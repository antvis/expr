import type { Token } from "./tokenizer";

/**
 * All possible node types in the Abstract Syntax Tree (AST)
 * - Program: Root node of the AST
 * - Literal: Constants (numbers, strings, booleans, null)
 * - Identifier: Variable and property names
 * - MemberExpression: Property access (dot or bracket notation)
 * - CallExpression: Function invocation
 * - BinaryExpression: Operations with two operands
 * - UnaryExpression: Operations with one operand
 * - ConditionalExpression: Ternary operator expressions
 */
export type NodeType =
	| "Program"
	| "Literal"
	| "Identifier"
	| "MemberExpression"
	| "CallExpression"
	| "BinaryExpression"
	| "UnaryExpression"
	| "ConditionalExpression";

/**
 * Base interface for all AST nodes
 * Every node must have a type property identifying its kind
 */
export interface Node {
	type: NodeType;
}

/**
 * Root node of the AST
 * Contains a single expression as its body
 */
export interface Program extends Node {
	type: "Program";
	body: Expression;
}

/**
 * Base interface for all expression nodes
 * All expressions are nodes that can produce a value
 */
export type Expression =
	| Literal
	| Identifier
	| MemberExpression
	| CallExpression
	| BinaryExpression
	| UnaryExpression
	| ConditionalExpression;

/**
 * Represents literal values in the code
 * Examples: 42, "hello", true, null
 */
export interface Literal extends Node {
	type: "Literal";
	value: string | number | boolean | null; // The actual value
	raw: string; // Original string representation in the source
}

/**
 * Represents identifiers/names in the code
 * Examples: variable names, property names
 */
export interface Identifier extends Node {
	type: "Identifier";
	name: string;
}

/**
 * Represents property access expressions
 * Examples:
 * - obj.prop (computed: false)
 * - obj["prop"] (computed: true)
 */
export interface MemberExpression extends Node {
	type: "MemberExpression";
	object: Expression; // The object being accessed
	property: Expression; // The property being accessed
	computed: boolean; // true for obj["prop"], false for obj.prop
}

/**
 * Represents function calls
 * Example: @sum(a, b)
 */
export interface CallExpression extends Node {
	type: "CallExpression";
	callee: Identifier; // Function name
	arguments: Expression[]; // Array of argument expressions
}

/**
 * Represents operations with two operands
 * Examples: a + b, x * y, foo === bar
 */
export interface BinaryExpression extends Node {
	type: "BinaryExpression";
	operator: string; // The operator (+, -, *, /, etc.)
	left: Expression; // Left-hand operand
	right: Expression; // Right-hand operand
}

/**
 * Represents operations with a single operand
 * Example: !valid
 */
export interface UnaryExpression extends Node {
	type: "UnaryExpression";
	operator: string; // The operator (!, -, etc.)
	argument: Expression; // The operand
}

/**
 * Represents ternary conditional expressions
 * Example: condition ? trueValue : falseValue
 */
export interface ConditionalExpression extends Node {
	type: "ConditionalExpression";
	test: Expression; // The condition
	consequent: Expression; // Value if condition is true
	alternate: Expression; // Value if condition is false
}

/**
 * Parser class that converts tokens into an Abstract Syntax Tree (AST)
 * Uses recursive descent parsing with precedence climbing
 *
 * Time Complexity:
 * - Overall: O(n) where n is the number of tokens
 * - Each token is processed exactly once during parsing
 * - Operator precedence climbing adds constant factor overhead
 *
 * Space Complexity:
 * - O(d) where d is the maximum depth of the expression tree
 * - Stack space for recursive calls in nested expressions
 * - Additional O(1) space for internal state (tokens array, current position)
 *
 * Example maximum depths:
 * - Binary expressions: a + b * c / d → depth 3
 * - Member access: foo.bar.baz[0].qux → depth 4
 * - Nested ternary: a ? b ? c : d : e → depth 2
 */
export class Parser {
	private tokens: Token[] = [];
	private current = 0;

	/**
	 * Parse tokens into an AST
	 * Time: O(n) - single pass through tokens
	 * Space: O(d) - recursive depth of expression tree
	 * @param tokens Array of tokens from the tokenizer
	 * @returns AST representing the expression
	 */
	parse(tokens: Token[]): Program {
		this.tokens = tokens;
		this.current = 0;

		const expression = this.parseExpression();
		return {
			type: "Program",
			body: expression,
		};
	}

	/**
	 * Returns the current token without consuming it
	 * @returns The current token or null if at end of input
	 * @example
	 * tokens = [{ type: "NUMBER", value: "42" }, ...]
	 * peek() → { type: "NUMBER", value: "42" }
	 */
	private peek(): Token | null {
		if (this.current >= this.tokens.length) return null;
		return this.tokens[this.current];
	}

	/**
	 * Consumes and returns the current token, advancing the parser position
	 * @returns The current token
	 * @example
	 * tokens = [{ type: "NUMBER", value: "42" }, { type: "OPERATOR", value: "+" }]
	 * consume() → { type: "NUMBER", value: "42" }
	 * // current is now pointing to the + operator
	 */
	private consume(): Token {
		return this.tokens[this.current++];
	}

	/**
	 * Checks if the current token matches the expected type
	 * @param type The token type to match
	 * @returns boolean indicating if current token matches
	 * @example
	 * tokens = [{ type: "PAREN_LEFT", value: "(" }, ...]
	 * match("PAREN_LEFT") → true
	 * match("NUMBER") → false
	 */
	private match(type: Token["type"]): boolean {
		const token = this.peek();
		return token !== null && token.type === type;
	}

	/**
	 * Parses expressions with operator precedence
	 * Time: O(n) - may process each token once
	 * Space: O(d) - recursive for nested expressions
	 * @param precedence Current precedence level
	 * @returns Expression node
	 * @example
	 * Input: "a + b * c"
	 * Returns: {
	 *   type: "BinaryExpression",
	 *   operator: "+",
	 *   left: { type: "Identifier", name: "a" },
	 *   right: {
	 *     type: "BinaryExpression",
	 *     operator: "*",
	 *     left: { type: "Identifier", name: "b" },
	 *     right: { type: "Identifier", name: "c" }
	 *   }
	 * }
	 */
	private parseExpression(precedence = 0): Expression {
		let left = this.parsePrimary();

		while (true) {
			const token = this.peek();
			if (!token) break;

			const nextPrecedence = this.getOperatorPrecedence(token);

			if (nextPrecedence <= precedence) break;

			if (token.type === "QUESTION") {
				this.consume(); // consume ?
				const consequent = this.parseExpression(0);
				if (!this.match("COLON")) {
					throw new Error("Expected ':' in conditional expression");
				}
				this.consume(); // consume :
				const alternate = this.parseExpression(0);
				left = {
					type: "ConditionalExpression",
					test: left,
					consequent,
					alternate,
				};
				continue;
			}

			if (token.type === "OPERATOR") {
				this.consume(); // consume operator
				const right = this.parseExpression(nextPrecedence);
				left = {
					type: "BinaryExpression",
					operator: token.value,
					left,
					right,
				};
				continue;
			}

			if (token.type === "DOT" || token.type === "BRACKET_LEFT") {
				left = this.parseMemberExpression(left);
				continue;
			}

			break;
		}

		return left;
	}

	/**
	 * Parses primary expressions (literals, identifiers, parenthesized expressions)
	 * Time: O(1) for literals/identifiers
	 *       O(n) for parenthesized expressions
	 * Space: O(1) for literals/identifiers
	 *        O(d) for parenthesized expressions
	 * @returns Expression node
	 * @example
	 * Input: "42"
	 * Returns: { type: "Literal", value: 42, raw: "42" }
	 *
	 * Input: "foo"
	 * Returns: { type: "Identifier", name: "foo" }
	 *
	 * Input: "(a + b)"
	 * Returns: { type: "BinaryExpression", operator: "+", ... }
	 */
	private parsePrimary(): Expression {
		const token = this.peek();
		if (!token) throw new Error("Unexpected end of input");

		switch (token.type) {
			case "NUMBER":
				this.consume();
				return {
					type: "Literal",
					value: Number(token.value),
					raw: token.value,
				};

			case "STRING":
				this.consume();
				return {
					type: "Literal",
					value: token.value,
					raw: `"${token.value}"`,
				};

			case "BOOLEAN":
				this.consume();
				return {
					type: "Literal",
					value: token.value === "true",
					raw: token.value,
				};

			case "NULL":
				this.consume();
				return {
					type: "Literal",
					value: null,
					raw: "null",
				};

			case "IDENTIFIER":
				this.consume();
				return {
					type: "Identifier",
					name: token.value,
				};

			case "FUNCTION":
				return this.parseCallExpression();

			case "PAREN_LEFT": {
				this.consume();
				const expr = this.parseExpression(0);
				if (!this.match("PAREN_RIGHT")) {
					throw new Error("Expected closing parenthesis");
				}
				this.consume();
				return expr;
			}

			default:
				throw new Error(`Unexpected token: ${token.type}`);
		}
	}

	/**
	 * Parses member access expressions
	 * Time: O(1) for single access
	 *       O(n) for chained access (a.b.c)
	 * Space: O(1) for single access
	 *        O(d) for chained access depth
	 * @param object The object expression being accessed
	 * @returns MemberExpression node
	 * @example
	 * Input: "data.value"
	 * Returns: {
	 *   type: "MemberExpression",
	 *   object: { type: "Identifier", name: "data" },
	 *   property: { type: "Identifier", name: "value" },
	 *   computed: false
	 * }
	 *
	 * Input: 'data["value"]'
	 * Returns: {
	 *   type: "MemberExpression",
	 *   object: { type: "Identifier", name: "data" },
	 *   property: { type: "Literal", value: "value", raw: '"value"' },
	 *   computed: true
	 * }
	 */
	private parseMemberExpression(object: Expression): MemberExpression {
		const token = this.consume(); // consume . or [
		let property: Expression;
		let computed: boolean;

		if (token.type === "DOT") {
			if (!this.match("IDENTIFIER")) {
				throw new Error("Expected identifier after dot");
			}
			property = {
				type: "Identifier",
				name: this.consume().value,
			};
			computed = false;
		} else {
			// BRACKET_LEFT
			property = this.parseExpression(0);
			if (!this.match("BRACKET_RIGHT")) {
				throw new Error("Expected closing bracket");
			}
			this.consume();
			computed = true;
		}

		return {
			type: "MemberExpression",
			object,
			property,
			computed,
		};
	}

	/**
	 * Parses function call expressions
	 */
	private parseCallExpression(): CallExpression {
		const token = this.consume(); // consume FUNCTION token
		const args: Expression[] = [];

		if (!this.match("PAREN_LEFT")) {
			throw new Error("Expected opening parenthesis after function name");
		}
		this.consume();

		// Parse arguments
		while (true) {
			// First check for right parenthesis
			if (this.match("PAREN_RIGHT")) {
				this.consume();
				break;
			}

			// Then check for end of input before doing anything else
			if (!this.peek()) {
				throw new Error("Expected closing parenthesis");
			}

			// If we have arguments already, we need a comma
			if (args.length > 0) {
				if (!this.match("COMMA")) {
					throw new Error("Expected comma between function arguments");
				}
				this.consume();
			}

			args.push(this.parseExpression(0));
		}

		return {
			type: "CallExpression",
			callee: {
				type: "Identifier",
				name: token.value,
			},
			arguments: args,
		};
	}

	/**
	 * Gets operator precedence
	 * Time: O(1) - constant time lookup
	 * Space: O(1) - no additional space used
	 * @param token The token to check
	 * @returns Precedence level (-1 to 8) or -1 if not an operator
	 */
	private getOperatorPrecedence(token: Token): number {
		if (token.type === "OPERATOR") {
			switch (token.value) {
				case "||":
					return 2;
				case "&&":
					return 3;
				case "===":
				case "!==":
					return 4;
				case ">":
				case ">=":
				case "<":
				case "<=":
					return 5;
				case "+":
				case "-":
					return 6;
				case "*":
				case "/":
				case "%":
					return 7;
				case "!":
					return 8;
			}
		}

		if (token.type === "DOT" || token.type === "BRACKET_LEFT") {
			return 9; // Highest precedence for member access
		}

		if (token.type === "QUESTION") {
			return 1; // Make it higher than -1 but lower than other operators
		}

		return -1;
	}
}
