// Imports
import type { Rows, Row, Cell, Location, Size, ScreenBufferUpdates, ScreenBufferUpdate, ScreenBufferDifference } from "./types.ts";
import { EventEmitter } from "./deps.ts";
import { RepositionError, ResizeError, ScreenBufferError } from "./errors.ts";
import { Color, ColorMode, ScreenBufferDifferenceKind } from "./enums.ts";

type _ = unknown | Promise<unknown>;

/**
 * A screen buffer made for efficient difference rendering with smart
 * cursor movement.
 */
export class ScreenBuffer extends EventEmitter<{

	/**
	 * Fired when the screen buffer is forced to add or drop columns.
	 * @event resize
	 * @property {Size} oldSize The old size.
	 * @property {Size} newSize The new size.
	 */
	resize(
		oldSize: Size,
		newSize: Size,
	): _;

	/**
	 * Fired when the x and y locations are changed and differs from
	 * the old x and/or y locations.
	 * @event reposition
	 * @property {Location} oldPosition The old position.
	 * @property {Location} newPosition The new position.
	 */
	reposition(
		oldPosition: Location,
		newPosition: Location,
	): _;

}> {

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
		if (!update) return [x, y, [diff]] as ScreenBufferUpdate;
		update[2].push(diff);
		return update;
	}

	private _: Rows = [];
	private _height: number;
	private _width: number;
	private _x = 0;
	private _y = 0;

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
		super();
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

		this.emitSync("resize", oSize, nSize);

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

		this.emitSync("reposition", oPos, { x, y });

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
				if (bCell.data !== uCell.data) {
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
				if (!hasDifference) {
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
}
