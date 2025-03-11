# super-spec

A secure expression evaluator for JavaScript/TypeScript with a chainable API. Perfect for safely evaluating dynamic expressions in SSR environments.

## Features

- 🔒 Secure by default - no access to global objects or prototype chain
- ⛓️ Chainable API for fluent expression building
- 🛡️ Strict mode and configurable security options
- 🎯 Perfect for SSR environments
- 📦 Zero dependencies & Extremely lightweight


## Basic Usage

```typescript
import { evaluate, createExpression } from "super-spec";

// Quick evaluation
const result = evaluate("price * quantity", {
  price: 10,
  quantity: 5
}); // returns 50

// Chainable API
const result = createExpression("price * quantity")
  .evaluate({ price: 10, quantity: 5 }); // returns 50

// Using dot notation and array access
const data = {
  values: [1, 2, 3],
  status: "active"
};

const result = createExpression('data.values[0] + data["values"][1]')
  .evaluate({ data }); // returns 3

// Using custom functions with configuration
const expr = createExpression('@sum(data.values) > 5 ? data["status"] : "inactive"')
  .configure({ strictMode: false })
  .extend({
    sum: (arr: number[]) => arr.reduce((a, b) => a + b, 0),
    uppercase: (str: string) => str.toUpperCase()
  })
  .evaluate({
    data: {
      values: [1, 2, 3],
      status: "active"
    }
  }); // returns "inactive"
```

## Advanced Usage

### Pre-compilation for Better Performance

```typescript
// Compile once, evaluate multiple times
const expr = createExpression('price * quantity')
  .compile(); // Pre-compile the expression

// Later use...
const result1 = expr.evaluate({ price: 10, quantity: 5 }); // 50
const result2 = expr.evaluate({ price: 20, quantity: 3 }); // 60
```

### Configuration Options

```typescript
const expr = createExpression('someExpression')
  .configure({
    strictMode: true,           // Enables strict security mode (default: true)
    maxTimeout: 1000,          // Maximum execution time in ms (default: 1000)
    allowedFunctions: ['sum']  // Whitelist of allowed functions
  });
```

### Error Handling

```typescript
import { ExpressionError } from "super-spec";

try {
  const result = createExpression('undefined_var + 1')
    .evaluate();
} catch (error) {
  if (error instanceof ExpressionError) {
    console.error(`Error: ${error.message}`);
    // Error: Undefined variable: undefined_var
  }
}
```

## Supported Operations

- Arithmetic: `+`, `-`, `*`, `/`, `%`
- Comparison: `===`, `!==`, `>`, `>=`, `<`, `<=`
- Logical: `&&`, `||`, `!`
- Conditional: `? :`
- Member Access: `.` and `[]`
- Function Calls: `@functionName(args)`

## Security

This library is designed with security in mind:

- No access to global objects (`window`, `global`, etc.)
- No access to prototype chain
- No `eval` or `Function` constructor usage
- Configurable function whitelist
- Execution timeout protection
- Memory usage limits

## License

MIT