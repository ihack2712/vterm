type Cb = (...args: unknown[]) => unknown | Promise<unknown>;
type ResolveCb<Callback extends Cb> = (value?: AsyncReturnType<Callback> | PromiseLike<AsyncReturnType<Callback>> | undefined) => void;
// deno-lint-ignore no-explicit-any
type RejectCb = (reason?: any) => void;
type AsyncReturnType<T extends Cb> = ReturnType<T> extends PromiseLike<infer R> ? R : T;
// deno-lint-ignore no-explicit-any
type QueueArray = [callback: Cb, resolve: ResolveCb<any>, reject: RejectCb, args: unknown[]][];

/**
 * A queue object to run functions one by one FIFO style.
 */
export class Queue {
	private readonly _queue: QueueArray = [];
	private _isRunning = false;

	/**
	 * Add a function to the queue.
	 * @param fn The function.
	 * @param args The arguments to pass to the functions.
	 * @returns A promise that resolves the value returned by the function when called.
	 */
	public run<Callback extends Cb>(fn: Callback, ...args: unknown[]): Promise<AsyncReturnType<Callback>> {
		return new Promise((resolve, reject) => {
			this._queue.push([fn, resolve, reject, args]);
			if (!this._isRunning) {
				this._run();
			}
		});
	}
	private async _run() {
		this._isRunning = true;
		while (this._queue.length > 0) {
			const [callback, resolve, reject, args] = this._queue.shift()!;
			try {
				const value = await callback(...args);
				resolve(value);
			} catch (error) {
				reject(error);
			}
		}
		this._isRunning = false;
	}
}
