import { describe, expect, it } from "vitest";
import { type Token, tokenize } from "../src/tokenizer";

describe("Tokenizer", () => {
	describe("Basic Literals", () => {
		it("should tokenize string literals", () => {
			const input = "\"hello\" 'world'";
			const expected: Token[] = [
				{ type: "STRING", value: "hello" },
				{ type: "STRING", value: "world" },
			];
			expect(tokenize(input)).toEqual(expected);
		});

		it("should handle escaped quotes in strings", () => {
			const input = '"hello \\"world\\""';
			const expected: Token[] = [{ type: "STRING", value: 'hello "world"' }];
			expect(tokenize(input)).toEqual(expected);
		});

		it("should tokenize numbers", () => {
			const input = "42 -3.14 0.5";
			const expected: Token[] = [
				{ type: "NUMBER", value: "42" },
				{ type: "NUMBER", value: "-3.14" },
				{ type: "NUMBER", value: "0.5" },
			];
			expect(tokenize(input)).toEqual(expected);
		});

		it("should tokenize boolean and null", () => {
			const input = "true false null";
			const expected: Token[] = [
				{ type: "BOOLEAN", value: "true" },
				{ type: "BOOLEAN", value: "false" },
				{ type: "NULL", value: "null" },
			];
			expect(tokenize(input)).toEqual(expected);
		});
	});

	describe("Operators", () => {
		it("should tokenize arithmetic operators", () => {
			const input = "a + b - c * d / e % f";
			const expected: Token[] = [
				{ type: "IDENTIFIER", value: "a" },
				{ type: "OPERATOR", value: "+" },
				{ type: "IDENTIFIER", value: "b" },
				{ type: "OPERATOR", value: "-" },
				{ type: "IDENTIFIER", value: "c" },
				{ type: "OPERATOR", value: "*" },
				{ type: "IDENTIFIER", value: "d" },
				{ type: "OPERATOR", value: "/" },
				{ type: "IDENTIFIER", value: "e" },
				{ type: "OPERATOR", value: "%" },
				{ type: "IDENTIFIER", value: "f" },
			];
			expect(tokenize(input)).toEqual(expected);
		});

		it("should tokenize comparison operators", () => {
			const input = "a === b !== c > d < e >= f <= g";
			const expected: Token[] = [
				{ type: "IDENTIFIER", value: "a" },
				{ type: "OPERATOR", value: "===" },
				{ type: "IDENTIFIER", value: "b" },
				{ type: "OPERATOR", value: "!==" },
				{ type: "IDENTIFIER", value: "c" },
				{ type: "OPERATOR", value: ">" },
				{ type: "IDENTIFIER", value: "d" },
				{ type: "OPERATOR", value: "<" },
				{ type: "IDENTIFIER", value: "e" },
				{ type: "OPERATOR", value: ">=" },
				{ type: "IDENTIFIER", value: "f" },
				{ type: "OPERATOR", value: "<=" },
				{ type: "IDENTIFIER", value: "g" },
			];
			expect(tokenize(input)).toEqual(expected);
		});

		it("should tokenize logical operators", () => {
			const input = "a && b || !c";
			const expected: Token[] = [
				{ type: "IDENTIFIER", value: "a" },
				{ type: "OPERATOR", value: "&&" },
				{ type: "IDENTIFIER", value: "b" },
				{ type: "OPERATOR", value: "||" },
				{ type: "OPERATOR", value: "!" },
				{ type: "IDENTIFIER", value: "c" },
			];
			expect(tokenize(input)).toEqual(expected);
		});
	});

	describe("Property Access", () => {
		it("should tokenize dot notation", () => {
			const input = "data.value.nested";
			const expected: Token[] = [
				{ type: "IDENTIFIER", value: "data" },
				{ type: "DOT", value: "." },
				{ type: "IDENTIFIER", value: "value" },
				{ type: "DOT", value: "." },
				{ type: "IDENTIFIER", value: "nested" },
			];
			expect(tokenize(input)).toEqual(expected);
		});

		it("should tokenize bracket notation", () => {
			const input = 'data["value"]';
			const expected: Token[] = [
				{ type: "IDENTIFIER", value: "data" },
				{ type: "BRACKET_LEFT", value: "[" },
				{ type: "STRING", value: "value" },
				{ type: "BRACKET_RIGHT", value: "]" },
			];
			expect(tokenize(input)).toEqual(expected);
		});
	});

	describe("Function Calls", () => {
		it("should tokenize predefined functions", () => {
			const input = "@sum(values)";
			const expected: Token[] = [
				{ type: "FUNCTION", value: "sum" },
				{ type: "PAREN_LEFT", value: "(" },
				{ type: "IDENTIFIER", value: "values" },
				{ type: "PAREN_RIGHT", value: ")" },
			];
			expect(tokenize(input)).toEqual(expected);
		});

		it("should tokenize function calls with multiple arguments", () => {
			const input = "@max(a, b, c)";
			const expected: Token[] = [
				{ type: "FUNCTION", value: "max" },
				{ type: "PAREN_LEFT", value: "(" },
				{ type: "IDENTIFIER", value: "a" },
				{ type: "COMMA", value: "," },
				{ type: "IDENTIFIER", value: "b" },
				{ type: "COMMA", value: "," },
				{ type: "IDENTIFIER", value: "c" },
				{ type: "PAREN_RIGHT", value: ")" },
			];
			expect(tokenize(input)).toEqual(expected);
		});
	});

	describe("Conditional Expressions", () => {
		it("should tokenize ternary expressions", () => {
			const input = "condition ? trueValue : falseValue";
			const expected: Token[] = [
				{ type: "IDENTIFIER", value: "condition" },
				{ type: "QUESTION", value: "?" },
				{ type: "IDENTIFIER", value: "trueValue" },
				{ type: "COLON", value: ":" },
				{ type: "IDENTIFIER", value: "falseValue" },
			];
			expect(tokenize(input)).toEqual(expected);
		});
	});

	describe("Complex Expressions", () => {
		it("should tokenize complex nested expressions", () => {
			const input = '@sum(data.values) > 0 ? data["status"] : "inactive"';
			const expected: Token[] = [
				{ type: "FUNCTION", value: "sum" },
				{ type: "PAREN_LEFT", value: "(" },
				{ type: "IDENTIFIER", value: "data" },
				{ type: "DOT", value: "." },
				{ type: "IDENTIFIER", value: "values" },
				{ type: "PAREN_RIGHT", value: ")" },
				{ type: "OPERATOR", value: ">" },
				{ type: "NUMBER", value: "0" },
				{ type: "QUESTION", value: "?" },
				{ type: "IDENTIFIER", value: "data" },
				{ type: "BRACKET_LEFT", value: "[" },
				{ type: "STRING", value: "status" },
				{ type: "BRACKET_RIGHT", value: "]" },
				{ type: "COLON", value: ":" },
				{ type: "STRING", value: "inactive" },
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
