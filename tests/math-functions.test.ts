import { describe, expect, it } from "vitest";
import { evaluate } from "../src";

describe("Default Math Functions", () => {
  describe("abs function", () => {
    it("should return the absolute value of a number", async () => {
      const result = await evaluate("@abs(-5)");
      expect(result).toBe(5);
    });

    it("should handle zero", async () => {
      const result = await evaluate("@abs(0)");
      expect(result).toBe(0);
    });

    it("should handle positive numbers", async () => {
      const result = await evaluate("@abs(10)");
      expect(result).toBe(10);
    });
  });

  describe("ceil function", () => {
    it("should round up to the nearest integer", async () => {
      const result = await evaluate("@ceil(4.3)");
      expect(result).toBe(5);
    });

    it("should not change integers", async () => {
      const result = await evaluate("@ceil(7)");
      expect(result).toBe(7);
    });

    it("should handle negative numbers", async () => {
      const result = await evaluate("@ceil(-3.7)");
      expect(result).toBe(-3);
    });
  });

  describe("floor function", () => {
    it("should round down to the nearest integer", async () => {
      const result = await evaluate("@floor(4.9)");
      expect(result).toBe(4);
    });

    it("should not change integers", async () => {
      const result = await evaluate("@floor(7)");
      expect(result).toBe(7);
    });

    it("should handle negative numbers", async () => {
      const result = await evaluate("@floor(-3.1)");
      expect(result).toBe(-4);
    });
  });

  describe("max function", () => {
    it("should return the largest of two numbers", async () => {
      const result = await evaluate("@max(5, 10)");
      expect(result).toBe(10);
    });

    it("should handle multiple arguments", async () => {
      const result = await evaluate("@max(5, 10, 3, 8, 15, 2)");
      expect(result).toBe(15);
    });

    it("should handle negative numbers", async () => {
      const result = await evaluate("@max(-5, -10, -3)");
      expect(result).toBe(-3);
    });

    it("should handle variables in context", async () => {
      const result = await evaluate("@max(a, b, c)", { a: 5, b: 10, c: 3 });
      expect(result).toBe(10);
    });
  });

  describe("min function", () => {
    it("should return the smallest of two numbers", async () => {
      const result = await evaluate("@min(5, 10)");
      expect(result).toBe(5);
    });

    it("should handle multiple arguments", async () => {
      const result = await evaluate("@min(5, 10, 3, 8, 15, 2)");
      expect(result).toBe(2);
    });

    it("should handle negative numbers", async () => {
      const result = await evaluate("@min(-5, -10, -3)");
      expect(result).toBe(-10);
    });

    it("should handle variables in context", async () => {
      const result = await evaluate("@min(a, b, c)", { a: 5, b: 10, c: 3 });
      expect(result).toBe(3);
    });
  });

  describe("round function", () => {
    it("should round to the nearest integer", async () => {
      const result = await evaluate("@round(4.3)");
      expect(result).toBe(4);
    });

    it("should round up for values >= .5", async () => {
      const result = await evaluate("@round(4.5)");
      expect(result).toBe(5);
    });

    it("should handle negative numbers", async () => {
      const result = await evaluate("@round(-3.7)");
      expect(result).toBe(-4);
    });

    it("should handle negative numbers with .5", async () => {
      const result = await evaluate("@round(-3.5)");
      expect(result).toBe(-3);
    });
  });

  describe("sqrt function", () => {
    it("should return the square root of a positive number", async () => {
      const result = await evaluate("@sqrt(16)");
      expect(result).toBe(4);
    });

    it("should handle non-perfect squares", async () => {
      const result = await evaluate("@sqrt(2)");
      expect(result).toBeCloseTo(1.4142, 4);
    });

    it("should handle zero", async () => {
      const result = await evaluate("@sqrt(0)");
      expect(result).toBe(0);
    });

    it("should return NaN for negative numbers", async () => {
      const result = await evaluate("@sqrt(-4)");
      expect(result).toBeNaN();
    });
  });

  describe("pow function", () => {
    it("should return the base raised to the exponent", async () => {
      const result = await evaluate("@pow(2, 3)");
      expect(result).toBe(8);
    });

    it("should handle fractional exponents", async () => {
      const result = await evaluate("@pow(4, 0.5)");
      expect(result).toBe(2);
    });

    it("should handle negative exponents", async () => {
      const result = await evaluate("@pow(2, -2)");
      expect(result).toBe(0.25);
    });

    it("should handle zero base with positive exponent", async () => {
      const result = await evaluate("@pow(0, 5)");
      expect(result).toBe(0);
    });

    it("should handle zero base with zero exponent", async () => {
      const result = await evaluate("@pow(0, 0)");
      expect(result).toBe(1); // This is the mathematical convention
    });

    it("should handle variables in context", async () => {
      const result = await evaluate("@pow(base, exponent)", {
        base: 3,
        exponent: 4,
      });
      expect(result).toBe(81);
    });
  });

  describe("Combined math functions", () => {
    it("should allow nesting of math functions", async () => {
      const result = await evaluate("@round(@sqrt(@pow(x, 2) + @pow(y, 2)))", {
        x: 3,
        y: 4,
      });
      expect(result).toBe(5); // sqrt(3² + 4²) = sqrt(25) = 5
    });

    it("should work with expressions as arguments", async () => {
      const result = await evaluate("@max(@abs(x), @abs(y), @abs(z))", {
        x: -5,
        y: 3,
        z: -8,
      });
      expect(result).toBe(8);
    });

    it("should handle complex mathematical expressions", async () => {
      const result = await evaluate(
        "@pow(@floor(x / y), 2) + @ceil(@sqrt(z))",
        { x: 10, y: 3, z: 15 },
      );
      expect(result).toBe(13); // pow(floor(10/3), 2) + ceil(sqrt(15)) = 3² + ceil(3.87) = 9 + 4 = 13
    });
  });
});
