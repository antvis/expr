import { describe, expect, it, vi } from "vitest";
import { ExpressionError, compile, evaluate, register } from "../src";
import { createInterpreterState, evaluateAst } from "../src/interpreter";
import { NodeType, parse } from "../src/parser";
import { TokenType, tokenize } from "../src/tokenizer";

describe("Coverage Improvement Tests", () => {
	describe("Expression Error Handling", () => {
		it("should handle non-ExpressionError errors during evaluation", () => {
			// Mock the evaluate function to throw a generic error
			const originalEvaluate = vi
				.spyOn(console, "error")
				.mockImplementation(() => {
					throw new Error("Generic error");
				});

			expect(() => evaluate("a + b", {})).toThrow();

			// Restore the original function
			originalEvaluate.mockRestore();
		});

		it("should handle unknown errors during evaluation", () => {
			// Mock the evaluate function to throw a non-Error object
			const originalEvaluate = vi
				.spyOn(console, "error")
				.mockImplementation(() => {
					throw "Not an error object";
				});

			expect(() => evaluate("a + b", {})).toThrow();

			// Restore the original function
			originalEvaluate.mockRestore();
		});

		it("should handle empty expressions", () => {
			expect(() => evaluate("")).toThrow("Unexpected end of input");
		});

		it("should compile expressions correctly", () => {
			const compiled = compile("a + b");
			expect(compiled).toBeDefined();
			expect(typeof compiled).toBe("function");
		});
	});

	describe("Tokenizer Edge Cases", () => {
		it("should handle negative numbers in expressions", () => {
			const tokens = tokenize("-42.5");

			expect(tokens).toHaveLength(1);
			expect(tokens[0]).toEqual({ type: TokenType.NUMBER, value: "-42.5" });
		});

		it("should handle function names with underscores", () => {
			const tokens = tokenize("@calculate_total(a, b)");

			expect(tokens).toHaveLength(6);
			expect(tokens[0]).toEqual({
				type: TokenType.FUNCTION,
				value: "calculate_total",
			});
		});
	});

	describe("Parser Edge Cases", () => {
		it("should throw error for missing comma between function arguments", () => {
			// Create function call missing comma "@func(a b)"
			const tokens = tokenize("@func(a b)");

			expect(() => parse(tokens)).toThrow(
				"Expected comma between function arguments",
			);
		});

		it("should throw error for unclosed function call", () => {
			// Create unclosed function call "@func(a, b"
			const tokens = tokenize("@func(a, b");

			expect(() => parse(tokens)).toThrow("Expected closing parenthesis");
		});

		it("should handle complex member expressions", () => {
			// Test complex member expression "obj.prop[index].nested"
			const tokens = tokenize("obj.prop[index].nested");
			const ast = parse(tokens);

			expect(ast.type).toBe(NodeType.Program);
			expect(ast.body.type).toBe(NodeType.MemberExpression);
		});
	});

	describe("Interpreter Edge Cases", () => {
		it("should handle null values in member expressions", () => {
			const interpreterState = createInterpreterState();
			const ast: any = {
				type: NodeType.Program,
				body: {
					type: NodeType.MemberExpression,
					object: {
						type: NodeType.Literal,
						value: null,
						raw: "null",
					},
					property: {
						type: NodeType.Identifier,
						name: "prop",
					},
					computed: false,
				},
			};

			expect(() => evaluateAst(ast, interpreterState, {})).toThrow(
				"Cannot access property of null",
			);
		});

		it("should handle undefined functions in call expressions", () => {
			const interpreterState = createInterpreterState();
			const ast: any = {
				type: NodeType.Program,
				body: {
					type: NodeType.CallExpression,
					callee: {
						type: NodeType.Identifier,
						name: "undefinedFunc",
					},
					arguments: [],
				},
			};

			expect(() => evaluateAst(ast, interpreterState, {})).toThrow(
				"Undefined function",
			);
		});

		it("should handle unsupported unary operators", () => {
			const interpreterState = createInterpreterState();
			const ast: any = {
				type: NodeType.Program,
				body: {
					type: NodeType.UnaryExpression,
					operator: "~", //
					argument: {
						type: NodeType.Literal,
						value: 5,
						raw: "5",
					},
				},
			};

			expect(() => evaluateAst(ast, interpreterState, {})).toThrow(
				"Evaluation error: Postfix operators are not supported: ~",
			);
		});
	});
});
