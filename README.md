# @antv/super-spec

Have you ever wanted to use some dynamic JS capabilities when using the ssr chart library but were afraid of data security?

Now we have solved this problem for you. We have designed a simple and easy-to-understand template syntax to help you achieve dynamic rendering of charts.

## Features

- 🔒 **Secure by default** - no access to global objects or prototype chain, do not use `eval` or `new Function`
- 🎯 **Perfect for SSR environments** - designed for server-side rendering
- 📦 **Zero dependencies** & extremely lightweight & no dependencies

## Installation

```bash
npm install @antv/super-spec
# or
yarn add @antv/super-spec
# or
pnpm add @antv/super-spec
```

## Basic Usage

```typescript
import { evaluate, createExpression } from "@antv/super-spec";

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

## Supported Grammatical Forms

The expression evaluator supports various grammatical forms to help you create dynamic expressions:

### 1. Variable References

```typescript
// Simple variable reference
const result = evaluate("x", { x: 42 }); // returns 42

// Nested property access with dot notation
const result = evaluate("user.profile.name", { 
  user: { profile: { name: "John" } } 
}); // returns "John"

// Array access with bracket notation
const result = evaluate("items[0]", { items: [10, 20, 30] }); // returns 10

// Mixed dot and bracket notation
const result = evaluate("data.items[0].value", { 
  data: { items: [{ value: 42 }] } 
}); // returns 42
```

### 2. Arithmetic Operations

```typescript
// Basic arithmetic
const result = evaluate("a + b * c", { a: 5, b: 3, c: 2 }); // returns 11

// Parentheses for grouping
const result = evaluate("(a + b) * c", { a: 5, b: 3, c: 2 }); // returns 16

// Modulo operation
const result = evaluate("a % b", { a: 10, b: 3 }); // returns 1

// Power operation
const result = evaluate("a ^ b", { a: 2, b: 3 }); // returns 8
```

### 3. Comparison and Logical Operations

```typescript
// Comparison operators
const result = evaluate("age >= 18", { age: 20 }); // returns true

// Logical AND
const result = evaluate("isActive && !isDeleted", { 
  isActive: true, isDeleted: false 
}); // returns true

// Logical OR
const result = evaluate("status == 'active' || status == 'pending'", { 
  status: 'pending' 
}); // returns true

// Combined logical expressions
const result = evaluate("(age >= 18 && status == 'active') || isAdmin", { 
  age: 16, status: 'inactive', isAdmin: true 
}); // returns true
```

### 4. Conditional (Ternary) Expressions

```typescript
// Simple ternary expression
const result = evaluate("age >= 18 ? 'adult' : 'minor'", { 
  age: 20 
}); // returns "adult"

// Nested ternary expressions
const result = evaluate("score >= 90 ? 'A' : score >= 80 ? 'B' : 'C'", { 
  score: 85 
}); // returns "B"
```

### 5. Function Calls

```typescript
// Function call with arguments
const result = createExpression('@max(a, b, c)')
  .configure({ strictMode: false })
  .extend({
    max: (...args: number[]) => Math.max(...args)
  })
  .evaluate({ a: 5, b: 9, c: 2 }); // returns 9

// Function call with expressions as arguments
const result = createExpression('@formatCurrency(price * quantity)')
  .configure({ strictMode: false })
  .extend({
    formatCurrency: (amount: number) => `$${amount.toFixed(2)}`
  })
  .evaluate({ price: 10.5, quantity: 3 }); // returns "$31.50"
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
  });
```

## Supported Operations

| Category | Operators | Example |
|----------|-----------|--------|
| Arithmetic | `+`, `-`, `*`, `/`, `%`, `^` (power) | `2 + 3 * 4` |
| Comparison | `==`, `!=`, `>`, `>=`, `<`, `<=` | `age >= 18` |
| Logical | `&&`, `||`, `!` | `isActive && !isDeleted` |
| Conditional | `? :` | `age >= 18 ? 'adult' : 'minor'` |
| Member Access | `.` and `[]` | `user.profile.name`, `items[0]` |
| Function Calls | `@functionName(args)` | `@sum(1, 2, 3)` |



## Security

This library is designed with security in mind:

- ✅ No access to global objects (`window`, `global`, etc.)
- ✅ No access to prototype chain
- ✅ No `eval` or `Function` constructor usage
- ✅ Strict mode by default
- ✅ Execution timeout protection

## TypeScript Support

This library is written in TypeScript and provides full type definitions.

```typescript
import { Expression, ExpressionError, evaluate, createExpression } from "@antv/super-spec";

// All types are properly exported and available
const expr: Expression = createExpression('x + y');
```

## License

MIT