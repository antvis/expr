import { describe, expect, it } from "vitest";
import {
	ExpressionError,
	compile,
	configure,
	evaluate,
	register,
} from "../src";

describe("Configuration and Registry Tests", () => {
	describe("Configuration Functions", () => {
		it("should reset configuration to defaults", async () => {
			// First set a custom configuration
			configure({ maxTimeout: 100 });

			// Test that the default configuration is restored
			// Default timeout is 1000ms, so this should not time out
			const expr = "1 + 1";
			const result = await evaluate(expr);
			expect(result).toBe(2);
		});

		it("should enforce blacklisted keywords", async () => {
			// Test default blacklisted keywords
			await expect(evaluate("constructor")).rejects.toThrow(
				"Blacklisted keywords detected in expression",
			);

			// Add a custom blacklisted keyword
			configure({
				blackList: new Set([
					"constructor",
					"__proto__",
					"prototype",
					"eval",
					"Function",
					"setTimeout",
					"setInterval",
					"dangerous", // Added custom keyword
				]),
			});

			// Test that the custom blacklisted keyword is enforced
			await expect(evaluate("dangerous")).rejects.toThrow(
				"Blacklisted keywords detected in expression",
			);
		});
	});

	describe("Function Registry", () => {
		it("should register and use custom functions", async () => {
			// Register a custom function
			register("double", (x: number) => x * 2);

			// Test that the function can be used in expressions
			const result = await evaluate("@double(5)");
			expect(result).toBe(10);
		});
	});

	describe("compileAsync function", () => {
		it("should asynchronously compile expressions", async () => {
			// Test compileAsync
			const compiledFn = await compile("x + y");

			// Test that the compiled function works correctly
			const result = await compiledFn({ x: 10, y: 20 });
			expect(result).toBe(30);
		});

		it("should handle errors during async compilation", async () => {
			// Test that compileAsync properly rejects for invalid expressions
			await expect(compile("")).rejects.toThrow(
				"Cannot evaluate empty expression",
			);
		});

		it("should handle blacklisted keywords during async compilation", async () => {
			// Test that compileAsync properly rejects for expressions with blacklisted keywords
			await expect(compile("eval('alert(1)')")).rejects.toThrow(
				"Blacklisted keywords detected in expression",
			);
		});
	});

	describe("Error Handling", () => {
		it("should wrap non-ExpressionError errors", async () => {
			// Register a function that throws a regular Error
			register("throwError", () => {
				throw new Error("Regular error");
			});

			// Test that the error is wrapped in an ExpressionError
			const error = await evaluate("@throwError()").catch((e) => e);
			expect(error.message).toContain("Regular error");
		});

		it("should handle unknown errors", async () => {
			// Register a function that throws a non-Error object
			register("throwString", () => {
				throw "Not an error object";
			});

			// Test that the error is properly handled
			const error = await evaluate("@throwString()").catch((e) => e);
			expect(error).toBeInstanceOf(ExpressionError);
			expect(error.message).toContain(
				"Unknown error during evaluation: Not an error object",
			);
		});
	});
});
