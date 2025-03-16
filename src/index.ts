import {
	type Context,
	createInterpreterState,
	evaluateAst,
} from "./interpreter";
import { parse } from "./parser";
import { tokenize } from "./tokenizer";

const blackList = new Set([
	"constructor",
	"__proto__",
	"prototype",
	"this",
	"window",
	"global",
]);

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
		`\\b(${Array.from(blackList).join("\\b|\\b")})\\b`,
		"g",
	);

	if (blackListRegexp.test(expression)) {
		throw new ExpressionError("Blacklisted keywords detected in expression");
	}
}

/**
 * Compile an expression into a reusable function
 * @param expression - The expression to compile
 * @returns A function that evaluates the expression with a given context
 */
// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export function compile(expression: string): (context?: Context) => any {
	validateExpression(expression);

	const tokens = tokenize(expression);
	const ast = parse(tokens);
	const interpreterState = createInterpreterState({}, exprGlobalFunctions);

	// Return a function that can be called with different contexts
	// biome-ignore lint/suspicious/noExplicitAny: Return type depends on the expression
	return (context: Context = {}): any => {
		try {
			return evaluateAst(ast, interpreterState, context);
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
 * Evaluate an expression with a given context
 * @param expression - The expression to evaluate
 * @param context - The context to use for evaluation
 * @returns The result of evaluating the expression
 */
// biome-ignore lint/suspicious/noExplicitAny: Return type depends on the expression
export function evaluate(expression: string, context: Context = {}): any {
	validateExpression(expression);

	const evaluator = compile(expression);
	return evaluator(context);
}
