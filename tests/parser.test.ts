import { describe, expect, it } from "vitest";
import { parse } from "../src/parser";
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
				type: "Program",
				body: {
					type: "Literal",
					value: 42,
					raw: "42",
				},
			});
		});

		it("should parse string literals", () => {
			const ast = parseExpression('"hello"');
			expect(ast).toEqual({
				type: "Program",
				body: {
					type: "Literal",
					value: "hello",
					raw: '"hello"',
				},
			});
		});

		it("should parse boolean literals", () => {
			const ast = parseExpression("true");
			expect(ast).toEqual({
				type: "Program",
				body: {
					type: "Literal",
					value: true,
					raw: "true",
				},
			});
		});

		it("should parse null literal", () => {
			const ast = parseExpression("null");
			expect(ast).toEqual({
				type: "Program",
				body: {
					type: "Literal",
					value: null,
					raw: "null",
				},
			});
		});
	});

	describe("Member Expressions", () => {
		it("should parse dot notation", () => {
			const ast = parseExpression("data.value");
			expect(ast).toEqual({
				type: "Program",
				body: {
					type: "MemberExpression",
					object: {
						type: "Identifier",
						name: "data",
					},
					property: {
						type: "Identifier",
						name: "value",
					},
					computed: false,
				},
			});
		});

		it("should parse bracket notation", () => {
			const ast = parseExpression('data["value"]');
			expect(ast).toEqual({
				type: "Program",
				body: {
					type: "MemberExpression",
					object: {
						type: "Identifier",
						name: "data",
					},
					property: {
						type: "Literal",
						value: "value",
						raw: '"value"',
					},
					computed: true,
				},
			});
		});

		it("should parse nested member expressions", () => {
			const ast = parseExpression("data.values[0].id");
			expect(ast).toEqual({
				type: "Program",
				body: {
					type: "MemberExpression",
					object: {
						type: "MemberExpression",
						object: {
							type: "MemberExpression",
							object: {
								type: "Identifier",
								name: "data",
							},
							property: {
								type: "Identifier",
								name: "values",
							},
							computed: false,
						},
						property: {
							type: "Literal",
							value: 0,
							raw: "0",
						},
						computed: true,
					},
					property: {
						type: "Identifier",
						name: "id",
					},
					computed: false,
				},
			});
		});
	});

	describe("Function Calls", () => {
		it("should parse function calls without arguments", () => {
			const ast = parseExpression("@sum()");
			expect(ast).toEqual({
				type: "Program",
				body: {
					type: "CallExpression",
					callee: {
						type: "Identifier",
						name: "sum",
					},
					arguments: [],
				},
			});
		});

		it("should parse function calls with multiple arguments", () => {
			const ast = parseExpression("@max(a, b, 42)");
			expect(ast).toEqual({
				type: "Program",
				body: {
					type: "CallExpression",
					callee: {
						type: "Identifier",
						name: "max",
					},
					arguments: [
						{
							type: "Identifier",
							name: "a",
						},
						{
							type: "Identifier",
							name: "b",
						},
						{
							type: "Literal",
							value: 42,
							raw: "42",
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
				type: "Program",
				body: {
					type: "BinaryExpression",
					operator: "+",
					left: {
						type: "Identifier",
						name: "a",
					},
					right: {
						type: "BinaryExpression",
						operator: "*",
						left: {
							type: "Identifier",
							name: "b",
						},
						right: {
							type: "Identifier",
							name: "c",
						},
					},
				},
			});
		});

		it("should parse comparison expressions", () => {
			const ast = parseExpression("a > b");
			expect(ast).toEqual({
				type: "Program",
				body: {
					type: "BinaryExpression",
					operator: ">",
					left: {
						type: "Identifier",
						name: "a",
					},
					right: {
						type: "Identifier",
						name: "b",
					},
				},
			});
		});

		it("should parse logical expressions", () => {
			const ast = parseExpression("a && b || c");
			expect(ast).toEqual({
				type: "Program",
				body: {
					type: "BinaryExpression",
					operator: "||",
					left: {
						type: "BinaryExpression",
						operator: "&&",
						left: {
							type: "Identifier",
							name: "a",
						},
						right: {
							type: "Identifier",
							name: "b",
						},
					},
					right: {
						type: "Identifier",
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
				type: "Program",
				body: {
					type: "UnaryExpression",
					operator: "!",
					argument: {
						type: "Identifier",
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
				type: "Program",
				body: {
					type: "ConditionalExpression",
					test: {
						type: "Identifier",
						name: "a",
					},
					consequent: {
						type: "Identifier",
						name: "b",
					},
					alternate: {
						type: "Identifier",
						name: "c",
					},
				},
			});
		});

		it("should parse nested ternary expressions", () => {
			const ast = parseExpression("a ? b : c ? d : e");
			expect(ast).toEqual({
				type: "Program",
				body: {
					type: "ConditionalExpression",
					test: {
						type: "Identifier",
						name: "a",
					},
					consequent: {
						type: "Identifier",
						name: "b",
					},
					alternate: {
						type: "ConditionalExpression",
						test: {
							type: "Identifier",
							name: "c",
						},
						consequent: {
							type: "Identifier",
							name: "d",
						},
						alternate: {
							type: "Identifier",
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
				type: "Program",
				body: {
					type: "ConditionalExpression",
					test: {
						type: "BinaryExpression",
						operator: ">",
						left: {
							type: "BinaryExpression",
							operator: "+",
							left: {
								type: "Identifier",
								name: "a",
							},
							right: {
								type: "BinaryExpression",
								operator: "*",
								left: {
									type: "Identifier",
									name: "b",
								},
								right: {
									type: "Identifier",
									name: "c",
								},
							},
						},
						right: {
							type: "Identifier",
							name: "d",
						},
					},
					consequent: {
						type: "Identifier",
						name: "e",
					},
					alternate: {
						type: "Identifier",
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
