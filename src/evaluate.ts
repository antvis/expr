import { type Context } from "./interpreter";
import { compile } from "./compile";

/**
 * Evaluate an expression with a given context
 * @param expression - The expression to evaluate
 * @param context - The context to use for evaluation
 * @returns The result of evaluating the expression
 */
export function evaluate(
  expression: string,
  context: Context = {},
  // biome-ignore lint/suspicious/noExplicitAny: Return type depends on the expression
): any {
  return compile(expression)(context);
}
