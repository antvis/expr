import { ExpressionError } from "./index";

/**
 * TokenType represents all possible token types in our expression language
 * - Basic types: STRING, NUMBER, BOOLEAN, NULL
 * - Identifiers and Functions: IDENTIFIER, FUNCTION
 * - Operators: OPERATOR
 * - Structural tokens: DOT, BRACKET_LEFT/RIGHT, PAREN_LEFT/RIGHT, COMMA, QUESTION, COLON
 */
export type TokenType =
	| "STRING"
	| "NUMBER"
	| "BOOLEAN"
	| "NULL"
	| "IDENTIFIER"
	| "OPERATOR"
	| "FUNCTION"
	| "DOT"
	| "BRACKET_LEFT"
	| "BRACKET_RIGHT"
	| "PAREN_LEFT"
	| "PAREN_RIGHT"
	| "COMMA"
	| "QUESTION"
	| "COLON"
	| "DOLLAR";

/**
 * Token represents a single unit in the expression
 * @property type - The category of the token
 * @property value - The actual string value of the token
 */
export interface Token {
	type: TokenType;
	value: string;
}

/**
 * Checks if a character can start an operator
 * @param char - Character to check
 * @returns boolean indicating if char can start an operator
 */
const isOperatorStart = (char: string): boolean => {
	return /[+\-*/%!&|=<>]/.test(char);
};

/**
 * Converts an input expression string into an array of tokens
 * Processes the input character by character, identifying tokens based on patterns
 *
 * Time Complexity: O(n) where n is the length of input string
 * Space Complexity: O(n) for storing the tokens array
 *
 * @param expr - The input expression string to tokenize
 * @returns Array of Token objects
 * @throws Error for unexpected or invalid characters
 */
export const tokenize = (expr: string): Token[] => {
	// Use closure to encapsulate the tokenizer state
	let pos = 0;
	const input = expr;
	const tokens: Token[] = [];

	/**
	 * Reads a string literal token, handling escape sequences
	 * @returns String token
	 * @throws Error for unterminated strings
	 */
	const readString = (): Token => {
		const quote = input[pos];
		let value = "";
		pos++; // Skip opening quote

		while (pos < input.length) {
			const char = input[pos];
			if (char === quote) {
				pos++; // Skip closing quote
				return { type: "STRING", value };
			}
			if (char === "\\") {
				pos++;
				value += input[pos];
			} else {
				value += char;
			}
			pos++;
		}

		throw new ExpressionError(
			"Unterminated string",
			pos,
			input.substring(Math.max(0, pos - 10), pos),
		);
	};

	/**
	 * Reads a numeric token, handling integers, decimals, and negative numbers
	 * @returns Number token
	 */
	const readNumber = (): Token => {
		const start = pos;

		while (
			pos < input.length &&
			(/[0-9]/.test(input[pos]) || input[pos] === "." || input[pos] === "-")
		) {
			pos++;
		}
		const value = input.slice(start, pos);
		return { type: "NUMBER", value };
	};

	/**
	 * Reads a function name token after @ symbol
	 * @returns Function token
	 */
	const readFunction = (): Token => {
		pos++; // Skip @ symbol
		const start = pos;
		while (pos < input.length && /[a-zA-Z_]/.test(input[pos])) {
			pos++;
		}
		const value = input.slice(start, pos);
		return { type: "FUNCTION", value };
	};

	/**
	 * Reads an identifier token, also handling boolean and null literals
	 * @returns Identifier, boolean, or null token
	 */
	const readIdentifier = (): Token => {
		const start = pos;
		while (pos < input.length && /[a-zA-Z0-9_]/.test(input[pos])) {
			pos++;
		}
		const value = input.slice(start, pos);

		// Handle special keywords
		if (value === "true" || value === "false") {
			return { type: "BOOLEAN", value };
		}
		if (value === "null") {
			return { type: "NULL", value };
		}

		return { type: "IDENTIFIER", value };
	};

	/**
	 * Reads an operator token, handling multi-character operators first
	 * @returns Operator token
	 * @throws Error for unknown operators
	 */
	const readOperator = (): Token => {
		const operators = [
			"===", // Equality
			"!==", // Inequality
			"&&", // Logical AND
			"||", // Logical OR
			">=", // Greater than or equal
			"<=", // Less than or equal
			">", // Greater than
			"<", // Less than
			"+", // Addition
			"-", // Subtraction
			"*", // Multiplication
			"/", // Division
			"%", // Modulo
			"!", // Logical NOT
		];
		for (const op of operators) {
			if (input.startsWith(op, pos)) {
				pos += op.length;
				return { type: "OPERATOR", value: op };
			}
		}
		throw new ExpressionError(
			`Unknown operator at position ${pos}, the token is ${input.substring(Math.max(0, pos - 10), pos)}`,
			pos,
			input.substring(Math.max(0, pos - 10), pos),
		);
	};

	while (pos < input.length) {
		const char = input[pos];

		// Skip whitespace characters (space, tab, newline)
		if (/\s/.test(char)) {
			pos++;
			continue;
		}

		// Handle string literals (both single and double quotes)
		if (char === '"' || char === "'") {
			const token = readString();
			tokens.push(token);
			continue;
		}

		// Handle numbers (including negative numbers and decimals)
		if (/[0-9]/.test(char) || (char === "-" && /[0-9]/.test(input[pos + 1]))) {
			const token = readNumber();
			tokens.push(token);
			continue;
		}

		// Handle predefined functions starting with @
		if (char === "@") {
			const token = readFunction();
			tokens.push(token);
			continue;
		}

		// Handle identifiers, boolean literals, and null
		if (/[a-zA-Z_]/.test(char)) {
			const token = readIdentifier();
			tokens.push(token);
			continue;
		}

		// Handle operators (+, -, *, /, etc.)
		if (isOperatorStart(char)) {
			const token = readOperator();
			tokens.push(token);
			continue;
		}

		// Handle single-character tokens
		let token: Token | null = null;
		switch (char) {
			case ".":
				token = { type: "DOT", value: "." };
				break;
			case "[":
				token = { type: "BRACKET_LEFT", value: "[" };
				break;
			case "]":
				token = { type: "BRACKET_RIGHT", value: "]" };
				break;
			case "(":
				token = { type: "PAREN_LEFT", value: "(" };
				break;
			case ")":
				token = { type: "PAREN_RIGHT", value: ")" };
				break;
			case ",":
				token = { type: "COMMA", value: "," };
				break;
			case "?":
				token = { type: "QUESTION", value: "?" };
				break;
			case ":":
				token = { type: "COLON", value: ":" };
				break;
			case "$":
				token = { type: "DOLLAR", value: "$" };
				break;
			default:
				throw new ExpressionError(`Unexpected character: ${char}`, pos, char);
		}
		if (token) {
			tokens.push(token);
		}
		pos++;
	}

	return tokens;
};
