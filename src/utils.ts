/**
 * Converts a synchronous function to an asynchronous one that returns a Promise
 * @param fn The synchronous function to convert
 * @returns An asynchronous function that wraps the original function in a Promise
 */
// biome-ignore lint/suspicious/noExplicitAny: Function needs to handle any type of arguments
export function promisify<T, Args extends any[]>(
	fn: (...args: Args) => T,
): (...args: Args) => Promise<T> {
	return (...args: Args): Promise<T> => {
		return new Promise((resolve, reject) => {
			try {
				const result = fn(...args);
				resolve(result);
			} catch (err) {
				reject(err);
			}
		});
	};
}
