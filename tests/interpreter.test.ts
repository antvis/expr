import { describe, expect, it } from "vitest";
import { createInterpreterState, evaluateAst } from "../src/interpreter";
import { parse } from "../src/parser";
import { tokenize } from "../src/tokenizer";

describe("Interpreter", () => {
  async function evaluateExpression(
    input: string,
    context = {},
    functions = {},
  ) {
    const tokens = tokenize(input);
    const ast = parse(tokens);
    const interpreterState = createInterpreterState({}, functions);
    return evaluateAst(ast, interpreterState, context);
  }

  describe("Literals", () => {
    it("should evaluate number literals", async () => {
      expect(await evaluateExpression("42")).toBe(42);
    });

    it("should evaluate string literals", async () => {
      expect(await evaluateExpression('"hello"')).toBe("hello");
    });

    it("should evaluate boolean literals", async () => {
      expect(await evaluateExpression("true")).toBe(true);
      expect(await evaluateExpression("false")).toBe(false);
    });

    it("should evaluate null", async () => {
      expect(await evaluateExpression("null")).toBe(null);
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

    it("should evaluate dot notation", async () => {
      expect(await evaluateExpression("data.value", context)).toBe(42);
    });

    it("should evaluate bracket notation", async () => {
      expect(await evaluateExpression('data["value"]', context)).toBe(42);
    });

    it("should evaluate nested access", async () => {
      expect(await evaluateExpression("data.nested.array[1]", context)).toBe(2);
    });
  });

  describe("Function Calls", () => {
    const functions = {
      sum: (...args: number[]) => args.reduce((a, b) => a + b, 0),
      max: Math.max,
    };

    it("should evaluate function calls", async () => {
      expect(await evaluateExpression("@sum(1, 2, 3)", {}, functions)).toBe(6);
    });

    it("should evaluate nested expressions in arguments", async () => {
      const context = { x: 1, y: 2 };
      expect(
        await evaluateExpression("@max(x, y, 3)", context, functions),
      ).toBe(3);
    });
  });

  describe("Binary Expressions", () => {
    const context = { a: 5, b: 3 };

    it("should evaluate arithmetic operators", async () => {
      expect(await evaluateExpression("a + b", context)).toBe(8);
      expect(await evaluateExpression("a - b", context)).toBe(2);
      expect(await evaluateExpression("a * b", context)).toBe(15);
      expect(await evaluateExpression("a / b", context)).toBe(5 / 3);
    });

    it("should evaluate comparison operators", async () => {
      expect(await evaluateExpression("a > b", context)).toBe(true);
      expect(await evaluateExpression("a === b", context)).toBe(false);
    });

    it("should evaluate logical operators", async () => {
      expect(await evaluateExpression("true && false")).toBe(false);
      expect(await evaluateExpression("true || false")).toBe(true);
    });
  });

  describe("Conditional Expressions", () => {
    it("should evaluate simple conditionals", async () => {
      expect(await evaluateExpression("true ? 1 : 2")).toBe(1);
      expect(await evaluateExpression("false ? 1 : 2")).toBe(2);
    });

    it("should evaluate nested conditionals", async () => {
      const input = "true ? false ? 1 : 2 : 3";
      expect(await evaluateExpression(input)).toBe(2);
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

    it("should evaluate complex expressions", async () => {
      const input = '@sum(data.values) > 5 ? data["status"] : "inactive"';
      expect(await evaluateExpression(input, context, functions)).toBe(
        "active",
      );
    });
  });

  describe("Error Handling", () => {
    it("should throw for undefined variables", async () => {
      await expect(evaluateExpression("unknownVar")).rejects.toThrow(
        "Undefined variable",
      );
    });

    it("should throw for undefined functions", async () => {
      await expect(evaluateExpression("@unknown()")).rejects.toThrow(
        "Undefined function",
      );
    });

    it("should throw for null property access", async () => {
      const context = { data: null };
      await expect(evaluateExpression("data.value", context)).rejects.toThrow(
        "Cannot access property of null",
      );
    });
  });
});
