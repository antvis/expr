import typescript from "@rollup/plugin-typescript";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";

export default [
	{
		input: "src/index.ts",
		output: [
			{
				file: "dist/index.esm.js",
				format: "esm",
			},
			{
				file: "dist/index.cjs.js",
				format: "cjs",
			},
		],
		plugins: [
			nodeResolve(),
			typescript({
				tsconfig: "./tsconfig.json",
				outDir: "dist",
			}),
			terser({
				compress: {
					drop_console: true,
				},
				output: {
					comments: false,
				},
			}),
		],
	},
];
