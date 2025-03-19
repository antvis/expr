import { describe, expect, it } from "vitest";
import { NodeType, parse } from "../src/parser";
import { tokenize } from "../src/tokenizer";

describe("Parser", () => {
  function parseExpression(input: string) {
    const tokens = tokenize(input);
    return parse(tokens);
  }

  describe("Literals", () => {
    it("should parse number literals", () => {
      const ast = parseExpression("42");
      expect(ast).toEqual({
        type: NodeType.Program,
        body: {
          type: NodeType.Literal,
          value: 42,
        },
      });
    });

    it("should parse string literals", () => {
      const ast = parseExpression('"hello"');
      expect(ast).toEqual({
        type: NodeType.Program,
        body: {
          type: NodeType.Literal,
          value: "hello",
        },
      });
    });

    it("should parse boolean literals", () => {
      const ast = parseExpression("true");
      expect(ast).toEqual({
        type: NodeType.Program,
        body: {
          type: NodeType.Literal,
          value: true,
        },
      });
    });

    it("should parse null literal", () => {
      const ast = parseExpression("null");
      expect(ast).toEqual({
        type: NodeType.Program,
        body: {
          type: NodeType.Literal,
          value: null,
        },
      });
    });
  });

  describe("Member Expressions", () => {
    it("should parse dot notation", () => {
      const ast = parseExpression("data.value");
      expect(ast).toEqual({
        type: NodeType.Program,
        body: {
          type: NodeType.MemberExpression,
          object: {
            type: NodeType.Identifier,
            name: "data",
          },
          property: {
            type: NodeType.Identifier,
            name: "value",
          },
          computed: false,
        },
      });
    });

    it("should parse bracket notation", () => {
      const ast = parseExpression('data["value"]');
      expect(ast).toEqual({
        type: NodeType.Program,
        body: {
          type: NodeType.MemberExpression,
          object: {
            type: NodeType.Identifier,
            name: "data",
          },
          property: {
            type: NodeType.Literal,
            value: "value",
          },
          computed: true,
        },
      });
    });
  });

  describe("Function Calls", () => {
    it("should parse function calls without arguments", () => {
      const ast = parseExpression("@sum()");
      expect(ast).toEqual({
        type: NodeType.Program,
        body: {
          type: NodeType.CallExpression,
          callee: {
            type: NodeType.Identifier,
            name: "sum",
          },
          arguments: [],
        },
      });
    });

    it("should parse function calls with multiple arguments", () => {
      const ast = parseExpression("@max(a, b, 42)");
      expect(ast).toEqual({
        type: NodeType.Program,
        body: {
          type: NodeType.CallExpression,
          callee: {
            type: NodeType.Identifier,
            name: "max",
          },
          arguments: [
            {
              type: NodeType.Identifier,
              name: "a",
            },
            {
              type: NodeType.Identifier,
              name: "b",
            },
            {
              type: NodeType.Literal,
              value: 42,
            },
          ],
        },
      });
    });
  });

  describe("Binary Expressions", () => {
    it("should parse arithmetic expressions", () => {
      const ast = parseExpression("a + b * c");
      expect(ast).toEqual({
        type: NodeType.Program,
        body: {
          type: NodeType.BinaryExpression,
          operator: "+",
          left: {
            type: NodeType.Identifier,
            name: "a",
          },
          right: {
            type: NodeType.BinaryExpression,
            operator: "*",
            left: {
              type: NodeType.Identifier,
              name: "b",
            },
            right: {
              type: NodeType.Identifier,
              name: "c",
            },
          },
        },
      });
    });

    it("should parse comparison expressions", () => {
      const ast = parseExpression("a > b");
      expect(ast).toEqual({
        type: NodeType.Program,
        body: {
          type: NodeType.BinaryExpression,
          operator: ">",
          left: {
            type: NodeType.Identifier,
            name: "a",
          },
          right: {
            type: NodeType.Identifier,
            name: "b",
          },
        },
      });
    });

    it("should parse logical expressions", () => {
      const ast = parseExpression("a && b || c");
      expect(ast).toEqual({
        type: NodeType.Program,
        body: {
          type: NodeType.BinaryExpression,
          operator: "||",
          left: {
            type: NodeType.BinaryExpression,
            operator: "&&",
            left: {
              type: NodeType.Identifier,
              name: "a",
            },
            right: {
              type: NodeType.Identifier,
              name: "b",
            },
          },
          right: {
            type: NodeType.Identifier,
            name: "c",
          },
        },
      });
    });
  });

  describe("Unary Expressions", () => {
    it("should parse unary expressions", () => {
      const ast = parseExpression("!a");
      expect(ast).toEqual({
        type: NodeType.Program,
        body: {
          type: NodeType.UnaryExpression,
          operator: "!",
          argument: {
            type: NodeType.Identifier,
            name: "a",
          },
          prefix: true,
        },
      });
    });
  });

  describe("Conditional Expressions", () => {
    it("should parse ternary expressions", () => {
      const ast = parseExpression("a ? b : c");
      expect(ast).toEqual({
        type: NodeType.Program,
        body: {
          type: NodeType.ConditionalExpression,
          test: {
            type: NodeType.Identifier,
            name: "a",
          },
          consequent: {
            type: NodeType.Identifier,
            name: "b",
          },
          alternate: {
            type: NodeType.Identifier,
            name: "c",
          },
        },
      });
    });

    it("should parse nested ternary expressions", () => {
      const ast = parseExpression("a ? b : c ? d : e");
      expect(ast).toEqual({
        type: NodeType.Program,
        body: {
          type: NodeType.ConditionalExpression,
          test: {
            type: NodeType.Identifier,
            name: "a",
          },
          consequent: {
            type: NodeType.Identifier,
            name: "b",
          },
          alternate: {
            type: NodeType.ConditionalExpression,
            test: {
              type: NodeType.Identifier,
              name: "c",
            },
            consequent: {
              type: NodeType.Identifier,
              name: "d",
            },
            alternate: {
              type: NodeType.Identifier,
              name: "e",
            },
          },
        },
      });
    });
  });

  describe("Complex Expressions", () => {
    it("should parse complex expressions", () => {
      const ast = parseExpression("a + b * c > d ? e : f");
      expect(ast).toEqual({
        type: NodeType.Program,
        body: {
          type: NodeType.ConditionalExpression,
          test: {
            type: NodeType.BinaryExpression,
            operator: ">",
            left: {
              type: NodeType.BinaryExpression,
              operator: "+",
              left: {
                type: NodeType.Identifier,
                name: "a",
              },
              right: {
                type: NodeType.BinaryExpression,
                operator: "*",
                left: {
                  type: NodeType.Identifier,
                  name: "b",
                },
                right: {
                  type: NodeType.Identifier,
                  name: "c",
                },
              },
            },
            right: {
              type: NodeType.Identifier,
              name: "d",
            },
          },
          consequent: {
            type: NodeType.Identifier,
            name: "e",
          },
          alternate: {
            type: NodeType.Identifier,
            name: "f",
          },
        },
      });
    });
  });

  describe("Error Handling", () => {
    it("should throw error for unexpected token", () => {
      expect(() => parseExpression("a +")).toThrow("Unexpected end of input");
    });

    it("should throw error for invalid property access", () => {
      expect(() => parseExpression("a.")).toThrow("Expected property name");
    });

    it("should throw error for unclosed bracket notation", () => {
      expect(() => parseExpression("a[b")).toThrow("Expected closing bracket");
    });

    it("should throw error for invalid ternary expression", () => {
      expect(() => parseExpression("a ? b")).toThrow(
        "Expected : in conditional expression",
      );
    });
  });
});
