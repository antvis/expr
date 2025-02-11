import { describe, expect, it } from "vitest";
import { Parser, Tokenizer } from "../src";
import { Interpreter } from "../src/interpreter";

describe("Interpreter", () => {
	const tokenizer = new Tokenizer();
	const parser = new Parser();

	function evaluate(input: string, context = {}, functions = {}) {
		const tokens = tokenizer.tokenize(input);
		const ast = parser.parse(tokens);
		const interpreter = new Interpreter(context, functions);
		return interpreter.evaluate(ast);
	}

	describe("Literals", () => {
		it("should evaluate number literals", () => {
			expect(evaluate("42")).toBe(42);
		});

		it("should evaluate string literals", () => {
			expect(evaluate('"hello"')).toBe("hello");
		});

		it("should evaluate boolean literals", () => {
			expect(evaluate("true")).toBe(true);
			expect(evaluate("false")).toBe(false);
		});

		it("should evaluate null", () => {
			expect(evaluate("null")).toBe(null);
		});
	});

	describe("Member Expressions", () => {
		const context = {
			data: {
				value: 42,
				nested: {
					array: [1, 2, 3],
				},
			},
		};

		it("should evaluate dot notation", () => {
			expect(evaluate("data.value", context)).toBe(42);
		});

		it("should evaluate bracket notation", () => {
			expect(evaluate('data["value"]', context)).toBe(42);
		});

		it("should evaluate nested access", () => {
			expect(evaluate("data.nested.array[1]", context)).toBe(2);
		});
	});

	describe("Function Calls", () => {
		const functions = {
			sum: (...args: number[]) => args.reduce((a, b) => a + b, 0),
			max: Math.max,
		};

		it("should evaluate function calls", () => {
			expect(evaluate("@sum(1, 2, 3)", {}, functions)).toBe(6);
		});

		it("should evaluate nested expressions in arguments", () => {
			const context = { x: 1, y: 2 };
			expect(evaluate("@max(x, y, 3)", context, functions)).toBe(3);
		});
	});

	describe("Binary Expressions", () => {
		const context = { a: 5, b: 3 };

		it("should evaluate arithmetic operators", () => {
			expect(evaluate("a + b", context)).toBe(8);
			expect(evaluate("a - b", context)).toBe(2);
			expect(evaluate("a * b", context)).toBe(15);
			expect(evaluate("a / b", context)).toBe(5 / 3);
		});

		it("should evaluate comparison operators", () => {
			expect(evaluate("a > b", context)).toBe(true);
			expect(evaluate("a === b", context)).toBe(false);
		});

		it("should evaluate logical operators", () => {
			expect(evaluate("true && false")).toBe(false);
			expect(evaluate("true || false")).toBe(true);
		});
	});

	describe("Conditional Expressions", () => {
		it("should evaluate simple conditionals", () => {
			expect(evaluate("true ? 1 : 2")).toBe(1);
			expect(evaluate("false ? 1 : 2")).toBe(2);
		});

		it("should evaluate nested conditionals", () => {
			const input = "true ? false ? 1 : 2 : 3";
			expect(evaluate(input)).toBe(2);
		});
	});

	describe("Complex Expressions", () => {
		const context = {
			data: {
				values: [1, 2, 3],
				status: "active",
			},
		};

		const functions = {
			sum: (arr: number[]) => arr.reduce((a, b) => a + b, 0),
		};

		it("should evaluate complex expressions", () => {
			const input = '@sum(data.values) > 5 ? data["status"] : "inactive"';
			expect(evaluate(input, context, functions)).toBe("active");
		});
	});

	describe("Error Handling", () => {
		it("should throw for undefined variables", () => {
			expect(() => evaluate("unknownVar")).toThrow("Undefined variable");
		});

		it("should throw for undefined functions", () => {
			expect(() => evaluate("@unknown()")).toThrow("Undefined function");
		});

		it("should throw for null property access", () => {
			const context = { data: null };
			expect(() => evaluate("data.value", context)).toThrow(
				"Cannot access property of null",
			);
		});
	});
});
