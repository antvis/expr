import { describe, expect, it } from "vitest";
import {
	evaluate,
	createExpression,
	ExpressionError,
	Expression,
} from "../src";

describe("Edge Cases and Advanced Scenarios", () => {
	describe("Empty and Invalid Inputs", () => {
		it("should handle empty expressions", () => {
			expect(() => evaluate("")).toThrow(ExpressionError);
			expect(() => evaluate(" ")).toThrow(ExpressionError);
		});

		it("should handle invalid syntax", () => {
			expect(() => evaluate("x +")).toThrow(ExpressionError);
			expect(() => evaluate("(x + y")).toThrow(ExpressionError);
			expect(() => evaluate("x + y)")).toThrow(ExpressionError);
		});

		it("should handle invalid tokens", () => {
			expect(() => evaluate("x $ y")).toThrow(ExpressionError);
			expect(() => evaluate("#invalid")).toThrow(ExpressionError);
		});
	});

	describe("Type Coercion", () => {
		it("should handle string concatenation", () => {
			expect(evaluate("'hello' + ' world'")).toBe("hello world");
			expect(evaluate("'value: ' + 42")).toBe("value: 42");
			expect(evaluate("'is true: ' + true")).toBe("is true: true");
		});

		it("should handle boolean coercion in logical operations", () => {
			expect(evaluate("0 && 'anything'")).toBe(0);
			expect(evaluate("1 && 'something'")).toBe("something");
			expect(evaluate("'' || 'fallback'")).toBe("fallback");
			expect(evaluate("'value' || 'fallback'")).toBe("value");
		});

		it("should handle numeric coercion", () => {
			expect(evaluate("'5' - 2")).toBe(3);
			expect(evaluate("'10' / '2'")).toBe(5);
			expect(evaluate("'3' * 4")).toBe(12);
		});
	});

	describe("Deep Nesting", () => {
		it("should handle deeply nested expressions", () => {
			const expr = "(x + y) * z / 2";
			expect(evaluate(expr, { x: 1, y: 2, z: 3 })).toBe(4.5); // ((1+2)*3/2) = 4.5
		});

		it("should handle deeply nested object access", () => {
			const context = {
				a: { b: { c: { d: { e: { value: 42 } } } } },
			};
			expect(evaluate("a.b.c.d.e.value", context)).toBe(42);
		});

		it("should handle deeply nested array access", () => {
			const context = {
				matrix: [[[[5]]]],
			};
			expect(evaluate("matrix[0][0][0][0]", context)).toBe(5);
		});
	});

	describe("Large Numbers and Precision", () => {
		it("should handle large integers", () => {
			expect(evaluate("1000000000 * 1000000000")).toBe(1000000000000000000);
		});

		it("should handle floating point precision", () => {
			// JavaScript floating point precision issues
			expect(evaluate("0.1 + 0.2")).toBeCloseTo(0.3);
			expect(evaluate("0.1 + 0.2 === 0.3")).toBe(false); // JS behavior
		});
	});

	describe("Complex Function Usage", () => {
		it("should support nested function calls", () => {
			const expr = createExpression("@outer(@inner(x, y), z)")
				.configure({ strictMode: false })
				.extend({
					inner: (a, b) => a + b,
					outer: (a, b) => a * b,
				});
			expect(expr.evaluate({ x: 2, y: 3, z: 4 })).toBe(20); // (2+3)*4 = 20
		});

		it("should handle function calls with complex expressions as arguments", () => {
			const expr = createExpression("@calculate(x + y, z * 2, w ? 1 : 0)")
				.configure({ strictMode: false })
				.extend({
					calculate: (a, b, c) => a + b + c,
				});
			expect(expr.evaluate({ x: 1, y: 2, z: 3, w: true })).toBe(10); // (1+2) + (3*2) + 1 = 10
		});
	});

	describe("Context Manipulation", () => {
		it("should not modify the original context", () => {
			const context = { x: 5, y: 10 };
			evaluate("x + y", context);
			expect(context).toEqual({ x: 5, y: 10 }); // Context should be unchanged
		});

		it("should handle undefined context values", () => {
			expect(() => evaluate("x + 5", { y: 10 })).toThrow();
			expect(() => evaluate("x.y.z", { x: {} })).toThrow();
		});
	});

	describe("Performance Considerations", () => {
		it("should benefit from pre-compilation", () => {
			const expr = createExpression("x + y").compile();

			// This is more of a conceptual test since we can't easily measure performance in a unit test
			// But we can verify that the compiled expression works correctly
			expect(expr.evaluate({ x: 1, y: 2 })).toBe(3);
			expect(expr.evaluate({ x: 10, y: 20 })).toBe(30);
		});
	});

	describe("Error Cases", () => {
		it("should handle division by zero", () => {
			expect(evaluate("10 / 0")).toBe(Infinity);
			expect(evaluate("-10 / 0")).toBe(-Infinity);
		});

		it("should handle invalid property access", () => {
			expect(() => evaluate("null.property")).toThrow();
			expect(() => evaluate("undefined.property")).toThrow();
		});

		it("should handle invalid array access", () => {
			const context = { arr: [1, 2, 3] };
			expect(evaluate("arr[10]", context)).toBe(undefined);
			expect(evaluate("arr['invalid']", context)).toBe(undefined);
		});
	});

	describe("Security Edge Cases", () => {
		it("should prevent access to global objects even with tricky expressions", () => {
			// These should throw errors or return undefined, not expose global objects
			expect(() => evaluate("this")).toThrow();
			expect(() => evaluate("constructor")).toThrow();
		});

		it("should handle potentially dangerous property names", () => {
			const context = {
				obj: { __proto__: "fake", constructor: "fake" },
			};

			// These should just access the properties, not the actual __proto__ or constructor
			expect(() => evaluate("obj.__proto__", context)).toThrow();
			expect(() => evaluate("obj.constructor", context)).toThrow();
		});
	});
});
