// Global registry for functions that can be used in expressions
// biome-ignore lint/suspicious/noExplicitAny: Function registry needs to support any function type
type ExpressionFunction = (...args: any[]) => any;

// Register some common Math functions by default
const exprGlobalFunctions: Record<string, ExpressionFunction> = {
  abs: Math.abs,
  ceil: Math.ceil,
  floor: Math.floor,
  max: Math.max,
  min: Math.min,
  round: Math.round,
  sqrt: Math.sqrt,
  pow: Math.pow,
};

/**
 * Register a function to be used in expressions with the @ prefix
 * @param name - The name of the function to register
 * @param fn - The function implementation
 */
export function register(name: string, fn: ExpressionFunction): void {
  exprGlobalFunctions[name] = fn;
}

/**
 * Get all the registered functions
 * @returns
 */
export function getFunctions(): Record<string, ExpressionFunction> {
  return exprGlobalFunctions;
}
