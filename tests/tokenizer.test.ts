import { describe, expect, it } from "vitest";
import { type Token, TokenType, tokenize } from "../src/tokenizer";

describe("Tokenizer", () => {
  describe("Basic Literals", () => {
    it("should tokenize string literals", () => {
      const input = "\"hello\" 'world'";
      const expected: Token[] = [
        { type: TokenType.STRING, value: "hello" },
        { type: TokenType.STRING, value: "world" },
      ];
      expect(tokenize(input)).toEqual(expected);
    });

    it("should handle escaped quotes in strings", () => {
      const input = '"hello \\"world\\""';
      const expected: Token[] = [
        { type: TokenType.STRING, value: 'hello "world"' },
      ];
      expect(tokenize(input)).toEqual(expected);
    });

    it("should tokenize numbers", () => {
      const input = "42 -3.14 0.5";
      const expected: Token[] = [
        { type: TokenType.NUMBER, value: "42" },
        { type: TokenType.NUMBER, value: "-3.14" },
        { type: TokenType.NUMBER, value: "0.5" },
      ];
      expect(tokenize(input)).toEqual(expected);
    });

    it("should tokenize boolean and null", () => {
      const input = "true false null";
      const expected: Token[] = [
        { type: TokenType.BOOLEAN, value: "true" },
        { type: TokenType.BOOLEAN, value: "false" },
        { type: TokenType.NULL, value: "null" },
      ];
      expect(tokenize(input)).toEqual(expected);
    });
  });

  describe("Operators", () => {
    it("should tokenize arithmetic operators", () => {
      const input = "a + b - c * d / e % f";
      const expected: Token[] = [
        { type: TokenType.IDENTIFIER, value: "a" },
        { type: TokenType.OPERATOR, value: "+" },
        { type: TokenType.IDENTIFIER, value: "b" },
        { type: TokenType.OPERATOR, value: "-" },
        { type: TokenType.IDENTIFIER, value: "c" },
        { type: TokenType.OPERATOR, value: "*" },
        { type: TokenType.IDENTIFIER, value: "d" },
        { type: TokenType.OPERATOR, value: "/" },
        { type: TokenType.IDENTIFIER, value: "e" },
        { type: TokenType.OPERATOR, value: "%" },
        { type: TokenType.IDENTIFIER, value: "f" },
      ];
      expect(tokenize(input)).toEqual(expected);
    });

    it("should tokenize comparison operators", () => {
      const input = "a === b !== c > d < e >= f <= g";
      const expected: Token[] = [
        { type: TokenType.IDENTIFIER, value: "a" },
        { type: TokenType.OPERATOR, value: "===" },
        { type: TokenType.IDENTIFIER, value: "b" },
        { type: TokenType.OPERATOR, value: "!==" },
        { type: TokenType.IDENTIFIER, value: "c" },
        { type: TokenType.OPERATOR, value: ">" },
        { type: TokenType.IDENTIFIER, value: "d" },
        { type: TokenType.OPERATOR, value: "<" },
        { type: TokenType.IDENTIFIER, value: "e" },
        { type: TokenType.OPERATOR, value: ">=" },
        { type: TokenType.IDENTIFIER, value: "f" },
        { type: TokenType.OPERATOR, value: "<=" },
        { type: TokenType.IDENTIFIER, value: "g" },
      ];
      expect(tokenize(input)).toEqual(expected);
    });

    it("should tokenize logical operators", () => {
      const input = "a && b || !c";
      const expected: Token[] = [
        { type: TokenType.IDENTIFIER, value: "a" },
        { type: TokenType.OPERATOR, value: "&&" },
        { type: TokenType.IDENTIFIER, value: "b" },
        { type: TokenType.OPERATOR, value: "||" },
        { type: TokenType.OPERATOR, value: "!" },
        { type: TokenType.IDENTIFIER, value: "c" },
      ];
      expect(tokenize(input)).toEqual(expected);
    });
  });

  describe("Property Access", () => {
    it("should tokenize dot notation", () => {
      const input = "data.value.nested";
      const expected: Token[] = [
        { type: TokenType.IDENTIFIER, value: "data" },
        { type: TokenType.DOT, value: "." },
        { type: TokenType.IDENTIFIER, value: "value" },
        { type: TokenType.DOT, value: "." },
        { type: TokenType.IDENTIFIER, value: "nested" },
      ];
      expect(tokenize(input)).toEqual(expected);
    });

    it("should tokenize bracket notation", () => {
      const input = 'data["value"]';
      const expected: Token[] = [
        { type: TokenType.IDENTIFIER, value: "data" },
        { type: TokenType.BRACKET_LEFT, value: "[" },
        { type: TokenType.STRING, value: "value" },
        { type: TokenType.BRACKET_RIGHT, value: "]" },
      ];
      expect(tokenize(input)).toEqual(expected);
    });
  });

  describe("Function Calls", () => {
    it("should tokenize predefined functions", () => {
      const input = "@sum(values)";
      const expected: Token[] = [
        { type: TokenType.FUNCTION, value: "sum" },
        { type: TokenType.PAREN_LEFT, value: "(" },
        { type: TokenType.IDENTIFIER, value: "values" },
        { type: TokenType.PAREN_RIGHT, value: ")" },
      ];
      expect(tokenize(input)).toEqual(expected);
    });

    it("should tokenize function calls with multiple arguments", () => {
      const input = "@max(a, b, c)";
      const expected: Token[] = [
        { type: TokenType.FUNCTION, value: "max" },
        { type: TokenType.PAREN_LEFT, value: "(" },
        { type: TokenType.IDENTIFIER, value: "a" },
        { type: TokenType.COMMA, value: "," },
        { type: TokenType.IDENTIFIER, value: "b" },
        { type: TokenType.COMMA, value: "," },
        { type: TokenType.IDENTIFIER, value: "c" },
        { type: TokenType.PAREN_RIGHT, value: ")" },
      ];
      expect(tokenize(input)).toEqual(expected);
    });
  });

  describe("Conditional Expressions", () => {
    it("should tokenize ternary expressions", () => {
      const input = "condition ? trueValue : falseValue";
      const expected: Token[] = [
        { type: TokenType.IDENTIFIER, value: "condition" },
        { type: TokenType.QUESTION, value: "?" },
        { type: TokenType.IDENTIFIER, value: "trueValue" },
        { type: TokenType.COLON, value: ":" },
        { type: TokenType.IDENTIFIER, value: "falseValue" },
      ];
      expect(tokenize(input)).toEqual(expected);
    });
  });

  describe("Complex Expressions", () => {
    it("should tokenize complex nested expressions", () => {
      const input = '@sum(data.values) > 0 ? data["status"] : "inactive"';
      const expected: Token[] = [
        { type: TokenType.FUNCTION, value: "sum" },
        { type: TokenType.PAREN_LEFT, value: "(" },
        { type: TokenType.IDENTIFIER, value: "data" },
        { type: TokenType.DOT, value: "." },
        { type: TokenType.IDENTIFIER, value: "values" },
        { type: TokenType.PAREN_RIGHT, value: ")" },
        { type: TokenType.OPERATOR, value: ">" },
        { type: TokenType.NUMBER, value: "0" },
        { type: TokenType.QUESTION, value: "?" },
        { type: TokenType.IDENTIFIER, value: "data" },
        { type: TokenType.BRACKET_LEFT, value: "[" },
        { type: TokenType.STRING, value: "status" },
        { type: TokenType.BRACKET_RIGHT, value: "]" },
        { type: TokenType.COLON, value: ":" },
        { type: TokenType.STRING, value: "inactive" },
      ];
      expect(tokenize(input)).toEqual(expected);
    });
  });

  describe("Error Handling", () => {
    it("should throw error for unterminated string", () => {
      const input = '"unclosed string';
      expect(() => tokenize(input)).toThrow("Unterminated string");
    });

    it("should throw error for unexpected character", () => {
      const input = "a # b";
      expect(() => tokenize(input)).toThrow("Unexpected character: #");
    });
  });
});
