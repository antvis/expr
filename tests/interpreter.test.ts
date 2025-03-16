import { describe, expect, it } from "vitest";
import { createInterpreterState, evaluateAst } from "../src/interpreter";
import { parse } from "../src/parser";
import { tokenize } from "../src/tokenizer";

describe("Interpreter", () => {
	function evaluateExpression(input: string, context = {}, functions = {}) {
		const tokens = tokenize(input);
		const ast = parse(tokens);
		const interpreterState = createInterpreterState({}, functions);
		return evaluateAst(ast, interpreterState, context);
	}

	describe("Literals", () => {
		it("should evaluate number literals", () => {
			expect(evaluateExpression("42")).toBe(42);
		});

		it("should evaluate string literals", () => {
			expect(evaluateExpression('"hello"')).toBe("hello");
		});

		it("should evaluate boolean literals", () => {
			expect(evaluateExpression("true")).toBe(true);
			expect(evaluateExpression("false")).toBe(false);
		});

		it("should evaluate null", () => {
			expect(evaluateExpression("null")).toBe(null);
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
			expect(evaluateExpression("data.value", context)).toBe(42);
		});

		it("should evaluate bracket notation", () => {
			expect(evaluateExpression('data["value"]', context)).toBe(42);
		});

		it("should evaluate nested access", () => {
			expect(evaluateExpression("data.nested.array[1]", context)).toBe(2);
		});
	});

	describe("Function Calls", () => {
		const functions = {
			sum: (...args: number[]) => args.reduce((a, b) => a + b, 0),
			max: Math.max,
		};

		it("should evaluate function calls", () => {
			expect(evaluateExpression("@sum(1, 2, 3)", {}, functions)).toBe(6);
		});

		it("should evaluate nested expressions in arguments", () => {
			const context = { x: 1, y: 2 };
			expect(evaluateExpression("@max(x, y, 3)", context, functions)).toBe(3);
		});
	});

	describe("Binary Expressions", () => {
		const context = { a: 5, b: 3 };

		it("should evaluate arithmetic operators", () => {
			expect(evaluateExpression("a + b", context)).toBe(8);
			expect(evaluateExpression("a - b", context)).toBe(2);
			expect(evaluateExpression("a * b", context)).toBe(15);
			expect(evaluateExpression("a / b", context)).toBe(5 / 3);
		});

		it("should evaluate comparison operators", () => {
			expect(evaluateExpression("a > b", context)).toBe(true);
			expect(evaluateExpression("a === b", context)).toBe(false);
		});

		it("should evaluate logical operators", () => {
			expect(evaluateExpression("true && false")).toBe(false);
			expect(evaluateExpression("true || false")).toBe(true);
		});
	});

	describe("Conditional Expressions", () => {
		it("should evaluate simple conditionals", () => {
			expect(evaluateExpression("true ? 1 : 2")).toBe(1);
			expect(evaluateExpression("false ? 1 : 2")).toBe(2);
		});

		it("should evaluate nested conditionals", () => {
			const input = "true ? false ? 1 : 2 : 3";
			expect(evaluateExpression(input)).toBe(2);
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
			expect(evaluateExpression(input, context, functions)).toBe("active");
		});
	});

	describe("Error Handling", () => {
		it("should throw for undefined variables", () => {
			expect(() => evaluateExpression("unknownVar")).toThrow(
				"Undefined variable",
			);
		});

		it("should throw for undefined functions", () => {
			expect(() => evaluateExpression("@unknown()")).toThrow(
				"Undefined function",
			);
		});

		it("should throw for null property access", () => {
			const context = { data: null };
			expect(() => evaluateExpression("data.value", context)).toThrow(
				"Cannot access property of null",
			);
		});
	});
});
