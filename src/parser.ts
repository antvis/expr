import { type Token, TokenType } from "./tokenizer";
import { ExpressionError } from "./error";

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
export enum NodeType {
	Program = 0,
	Literal = 1,
	Identifier = 2,
	MemberExpression = 3,
	CallExpression = 4,
	BinaryExpression = 5,
	UnaryExpression = 6,
	ConditionalExpression = 7,
}

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
	type: NodeType.Program;
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
	type: NodeType.Literal;
	value: string | number | boolean | null; // The actual value
}

/**
 * Represents identifiers/names in the code
 * Examples: variable names, property names
 */
export interface Identifier extends Node {
	type: NodeType.Identifier;
	name: string;
}

/**
 * Represents property access expressions
 * Examples:
 * - obj.prop (computed: false)
 * - obj["prop"] (computed: true)
 */
export interface MemberExpression extends Node {
	type: NodeType.MemberExpression;
	object: Expression; // The object being accessed
	property: Expression; // The property being accessed
	computed: boolean; // true for obj["prop"], false for obj.prop
}

/**
 * Represents function calls
 * Example: @sum(a, b)
 */
export interface CallExpression extends Node {
	type: NodeType.CallExpression;
	callee: Identifier; // Function name
	arguments: Expression[]; // Array of argument expressions
}

/**
 * Represents operations with two operands
 * Examples: a + b, x * y, foo === bar
 */
export interface BinaryExpression extends Node {
	type: NodeType.BinaryExpression;
	operator: string; // The operator (+, -, *, /, etc.)
	left: Expression; // Left-hand operand
	right: Expression; // Right-hand operand
}

/**
 * Represents operations with a single operand
 * Example: !valid
 */
export interface UnaryExpression extends Node {
	type: NodeType.UnaryExpression;
	operator: string; // The operator (!, -, etc.)
	argument: Expression; // The operand
	prefix: boolean; // true for prefix operators, false for postfix
}

/**
 * Represents ternary conditional expressions
 * Example: condition ? trueValue : falseValue
 */
export interface ConditionalExpression extends Node {
	type: NodeType.ConditionalExpression;
	test: Expression; // The condition
	consequent: Expression; // Value if condition is true
	alternate: Expression; // Value if condition is false
}

// Operator precedence lookup table for O(1) access
const OPERATOR_PRECEDENCE = new Map<string, number>([
	["||", 2],
	["&&", 3],
	["===", 4],
	["!==", 4],
	[">", 5],
	[">=", 5],
	["<", 5],
	["<=", 5],
	["+", 6],
	["-", 6],
	["*", 7],
	["/", 7],
	["%", 7],
	["!", 8],
]);

// Pre-create common AST nodes for reuse
const NULL_LITERAL: Literal = {
	type: NodeType.Literal,
	value: null,
};

const TRUE_LITERAL: Literal = {
	type: NodeType.Literal,
	value: true,
};

const FALSE_LITERAL: Literal = {
	type: NodeType.Literal,
	value: false,
};

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
	const length = tokens.length;

	/**
	 * Returns the current token without consuming it
	 * @returns The current token or null if at end of input
	 */
	const peek = (): Token | null => {
		if (current >= length) return null;
		return tokens[current];
	};

	/**
	 * Consumes and returns the current token, advancing the parser position
	 * @returns The consumed token
	 */
	const consume = (): Token => {
		return tokens[current++];
	};

	/**
	 * Checks if the current token matches the expected type
	 * @param type - The token type to match
	 * @returns boolean indicating if current token matches
	 */
	const match = (type: TokenType): boolean => {
		const token = peek();
		return token !== null && token.type === type;
	};

	/**
	 * Gets operator precedence
	 * @param token - The token to check
	 * @returns Precedence level (-1 to 9) or -1 if not an operator
	 */
	const getOperatorPrecedence = (token: Token): number => {
		if (token.type === TokenType.OPERATOR) {
			return OPERATOR_PRECEDENCE.get(token.value) || -1;
		}

		if (token.type === TokenType.DOT || token.type === TokenType.BRACKET_LEFT) {
			return 9; // Highest precedence for member access
		}

		if (token.type === TokenType.QUESTION) {
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

		if (token.type === TokenType.DOT) {
			if (!match(TokenType.IDENTIFIER)) {
				const token = peek();
				throw new ExpressionError(
					"Expected property name",
					current,
					token ? token.value : "<end of input>",
				);
			}
			const identifierToken = consume();
			property = {
				type: NodeType.Identifier,
				name: identifierToken.value,
			};
			computed = false;
		} else {
			// BRACKET_LEFT
			property = parseExpression(0);

			if (!match(TokenType.BRACKET_RIGHT)) {
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
			type: NodeType.MemberExpression,
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

		if (!match(TokenType.PAREN_LEFT)) {
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
			if (match(TokenType.PAREN_RIGHT)) {
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
				if (!match(TokenType.COMMA)) {
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
			type: NodeType.CallExpression,
			callee: {
				type: NodeType.Identifier,
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
			token.type === TokenType.OPERATOR &&
			(token.value === "!" || token.value === "-")
		) {
			consume(); // consume operator
			const argument = parsePrimary();
			return {
				type: NodeType.UnaryExpression,
				operator: token.value,
				argument,
				prefix: true,
			};
		}

		switch (token.type) {
			case TokenType.NUMBER: {
				consume(); // consume number
				return {
					type: NodeType.Literal,
					value: Number(token.value),
				};
			}

			case TokenType.STRING: {
				consume(); // consume string
				return {
					type: NodeType.Literal,
					value: token.value,
				};
			}

			case TokenType.BOOLEAN: {
				consume(); // consume boolean
				return token.value === "true" ? TRUE_LITERAL : FALSE_LITERAL;
			}

			case TokenType.NULL: {
				consume(); // consume null
				return NULL_LITERAL;
			}

			case TokenType.IDENTIFIER: {
				consume(); // consume identifier
				return {
					type: NodeType.Identifier,
					name: token.value,
				};
			}

			case TokenType.FUNCTION:
				return parseCallExpression();

			case TokenType.PAREN_LEFT: {
				consume(); // consume (
				const expr = parseExpression(0);
				if (!match(TokenType.PAREN_RIGHT)) {
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

		while (current < length) {
			const token = tokens[current]; // Inline peek() for performance
			const nextPrecedence = getOperatorPrecedence(token);

			if (nextPrecedence <= precedence) break;

			if (token.type === TokenType.QUESTION) {
				consume(); // consume ?
				const consequent = parseExpression(0);
				if (!match(TokenType.COLON)) {
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
					type: NodeType.ConditionalExpression,
					test: left,
					consequent,
					alternate,
				};
				continue;
			}

			if (token.type === TokenType.OPERATOR) {
				consume(); // consume operator
				const right = parseExpression(nextPrecedence);
				left = {
					type: NodeType.BinaryExpression,
					operator: token.value,
					left,
					right,
				};
				continue;
			}

			if (
				token.type === TokenType.DOT ||
				token.type === TokenType.BRACKET_LEFT
			) {
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
		type: NodeType.Program,
		body: expression,
	};
};
