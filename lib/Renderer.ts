// Imports
import type { Size, ColorProp, CellState } from "./types.ts";
import { ScreenBuffer } from "./ScreenBuffer.ts";
import {
	ESC, CSO, DEL,
	GM_BOLD,
	GM_DIM,
	GM_ITALIC,
	GM_UNDERLINE,
	GM_SLOW_BLINK,
	GM_REVERSE,
	GM_HIDE,
	GM_STRIKE,
	GM_DBL_UNDERLINE,
	GO_INTENSITY,
	GO_ITALIC,
	GO_UNDERLINE,
	GO_BLINK,
	GO_REVERSE,
	GO_HIDE,
	GO_STRIKE,
	QM,
	AH,
	AL,
} from "./constants.ts";
import { encodeNumber, transform4BitColor } from "./util.ts";
import { ScreenBufferDifferenceKind, ColorMode, Color } from "./enums.ts";
import { fromState } from "./state.ts";
import { Queue } from "./Queue.ts";

// deno-lint-ignore no-explicit-any
type Listener = (...args: any[]) => any;

export class Renderer {

	private _renderingQueue = new Queue();

	private _cachedScreenBuffer: ScreenBuffer;

	private _event_render: Listener;
	private _event_resize: Listener;

	private _buffer: number[] = [];

	private _enteredAlternateScreen = false;

	public constructor(public readonly target: ScreenBuffer, public readonly out: Deno.Writer | Deno.WriterSync) {
		this._cachedScreenBuffer = new ScreenBuffer(target.getWidth(), target.getHeight());
		this._event_render = async () => await this._doRender();
		this._event_resize = async (oldSize: Size, newSize: Size) => await this._doResize(oldSize, newSize);
	}

	public abort(): this {
		if (this._event_render !== undefined)
			this.target.onrender.unsubscribe(this._event_render);
		if (this._event_resize !== undefined)
			this.target.onresize.unsubscribe(this._event_resize);
		return this;
	}

	public start(): this {
		this.abort();
		this.target.onrender.subscribe(this._event_render!);
		this.target.onresize.subscribe(this._event_resize!);
		return this;
	}

	private async _flush(buffer?: number[]) {
		const arr = new Uint8Array(buffer ?? this._buffer);
		this._buffer = [];
		if (typeof (this.out as Deno.Writer).write === "function")
			await (this.out as Deno.Writer).write(arr);
		else if (typeof (this.out as Deno.WriterSync).writeSync === "function")
			(this.out as Deno.WriterSync).writeSync(arr);
	}

	public async enterAlternateScreen() {
		if (!this._enteredAlternateScreen)
			await this._flush([ESC, CSO, QM, 0x31, 0x30, 0x34, 0x39, AH]);
		this._enteredAlternateScreen = true;
	}

	public async leaveAlternateScreen() {
		if (this._enteredAlternateScreen)
			await this._flush([ESC, CSO, QM, 0x31, 0x30, 0x34, 0x39, AL]);
		this._enteredAlternateScreen = false;
	}

	private _doClear() {
		this._buffer.push(ESC, CSO, 50, 74);
	}

	private _pos(x: number, y: number) {
		this._buffer.push(ESC, CSO, ...encodeNumber(y + 1), DEL, ...encodeNumber(x + 1), 72);
	}

	private _addGraphicToBuffer(code: number): false {
		this._buffer.push(ESC, CSO, code, 0x6D); // \x1b[?m
		return false;
	}

	private _addColorToBuffer(color: ColorProp, isBackground = false) {
		this._buffer.push(ESC, CSO); // \x1b[
		console.log("Hello")
		if (color.kind === ColorMode.Bit4) {
			console.log(transform4BitColor(color.color, isBackground))
			this._buffer.push(transform4BitColor(color.color, isBackground));
		} else if (color.kind === ColorMode.Bit8) {
			this._buffer.push(isBackground ? 48 : 38, DEL, 5, DEL, color.color);
		} else if (color.kind === ColorMode.Bit24) {
			this._buffer.push(isBackground ? 48 : 38, DEL, 2, DEL, color.color >> 16, DEL, (color.color & 0xFF00) >> 8, DEL, color.color & 0xFF);
		}
		this._buffer.push(0x6D); // m
	}

	private async __doRender() {
		this._doClear();
		const updates = this._cachedScreenBuffer.getUpdates(this.target);
		let state = 0;
		let fg: ColorProp = { kind: ColorMode.Bit4, color: Color.Default };
		let bg: ColorProp = { kind: ColorMode.Bit4, color: Color.Default };
		const rows = this._cachedScreenBuffer.imAPro();
		for (const [x, y, differences] of updates) {
			let cx = 0;
			const row = rows[y];
			if (!row) continue;
			this._pos(x, y);
			for (const [kind, o, n] of differences) {
				if (kind === ScreenBufferDifferenceKind.State) {
					state = n as number;
					const oldState: CellState = fromState(o as number);
					const newState: CellState = fromState(n as number);

					// SGR Parameters
					// BOLD_ON          ( 1) - bold on
					// BOLD_OFF         (22) - bold off, dim off
					// DIM_ON           ( 2) - dim on
					// DIM_OFF          (22) - bold off, dim off
					// ITALIC_ON        ( 3) - italic on
					// ITALIC_OFF       (23) - italic off
					// UNDERLINE_ON     ( 4) - underline on
					// UNDERLINE_OFF    (24) - underline off, double underline off
					// SLOW_BLINK_ON    ( 5) - slow blink on
					// SLOW_BLINK_OFF   (25) - slow blink off
					// REVERSE_ON       ( 7) - reverse on
					// REVERSE_OFF      (27) - reverse off
					// HIDE_ON          ( 8) - hide on
					// HIDE_OFF         (28) - hide off
					// STRIKE_ON        ( 9) - strike on
					// STRIKE_OFF       (29) - strike off
					// DBL_UNDERLINE_ON (21) - double underline on, bold off

					let resetUnderline = false;
					let resetBold = false;

					if (!newState.underline && oldState.underline) {
						this._addGraphicToBuffer(GO_UNDERLINE);
						resetUnderline = true;
						if (newState.doubleUnderline && oldState.doubleUnderline) {
							this._addGraphicToBuffer(GM_DBL_UNDERLINE);
							resetBold = true;
						}
					}

					if (!newState.doubleUnderline && oldState.doubleUnderline && !resetUnderline) {
						this._addGraphicToBuffer(GO_UNDERLINE);
						if (newState.underline && oldState.underline)
							this._addGraphicToBuffer(GM_UNDERLINE);
					}

					let resetIntensity = false;

					if (!newState.bold && oldState.bold && !resetBold) {
						this._addGraphicToBuffer(GO_INTENSITY);
						resetIntensity = true;
						if (newState.dim && oldState.dim)
							this._addGraphicToBuffer(GM_DIM);
					}

					if (!newState.dim && oldState.dim && !resetIntensity) {
						this._addGraphicToBuffer(GO_INTENSITY);
						if (newState.bold && oldState.bold)
							this._addGraphicToBuffer(GM_BOLD);
					}

					if (!newState.italic && oldState.italic) this._addGraphicToBuffer(GO_ITALIC);

					if (!newState.slowBlink && oldState.slowBlink) this._addGraphicToBuffer(GO_BLINK);
					if (!newState.reverse && oldState.reverse) this._addGraphicToBuffer(GO_REVERSE);
					if (!newState.hide && oldState.hide) this._addGraphicToBuffer(GO_HIDE);
					if (!newState.strikeThrough && oldState.strikeThrough) this._addGraphicToBuffer(GO_STRIKE);

					if (newState.doubleUnderline && !oldState.doubleUnderline) {
						this._addGraphicToBuffer(GM_DBL_UNDERLINE);
						if (newState.bold && oldState.bold)
							this._addGraphicToBuffer(GM_BOLD);
					}
					if (newState.bold && !newState.bold) this._addGraphicToBuffer(GM_BOLD);
					if (newState.dim && !oldState.dim) this._addGraphicToBuffer(GM_DIM);
					if (newState.italic && !oldState.italic) this._addGraphicToBuffer(GM_ITALIC);
					if (newState.underline && !oldState.underline) this._addGraphicToBuffer(GM_UNDERLINE);
					if (newState.slowBlink && !oldState.slowBlink) this._addGraphicToBuffer(GM_SLOW_BLINK);
					if (newState.reverse && !oldState.reverse) this._addGraphicToBuffer(GM_REVERSE);
					if (newState.hide && !oldState.hide) this._addGraphicToBuffer(GM_HIDE);
					if (newState.strikeThrough && !oldState.strikeThrough) this._addGraphicToBuffer(GM_STRIKE);
				} else if (kind === ScreenBufferDifferenceKind.Background) {
					bg = n as ColorProp;
					this._addColorToBuffer(bg, true);
				} else if (kind === ScreenBufferDifferenceKind.Foreground) {
					fg = n as ColorProp;
					this._addColorToBuffer(fg);
				} else if (kind === ScreenBufferDifferenceKind.Data) {
					const col = {
						state,
						backgroundColor: bg.color,
						backgroundColorMode: bg.kind,
						foregroundColor: fg.color,
						foregroundColorMode: fg.kind,
						data: (n as string) || " "
					};
					row[x + cx] = col;
					this._buffer.push(col.data.charCodeAt(0) || 160);
					cx++;
				}
			}
		}
		this._pos(this.target.getCursorX(), this.target.getCursorY());
		await this._flush();
	}

	private _doRender() {
		return this._renderingQueue.run(async () => await this.__doRender());
	}

	private async _doResize(oldSize: Size, newSize: Size) {
		this._doClear();
		this._cachedScreenBuffer = new ScreenBuffer(newSize.width, newSize.height);
		await this._doRender();
	}

}
