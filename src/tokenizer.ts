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
 * Tokenizer class that converts an input expression string into a sequence of tokens
 *
 * Time Complexity:
 * - tokenize(): O(n) where n is the length of input string
 * - Each read* method: O(k) where k is the length of the current token
 * - Overall: O(n) as each character is processed exactly once
 *
 * Space Complexity:
 * - O(n) for storing the tokens array
 * - O(1) for other internal state (pos, input)
 * - Overall: O(n) where n is the length of input string
 */
export class Tokenizer {
	// Current position in the input string
	private pos = 0;
	// Input string being tokenized
	private input = "";

	/**
	 * Converts an input expression string into an array of tokens
	 * Processes the input character by character, identifying tokens based on patterns
	 *
	 * @param expr - The input expression string to tokenize
	 * @returns Array of Token objects
	 * @throws Error for unexpected or invalid characters
	 */
	tokenize(expr: string): Token[] {
		this.pos = 0;
		this.input = expr;
		const tokens: Token[] = [];

		while (this.pos < this.input.length) {
			const char = this.input[this.pos];

			// Skip whitespace characters (space, tab, newline)
			if (/\s/.test(char)) {
				this.pos++;
				continue;
			}

			// Handle string literals (both single and double quotes)
			if (char === '"' || char === "'") {
				tokens.push(this.readString());
				continue;
			}

			// Handle numbers (including negative numbers and decimals)
			if (
				/[0-9]/.test(char) ||
				(char === "-" && /[0-9]/.test(this.input[this.pos + 1]))
			) {
				tokens.push(this.readNumber());
				continue;
			}

			// Handle predefined functions starting with @
			if (char === "@") {
				tokens.push(this.readFunction());
				continue;
			}

			// Handle identifiers, boolean literals, and null
			if (/[a-zA-Z_]/.test(char)) {
				tokens.push(this.readIdentifier());
				continue;
			}

			// Handle operators (+, -, *, /, etc.)
			if (this.isOperatorStart(char)) {
				tokens.push(this.readOperator());
				continue;
			}

			// Handle single-character tokens
			switch (char) {
				case ".":
					tokens.push({ type: "DOT", value: "." });
					break;
				case "[":
					tokens.push({ type: "BRACKET_LEFT", value: "[" });
					break;
				case "]":
					tokens.push({ type: "BRACKET_RIGHT", value: "]" });
					break;
				case "(":
					tokens.push({ type: "PAREN_LEFT", value: "(" });
					break;
				case ")":
					tokens.push({ type: "PAREN_RIGHT", value: ")" });
					break;
				case ",":
					tokens.push({ type: "COMMA", value: "," });
					break;
				case "?":
					tokens.push({ type: "QUESTION", value: "?" });
					break;
				case ":":
					tokens.push({ type: "COLON", value: ":" });
					break;
				default:
					throw new ExpressionError(
						`Unexpected character: ${char}`,
						this.pos,
						char,
					);
			}
			this.pos++;
		}

		return tokens;
	}

	/**
	 * Reads a string literal token, handling escape sequences
	 * @returns String token including the content between quotes
	 * @throws Error for unterminated strings
	 */
	private readString(): Token {
		const quote = this.input[this.pos];
		let value = "";
		this.pos++;

		while (this.pos < this.input.length) {
			const char = this.input[this.pos];
			if (char === quote) {
				this.pos++;
				return { type: "STRING", value };
			}
			if (char === "\\") {
				this.pos++;
				value += this.input[this.pos];
			} else {
				value += char;
			}
			this.pos++;
		}

		throw new ExpressionError(
			"Unterminated string",
			this.pos,
			this.input.substring(Math.max(0, this.pos - 10), this.pos),
		);
	}

	/**
	 * Reads a numeric token, handling integers, decimals, and negative numbers
	 * @returns Number token
	 */
	private readNumber(): Token {
		const start = this.pos;
		while (
			this.pos < this.input.length &&
			(/[0-9]/.test(this.input[this.pos]) ||
				this.input[this.pos] === "." ||
				this.input[this.pos] === "-")
		) {
			this.pos++;
		}
		const value = this.input.slice(start, this.pos);
		return { type: "NUMBER", value };
	}

	/**
	 * Reads a function name token after @ symbol
	 * @returns Function token
	 */
	private readFunction(): Token {
		this.pos++; // jump @
		const start = this.pos;
		while (
			this.pos < this.input.length &&
			/[a-zA-Z_]/.test(this.input[this.pos])
		) {
			this.pos++;
		}
		const value = this.input.slice(start, this.pos);
		return { type: "FUNCTION", value };
	}

	/**
	 * Reads an identifier token, also handling boolean and null literals
	 * @returns Identifier, Boolean, or Null token
	 */
	private readIdentifier(): Token {
		const start = this.pos;
		while (
			this.pos < this.input.length &&
			/[a-zA-Z0-9_]/.test(this.input[this.pos])
		) {
			this.pos++;
		}
		const value = this.input.slice(start, this.pos);

		// Handle special keywords
		if (value === "true" || value === "false") {
			return { type: "BOOLEAN", value };
		}
		if (value === "null") {
			return { type: "NULL", value };
		}

		return { type: "IDENTIFIER", value };
	}

	/**
	 * Reads an operator token, handling multi-character operators first
	 * @returns Operator token
	 * @throws Error for unknown operators
	 */
	private readOperator(): Token {
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
			if (this.input.startsWith(op, this.pos)) {
				this.pos += op.length;
				return { type: "OPERATOR", value: op };
			}
		}
		throw new ExpressionError(
			`Unknown operator at position ${this.pos}, the token is ${this.input.substring(Math.max(0, this.pos - 10), this.pos)}`,
			this.pos,
			this.input.substring(Math.max(0, this.pos - 10), this.pos),
		);
	}

	/**
	 * Checks if a character can start an operator
	 * @param char - Character to check
	 * @returns boolean indicating if char can start an operator
	 */
	private isOperatorStart(char: string): boolean {
		return /[+\-*/%!&|=<>]/.test(char);
	}
}
