import {
	type Context,
	createInterpreterState,
	evaluateAst,
} from "./interpreter";
import { parse } from "./parser";
import { tokenize } from "./tokenizer";
import { promisify } from "./utils";

export interface ExpressionConfig {
	maxTimeout: number;
	blackList: Set<string>;
}

// Default global configuration
export const defaultConfig: ExpressionConfig = {
	maxTimeout: 10000,
	// Global blacklist for keywords that cannot be used in expressions
	blackList: new Set([
		"constructor",
		"__proto__",
		"prototype",
		"this",
		"window",
		"global",
	]),
};

// Current active configuration (initialized with defaults)
const activeConfig: ExpressionConfig = {
	...defaultConfig,
	blackList: new Set(defaultConfig.blackList),
};

/**
 * Set global configuration options for all expression evaluations
 * @param config - Configuration options to set
 */
export function configure(config: Partial<ExpressionConfig>): void {
	if (config.maxTimeout !== undefined) {
		activeConfig.maxTimeout = config.maxTimeout;
	}

	if (config.blackList !== undefined) {
		activeConfig.blackList = config.blackList;
	}
}

/**
 * Get the current active configuration
 * @returns The current configuration
 */
export function getConfig(): ExpressionConfig {
	return {
		...activeConfig,
		blackList: new Set(activeConfig.blackList),
	};
}

// Global registry for functions that can be used in expressions
// biome-ignore lint/suspicious/noExplicitAny: Function registry needs to support any function type
type ExpressionFunction = (...args: any[]) => any;
const exprGlobalFunctions: Record<string, ExpressionFunction> = {};

export class ExpressionError extends Error {
	constructor(
		message: string,
		public readonly position?: number,
		public readonly token?: string,
	) {
		super(message);
		this.name = "ExpressionError";
	}
}

/**
 * Register a function to be used in expressions with the @ prefix
 * @param name - The name of the function to register
 * @param fn - The function implementation
 */
export function register(name: string, fn: ExpressionFunction): void {
	exprGlobalFunctions[name] = fn;
}

// Register some common Math functions by default
register("abs", Math.abs);
register("ceil", Math.ceil);
register("floor", Math.floor);
register("max", Math.max);
register("min", Math.min);
register("round", Math.round);
register("sqrt", Math.sqrt);
register("pow", Math.pow);

/**
 * Validates that an expression doesn't contain blacklisted keywords
 * @param expression - The expression to validate
 */
function validateExpression(expression: string): void {
	if (!expression || expression.trim() === "") {
		throw new ExpressionError("Cannot evaluate empty expression");
	}

	const blackListRegexp = new RegExp(
		`\\b(${Array.from(activeConfig.blackList).join("\\b|\\b")})\\b`,
		"g",
	);

	if (blackListRegexp.test(expression)) {
		throw new ExpressionError("Blacklisted keywords detected in expression");
	}
}

/**
 * Executes a function with a timeout
 * @param fn - Function to execute
 * @returns Result of the function execution
 */
async function executeWithTimeout<T>(fn: () => T): Promise<T> {
	const maxTimeout = activeConfig.maxTimeout;

	try {
		// Create a promise for the function execution
		const fnPromise = new Promise<T>((resolve, reject) => {
			try {
				const result = fn();
				resolve(result);
			} catch (err) {
				reject(err);
			}
		});

		// Create a timeout promise
		const timeoutPromise = new Promise<never>((_, reject) => {
			const timeoutId = setTimeout(() => {
				reject(
					new ExpressionError(`Evaluation timed out after ${maxTimeout}ms`),
				);
			}, maxTimeout);

			// Clean up timeout if function completes first
			fnPromise.then(() => clearTimeout(timeoutId)).catch(() => {});
		});

		// Race the promises and properly await the result
		return await Promise.race([fnPromise, timeoutPromise]);
	} catch (error) {
		// Properly propagate any errors
		if (error instanceof Error) {
			throw error;
		}
		throw new ExpressionError(`Unknown error during evaluation: ${error}`);
	}
}

/**
 * Compile an expression into a reusable function
 * @param expression - The expression to compile
 * @returns A function that evaluates the expression with a given context
 */
export function compileSync(
	expression: string,
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
): (context?: Context) => Promise<any> {
	validateExpression(expression);

	const tokens = tokenize(expression);
	const ast = parse(tokens);
	const interpreterState = createInterpreterState({}, exprGlobalFunctions);

	// Return a function that can be called with different contexts
	// biome-ignore lint/suspicious/noExplicitAny: Return type depends on the expression
	return (context: Context = {}): Promise<any> => {
		try {
			// Execute the evaluation with timeout protection
			return executeWithTimeout(() =>
				evaluateAst(ast, interpreterState, context),
			);
		} catch (error) {
			if (error instanceof ExpressionError) {
				throw error;
			}

			if (error instanceof Error) {
				throw new ExpressionError(error.message);
			}
			throw error;
		}
	};
}

/**
 * Asynchronously compile an expression into a function that can be called with a context
 * @param expression - The expression to compile
 * @returns A Promise that resolves to a function that evaluates the expression with a given context
 */
export const compileAsync = promisify(compileSync);

/**
 * Evaluate an expression with a given context
 * @param expression - The expression to evaluate
 * @param context - The context to use for evaluation
 * @returns The result of evaluating the expression
 */
export async function evaluate(
	expression: string,
	context: Context = {},
	// biome-ignore lint/suspicious/noExplicitAny: Return type depends on the expression
): Promise<any> {
	validateExpression(expression);

	const evaluator = compileSync(expression);
	return evaluator(context);
}
