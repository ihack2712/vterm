// Imports
import type { Size } from "./types.ts";
import { Event } from "./Event.ts";
import { forever } from "./forever.ts";

/**
 * An object that listens for terminal events.
 */
export class TerminalEvents {
	private __previousTerminalSize: Size = this.__getSize();
	private __windowChangeListener?: () => void;

	/**
	 * The terminal was resized.
	 */
	public readonly onresize = new Event<[Size, Size]>();

	/**
	 * Initiate a new terminal events object.
	 * @param stdout The output stream.
	 * @param stdin The input stream.
	 */
	public constructor(
		public readonly stdout: Deno.Writer & Deno.WriterSync & Deno.Closer & {
			readonly rid: number;
		},
		public readonly stdin?: Deno.Reader & Deno.ReaderSync & Deno.Closer & {
			readonly rid: number;
		}
	) { }

	/**
	 * Start listening for events.
	 */
	public start() {
		if (this.stdout.rid === Deno.stdout.rid) {
			this.__windowChangeListener = forever(async cancel => {
				const sig = Deno.signals.windowChange();
				const listener = () => sig.dispose();
				cancel.subscribe(listener);
				await sig
				cancel.unsubscribe(listener);
				const newSize = this.__getSize();
				const oldSize = this.__previousTerminalSize;
				if (oldSize.width === newSize.width && oldSize.height === newSize.height) return;
				this.__previousTerminalSize = newSize;
				this.onresize.dispatch(oldSize, newSize);
			});
		}
	}

	/**
	 * Stop listening for events.
	 */
	public stop() {
		if (typeof this.__windowChangeListener === "function")
			this.__windowChangeListener();
	}

	/**
	 * Get the terminal size of stdout.
	 */
	public __getSize(): Size {
		const size = Deno.consoleSize(this.stdout.rid);
		return {
			width: size.columns,
			height: size.rows
		};
	}
}
