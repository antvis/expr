import { getFunctions } from "./functions";
import {
  type Context,
  createInterpreterState,
  evaluateAst,
} from "./interpreter";
import { parse } from "./parser";
import { tokenize } from "./tokenizer";

/**
 * Compile an expression into a reusable function
 * @param expression - The expression to compile
 * @returns A function that evaluates the expression with a given context
 */
export function compile(
  expression: string,
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
): (context?: Context) => any {
  const tokens = tokenize(expression);
  const ast = parse(tokens);
  const interpreterState = createInterpreterState({}, getFunctions());

  // Return a function that can be called with different contexts
  // biome-ignore lint/suspicious/noExplicitAny: Return type depends on the expression
  return (context: Context = {}): any => {
    return evaluateAst(ast, interpreterState, context);
  };
}
