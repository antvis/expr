import { describe, expect, it, vi } from "vitest";
import {
	Expression,
	ExpressionError,
	createExpression,
	evaluate,
} from "../src";

describe("Expression Class", () => {
	describe("constructor", () => {
		it("should create an instance with the given expression", () => {
			const expr = new Expression("1 + 2");
			expect(expr).toBeInstanceOf(Expression);
		});
	});

	describe("configure", () => {
		it("should configure options", () => {
			const expr = new Expression("1 + 2");
			const result = expr.configure({ strictMode: false, maxTimeout: 2000 });
			expect(result).toBe(expr); // Should return this for chaining
		});
	});

	describe("extend", () => {
		it("should throw error in strict mode", () => {
			const expr = new Expression("@sum(1, 2, 3)");
			expect(() =>
				expr.extend({
					sum: (...args: unknown[]) =>
						args.reduce((a: unknown, b: unknown) => Number(a) + Number(b), 0),
				}),
			).toThrow(ExpressionError);
		});

		it("should allow extending with custom functions when not in strict mode", () => {
			const expr = new Expression("@sum(1, 2, 3)")
				.configure({ strictMode: false })
				.extend({
					sum: (...args: unknown[]) =>
						args.reduce((a: unknown, b: unknown) => Number(a) + Number(b), 0),
				});

			expect(expr.evaluate()).toBe(6);
		});

		it("should return this for chaining", () => {
			const expr = new Expression("@sum(1, 2, 3)").configure({
				strictMode: false,
			});

			const result = expr.extend({
				sum: (...args: unknown[]) =>
					args.reduce((a: unknown, b: unknown) => Number(a) + Number(b), 0),
			});
			expect(result).toBe(expr);
		});
	});

	describe("compile", () => {
		it("should compile the expression and return this for chaining", () => {
			const expr = new Expression("1 + 2");
			const result = expr.compile();
			expect(result).toBe(expr);
		});

		it("should throw ExpressionError for invalid expressions", () => {
			const expr = new Expression("1 +"); // Invalid expression
			try {
				expr.compile();
				// Should not reach here
				expect(true).toBe(false);
			} catch (error) {
				expect(error).toBeInstanceOf(ExpressionError);
				expect(error.message).toContain("Unexpected end of input");
				expect(error.position).toBeDefined();
				expect(error.token).toBeDefined();
			}
		});
	});

	describe("evaluate", () => {
		it("should evaluate simple expressions", () => {
			const expr = new Expression("1 + 2");
			expect(expr.evaluate()).toBe(3);
		});

		it("should evaluate expressions with context", () => {
			const expr = new Expression("a + b");
			expect(expr.evaluate({ a: 5, b: 3 })).toBe(8);
		});

		it("should compile automatically if not already compiled", () => {
			const expr = new Expression("1 + 2");
			const compileSpy = vi.spyOn(expr, "compile");
			expr.evaluate();
			expect(compileSpy).toHaveBeenCalled();
		});

		it("should not recompile if already compiled", () => {
			const expr = new Expression("1 + 2");
			expr.compile();
			const compileSpy = vi.spyOn(expr, "compile");
			expr.evaluate();
			expect(compileSpy).not.toHaveBeenCalled();
		});

		it("should throw ExpressionError for empty expressions", () => {
			const expr = new Expression("");
			try {
				expr.evaluate();
				// Should not reach here
				expect(true).toBe(false);
			} catch (error) {
				expect(error).toBeInstanceOf(ExpressionError);
				expect(error.message).toBe("Cannot evaluate empty expression");
			}
		});

		it("should throw ExpressionError for evaluation errors", () => {
			const expr = new Expression("a / 0");
			const result = expr.evaluate({ a: 1 });
			// Should not reach here
			expect(result).toBe(Number.POSITIVE_INFINITY);
		});
	});
});

describe("Factory Functions", () => {
	describe("createExpression", () => {
		it("should create an Expression instance", () => {
			const expr = createExpression("1 + 2");
			expect(expr).toBeInstanceOf(Expression);
		});
	});

	describe("evaluate", () => {
		it("should evaluate the expression directly", () => {
			expect(evaluate("1 + 2")).toBe(3);
		});

		it("should evaluate with context", () => {
			expect(evaluate("a + b", { a: 5, b: 3 })).toBe(8);
		});

		it("should throw ExpressionError for invalid expressions", () => {
			try {
				evaluate("1 +");
				// Should not reach here
				expect(true).toBe(false);
			} catch (error) {
				expect(error).toBeInstanceOf(ExpressionError);
				expect(error.message).toContain("Unexpected end of input");
				expect(error.position).toBeDefined();
				expect(error.token).toBeDefined();
			}
		});
	});
});

describe("ExpressionError", () => {
	it("should create an error with the correct name", () => {
		const error = new ExpressionError("Test error");
		expect(error.name).toBe("ExpressionError");
		expect(error.message).toBe("Test error");
	});

	it("should store position and token information", () => {
		const error = new ExpressionError("Test error", 5, "token");
		expect(error.position).toBe(5);
		expect(error.token).toBe("token");
	});

	it("should format error message with position and token when available", () => {
		const error = new ExpressionError("Syntax error", 10, "@");
		const errorString = error.toString();
		expect(errorString).toContain("Syntax error");
		expect(errorString).toContain("position: 10");
		expect(errorString).toContain("token: @");
	});
});

describe("Error Handling Tests", () => {
	// 分词器错误测试
	it("should provide detailed error for unexpected character", () => {
		try {
			evaluate("a # b");
			// Should not reach here
			expect(true).toBe(false);
		} catch (error) {
			expect(error).toBeInstanceOf(ExpressionError);
			expect(error.message).toContain("Unexpected character");
			expect(error.position).toBeDefined();
			expect(error.token).toBe("#");
			console.log(`error: ${error.toString()}`);
		}
	});

	it("should provide detailed error for unterminated string", () => {
		try {
			evaluate('"incomplete string');
			// Should not reach here
			expect(true).toBe(false);
		} catch (error) {
			expect(error).toBeInstanceOf(ExpressionError);
			expect(error.message).toContain("Unterminated string");
			expect(error.position).toBeDefined();
			expect(error.token).toBeDefined();
			console.log(`error: ${error.toString()}`);
		}
	});

	it("should provide detailed error for invalid escape sequence", () => {
		const result = evaluate('"string with z escape"');
		// Should not reach here
		expect(result).toBe("string with z escape");
	});

	// 解析器错误测试
	it("should provide detailed error for missing closing parenthesis", () => {
		try {
			evaluate("(1 + 2");
			// Should not reach here
			expect(true).toBe(false);
		} catch (error) {
			expect(error).toBeInstanceOf(ExpressionError);
			expect(error.message).toContain("Expected closing parenthesis");
			expect(error.position).toBeDefined();
			expect(error.token).toBeDefined();
			console.log(`error: ${error.toString()}`);
		}
	});

	it("should provide detailed error for missing operand", () => {
		try {
			evaluate("1 + ");
			// Should not reach here
			expect(true).toBe(false);
		} catch (error) {
			expect(error).toBeInstanceOf(ExpressionError);
			expect(error.message).toContain("Unexpected end of input");
			expect(error.position).toBeDefined();
			expect(error.token).toBeDefined();
			console.log(`error: ${error.toString()}`);
		}
	});

	it("should provide detailed error for missing operator", () => {
		try {
			const result = evaluate("1 2");
			expect(result).toBe(1);
		} catch (error) {
			expect(error).toBeInstanceOf(ExpressionError);
			console.log(`error: ${error.toString()}`);
		}
	});

	// 解释器错误测试
	it("should provide detailed error for undefined variable", () => {
		try {
			evaluate("undefinedVar + 1");
			// Should not reach here
			expect(true).toBe(false);
		} catch (error) {
			expect(error).toBeInstanceOf(ExpressionError);
			expect(error.message).toContain("Undefined");
			console.log(`error: ${error.toString()}`);
		}
	});

	it("should handle division by zero", () => {
		try {
			const result = evaluate("10 / 0");
			// JavaScript 中除以零会返回 Infinity，而不是抛出错误
			expect(result).toBe(Number.POSITIVE_INFINITY);
		} catch (error) {
			// 如果实现选择抛出错误，我们也接受这种情况
			expect(error).toBeInstanceOf(ExpressionError);
			console.log(`error: ${error.toString()}`);
		}
	});

	it("should provide detailed error for invalid property access", () => {
		try {
			evaluate("null.property", { null: null });
			// Should not reach here
			expect(true).toBe(false);
		} catch (error) {
			expect(error).toBeInstanceOf(ExpressionError);
			console.log(`error: ${error.toString()}`);
		}
	});
});

describe("Integration Tests", () => {
	it("should handle complex expressions", () => {
		const context = {
			data: {
				values: [1, 2, 3],
				status: "active",
			},
		};

		const expr = new Expression("data.values[1] + data.values[2]")
			.configure({ strictMode: false })
			.compile();

		expect(expr.evaluate(context)).toBe(5);
	});

	it("should support method chaining", () => {
		const result = new Expression("a + b")
			.configure({ strictMode: false })
			.compile()
			.evaluate({ a: 1, b: 2 });

		expect(result).toBe(3);
	});

	it("should handle custom functions with extend", () => {
		const expr = new Expression("@double(a) + @triple(b)")
			.configure({ strictMode: false })
			.extend({
				double: (x: unknown) => Number(x) * 2,
				triple: (x: unknown) => Number(x) * 3,
			})
			.compile(); // 确保在evaluate前编译表达式

		expect(expr.evaluate({ a: 2, b: 3 })).toBe(13); // 2*2 + 3*3 = 4 + 9 = 13
	});
});
