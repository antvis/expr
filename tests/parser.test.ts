import { describe, expect, it } from "vitest";
import { Parser, Tokenizer } from "../src";

describe("Parser", () => {
	const tokenizer = new Tokenizer();
	const parser = new Parser();

	function parse(input: string) {
		const tokens = tokenizer.tokenize(input);
		return parser.parse(tokens);
	}

	describe("Literals", () => {
		it("should parse number literals", () => {
			const ast = parse("42");
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
			const ast = parse('"hello"');
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
			const ast = parse("true");
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
			const ast = parse("null");
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
			const ast = parse("data.value");
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
			const ast = parse('data["value"]');
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
			const ast = parse("data.values[0].id");
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
			const ast = parse("@sum()");
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
			const ast = parse("@max(a, b, 42)");
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
			const ast = parse("a + b * c");
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
			const ast = parse("a === b");
			expect(ast).toEqual({
				type: "Program",
				body: {
					type: "BinaryExpression",
					operator: "===",
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
			const ast = parse("a && b || c");
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

	describe("Conditional Expressions", () => {
		it("should parse ternary expressions", () => {
			const ast = parse("a ? b : c");
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
			const ast = parse("a ? b ? c : d : e");
			expect(ast).toEqual({
				type: "Program",
				body: {
					type: "ConditionalExpression",
					test: {
						type: "Identifier",
						name: "a",
					},
					consequent: {
						type: "ConditionalExpression",
						test: {
							type: "Identifier",
							name: "b",
						},
						consequent: {
							type: "Identifier",
							name: "c",
						},
						alternate: {
							type: "Identifier",
							name: "d",
						},
					},
					alternate: {
						type: "Identifier",
						name: "e",
					},
				},
			});
		});
	});

	describe("Complex Expressions", () => {
		it("should parse complex nested expressions", () => {
			const ast = parse('@sum(data.values) > 0 ? data["status"] : "inactive"');
			expect(ast).toEqual({
				type: "Program",
				body: {
					type: "ConditionalExpression",
					test: {
						type: "BinaryExpression",
						operator: ">",
						left: {
							type: "CallExpression",
							callee: {
								type: "Identifier",
								name: "sum",
							},
							arguments: [
								{
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
							],
						},
						right: {
							type: "Literal",
							value: 0,
							raw: "0",
						},
					},
					consequent: {
						type: "MemberExpression",
						object: {
							type: "Identifier",
							name: "data",
						},
						property: {
							type: "Literal",
							value: "status",
							raw: '"status"',
						},
						computed: true,
					},
					alternate: {
						type: "Literal",
						value: "inactive",
						raw: '"inactive"',
					},
				},
			});
		});
	});

	describe("Error Handling", () => {
		it("should throw error for unclosed parentheses", () => {
			expect(() => parse("@sum(a, b")).toThrow("Expected closing parenthesis");
		});

		it("should throw error for unclosed brackets", () => {
			expect(() => parse('data["key"')).toThrow("Expected closing bracket");
		});

		it("should throw error for incomplete ternary", () => {
			expect(() => parse("a ? b")).toThrow(
				"Expected ':' in conditional expression",
			);
		});

		it("should throw error for missing function arguments", () => {
			expect(() => parse("@sum")).toThrow(
				"Expected opening parenthesis after function name",
			);
		});
	});
});
