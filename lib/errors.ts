export class ScreenBufferError extends Error {
  public name: string = "ScreenBufferError";
}

export class ResizeError extends ScreenBufferError {
  public name: string = "ScreenBufferError";
}

export class RepositionError extends ScreenBufferError {
  public name: string = "RepositionError";
}
