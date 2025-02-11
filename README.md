**this is a expr eval lib for secure when use ssr**

```ts
// simple encapsulation
import { Tokenizer, Parser, Interpreter } from "@antv/graph-secure-eval";

const tokenizer = new Tokenizer();
const parser = new Parser();
const interpreter = new Interpreter();

function evaluate(input: string, context = {}, functions = {}) {
	const tokens = tokenizer.tokenize(input);
	const ast = parser.parse(tokens);
	return interpreter.evaluate(context, functions);
}
```

```ts
// simple demo
const context = {
	data: {
		values: [1, 2, 3],
		status: "active",
	},
};

const functions = {
	sum: (arr: number[]) => arr.reduce((a, b) => a + b, 0),
};

const input = '@sum(data.values) > 5 ? data["status"] : "inactive"';
console.log(evaluate(input, context, functions)); // "active";
```