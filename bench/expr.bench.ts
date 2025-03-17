import { bench, describe } from "vitest";
import { evaluate, register } from "../src";
import { createInterpreterState } from "../src/interpreter";
import { evaluateAst } from "../src/interpreter";
import { parse } from "../src/parser";
import { tokenize } from "../src/tokenizer";

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

const state = createInterpreterState(
	{},
	{
		calculateTotal: context.calculateTotal,
		applyDiscount: context.applyDiscount,
	},
);

const evaluateSync = (expr: string, context: any) => {
	const tokens = tokenize(expr);
	const ast = parse(tokens);
	return evaluateAst(ast, state, context);
};

// 测试表达式
const simpleExpression = "user.age + 5";
const mediumExpression = 'user.scores[2] > 80 ? "Good" : "Needs improvement"';
const complexExpression =
	'@applyDiscount(@calculateTotal(products), 10) > 2000 ? "High value" : "Standard"';

const complexExpression2 =
	'applyDiscount(calculateTotal(products), 10) > 2000 ? "High value" : "Standard"';

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
	bench("evaluate (baseline)", async () => {
		await evaluate(simpleExpression, context);
	});

	bench("new Function (vs evaluate)", () => {
		newFunctionSimple(context);
	});

	bench("evaluateSync (vs evaluate)", () => {
		evaluateSync(simpleExpression, context);
	});
});

describe("Medium Expression Benchmarks", () => {
	bench("evaluate (baseline)", async () => {
		await evaluate(mediumExpression, context);
	});

	bench("new Function (vs evaluate)", () => {
		newFunctionMedium(context);
	});

	bench("evaluateSync (vs evaluate)", () => {
		evaluateSync(mediumExpression, context);
	});
});

describe("Complex Expression Benchmarks", () => {
	bench("evaluate (baseline)", async () => {
		await evaluate(complexExpression, context);
	});

	bench("new Function (vs evaluate)", () => {
		newFunctionComplex(context);
	});

	bench("evaluateSync (vs evaluate)", () => {
		evaluateSync(complexExpression, context);
	});
});
