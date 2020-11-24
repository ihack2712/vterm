// Imports
import { Event } from "./Event.ts";

export type CancelFn = () => Promise<void>;
export function forever(fn: (cancel: Event, ...args: unknown[]) => unknown | Promise<unknown>, ...args: unknown[]): CancelFn {
	const cancel = new Event();
	let doRun = true;
	(async () => {
		while (doRun) {
			try {
				await fn(cancel, ...args);
			} catch (error) {
				// Do nothing.
			}
		}
	})();
	return (async () => {
		doRun = false;
		await cancel.dispatch();
	});
}
