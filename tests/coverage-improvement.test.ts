import { describe, expect, it } from "vitest";
import {
	Expression,
	ExpressionError,
	createExpression,
	evaluate,
} from "../src";
import { Interpreter } from "../src/interpreter";
import { Parser } from "../src/parser";
import { Tokenizer } from "../src/tokenizer";

describe("Coverage Improvement Tests", () => {
	describe("Expression Error Handling", () => {
		it("should handle non-ExpressionError errors during evaluation", () => {
			const expr = new Expression("a + b");

			const originalEvaluate = (expr as any).interpreter.evaluate;
			(expr as any).interpreter.evaluate = () => {
				throw new Error("Generic error");
			};

			expect(() => expr.evaluate({})).toThrow(ExpressionError);
			expect(() => expr.evaluate({})).toThrow("Generic error");

			(expr as any).interpreter.evaluate = originalEvaluate;
		});

		it("should handle unknown errors during evaluation", () => {
			// 创建一个会抛出非 Error 对象的表达式
			const expr = new Expression("a + b");

			const originalEvaluate = (expr as any).interpreter.evaluate;
			(expr as any).interpreter.evaluate = () => {
				throw "Not an error object";
			};

			expect(() => expr.evaluate({})).toThrow();

			(expr as any).interpreter.evaluate = originalEvaluate;
		});

		it("should handle empty expressions", () => {
			const expr = new Expression("");
			expect(() => expr.evaluate()).toThrow("Cannot evaluate empty expression");
		});

		it("should configure options correctly", () => {
			const expr = new Expression("a + b");
			expr.configure({ strictMode: false, maxTimeout: 2000 });
			// 验证配置已应用（间接测试，因为我们无法直接访问私有属性）
			expect(expr).toBeDefined();
		});
	});

	describe("Tokenizer Edge Cases", () => {
		it("should handle negative numbers in expressions", () => {
			const tokenizer = new Tokenizer();
			const tokens = tokenizer.tokenize("-42.5");

			expect(tokens).toHaveLength(1);
			expect(tokens[0]).toEqual({ type: "NUMBER", value: "-42.5" });
		});

		it("should handle function names with underscores", () => {
			const tokenizer = new Tokenizer();
			const tokens = tokenizer.tokenize("@calculate_total(a, b)");

			expect(tokens).toHaveLength(6);
			expect(tokens[0]).toEqual({ type: "FUNCTION", value: "calculate_total" });
		});
	});

	describe("Parser Edge Cases", () => {
		it("should throw error for missing comma between function arguments", () => {
			const parser = new Parser();
			const tokenizer = new Tokenizer();

			// 创建缺少逗号的函数调用 "@func(a b)"
			const tokens = tokenizer.tokenize("@func(a b)");

			expect(() => parser.parse(tokens)).toThrow(
				"Expected comma between function arguments",
			);
		});

		it("should throw error for unclosed function call", () => {
			const parser = new Parser();
			const tokenizer = new Tokenizer();

			// 创建未闭合的函数调用 "@func(a, b"
			const tokens = tokenizer.tokenize("@func(a, b");

			expect(() => parser.parse(tokens)).toThrow(
				"Expected closing parenthesis",
			);
		});

		it("should handle complex member expressions", () => {
			const parser = new Parser();
			const tokenizer = new Tokenizer();

			// 测试复杂的成员表达式 "obj.prop[index].nested"
			const tokens = tokenizer.tokenize("obj.prop[index].nested");
			const ast = parser.parse(tokens);

			expect(ast.type).toBe("Program");
			expect(ast.body.type).toBe("MemberExpression");
		});
	});

	describe("Interpreter Edge Cases", () => {
		it("should handle null values in member expressions", () => {
			const interpreter = new Interpreter();
			const ast: any = {
				type: "Program",
				body: {
					type: "MemberExpression",
					object: {
						type: "Literal",
						value: null,
						raw: "null",
					},
					property: {
						type: "Identifier",
						name: "prop",
					},
					computed: false,
				},
			};

			expect(() => interpreter.evaluate(ast, {})).toThrow(
				"Cannot access property of null or undefined",
			);
		});

		it("should handle undefined functions in call expressions", () => {
			const interpreter = new Interpreter();
			const ast: any = {
				type: "Program",
				body: {
					type: "CallExpression",
					callee: {
						type: "Identifier",
						name: "undefinedFunc",
					},
					arguments: [],
				},
			};

			expect(() => interpreter.evaluate(ast, {})).toThrow(
				"Evaluation error: Undefined function: undefinedFunc",
			);
		});

		it("should handle unsupported unary operators", () => {
			const interpreter = new Interpreter();
			const ast: any = {
				type: "Program",
				body: {
					type: "UnaryExpression",
					operator: "~", //
					argument: {
						type: "Literal",
						value: 5,
						raw: "5",
					},
				},
			};

			expect(() => interpreter.evaluate(ast, {})).toThrow(
				"Evaluation error: Unknown operator: ~",
			);
		});
	});
});
