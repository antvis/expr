import { Tokenizer } from "./tokenizer";
import { Parser, type Program } from "./parser";
import { type Context, Interpreter } from "./interpreter";

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
}

export class Expression {
	private readonly tokenizer = new Tokenizer();
	private readonly parser = new Parser();
	private interpreter: Interpreter;
	private options: EvaluatorOptions = {
		strictMode: true,
		maxTimeout: 1000,
	};
	private ast?: Program;

	constructor(private readonly expression: string) {
		this.interpreter = new Interpreter();
	}

	/**
	 * Configure evaluation options
	 */
	configure(options: Partial<EvaluatorOptions>): this {
		this.options = { ...this.options, ...options };
		return this;
	}

	/**
	 * Extend with custom functions
	 */
	extend(functions: Record<string, (...args: unknown[]) => unknown>): this {
		if (!this.options.strictMode) {
			for (const [key, value] of Object.entries(functions)) {
				this.interpreter.setFunction(key, value);
			}
			return this;
		}
		throw new ExpressionError(
			"Cannot extend functions in strict mode. Use configure({ strictMode: false }) first.",
		);
	}

	/**
	 * Compile the expression
	 */
	compile(): this {
		try {
			const tokens = this.tokenizer.tokenize(this.expression);
			this.ast = this.parser.parse(tokens);
			return this;
		} catch (error) {
			if (error instanceof Error) {
				throw new ExpressionError(error.message);
			}
			throw error;
		}
	}

	/**
	 * Evaluate the expression with given context
	 */
	evaluate(context: Context = {}) {
		try {
			if (!this.ast) {
				this.compile();
			}

			if (!this.ast) {
				throw new ExpressionError("Cannot evaluate empty expression");
			}

			this.interpreter = new Interpreter(context);
			return this.interpreter.evaluate(this.ast);
		} catch (error) {
			if (error instanceof Error) {
				throw new ExpressionError(error.message);
			}
			throw error;
		}
	}
}

// Convenient factory functions
export function createExpression(expression: string): Expression {
	return new Expression(expression);
}

export function evaluate(expression: string, context: Context = {}) {
	return new Expression(expression).evaluate(context);
}

// Export all public symbols for custom evaluators
export * from "./interpreter";
export * from "./parser";
export * from "./tokenizer";
