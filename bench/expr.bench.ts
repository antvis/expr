import { Parser } from "expr-eval";
import { bench, describe } from "vitest";
import { compile, evaluate, register } from "../dist/index.esm.js";

const context = {
  user: {
    name: "John",
    age: 30,
    isAdmin: true,
    scores: [85, 90, 78, 92],
    address: {
      city: "New York",
      zip: "10001",
    },
  },
  products: [
    { id: 1, name: "Laptop", price: 1200 },
    { id: 2, name: "Phone", price: 800 },
    { id: 3, name: "Tablet", price: 500 },
  ],
  calculateTotal: (items: any[]) => {
    const total = items.reduce((sum, item) => sum + item.price, 0);
    return total;
  },
  applyDiscount: (total: number, percentage: number) => {
    const value = total * (1 - percentage / 100);
    return value;
  },
};

const simpleExpression = "user.age + 5";
const mediumExpression = 'user.scores[2] > 80 ? "Good" : "Needs improvement"';
const complexExpression =
  '@applyDiscount(@calculateTotal(products), 10) > 2000 ? "High value" : "Standard"';

const complexExpression2 =
  'applyDiscount(calculateTotal(products), 10) > 2000 ? "High value" : "Standard"';

const simpleExpressionCompiler = compile(simpleExpression);
const mediumExpressionCompiler = compile(mediumExpression);
const complexExpressionCompiler = compile(complexExpression);

register("calculateTotal", context.calculateTotal);
register("applyDiscount", context.applyDiscount);

const parser = new Parser();
parser.functions.calculateTotal = context.calculateTotal;
parser.functions.applyDiscount = context.applyDiscount;

const newFunctionSimple = new Function(
  "context",
  `with(context) { return ${simpleExpression}; }`,
);
const newFunctionMedium = new Function(
  "context",
  `with(context) { return ${mediumExpression}; }`,
);
const newFunctionComplex = new Function(
  "context",
  `with(context) { return ${complexExpression2}; }`,
);

describe("Simple Expression Benchmarks", () => {
  bench("evaluate after compile (baseline) only interpreter", () => {
    simpleExpressionCompiler(context);
  });

  bench("new Function (vs evaluate)", () => {
    newFunctionSimple(context);
  });

  bench(
    "evaluate without compile (vs evaluate) tokenize + parse + interpreter",
    () => {
      evaluate(simpleExpression, context);
    },
  );

  bench("expr-eval Parser (vs evaluate)", () => {
    // @ts-ignore
    Parser.evaluate(simpleExpression, context);
  });
});

describe("Medium Expression Benchmarks", () => {
  bench("evaluate after compile (baseline) only interpreter", () => {
    mediumExpressionCompiler(context);
  });

  bench("new Function (vs evaluate)", () => {
    newFunctionMedium(context);
  });

  bench(
    "evaluate without compile (vs evaluate) tokenize + parse + interpreter",
    () => {
      evaluate(mediumExpression, context);
    },
  );

  bench("expr-eval Parser (vs evaluate)", () => {
    // @ts-ignore
    Parser.evaluate(mediumExpression, context);
  });
});

describe("Complex Expression Benchmarks", () => {
  bench("evaluate after compile (baseline) only interpreter", () => {
    complexExpressionCompiler(context);
  });

  bench("new Function (vs evaluate)", () => {
    newFunctionComplex(context);
  });

  bench(
    "evaluate without compile (vs evaluate) tokenize + parse + interpreter",
    () => {
      evaluate(complexExpression2, context);
    },
  );

  bench("expr-eval Parser (vs evaluate)", () => {
    // @ts-ignore
    parser.evaluate(complexExpression2, context);
  });
});
