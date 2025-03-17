import { describe, expect, it } from "vitest";
import { promisify } from "../src/utils";

describe("Utils", () => {
	describe("promisify", () => {
		it("should convert a synchronous function to an asynchronous one", async () => {
			// Define a simple synchronous function
			const add = (a: number, b: number): number => a + b;

			// Promisify it
			const asyncAdd = promisify(add);

			// Test that it works correctly
			const result = await asyncAdd(2, 3);
			expect(result).toBe(5);
		});

		it("should handle errors thrown by the original function", async () => {
			// Define a function that throws an error
			const throwError = (): never => {
				throw new Error("Test error");
			};

			// Promisify it
			const asyncThrow = promisify(throwError);

			// Test that it properly rejects the promise
			await expect(asyncThrow()).rejects.toThrow("Test error");
		});

		it("should handle functions with multiple arguments", async () => {
			// Define a function with multiple arguments
			const concat = (a: string, b: string, c: string): string => a + b + c;

			// Promisify it
			const asyncConcat = promisify(concat);

			// Test that it works correctly
			const result = await asyncConcat("Hello, ", "world", "!");
			expect(result).toBe("Hello, world!");
		});
	});
});
