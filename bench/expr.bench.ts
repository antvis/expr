import { bench, describe } from "vitest";
import { compile, evaluate, register } from "../src";

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

// 测试表达式
const simpleExpression = "user.age + 5";
const mediumExpression = 'user.scores[2] > 80 ? "Good" : "Needs improvement"';
const complexExpression =
	'@applyDiscount(@calculateTotal(products), 10) > 2000 ? "High value" : "Standard"';

const complexExpression2 =
	'applyDiscount(calculateTotal(products), 10) > 2000 ? "High value" : "Standard"';

const simpleExpressionCompiler = compile(simpleExpression);
const mediumExpressionCompiler = compile(mediumExpression);
const complexExpression2Compiler = compile(complexExpression);

register("calculateTotal", context.calculateTotal);
register("applyDiscount", context.applyDiscount);

// 创建 Function 对象
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
	bench("evaluate after compile (baseline)", () => {
		simpleExpressionCompiler(context);
	});

	bench("new Function (vs evaluate)", () => {
		newFunctionSimple(context);
	});

	bench("evaluate without compile (vs evaluate)", () => {
		evaluate(simpleExpression, context);
	});
});

describe("Medium Expression Benchmarks", () => {
	bench("evaluate after compile (baseline)", () => {
		mediumExpressionCompiler(context);
	});

	bench("new Function (vs evaluate)", () => {
		newFunctionMedium(context);
	});

	bench("evaluate without compile (vs evaluate)", () => {
		evaluate(mediumExpression, context);
	});
});

describe("Complex Expression Benchmarks", () => {
	bench("evaluate after compile (baseline)", () => {
		complexExpression2Compiler(context);
	});

	bench("new Function (vs evaluate)", () => {
		newFunctionComplex(context);
	});

	bench("evaluate without compile (vs evaluate)", () => {
		evaluate(complexExpression2, context);
	});
});
