import { describe, expect, it } from "vitest";
import { ExpressionError, compileSync, evaluate, register } from "../src";

describe("API Integration Tests", () => {
	describe("evaluate function", () => {
		it("should evaluate simple expressions", async () => {
			expect(await evaluate("42")).toBe(42);
			expect(await evaluate("'hello'")).toBe("hello");
			expect(await evaluate("true")).toBe(true);
			expect(await evaluate("null")).toBe(null);
		});

		it("should evaluate expressions with context", async () => {
			const context = { x: 10, y: 5 };
			expect(await evaluate("x + y", context)).toBe(15);
			expect(await evaluate("x - y", context)).toBe(5);
			expect(await evaluate("x * y", context)).toBe(50);
			expect(await evaluate("x / y", context)).toBe(2);
		});

		it("should throw ExpressionError for invalid expressions", async () => {
			await expect(evaluate("")).rejects.toThrow(ExpressionError);
			await expect(evaluate("x + y")).rejects.toThrow(ExpressionError);
		});
	});

	describe("compile function", () => {
		it("should create a function that can be called with different contexts", async () => {
			const expr = compileSync("x + y");
			expect(await expr({ x: 10, y: 5 })).toBe(15);
			expect(await expr({ x: 20, y: 30 })).toBe(50);
		});

		it("should throw when compiling invalid expressions", () => {
			expect(() => compileSync("")).toThrow(ExpressionError);
			expect(() => compileSync("this.property")).toThrow(ExpressionError);
		});
	});

	describe("register function", () => {
		it("should register custom functions that can be used in expressions", async () => {
			register("sum", (...args) => args.reduce((a, b) => a + b, 0));
			expect(await evaluate("@sum(1, 2, 3)")).toBe(6);
		});

		it("should allow registered functions to be used in compiled expressions", async () => {
			register("multiply", (a, b) => a * b);
			const expr = compileSync("@multiply(x, y)");
			expect(await expr({ x: 10, y: 5 })).toBe(50);
		});
	});

	describe("Variable References", () => {
		it("should handle nested property access", async () => {
			const context = {
				user: { profile: { name: "John", age: 30 } },
			};
			expect(await evaluate("user.profile.name", context)).toBe("John");
			expect(await evaluate("user.profile.age", context)).toBe(30);
		});

		it("should handle array access", async () => {
			const context = { items: [10, 20, 30] };
			expect(await evaluate("items[0]", context)).toBe(10);
			expect(await evaluate("items[1]", context)).toBe(20);
			expect(await evaluate("items[2]", context)).toBe(30);
		});

		it("should handle mixed dot and bracket notation", async () => {
			const context = { data: { items: [{ value: 42 }] } };
			expect(await evaluate("data.items[0].value", context)).toBe(42);
			expect(await evaluate("data['items'][0]['value']", context)).toBe(42);
		});
	});

	describe("Arithmetic Operations", () => {
		const context = { a: 10, b: 3, c: 2 };

		it("should handle basic arithmetic", async () => {
			expect(await evaluate("a + b", context)).toBe(13);
			expect(await evaluate("a - b", context)).toBe(7);
			expect(await evaluate("a * b", context)).toBe(30);
			expect(await evaluate("a / b", context)).toBe(10 / 3);
		});

		it("should handle operator precedence", async () => {
			expect(await evaluate("a + b * c", context)).toBe(16); // 10 + (3 * 2)
			expect(await evaluate("(a + b) * c", context)).toBe(26); // (10 + 3) * 2
		});

		it("should handle modulo operation", async () => {
			expect(await evaluate("a % b", context)).toBe(1); // 10 % 3 = 1
		});
	});

	describe("Comparison and Logical Operations", () => {
		const context = {
			age: 20,
			status: "active",
			isAdmin: true,
			isDeleted: false,
		};

		it("should handle comparison operators", async () => {
			expect(await evaluate("age >= 18", context)).toBe(true);
			expect(await evaluate("age < 18", context)).toBe(false);
			expect(await evaluate("age === 20", context)).toBe(true);
			expect(await evaluate("age !== 21", context)).toBe(true);
		});

		it("should handle logical operators", async () => {
			expect(await evaluate("isAdmin && !isDeleted", context)).toBe(true);
			expect(await evaluate("isAdmin || isDeleted", context)).toBe(true);
			expect(await evaluate("!isAdmin", context)).toBe(false);
		});

		it("should handle combined logical expressions", async () => {
			expect(
				await evaluate(
					"(age >= 18 && status === 'active') || isAdmin",
					context,
				),
			).toBe(true);
			expect(await evaluate("age < 18 && status === 'active'", context)).toBe(
				false,
			);
		});
	});

	describe("Conditional (Ternary) Expressions", () => {
		const context = { age: 20, score: 85 };

		it("should handle simple ternary expressions", async () => {
			expect(await evaluate("age >= 18 ? 'adult' : 'minor'", context)).toBe(
				"adult",
			);
			expect(await evaluate("age < 18 ? 'minor' : 'adult'", context)).toBe(
				"adult",
			);
		});

		it("should handle nested ternary expressions", async () => {
			const expr = "score >= 90 ? 'A' : score >= 80 ? 'B' : 'C'";
			expect(await evaluate(expr, context)).toBe("B");
		});
	});

	describe("Error Handling", () => {
		it("should provide detailed error information", async () => {
			await expect(evaluate("x +")).rejects.toThrow(ExpressionError);
		});
	});

	describe("Security Features", () => {
		it("should prevent access to global objects", async () => {
			// Testing that we can't access window/global objects
			await expect(evaluate("window")).rejects.toThrow(ExpressionError);
			await expect(evaluate("global")).rejects.toThrow(ExpressionError);
		});

		it("should prevent prototype chain access", async () => {
			// Testing that we can't access prototype methods
			const context = { obj: {} };
			await expect(evaluate("obj.constructor", context)).rejects.toThrow(
				ExpressionError,
			);
			await expect(evaluate("obj.__proto__", context)).rejects.toThrow(
				ExpressionError,
			);
		});
	});
});
