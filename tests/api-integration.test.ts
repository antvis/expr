import { describe, expect, it } from "vitest";
import { ExpressionError, compile, evaluate, register } from "../src";

describe("API Integration Tests", () => {
	describe("evaluate function", () => {
		it("should evaluate simple expressions", () => {
			expect(evaluate("42")).toBe(42);
			expect(evaluate("'hello'")).toBe("hello");
			expect(evaluate("true")).toBe(true);
			expect(evaluate("null")).toBe(null);
		});

		it("should evaluate expressions with context", () => {
			const context = { x: 10, y: 5 };
			expect(evaluate("x + y", context)).toBe(15);
			expect(evaluate("x - y", context)).toBe(5);
			expect(evaluate("x * y", context)).toBe(50);
			expect(evaluate("x / y", context)).toBe(2);
		});

		it("should throw ExpressionError for invalid expressions", () => {
			expect(() => evaluate("")).toThrow(ExpressionError);
			expect(() => evaluate("x + y")).toThrow(ExpressionError);
		});
	});

	describe("compile function", () => {
		it("should create a function that can be called with different contexts", () => {
			const expr = compile("x + y");
			expect(expr({ x: 10, y: 5 })).toBe(15);
			expect(expr({ x: 20, y: 30 })).toBe(50);
		});

		it("should throw when compiling invalid expressions", () => {
			expect(() => compile("")).toThrow(ExpressionError);
			expect(() => compile("this.property")).toThrow(ExpressionError);
		});
	});

	describe("register function", () => {
		it("should register custom functions that can be used in expressions", () => {
			register("sum", (...args) => args.reduce((a, b) => a + b, 0));
			expect(evaluate("@sum(1, 2, 3)")).toBe(6);
		});

		it("should allow registered functions to be used in compiled expressions", () => {
			register("multiply", (a, b) => a * b);
			const expr = compile("@multiply(x, y)");
			expect(expr({ x: 10, y: 5 })).toBe(50);
		});
	});

	describe("Variable References", () => {
		it("should handle nested property access", () => {
			const context = {
				user: { profile: { name: "John", age: 30 } },
			};
			expect(evaluate("user.profile.name", context)).toBe("John");
			expect(evaluate("user.profile.age", context)).toBe(30);
		});

		it("should handle array access", () => {
			const context = { items: [10, 20, 30] };
			expect(evaluate("items[0]", context)).toBe(10);
			expect(evaluate("items[1]", context)).toBe(20);
			expect(evaluate("items[2]", context)).toBe(30);
		});

		it("should handle mixed dot and bracket notation", () => {
			const context = { data: { items: [{ value: 42 }] } };
			expect(evaluate("data.items[0].value", context)).toBe(42);
			expect(evaluate("data['items'][0]['value']", context)).toBe(42);
		});
	});

	describe("Arithmetic Operations", () => {
		const context = { a: 10, b: 3, c: 2 };

		it("should handle basic arithmetic", () => {
			expect(evaluate("a + b", context)).toBe(13);
			expect(evaluate("a - b", context)).toBe(7);
			expect(evaluate("a * b", context)).toBe(30);
			expect(evaluate("a / b", context)).toBe(10 / 3);
		});

		it("should handle operator precedence", () => {
			expect(evaluate("a + b * c", context)).toBe(16); // 10 + (3 * 2)
			expect(evaluate("(a + b) * c", context)).toBe(26); // (10 + 3) * 2
		});

		it("should handle modulo operation", () => {
			expect(evaluate("a % b", context)).toBe(1); // 10 % 3 = 1
		});
	});

	describe("Comparison and Logical Operations", () => {
		const context = {
			age: 20,
			status: "active",
			isAdmin: true,
			isDeleted: false,
		};

		it("should handle comparison operators", () => {
			expect(evaluate("age >= 18", context)).toBe(true);
			expect(evaluate("age < 18", context)).toBe(false);
			expect(evaluate("age === 20", context)).toBe(true);
			expect(evaluate("age !== 21", context)).toBe(true);
		});

		it("should handle logical operators", () => {
			expect(evaluate("isAdmin && !isDeleted", context)).toBe(true);
			expect(evaluate("isAdmin || isDeleted", context)).toBe(true);
			expect(evaluate("!isAdmin", context)).toBe(false);
		});

		it("should handle combined logical expressions", () => {
			expect(
				evaluate("(age >= 18 && status === 'active') || isAdmin", context),
			).toBe(true);
			expect(evaluate("age < 18 && status === 'active'", context)).toBe(false);
		});
	});

	describe("Conditional (Ternary) Expressions", () => {
		const context = { age: 20, score: 85 };

		it("should handle simple ternary expressions", () => {
			expect(evaluate("age >= 18 ? 'adult' : 'minor'", context)).toBe("adult");
			expect(evaluate("age < 18 ? 'minor' : 'adult'", context)).toBe("adult");
		});

		it("should handle nested ternary expressions", () => {
			const expr = "score >= 90 ? 'A' : score >= 80 ? 'B' : 'C'";
			expect(evaluate(expr, context)).toBe("B");
		});
	});

	describe("Error Handling", () => {
		it("should provide detailed error information", () => {
			try {
				evaluate("x +");
				expect(true).toBe(false); // This will fail the test if evaluate doesn't throw
			} catch (error) {
				expect(error).toBeInstanceOf(ExpressionError);
				expect(error.message).toBeDefined();
			}
		});
	});

	describe("Security Features", () => {
		it("should prevent access to global objects", () => {
			// Testing that we can't access window/global objects
			expect(() => evaluate("window")).toThrow(ExpressionError);
			expect(() => evaluate("global")).toThrow(ExpressionError);
		});

		it("should prevent prototype chain access", () => {
			// Testing that we can't access prototype methods
			const context = { obj: {} };
			expect(() => evaluate("obj.constructor", context)).toThrow(
				ExpressionError,
			);
			expect(() => evaluate("obj.__proto__", context)).toThrow(ExpressionError);
		});
	});
});
