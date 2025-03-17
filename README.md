# @antv/expr

Have you ever wanted to use some dynamic JS capabilities when using the ssr chart library but were afraid of data security?

Now we have solved this problem for you. We have designed a simple and easy-to-understand template syntax to help you achieve dynamic rendering of charts.

## Features

- 🔒 **Secure by default** - No access to global objects or prototype chain, does not use `eval` or `new Function`
- ⚡ **Async support** - All evaluation operations return Promises, supporting asynchronous computation and timeout protection
- 🚀 **High performance** - Supports pre-compilation of expressions for improved performance with repeated evaluations
- 🛠️ **Extensible** - Register custom functions to easily extend functionality
- 🪩 **Lightweight** - Zero dependencies, small footprint

## Installation

```bash
npm install @antv/expr
# or
yarn add @antv/expr
# or
pnpm add @antv/expr
```

## Basic Usage

### Asynchronous Expression Evaluation

```typescript
import { evaluate } from '@antv/expr';

// Basic evaluation
const result = await evaluate('x + y', { x: 10, y: 20 }); // returns 30

// Using dot notation and array access
const data = {
  values: [1, 2, 3],
  status: 'active'
};

const result = await evaluate('data.values[0] + data.values[1]', { data }); // returns 3
```

### Pre-compiling Expressions

```typescript
import { compileSync, compile } from '@antv/expr';

// Synchronous compilation (returns async execution function)
const evaluator = compileSync('price * quantity');
const result1 = await evaluator({ price: 10, quantity: 5 }); // returns 50
const result2 = await evaluator({ price: 20, quantity: 3 }); // returns 60

// Asynchronous compilation
const asyncEvaluator = await compile('price * quantity');
const result = await asyncEvaluator({ price: 15, quantity: 2 }); // returns 30
```

### Registering Custom Functions

```typescript
import { register, evaluate } from '@antv/expr';

// Register custom functions
register('sum', (...args) => args.reduce((a, b) => a + b, 0));
register('average', (array) => array.reduce((a, b) => a + b, 0) / array.length);

// Use custom functions in expressions
const result = await evaluate('@sum(1, 2, 3, 4)'); // returns 10
const avg = await evaluate('@average(data.values)', { 
  data: { values: [10, 20, 30, 40] } 
}); // returns 25
```

## Supported Syntax

### Variable References

```typescript
// Simple variable reference
const result = await evaluate('x', { x: 42 }); // returns 42

// Nested property access with dot notation
const result = await evaluate('user.profile.name', { 
  user: { profile: { name: 'John' } } 
}); // returns 'John'

// Array access with bracket notation
const result = await evaluate('items[0]', { items: [10, 20, 30] }); // returns 10

// Mixed dot and bracket notation
const result = await evaluate('data.items[0].value', { 
  data: { items: [{ value: 42 }] } 
}); // returns 42
```

### Arithmetic Operations

```typescript
// Basic arithmetic
const result = await evaluate('a + b * c', { a: 5, b: 3, c: 2 }); // returns 11

// Using parentheses for grouping
const result = await evaluate('(a + b) * c', { a: 5, b: 3, c: 2 }); // returns 16

// Modulo operation
const result = await evaluate('a % b', { a: 10, b: 3 }); // returns 1
```

### Comparison and Logical Operations

```typescript
// Comparison operators
const result = await evaluate('age >= 18', { age: 20 }); // returns true

// Logical AND
const result = await evaluate('isActive && !isDeleted', { 
  isActive: true, isDeleted: false 
}); // returns true

// Logical OR
const result = await evaluate('status === "active" || status === "pending"', { 
  status: 'pending' 
}); // returns true
```

### Conditional (Ternary) Expressions

```typescript
// Simple ternary expression
const result = await evaluate('age >= 18 ? "adult" : "minor"', { 
  age: 20 
}); // returns 'adult'

// Nested ternary expressions
const result = await evaluate('score >= 90 ? "A" : score >= 80 ? "B" : "C"', { 
  score: 85 
}); // returns 'B'
```

### Function Calls

```typescript
import { register, evaluate } from '@antv/expr';

// Register functions
register('max', Math.max);
register('formatCurrency', (amount) => `$${amount.toFixed(2)}`);

// Function call with arguments
const result = await evaluate('@max(a, b, c)', { a: 5, b: 9, c: 2 }); // returns 9

// Expression as function arguments
const result = await evaluate('@formatCurrency(price * quantity)', { 
  price: 10.5, quantity: 3 
}); // returns '$31.50'
```
**Default Global Functions:** `['abs', 'ceil', 'floor', 'round', 'sqrt', 'pow', 'max', 'min']`

## Advanced Usage

### Timeout Handling

```typescript
import { configure, evaluate } from '@antv/expr';

// Register a setTimeout function
register(
	"settimeout",
	(timeout: number) => new Promise((resolve) => setTimeout(resolve, timeout)),
);

// Set maximum execution time to 500 milliseconds
configure({ maxTimeout: 500 });

// Try to execute a potentially long-running expression
try {
	await evaluate("@settimeout(1000)");
} catch (error) {
	console.error("Expression error:", error.message); // Will catch timeout error: Expression error: Evaluation timed out after 500ms
}
```

### Security Configuration

```typescript
import { configure } from '@antv/expr';

// Custom blacklisted keywords
configure({
  blackList: new Set([
    'constructor',
    '__proto__',
    'prototype',
    'eval',
    'Function',
    'this',
    'window',
    'global',
    // Add custom blacklisted keywords
    'dangerous'
  ])
});
```
**Default BlackList:** `['constructor', '__proto__', 'prototype', 'eval', 'Function', 'this', 'window', 'global']`
**Note:** You will replace the default blacklist with your custom blacklist.

## Security Features

This library is designed with security in mind:

- ✅ No access to global objects (`window`, `global`, etc.)
- ✅ No access to prototype chain
- ✅ No use of `eval` or `Function` constructor
- ✅ Expression execution has timeout protection
- ✅ Configurable keyword blacklist

## API Reference

### Core Functions

#### `evaluate(expression: string, context?: object): Promise<any>`

Asynchronously evaluates an expression and returns the result.

- `expression`: The expression string to evaluate
- `context`: An object containing variables used in the expression (optional)
- Returns: A Promise that resolves to the result of the expression evaluation

#### `compileSync(expression: string): (context?: object) => Promise<any>`

Synchronously compiles an expression, returning an async execution function that can be used multiple times.

- `expression`: The expression string to compile
- Returns: A function that accepts a context object and returns a Promise resolving to the evaluation result

#### `compile(expression: string): Promise<(context?: object) => Promise<any>>`

Asynchronously compiles an expression, returning an async evaluation function that can be used multiple times.

- `expression`: The expression string to compile
- Returns: A Promise that resolves to a function that accepts a context object and returns a Promise resolving to the evaluation result

### Configuration and Registration

#### `configure(config: Partial<ExpressionConfig>): void`

Sets global configuration for expression evaluation.

- `config`: Configuration options object
  - `maxTimeout`: Maximum execution time in milliseconds
  - `blackList`: Set of keywords not allowed in expressions

#### `register(name: string, fn: Function): void`

Registers a custom function that can be used in expressions.

- `name`: Function name (used with @ prefix in expressions)
- `fn`: Function implementation


### Error Handling

All evaluation errors throw an `ExpressionError` type exception with detailed error information.

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

MIT