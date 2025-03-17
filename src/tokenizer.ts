import { ExpressionError } from "./utils";

// token type enum
export enum TokenType {
	STRING = 0,
	NUMBER = 1,
	BOOLEAN = 2,
	NULL = 3,
	IDENTIFIER = 4,
	OPERATOR = 5,
	FUNCTION = 6,
	DOT = 7,
	BRACKET_LEFT = 8,
	BRACKET_RIGHT = 9,
	PAREN_LEFT = 10,
	PAREN_RIGHT = 11,
	COMMA = 12,
	QUESTION = 13,
	COLON = 14,
	DOLLAR = 15,
}

// Character code constants for faster comparison
const CHAR_0 = 48; // '0'
const CHAR_9 = 57; // '9'
const CHAR_A = 65; // 'A'
const CHAR_Z = 90; // 'Z'
const CHAR_a = 97; // 'a'
const CHAR_z = 122; // 'z'
const CHAR_UNDERSCORE = 95; // '_'
const CHAR_DOT = 46; // '.'
const CHAR_MINUS = 45; // '-'
const CHAR_PLUS = 43; // '+'
const CHAR_MULTIPLY = 42; // '*'
const CHAR_DIVIDE = 47; // '/'
const CHAR_MODULO = 37; // '%'
const CHAR_EXCLAMATION = 33; // '!'
const CHAR_AMPERSAND = 38; // '&'
const CHAR_PIPE = 124; // '|'
const CHAR_EQUAL = 61; // '='
const CHAR_LESS_THAN = 60; // '<'
const CHAR_GREATER_THAN = 62; // '>'
const CHAR_QUESTION = 63; // '?'
const CHAR_COLON = 58; // ':'
const CHAR_COMMA = 44; // ','
const CHAR_BRACKET_LEFT = 91; // '['
const CHAR_BRACKET_RIGHT = 93; // ']'
const CHAR_PAREN_LEFT = 40; // '('
const CHAR_PAREN_RIGHT = 41; // ')'
const CHAR_DOLLAR = 36; // '$'
const CHAR_AT = 64; // '@'
const CHAR_DOUBLE_QUOTE = 34; // '"'
const CHAR_SINGLE_QUOTE = 39; // '\''
const CHAR_BACKSLASH = 92; // '\\'
const CHAR_SPACE = 32; // ' '
const CHAR_TAB = 9; // '\t'
const CHAR_NEWLINE = 10; // '\n'
const CHAR_CARRIAGE_RETURN = 13; // '\r'

// Use a Set for faster lookups
const WHITESPACE_CHARS = new Set([
	CHAR_SPACE,
	CHAR_TAB,
	CHAR_NEWLINE,
	CHAR_CARRIAGE_RETURN,
]);
const OPERATOR_START_CHARS = new Set([
	CHAR_PLUS,
	CHAR_MINUS,
	CHAR_MULTIPLY,
	CHAR_DIVIDE,
	CHAR_MODULO,
	CHAR_EXCLAMATION,
	CHAR_AMPERSAND,
	CHAR_PIPE,
	CHAR_EQUAL,
	CHAR_LESS_THAN,
	CHAR_GREATER_THAN,
]);

// Token type lookup maps for common tokens
const KEYWORDS = new Map<string, TokenType>([
	["true", TokenType.BOOLEAN],
	["false", TokenType.BOOLEAN],
	["null", TokenType.NULL],
]);

// Operator to token type mapping (sorted by length for optimization)
const OPERATOR_TOKENS = new Map<string, true>([
	// 3-character operators
	["===", true],
	["!==", true],

	// 2-character operators
	["<=", true],
	[">=", true],
	["&&", true],
	["||", true],

	// 1-character operators
	["+", true],
	["-", true],
	["*", true],
	["/", true],
	["%", true],
	["!", true],
	["<", true],
	[">", true],
]);

// Single character token map for O(1) lookup
const SINGLE_CHAR_TOKENS = new Map<number, TokenType>([
	[CHAR_DOT, TokenType.DOT],
	[CHAR_BRACKET_LEFT, TokenType.BRACKET_LEFT],
	[CHAR_BRACKET_RIGHT, TokenType.BRACKET_RIGHT],
	[CHAR_PAREN_LEFT, TokenType.PAREN_LEFT],
	[CHAR_PAREN_RIGHT, TokenType.PAREN_RIGHT],
	[CHAR_COMMA, TokenType.COMMA],
	[CHAR_QUESTION, TokenType.QUESTION],
	[CHAR_COLON, TokenType.COLON],
	[CHAR_DOLLAR, TokenType.DOLLAR],
]);

/**
 * Token represents a single unit in the expression
 * @property type - The category of the token
 * @property value - The actual string value of the token
 */
export interface Token {
	type: TokenType;
	value: string;
}

// Pre-allocate token objects for single character tokens to reduce object creation
const CHAR_TOKEN_CACHE = new Map<number, Token>();
for (const [code, type] of SINGLE_CHAR_TOKENS.entries()) {
	CHAR_TOKEN_CACHE.set(code, { type, value: String.fromCharCode(code) });
}

/**
 * Check if a character code is a digit (0-9)
 */
function isDigit(code: number): boolean {
	return code >= CHAR_0 && code <= CHAR_9;
}

/**
 * Check if a character code is a letter (a-z, A-Z) or underscore
 */
function isAlpha(code: number): boolean {
	return (
		(code >= CHAR_a && code <= CHAR_z) ||
		(code >= CHAR_A && code <= CHAR_Z) ||
		code === CHAR_UNDERSCORE
	);
}

/**
 * Check if a character code is alphanumeric (a-z, A-Z, 0-9) or underscore
 */
function isAlphaNumeric(code: number): boolean {
	return isAlpha(code) || isDigit(code);
}

/**
 * Check if a character code is whitespace
 */
function isWhitespace(code: number): boolean {
	return WHITESPACE_CHARS.has(code);
}

/**
 * Check if a character code can start an operator
 */
function isOperatorStart(code: number): boolean {
	return OPERATOR_START_CHARS.has(code);
}

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
	const input = expr;
	const length = input.length;
	// Pre-allocate tokens array with estimated capacity to avoid resizing
	const tokens: Token[] = new Array(Math.ceil(length / 3));
	let tokenCount = 0;
	let pos = 0;

	/**
	 * Reads a string literal token, handling escape sequences
	 * @returns String token
	 * @throws Error for unterminated strings
	 */

	function readString(quoteChar: number): Token {
		const start = pos + 1; // Skip opening quote
		pos++;
		let value = "";
		let hasEscape = false;

		while (pos < length) {
			const char = input.charCodeAt(pos);
			if (char === quoteChar) {
				// If no escape sequences, use substring directly
				if (!hasEscape) {
					value = input.substring(start, pos);
				}
				pos++; // Skip closing quote
				return { type: TokenType.STRING, value };
			}
			if (char === CHAR_BACKSLASH) {
				// Handle escape sequence
				if (!hasEscape) {
					// First escape encountered, copy characters so far
					value = input.substring(start, pos);
					hasEscape = true;
				}
				pos++;
				value += input[pos];
			} else if (hasEscape) {
				// Only append if we're building the escaped string
				value += input[pos];
			}
			pos++;
		}

		throw new ExpressionError(
			`Unterminated string starting with ${String.fromCharCode(quoteChar)}`,
			pos,
			input.substring(Math.max(0, pos - 10), pos),
		);
	}

	/**
	 * Reads a numeric token, handling integers, decimals, and negative numbers
	 * @returns Number token
	 */
	function readNumber(): Token {
		const start = pos;

		// Handle negative sign if present
		if (input.charCodeAt(pos) === CHAR_MINUS) {
			pos++;
		}

		// Read digits before decimal point
		while (pos < length && isDigit(input.charCodeAt(pos))) {
			pos++;
		}

		// Handle decimal point and digits after it
		if (pos < length && input.charCodeAt(pos) === CHAR_DOT) {
			pos++;
			while (pos < length && isDigit(input.charCodeAt(pos))) {
				pos++;
			}
		}

		const value = input.slice(start, pos);
		return { type: TokenType.NUMBER, value };
	}

	/**
	 * Reads a function name token after @ symbol
	 * @returns Function token
	 */
	function readFunction(): Token {
		pos++; // Skip @ symbol
		const start = pos;

		// First character must be a letter or underscore
		if (pos < length && isAlpha(input.charCodeAt(pos))) {
			pos++;

			// Subsequent characters can be alphanumeric
			while (pos < length && isAlphaNumeric(input.charCodeAt(pos))) {
				pos++;
			}
		}

		const value = input.slice(start, pos);
		return { type: TokenType.FUNCTION, value };
	}

	/**
	 * Reads an identifier token, also handling boolean and null literals
	 * @returns Identifier, boolean, or null token
	 */
	function readIdentifier(): Token {
		const start = pos++; // First character already checked

		// Read remaining characters
		while (pos < length && isAlphaNumeric(input.charCodeAt(pos))) {
			pos++;
		}

		const value = input.slice(start, pos);

		// Check if it's a keyword (true, false, null)
		const keywordType = KEYWORDS.get(value);
		if (keywordType) {
			return { type: keywordType, value };
		}

		return { type: TokenType.IDENTIFIER, value };
	}

	/**
	 * Reads an operator token, checking multi-character operators first
	 * @returns Operator token
	 */
	function readOperator(): Token {
		// Try to match 3-character operators
		if (pos + 2 < length) {
			const op3 = input.substring(pos, pos + 3);
			if (OPERATOR_TOKENS.has(op3)) {
				pos += 3;
				return { type: TokenType.OPERATOR, value: op3 };
			}
		}

		// Try to match 2-character operators
		if (pos + 1 < length) {
			const op2 = input.substring(pos, pos + 2);
			if (OPERATOR_TOKENS.has(op2)) {
				pos += 2;
				return { type: TokenType.OPERATOR, value: op2 };
			}
		}

		// Try to match 1-character operators
		const op1 = input[pos];
		if (OPERATOR_TOKENS.has(op1)) {
			pos++;
			return { type: TokenType.OPERATOR, value: op1 };
		}

		throw new ExpressionError(
			`Unknown operator at position ${pos}: ${input.substring(pos, pos + 1)}`,
			pos,
			input.substring(Math.max(0, pos - 10), pos),
		);
	}

	// Main tokenization loop
	while (pos < length) {
		const charCode = input.charCodeAt(pos);

		// Fast path for whitespace
		if (isWhitespace(charCode)) {
			pos++;
			continue;
		}

		// Fast path for single-character tokens
		const cachedToken = CHAR_TOKEN_CACHE.get(charCode);
		if (cachedToken) {
			tokens[tokenCount++] = cachedToken;
			pos++;
			continue;
		}

		// Handle string literals
		if (charCode === CHAR_DOUBLE_QUOTE || charCode === CHAR_SINGLE_QUOTE) {
			tokens[tokenCount++] = readString(charCode);
			continue;
		}

		// Handle numbers (including negative numbers)
		if (
			isDigit(charCode) ||
			(charCode === CHAR_MINUS &&
				pos + 1 < length &&
				isDigit(input.charCodeAt(pos + 1)))
		) {
			tokens[tokenCount++] = readNumber();
			continue;
		}

		// Handle function calls starting with @
		if (charCode === CHAR_AT) {
			tokens[tokenCount++] = readFunction();
			continue;
		}

		// Handle identifiers (including keywords)
		if (isAlpha(charCode)) {
			tokens[tokenCount++] = readIdentifier();
			continue;
		}

		// Handle operators
		if (isOperatorStart(charCode)) {
			tokens[tokenCount++] = readOperator();
			continue;
		}

		// If we get here, we have an unexpected character
		throw new ExpressionError(
			`Unexpected character: ${input[pos]}`,
			pos,
			input.substring(Math.max(0, pos - 10), pos),
		);
	}

	// Trim the tokens array to the actual number of tokens
	return tokenCount === tokens.length ? tokens : tokens.slice(0, tokenCount);
};
