import { ExpressionError } from "./index";
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
	prefix: boolean; // true for prefix operators, false for postfix
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
 * Parse tokens into an AST
 * Time: O(n) - single pass through tokens
 * Space: O(d) - recursive depth of expression tree
 * @param tokens - Array of tokens from the tokenizer
 * @returns AST representing the expression
 */
export const parse = (tokens: Token[]): Program => {
	// Use closure to encapsulate the parser state
	let current = 0;

	/**
	 * Returns the current token without consuming it
	 * @returns The current token or null if at end of input
	 */
	const peek = (): Token | null => {
		if (current >= tokens.length) return null;
		return tokens[current];
	};

	/**
	 * Consumes and returns the current token, advancing the parser position
	 * @returns The consumed token
	 */
	const consume = (): Token => {
		const token = tokens[current];
		current++;
		return token;
	};

	/**
	 * Checks if the current token matches the expected type
	 * @param type - The token type to match
	 * @returns boolean indicating if current token matches
	 */
	const match = (type: Token["type"]): boolean => {
		const token = peek();
		return token !== null && token.type === type;
	};

	/**
	 * Gets operator precedence
	 * @param token - The token to check
	 * @returns Precedence level (-1 to 9) or -1 if not an operator
	 */
	const getOperatorPrecedence = (token: Token): number => {
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
	};

	/**
	 * Parses member access expressions
	 * @param object - The object expression being accessed
	 * @returns MemberExpression node
	 */
	const parseMemberExpression = (object: Expression): MemberExpression => {
		const token = consume(); // consume . or [
		let property: Expression;
		let computed: boolean;

		if (token.type === "DOT") {
			if (!match("IDENTIFIER")) {
				const token = peek();
				throw new ExpressionError(
					"Expected property name",
					current,
					token ? token.value : "<end of input>",
				);
			}
			const identifierToken = consume();
			property = {
				type: "Identifier",
				name: identifierToken.value,
			};
			computed = false;
		} else {
			// BRACKET_LEFT
			property = parseExpression(0);

			if (!match("BRACKET_RIGHT")) {
				const token = peek();
				throw new ExpressionError(
					"Expected closing bracket",
					current,
					token ? token.value : "<end of input>",
				);
			}
			consume(); // consume ]
			computed = true;
		}

		return {
			type: "MemberExpression",
			object,
			property,
			computed,
		};
	};

	/**
	 * Parses function call expressions
	 * @returns CallExpression node
	 */
	const parseCallExpression = (): CallExpression => {
		const token = consume(); // consume FUNCTION token
		const args: Expression[] = [];

		if (!match("PAREN_LEFT")) {
			const token = peek();
			throw new ExpressionError(
				"Expected opening parenthesis after function name",
				current,
				token ? token.value : "<end of input>",
			);
		}
		consume(); // consume (

		// Parse arguments
		while (true) {
			// First check for right parenthesis
			if (match("PAREN_RIGHT")) {
				consume(); // consume )
				break;
			}

			// Then check for end of input before doing anything else
			if (!peek()) {
				const token = peek();
				throw new ExpressionError(
					"Expected closing parenthesis",
					current,
					token ? token.value : "<end of input>",
				);
			}

			// If we have arguments already, we need a comma
			if (args.length > 0) {
				if (!match("COMMA")) {
					const token = peek();
					throw new ExpressionError(
						"Expected comma between function arguments",
						current,
						token ? token.value : "<end of input>",
					);
				}
				consume(); // consume ,
			}

			const arg = parseExpression(0);
			args.push(arg);
		}

		return {
			type: "CallExpression",
			callee: {
				type: "Identifier",
				name: token.value,
			},
			arguments: args,
		};
	};

	/**
	 * Parses primary expressions (literals, identifiers, parenthesized expressions)
	 * @returns Expression node
	 */
	const parsePrimary = (): Expression => {
		const token = peek();
		if (!token)
			throw new ExpressionError(
				"Unexpected end of input",
				current,
				"<end of input>",
			);

		// Handle unary operators
		if (
			token.type === "OPERATOR" &&
			(token.value === "!" || token.value === "-")
		) {
			consume(); // consume operator
			const argument = parsePrimary();
			return {
				type: "UnaryExpression",
				operator: token.value,
				argument,
				prefix: true,
			};
		}

		switch (token.type) {
			case "NUMBER": {
				consume(); // consume number
				return {
					type: "Literal",
					value: Number(token.value),
					raw: token.value,
				};
			}

			case "STRING": {
				consume(); // consume string
				return {
					type: "Literal",
					value: token.value,
					raw: `"${token.value}"`,
				};
			}

			case "BOOLEAN": {
				consume(); // consume boolean
				return {
					type: "Literal",
					value: token.value === "true",
					raw: token.value,
				};
			}

			case "NULL": {
				consume(); // consume null
				return {
					type: "Literal",
					value: null,
					raw: "null",
				};
			}

			case "IDENTIFIER": {
				consume(); // consume identifier
				return {
					type: "Identifier",
					name: token.value,
				};
			}

			case "FUNCTION":
				return parseCallExpression();

			case "PAREN_LEFT": {
				consume(); // consume (
				const expr = parseExpression(0);
				if (!match("PAREN_RIGHT")) {
					const token = peek();
					throw new ExpressionError(
						"Expected closing parenthesis",
						current,
						token ? token.value : "<end of input>",
					);
				}
				consume(); // consume )
				return expr;
			}

			default:
				throw new ExpressionError(
					`Unexpected token: ${token.type}`,
					current,
					token.value,
				);
		}
	};

	/**
	 * Parses expressions with operator precedence
	 * @param precedence - Current precedence level
	 * @returns Expression node
	 */
	const parseExpression = (precedence = 0): Expression => {
		let left = parsePrimary();

		while (true) {
			const token = peek();

			if (!token) break;

			const nextPrecedence = getOperatorPrecedence(token);

			if (nextPrecedence <= precedence) break;

			if (token.type === "QUESTION") {
				consume(); // consume ?
				const consequent = parseExpression(0);
				if (!match("COLON")) {
					const token = peek();
					throw new ExpressionError(
						"Expected : in conditional expression",
						current,
						token ? token.value : "<end of input>",
					);
				}
				consume(); // consume :
				const alternate = parseExpression(0);
				left = {
					type: "ConditionalExpression",
					test: left,
					consequent,
					alternate,
				};
				continue;
			}

			if (token.type === "OPERATOR") {
				consume(); // consume operator
				const right = parseExpression(nextPrecedence);
				left = {
					type: "BinaryExpression",
					operator: token.value,
					left,
					right,
				};
				continue;
			}

			if (token.type === "DOT" || token.type === "BRACKET_LEFT") {
				left = parseMemberExpression(left);
				continue;
			}

			break;
		}

		return left;
	};

	// Start parsing from the initial state
	const expression = parseExpression();
	return {
		type: "Program",
		body: expression,
	};
};
