import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		environment: "node",
		coverage: {
			provider: "v8", // 或者使用 'istanbul'（c8）
			reporter: ["text", "json", "html"],
			include: ["src/**/*.ts"],
			exclude: ["**/*.d.ts", "**/*.test.ts", "node_modules/**"],
		},
	},
});
