// Imports
import type { Rows, Row, Cell, Location, Size, ScreenBufferUpdates, ScreenBufferUpdate, ScreenBufferDifference, IWriter, CellState, ColorProp } from "./types.ts";
import { Event } from "./Event.ts";
import { RepositionError, ResizeError, ScreenBufferError } from "./errors.ts";
import { Color, ColorMode, ScreenBufferDifferenceKind } from "./enums.ts";
import { stripEscapeSequences, validateColor } from "./util.ts";
import { MAX_STATE } from "./constants.ts";
import { fromObj, fromState, getAlternateFont, isBold, isDim, isDoubleUnderline, isHide, isItalic, isReverse, isSlowBlink, isStrike, isUnderline, setAlternateFont, setBold, setDim, setDoubleUnderline, setHide, setItalic, setReverse, setSlowBlink, setStrike, setUnderline } from "./state.ts";

type _ = unknown | Promise<unknown>;

/**
 * A screen buffer made for efficient difference rendering with smart
 * cursor movement.
 */
export class ScreenBuffer implements IWriter {

	/**
	 * Create an empty cell object.
	 */
	public static emptyCell(): Cell {
		return {
			data: " ",
			state: 0,
			backgroundColor: Color.Default,
			foregroundColor: Color.Default,
			backgroundColorMode: ColorMode.Bit4,
			foregroundColorMode: ColorMode.Bit4
		};
	}

	/**
	 * Add a difference to an update array.
	 * @param x The x location of the updated cell.
	 * @param y The y location of the updated cell.
	 * @param diff The difference to add to the update.
	 * @param update The update.
	 */
	public static addDifferenceToUpdate(x: number, y: number, diff: ScreenBufferDifference, update?: ScreenBufferUpdate): ScreenBufferUpdate {
		if (!update) return [x, y, [diff]];
		update[2].push(diff);
		return update;
	}

	private _: Rows = [];

	private _height: number;
	private _width: number;

	private _x = 0;
	private _y = 0;

	private _fcm: ColorMode = ColorMode.Bit4;
	private _fc: number = Color.Default;

	private _bcm: ColorMode = ColorMode.Bit4;
	private _bc: number = Color.Default;

	private _cx = 0;
	private _cy = 0;

	private _state = 0;

	/** A resize event. */
	public readonly onresize = new Event<[Size, Size]>();

	/** A reposition event. */
	public readonly onreposition = new Event<[Location, Location]>();

	/** A render request event. */
	public readonly onrender = new Event();

	/**
	 * Generate a new empty screen buffer.
	 * @param columns The amount of empty columns to create.
	 * @param rows The amount of empty rows to create.
	 */
	public constructor(columns: number, rows: number);

	/**
	 * Clone an existing screen buffer.
	 * @param clone The screen buffer to clone.
	 */
	public constructor(clone: ScreenBuffer);

	/**
	 * Clone an area of an existing screen buffer.
	 * @param clone The screen buffer to clone.
	 * @param columns The amount of columns to clone.
	 * @param rows The amount of rows to clone.
	 */
	public constructor(clone: ScreenBuffer, columns: number, rows: number);

	/**
	 * Clone an area of an existing screen buffer.
	 * @param clone The screen buffer to clone.
	 * @param x The x position to start cloning from.
	 * @param y The y position to start cloning from.
	 * @param columns The amount of columns to clone.
	 * @param rows The amount of rows to clone.
	 */
	public constructor(
		clone: ScreenBuffer,
		x: number,
		y: number,
		columns: number,
		rows: number,
	);

	public constructor(
		a: number | ScreenBuffer,
		b?: number,
		c?: number,
		d?: number,
		e?: number,
	) {
		const clone = a instanceof ScreenBuffer ? a : undefined;
		const { x, y } =
			typeof b === "number" && typeof c === "number" && typeof d === "number" && typeof e === "number"
				? { x: b, y: c }
				: { x: 0, y: 0 };
		let { w, h } = typeof d === "number" && typeof e === "number"
			? { w: d, h: e }
			: typeof a === "number" && typeof b === "number"
				? { w: a, h: b }
				: clone !== undefined
					? { w: clone.getWidth(), h: clone.getHeight() }
					: { w: undefined, h: undefined };
		if (typeof w !== "number" || typeof h !== "number")
			throw new ScreenBufferError("Missing size!");
		w = Math.floor(w);
		h = Math.floor(h);
		if (w < 0)
			throw new ScreenBufferError("Width must be greater than 0!");
		if (h < 0)
			throw new ScreenBufferError("Height must be greater than 0!");
		this._width = w;
		this._height = h;
		for (let cy = 0; cy < h; cy++) {
			const row: Row = [];
			for (let cx = 0; cx < w; cx++)
				row[cx] = ScreenBuffer.emptyCell();
			this._[cy] = row;
		}
		this._x = x;
		this._y = y;
	}

	/**
	 * Return the rows array.
	 */
	public imAPro(): Rows {
		return this._;
	}

	/**
	 * Request for the screen buffer to be rendered.
	 */
	public render(): this {
		this.onrender.dispatch();
		return this;
	}

	/**
	 * Get the buffer's width.
	 */
	public getWidth(): number {
		return this._width;
	}

	/**
	 * Get the buffer's height.
	 */
	public getHeight(): number {
		return this._height;
	}

	/**
	 * Get the buffer's x position.
	 */
	public getX(): number {
		return this._x;
	}

	/**
	 * Get the buffer's y position.
	 */
	public getY(): number {
		return this._y;
	}

	/**
	 * Get the buffer's size.
	 */
	public getSize(): { width: number; height: number } {
		return { width: this.getWidth(), height: this.getHeight() };
	}

	/**
	 * Get the buffer's position.
	 */
	public getPosition(): { x: number; y: number } {
		return { x: this.getX(), y: this.getY() };
	}

	/**
	 * Set the width of this buffer.
	 * @param width The new width.
	 * @fires resize If the new width differs from the old width.
	 * @throws A {@see ResizeError} if the new width is less than 0.
	 */
	public setWidth(width?: number): this {
		return this.setSize(width, this._height);
	}

	/**
	 * Set the height of this buffer.
	 * @param height The new height.
	 * @fires resize If the new height differs from the old height.
	 * @throws A {@see ResizeError} if the new height is less than 0.
	 */
	public setHeight(height?: number): this {
		return this.setSize(this._width, height);
	}

	/**
	 * Set the size of this buffer.
	 * @param width The new width.
	 * @param height The new height.
	 * @fires resize If the new height or the new width differs from
	 *  the old width and/or height.
	 * @throws A {@see ResizeError} if the new height or width is
	 *  less than 0.
	 */
	public setSize(width?: number, height?: number): this {
		width = Math.floor(width ?? this._width);
		height = Math.floor(height ?? this._height);

		if (this._height === height && this._width === width) return this;

		if (width < 0)
			throw new ResizeError("Width is less than 0!");
		if (height < 0)
			throw new ResizeError("Height is less than 0!");

		if (height < this._height)
			this._ = this._.slice(0, height);

		if (width < this._width)
			for (let y = 0; y < this._height; y++)
				this._[y] = this._[y].slice(0, width);
		else if (width > this._width)
			for (let y = 0; y < this._height; y++)
				for (let x = this._width; x < width; x++)
					this._[y][x] = ScreenBuffer.emptyCell();
		if (height > this._height)
			for (let y = this._height; y < height; y++)
				for (let x = 0; x < width; x++)
					this._[y][x] = ScreenBuffer.emptyCell();

		const oSize = this.getSize();

		this._width = width;
		this._height = height;

		const nSize = this.getSize();

		this.onresize.dispatch(oSize, nSize);

		return this;
	}


	/**
	 * Set the x location.
	 * @param x The x location.
	 * @fires reposition If the new x position differs from the old x
	 *  position.
	 * @throws A {@see RepositionError} if the x position is less
	 *  than 0.
	 */
	public setX(x?: number): this {
		return this.setPosition(x, this._y);
	}

	/**
	 * Set the y location.
	 * @param y The y location.
	 * @fires reposition If the new y location differs from the old y
	 *  position.
	 * @throws A {@see RepositionError} if the new y position is less
	 *  than 0.
	 */
	public setY(y?: number): this {
		return this.setPosition(this._x, y);
	}

	/**
	 * Set the x and y locations.
	 * @param x The x location.
	 * @param y The y location.
	 * @fires reposition If the new x and/or the new y positions
	 *  differ from the old x and/or y positions.
	 * @throws A {@see RepositionError} if the new x and/or y
	 *  positions is less than 0.
	 */
	public setPosition(x?: number, y?: number): this {
		x = Math.floor(x ?? this._x);
		y = Math.floor(y ?? this._y);

		if (x === this._x && this._y === y) return this;

		if (x < 0)
			throw new RepositionError("X is less than 0!");
		if (y < 0)
			throw new RepositionError("Y is less than 0!");

		const oPos = this.getPosition();

		this._x = x;
		this._y = y;

		this.onreposition.dispatch(oPos, { x, y });

		return this;
	}

	/**
	 * Get the differences between two screen buffers.
	 * @param buffer The screen buffer to match against.
	 * @throws A {@see ScreenBufferError} If the opponent buffer and
	 *  this buffer doesn't share the same width, height, x and y
	 *  properties.
	 */
	public getUpdates(buffer: ScreenBuffer): ScreenBufferUpdates {
		// Error checking.
		if (this.getWidth() !== buffer.getWidth())
			throw new ScreenBufferError("Buffers doesn't share the same width!");
		if (this.getHeight() !== buffer.getHeight())
			throw new ScreenBufferError("Buffers doesn't share the same height!");
		if (this.getX() !== buffer.getX())
			throw new ScreenBufferError("Buffers doesn't share the same x position!");
		if (this.getY() !== buffer.getY())
			throw new ScreenBufferError("Buffers doesn't share the same y position!");
		// The boundaries.
		const { width, height } = this.getSize();
		// The updates to return.
		const updates: ScreenBufferUpdates = [];
		// An update of the last following differences.
		let update: ScreenBufferUpdate | undefined = undefined;
		// Go through each row of both this buffer and the opponent
		// buffer.
		for (let y = 0; y < height; y++) {
			// Get the current row of this buffer.
			const bRow = this._[y]; // bottom row
			// Get the current row of the opponent buffer.
			const uRow = buffer._[y]; // upper row
			// Go through each column of the current row of both this
			// buffer and the opponent buffer.
			for (let x = 0; x < width; x++) {
				// Get the current column of this row.
				const bCell = bRow[x]; // bottom cell
				// Get the current column of the opponent row.
				const uCell = uRow[x]; // upper cell
				// Used to check if cells has differences.
				let hasDifference = false;
				// Check if the cells have different background colors/modes.
				if (bCell.backgroundColorMode !== uCell.backgroundColorMode || bCell.backgroundColor !== uCell.backgroundColor) {
					update = ScreenBuffer.addDifferenceToUpdate(
						x, y,
						[
							ScreenBufferDifferenceKind.Background,
							{ kind: bCell.backgroundColorMode, color: bCell.backgroundColor },
							{ kind: uCell.backgroundColorMode, color: uCell.backgroundColor }
						], update
					);
					hasDifference = true;
				}
				// Check if the cells have different foreground colors/modes.
				if (bCell.foregroundColorMode !== uCell.foregroundColorMode || bCell.backgroundColor !== uCell.backgroundColor) {
					update = ScreenBuffer.addDifferenceToUpdate(
						x, y,
						[
							ScreenBufferDifferenceKind.Background,
							{ kind: bCell.foregroundColorMode, color: bCell.foregroundColor },
							{ kind: uCell.foregroundColorMode, color: uCell.foregroundColor }
						], update
					);
					hasDifference = true;
				}
				// Check if the cells have different states.
				if (bCell.state !== uCell.state) {
					update = ScreenBuffer.addDifferenceToUpdate(
						x, y,
						[
							ScreenBufferDifferenceKind.State,
							bCell.state,
							uCell.state
						], update
					);
					hasDifference = true;
				}
				// Check if the cells have different characters/data
				// strings.
				if (bCell.data !== uCell.data || hasDifference) {
					update = ScreenBuffer.addDifferenceToUpdate(
						x, y,
						[
							ScreenBufferDifferenceKind.Data,
							bCell.data,
							uCell.data,
						]
					);
					hasDifference = true;
				}

				// Check if there are differences between the cells
				if (hasDifference) {
					updates.push(update!);
					update = undefined;
				}
			}

			// Check if there is an update to add to the updates
			// array before purging the cached update.
			if (update !== undefined) {
				updates.push(update);
				update = undefined;
			}
		}
		return updates;
	}

	/**
	 * Apply updates onto this screen buffer.
	 * @param updates The updates to apply.
	 */
	public applyUpdates(updates: ScreenBufferUpdates): this {
		let state: number = 0;
		let fg: ColorProp = { kind: ColorMode.Bit4, color: Color.Default };
		let bg: ColorProp = { kind: ColorMode.Bit4, color: Color.Default };
		for (const [ax, ay, differences] of updates) {
			let cx = ax;
			const row = this._[ay];
			for (const [kind, o, n] of differences) {
				// deno-lint-ignore no-explicit-any
				if (kind === ScreenBufferDifferenceKind.State) state = n as any;
				// deno-lint-ignore no-explicit-any
				else if (kind === ScreenBufferDifferenceKind.Background) bg = n as any;
				// deno-lint-ignore no-explicit-any
				else if (kind === ScreenBufferDifferenceKind.Foreground) fg = n as any;
				else if (kind === ScreenBufferDifferenceKind.Data) {
					if (cx > this._width) continue;
					row[cx] = {
						// deno-lint-ignore no-explicit-any
						data: n as any,
						state,
						backgroundColor: bg.color,
						backgroundColorMode: bg.kind,
						foregroundColor: fg.color,
						foregroundColorMode: fg.kind
					};
					cx++;
				}
			}
		}
		return this;
	}

	/**
	 * Get the current foreground color mode.
	 */
	public getForegroundColorMode(): ColorMode {
		return this._fcm;
	}

	/**
	 * Get the current foreground color.
	 */
	public getForegroundColor(): number {
		return this._fc;
	}

	/**
	 * Get the current background color mode.
	 */
	public getBackgroundColorMode(): ColorMode {
		return this._bcm;
	}

	/**
	 * Get the current background color.
	 */
	public getBackgroundColor(): number {
		return this._bc;
	}

	/**
	 * Change the current foreground color mode.
	 * @param mode The color mode to change to.
	 */
	public setForegroundColorMode(mode: ColorMode): this {
		this._fcm = mode;
		return this;
	}

	/**
	 * Change the current foreground color.
	 * @param color The color to change to.
	 * @param mode Also change the color mode.
	 * @throws A {@see ColorError} if the color number is less than
	 *  0, or the color is invalid for the given mode.
	 */
	public setForegroundColor(color: number, mode?: ColorMode): this {
		validateColor(color, mode ?? this._fcm);
		if (mode !== undefined)
			this.setForegroundColorMode(mode);
		this._fc = color;
		return this;
	}

	/**
	 * Change the current background color mode.
	 * @param mode The color mode to change to.
	 */
	public setBackgroundColorMode(mode: ColorMode): this {
		this._fcm = mode;
		return this;
	}

	/**
	 * Change the current background color.
	 * @param color The color to change to.
	 * @param mode Also change the color mode.
	 * @throws A {@see ColorError} if the color number is less than
	 *  0, or the color is invalid for the given mode.
	 */
	public setBackgroundColor(color: number, mode?: ColorMode): this {
		validateColor(color, mode ?? this._bcm);
		if (mode !== undefined)
			this.setBackgroundColorMode(mode);
		this._bc = color;
		return this;
	}

	/**
	 * Get the current cursor position.
	 */
	public getCursorPos(): Location {
		return { x: this._cx, y: this._cy };
	}

	/**
	 * Get the cursor's current x position.
	 */
	public getCursorX(): number {
		return this._cx;
	}

	/**
	 * Get the cursor's current y position.
	 */
	public getCursorY(): number {
		return this._cy;
	}

	/**
	 * Set a new cursor position.
	 * @param x The new x location.
	 * @param y The new y location.
	 */
	public setCursorPos(x: number, y: number): this {
		if (x < 0)
			throw new ScreenBufferError("The x location is less than 0!");
		if (y < 0)
			throw new ScreenBufferError("The y location is less than 0!");
		if (x > this._width)
			throw new ScreenBufferError("The x location is greater than the writer's width!");
		if (y > this._height)
			throw new ScreenBufferError("The y location is greater than the writer's height!");
		this._cx = x;
		this._cy = y;
		return this;
	}

	/**
	 * Set a new x cursor location.
	 * @param x The new x location.
	 */
	public setCursorX(x: number): this {
		return this.setCursorPos(x, this._cy);
	}

	/**
	 * Set a new y cursor location.
	 * @param y The new y location.
	 */
	public setCursorY(y: number): this {
		return this.setCursorPos(this._cx, y);
	}

	/**
	 * Get the current state.
	 */
	public getState(): number {
		return this._state;
	}

	/**
	 * Get the current cell state as an object.
	 */
	public getStateObject(): CellState {
		return fromState(this._state);
	}

	/**
	 * Set the current state.
	 * @param state The new state.
	 */
	public setState(state: number | Partial<CellState>): this {
		if (typeof state !== "number")
			state = fromObj(state);
		if (state < 0)
			throw new ScreenBufferError("State is less than 0!");
		else if (state > MAX_STATE)
			throw new ScreenBufferError("State is out of bounds!");
		this._state = state;
		return this;
	}

	/**
	 * Get the current bold state.
	 */
	public getBoldState(): boolean {
		return isBold(this._state);
	}

	/**
	 * Get the current dim state.
	 */
	public getDimmedState(): boolean {
		return isDim(this._state);
	}

	/**
	 * Get the current italic state.
	 */
	public getItalicState(): boolean {
		return isItalic(this._state);
	}

	/**
	 * Get the current underline state.
	 */
	public getUnderlinedState(): boolean {
		return isUnderline(this._state);
	}

	/**
	 * Get the current double underline state.
	 */
	public getDoubleUnderlinedState(): boolean {
		return isDoubleUnderline(this._state);
	}

	/**
	 * Get the current slow blink state.
	 */
	public getBlinkingState(): boolean {
		return isSlowBlink(this._state);
	}

	/**
	 * Get the current reversed state.
	 */
	public getReversedState(): boolean {
		return isReverse(this._state);
	}

	/**
	 * Get the current hidden state.
	 */
	public getHiddenState(): boolean {
		return isHide(this._state);
	}

	/**
	 * Get the current strikethrough state.
	 */
	public getStrikethroughState(): boolean {
		return isStrike(this._state);
	}

	/**
	 * Get the current alternate font.
	 */
	public getAlternateFontState(): number {
		return getAlternateFont(this._state);
	}

	/**
	 * Set the current bold state.
	 * @param state The new bold state.
	 */
	public setBoldState(state: boolean): this {
		this._state = setBold(this._state, state);
		return this;
	}

	/**
	 * Set the current dim state.
	 * @param state The new dim state.
	 */
	public setDimmedState(state: boolean): this {
		this._state = setDim(this._state, state);
		return this;
	}

	/**
	 * Set the current italic state.
	 * @param state The new italic state.
	 */
	public setItalicState(state: boolean): this {
		this._state = setItalic(this._state, state);
		return this;
	}

	/**
	 * Set the current underline state.
	 * @param state The new underline state.
	 */
	public setUnderlinedState(state: boolean): this {
		this._state = setUnderline(this._state, state);
		return this;
	}

	/**
	 * Set the current double underline state.
	 * @param state The new double underline state.
	 */
	public setDoubleUnderlinedState(state: boolean): this {
		this._state = setDoubleUnderline(this._state, state);
		return this;
	}

	/**
	 * Set the current slow blinking state.
	 * @param state The new slow blinking state.
	 */
	public setBlinkingState(state: boolean): this {
		this._state = setSlowBlink(this._state, state);
		return this;
	}

	/**
	 * Set the current reversed state.
	 * @param state The new reversed state.
	 */
	public setReversedState(state: boolean): this {
		this._state = setReverse(this._state, state);
		return this;
	}

	/**
	 * Set the current hidden state.
	 * @param state The new hidden state.
	 */
	public setHiddenState(state: boolean): this {
		this._state = setHide(this._state, state);
		return this;
	}

	/**
	 * Set the current strikethrough state.
	 * @param state The new strikethrough.
	 */
	public setStrikethroughState(state: boolean): this {
		this._state = setStrike(this._state, state);
		return this;
	}

	/**
	 * Set the alternate font state.
	 * @param n The alternate font number.
	 */
	public setAlternateFontState(n: number): this {
		this._state = setAlternateFont(this._state, n);
		return this;
	}

	private _shiftRow() {
		this._.shift();
		const row: Row = [];
		for (let x = 0; x < this._width; x++)
			row[x] = ScreenBuffer.emptyCell();
		this._.push(row);
	}

	/**
	 * Write data onto the screen buffer.
	 * @param data The data to write.
	 */
	public writeRaw(data: string): this {
		data = stripEscapeSequences(data).replace(/\t/g, "    ");
		const row = this._[this._cy];
		for (const char of data) {
			if (char === "\r") {
				this._cx = 0;
				continue;
			} else if (char === "\n") {
				this._cx = 0;
				this._cy++;
				if (this._cy === this._height) {
					this._shiftRow();
					this._cy--;
				}
				continue;
			}
			row[this._cx++] = {
				data: char,
				state: this._state,
				backgroundColor: this._bc,
				backgroundColorMode: this._bcm,
				foregroundColor: this._fc,
				foregroundColorMode: this._fcm
			};
			if (this._cx === this._width) {
				this._cx = 0;
				this._cy++;
			}
			if (this._cy === this._height) {
				this._shiftRow();
				this._cy--;
			}

		}
		if (this._cx > this._width) this._cx = this._width - 1;
		return this;
	}

	/**
	 * Clear the current line.
	 */
	public clearLine(): this {
		const row = this._[this._cy];
		for (let x = 0; x < this._width; x++)
			row[x] = {
				data: " ",
				state: this._state,
				backgroundColor: this._bc,
				backgroundColorMode: this._bcm,
				foregroundColor: this._fc,
				foregroundColorMode: this._fcm
			};
		return this;
	}

	/**
	 * Clear the screen buffer.
	 */
	public clear(): this {
		for (let y = 0; y < this._height; y++) {
			const row = this._[this._cy];
			for (let x = 0; x < this._width; x++)
				row[x] = {
					data: " ",
					state: this._state,
					backgroundColor: this._bc,
					backgroundColorMode: this._bcm,
					foregroundColor: this._fc,
					foregroundColorMode: this._fcm
				};
		}
		return this;
	}

}
