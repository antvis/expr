import type {
	Program,
	Expression,
	BinaryExpression,
	UnaryExpression,
	ConditionalExpression,
	MemberExpression,
	CallExpression,
	Literal,
	Identifier,
} from "./parser";

type Context = Record<string, unknown>;
type Functions = Record<string, (...args: unknown[]) => unknown>;

/**
 * Interpreter class that evaluates AST nodes and produces a result
 *
 * Time Complexity:
 * - O(n) where n is the number of nodes in the AST
 * - Each node is visited exactly once
 *
 * Space Complexity:
 * - O(d) where d is the maximum depth of the AST
 * - Stack space for recursive evaluation
 */
export class Interpreter {
	private context: Context;
	private functions: Functions;

	constructor(context: Context = {}, functions: Functions = {}) {
		this.context = context;
		this.functions = functions;
	}

	/**
	 * Evaluates an AST and returns the result
	 * @param ast The AST to evaluate
	 * @returns The result of evaluation
	 * @example
	 * const ast = parser.parse(tokens);
	 * const result = interpreter.evaluate(ast);
	 */
	evaluate(ast: Program) {
		return this.evaluateNode(ast.body);
	}

	/**
	 * Evaluates a single AST node
	 * @param node The node to evaluate
	 * @returns The result of evaluation
	 */
	private evaluateNode(node: Expression) {
		switch (node.type) {
			case "Literal":
				return this.evaluateLiteral(node);
			case "Identifier":
				return this.evaluateIdentifier(node);
			case "MemberExpression":
				return this.evaluateMemberExpression(node);
			case "CallExpression":
				return this.evaluateCallExpression(node);
			case "BinaryExpression":
				return this.evaluateBinaryExpression(node);
			case "UnaryExpression":
				return this.evaluateUnaryExpression(node);
			case "ConditionalExpression":
				return this.evaluateConditionalExpression(node);
			default:
				throw new Error(
					`Unknown node type: ${
						// biome-ignore lint/suspicious/noExplicitAny: <explanation>
						(node as any).type
					}`,
				);
		}
	}

	/**
	 * Evaluates a literal value
	 * @example "hello" → "hello"
	 * @example 42 → 42
	 */
	private evaluateLiteral(node: Literal) {
		return node.value;
	}

	/**
	 * Evaluates an identifier by looking up its value in the context
	 * @example data → context.data
	 */
	private evaluateIdentifier(node: Identifier) {
		if (!(node.name in this.context)) {
			throw new Error(`Undefined variable: ${node.name}`);
		}
		return this.context[node.name];
	}

	/**
	 * Evaluates a member expression (property access)
	 * @example data.value → context.data.value
	 * @example data["value"] → context.data["value"]
	 */
	private evaluateMemberExpression(node: MemberExpression) {
		const object = this.evaluateNode(node.object);
		if (object == null) {
			throw new Error("Cannot access property of null or undefined");
		}

		const property = node.computed
			? this.evaluateNode(node.property)
			: (node.property as Identifier).name;

		return object[property];
	}

	/**
	 * Evaluates a function call
	 * @example @sum(1, 2) → functions.sum(1, 2)
	 */
	private evaluateCallExpression(node: CallExpression) {
		const func = this.functions[node.callee.name];
		if (!func) {
			throw new Error(`Undefined function: ${node.callee.name}`);
		}

		const args = node.arguments.map((arg) => this.evaluateNode(arg));
		return func(...args);
	}

	/**
	 * Evaluates a binary expression
	 * @example a + b → context.a + context.b
	 * @example x > y → context.x > context.y
	 */
	private evaluateBinaryExpression(node: BinaryExpression) {
		const left = this.evaluateNode(node.left);
		const right = this.evaluateNode(node.right);

		switch (node.operator) {
			case "+":
				return left + right;
			case "-":
				return left - right;
			case "*":
				return left * right;
			case "/":
				return left / right;
			case "%":
				return left % right;
			case "===":
				return left === right;
			case "!==":
				return left !== right;
			case ">":
				return left > right;
			case ">=":
				return left >= right;
			case "<":
				return left < right;
			case "<=":
				return left <= right;
			case "&&":
				return left && right;
			case "||":
				return left || right;
			default:
				throw new Error(`Unknown operator: ${node.operator}`);
		}
	}

	/**
	 * Evaluates a unary expression
	 * @example !valid → !context.valid
	 */
	private evaluateUnaryExpression(node: UnaryExpression) {
		const argument = this.evaluateNode(node.argument);

		switch (node.operator) {
			case "!":
				return !argument;
			default:
				throw new Error(`Unknown operator: ${node.operator}`);
		}
	}

	/**
	 * Evaluates a conditional (ternary) expression
	 * @example a ? b : c → context.a ? context.b : context.c
	 */
	private evaluateConditionalExpression(node: ConditionalExpression) {
		const test = this.evaluateNode(node.test);
		return test
			? this.evaluateNode(node.consequent)
			: this.evaluateNode(node.alternate);
	}
}
