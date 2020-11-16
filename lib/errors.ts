export class ScreenBufferError extends Error {
	public name = "ScreenBufferError";
}

export class ResizeError extends ScreenBufferError {
	public name = "ScreenBufferError";
}

export class RepositionError extends ScreenBufferError {
	public name = "RepositionError";
}
