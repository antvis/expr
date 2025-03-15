import {
	type Context,
	createInterpreterState,
	evaluate as evaluateAst,
	setFunction,
} from "./interpreter";
import { parse, type Program } from "./parser";
import { tokenize } from "./tokenizer";

export interface EvaluatorOptions {
	strictMode?: boolean;
	maxTimeout?: number;
}

export class ExpressionError extends Error {
	constructor(
		message: string,
		public readonly position?: number,
		public readonly token?: string,
	) {
		super(message);
		this.name = "ExpressionError";
	}

	/**
	 * Returns formatted error message, including position and token information (if available)
	 */
	toString(): string {
		let errorString = `${this.name}: ${this.message}`;

		if (this.position !== undefined) {
			errorString += ` (position: ${this.position}`;

			if (this.token !== undefined) {
				errorString += `, token: ${this.token})`;
			} else {
				errorString += ")";
			}
		}

		return errorString;
	}
}

/**
 * State for the Expression evaluator
 */
interface ExpressionState {
	expression: string;
	interpreterState: ReturnType<typeof createInterpreterState>;
	options: EvaluatorOptions;
	ast?: Program;
}

/**
 * Creates a new expression state
 * @param expression - The expression to evaluate
 * @returns A new expression state
 */
export const createExpressionState = (expression: string): ExpressionState => {
	return {
		expression,
		interpreterState: createInterpreterState(),
		options: {
			strictMode: true,
			maxTimeout: 1000,
		},
	};
};

/**
 * Configure evaluation options
 * @param state - Current expression state
 * @param options - Options to configure
 * @returns Updated expression state
 */
export const configure = (
	state: ExpressionState,
	options: Partial<EvaluatorOptions>,
): ExpressionState => {
	return {
		...state,
		options: { ...state.options, ...options },
	};
};

/**
 * Extend with custom functions
 * @param state - Current expression state
 * @param functions - Functions to add
 * @returns Updated expression state
 */
export const extend = (
	state: ExpressionState,
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	functions: Record<string, (...args: any[]) => any>,
): ExpressionState => {
	if (!state.options.strictMode) {
		let newInterpreterState = state.interpreterState;
		for (const [key, value] of Object.entries(functions)) {
			newInterpreterState = setFunction(newInterpreterState, key, value);
		}
		return {
			...state,
			interpreterState: newInterpreterState,
		};
	}
	throw new ExpressionError(
		"Cannot extend functions in strict mode. Use configure({ strictMode: false }) first.",
	);
};

/**
 * Compile the expression
 * @param state - Current expression state
 * @returns Updated expression state with compiled AST
 */
export const compile = (state: ExpressionState): ExpressionState => {
	try {
		if (state.expression === "" || !state.expression) {
			throw new ExpressionError("Cannot evaluate empty expression");
		}
		const tokens = tokenize(state.expression);
		const ast = parse(tokens);
		return {
			...state,
			ast,
		};
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

/**
 * Evaluate the expression with given context
 * @param state - Current expression state
 * @param context - Variables to use during evaluation
 * @returns The evaluation result
 */
export const evaluateExpression = (
	state: ExpressionState,
	context: Context = {},
) => {
	try {
		let currentState = state;
		if (!currentState.ast) {
			currentState = compile(currentState);
		}

		if (!currentState.ast) {
			throw new ExpressionError("Cannot evaluate empty expression");
		}

		return evaluateAst(
			currentState.ast,
			currentState.interpreterState,
			context,
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

// For backward compatibility with the class-based API
export class Expression {
	private state: ExpressionState;

	constructor(expression: string) {
		this.state = createExpressionState(expression);
	}

	/**
	 * Configure evaluation options
	 */
	configure(options: Partial<EvaluatorOptions>): this {
		this.state = configure(this.state, options);
		return this;
	}

	/**
	 * Extend with custom functions
	 */
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	extend(functions: Record<string, (...args: any[]) => any>): this {
		this.state = extend(this.state, functions);
		return this;
	}

	/**
	 * Compile the expression
	 */
	compile(): this {
		this.state = compile(this.state);
		return this;
	}

	/**
	 * Evaluate the expression with given context
	 */
	evaluate(context: Context = {}) {
		return evaluateExpression(this.state, context);
	}
}

// Convenient factory functions
export function createExpression(expression: string): Expression {
	return new Expression(expression);
}

export function evaluate(expression: string, context: Context = {}) {
	const state = createExpressionState(expression);
	return evaluateExpression(state, context);
}

// Export all public symbols for custom evaluators
export * from "./interpreter";
export * from "./parser";
export * from "./tokenizer";
