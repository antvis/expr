export class ExpressionError extends Error {
	constructor(
		message: string,
		public readonly position?: number,
		public readonly token?: string,
	) {
		super(message);
		this.name = "ExpressionError";
	}
}
