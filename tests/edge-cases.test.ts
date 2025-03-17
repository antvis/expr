import { describe, expect, it } from "vitest";
import { ExpressionError, compileSync, evaluate, register } from "../src";

describe("Edge Cases and Advanced Scenarios", () => {
	describe("Empty and Invalid Inputs", () => {
		it("should handle empty expressions", async () => {
			await expect(evaluate("")).rejects.toThrow(ExpressionError);
			await expect(evaluate(" ")).rejects.toThrow(ExpressionError);
		});

		it("should handle invalid syntax", async () => {
			await expect(evaluate("x +")).rejects.toThrow(ExpressionError);
			await expect(evaluate("(x + y")).rejects.toThrow(ExpressionError);
			await expect(evaluate("x + y)")).rejects.toThrow(ExpressionError);
		});

		it("should handle invalid tokens", async () => {
			await expect(evaluate("x $ y")).rejects.toThrow(ExpressionError);
			await expect(evaluate("#invalid")).rejects.toThrow(ExpressionError);
		});
	});

	describe("Type Coercion", () => {
		it("should handle string concatenation", async () => {
			expect(await evaluate("'hello' + ' world'")).toBe("hello world");
			expect(await evaluate("'value: ' + 42")).toBe("value: 42");
			expect(await evaluate("'is true: ' + true")).toBe("is true: true");
		});

		it("should handle boolean coercion in logical operations", async () => {
			expect(await evaluate("0 && 'anything'")).toBe(0);
			expect(await evaluate("1 && 'something'")).toBe("something");
			expect(await evaluate("'' || 'fallback'")).toBe("fallback");
			expect(await evaluate("'value' || 'fallback'")).toBe("value");
		});

		it("should handle numeric coercion", async () => {
			expect(await evaluate("'5' - 2")).toBe(3);
			expect(await evaluate("'10' / '2'")).toBe(5);
			expect(await evaluate("'3' * 4")).toBe(12);
		});
	});

	describe("Deep Nesting", () => {
		it("should handle deeply nested expressions", async () => {
			const expr = "(x + y) * z / 2";
			expect(await evaluate(expr, { x: 1, y: 2, z: 3 })).toBe(4.5); // ((1+2)*3/2) = 4.5
		});

		it("should handle deeply nested object access", async () => {
			const context = {
				a: { b: { c: { d: { e: { value: 42 } } } } },
			};
			expect(await evaluate("a.b.c.d.e.value", context)).toBe(42);
		});

		it("should handle deeply nested array access", async () => {
			const context = {
				matrix: [[[[5]]]],
			};
			expect(await evaluate("matrix[0][0][0][0]", context)).toBe(5);
		});
	});

	describe("Large Numbers and Precision", () => {
		it("should handle large integers", async () => {
			expect(await evaluate("1000000000 * 1000000000")).toBe(
				1000000000000000000,
			);
		});

		it("should handle floating point precision", async () => {
			// JavaScript floating point precision issues
			expect(await evaluate("0.1 + 0.2")).toBeCloseTo(0.3);
			expect(await evaluate("0.1 + 0.2 === 0.3")).toBe(false); // JS behavior
		});
	});

	describe("Complex Function Usage", () => {
		it("should support nested function calls", async () => {
			register("inner", (a, b) => a + b);
			register("outer", (a, b) => a * b);
			expect(
				await evaluate("@outer(@inner(x, y), z)", { x: 2, y: 3, z: 4 }),
			).toBe(20); // (2+3)*4 = 20
		});

		it("should handle function calls with complex expressions as arguments", async () => {
			register("calculate", (a, b, c) => a + b + c);
			expect(
				await evaluate("@calculate(x + y, z * 2, w ? 1 : 0)", {
					x: 1,
					y: 2,
					z: 3,
					w: true,
				}),
			).toBe(10); // (1+2) + (3*2) + 1 = 10
		});
	});

	describe("Context Manipulation", () => {
		it("should not modify the original context", async () => {
			const context = { x: 5, y: 10 };
			await evaluate("x + y", context);
			expect(context).toEqual({ x: 5, y: 10 }); // Context should be unchanged
		});

		it("should handle undefined context values", async () => {
			await expect(evaluate("x + 5", { y: 10 })).rejects.toThrow();
			await expect(evaluate("x.y.z", { x: {} })).rejects.toThrow();
		});
	});

	describe("Performance Considerations", () => {
		it("should benefit from pre-compilation", async () => {
			const expr = compileSync("x + y");

			// This is more of a conceptual test since we can't easily measure performance in a unit test
			// But we can verify that the compiled expression works correctly
			expect(await expr({ x: 1, y: 2 })).toBe(3);
			expect(await expr({ x: 10, y: 20 })).toBe(30);
		});
	});

	describe("Error Cases", () => {
		it("should handle division by zero", async () => {
			expect(await evaluate("10 / 0")).toBe(Number.POSITIVE_INFINITY);
			expect(await evaluate("-10 / 0")).toBe(Number.NEGATIVE_INFINITY);
		});

		it("should handle invalid property access", async () => {
			await expect(evaluate("null.property")).rejects.toThrow();
			await expect(evaluate("undefined.property")).rejects.toThrow();
		});

		it("should handle invalid array access", async () => {
			const context = { arr: [1, 2, 3] };
			expect(await evaluate("arr[10]", context)).toBe(undefined);
			expect(await evaluate("arr['invalid']", context)).toBe(undefined);
		});
	});

	describe("Security Edge Cases", () => {
		it("should prevent access to global objects even with tricky expressions", async () => {
			// These should throw errors or return undefined, not expose global objects
			await expect(evaluate("this")).rejects.toThrow();
			await expect(evaluate("constructor")).rejects.toThrow();
		});

		it("should handle potentially dangerous property names", async () => {
			const context = {
				obj: { __proto__: "fake", constructor: "fake" },
			};

			// These should throw errors due to blacklisted keywords
			await expect(evaluate("obj.__proto__", context)).rejects.toThrow();
			await expect(evaluate("obj.constructor", context)).rejects.toThrow();
		});
	});
});
