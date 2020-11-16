// Imports
import type { Rows, Row } from "./types.ts";
import { EventEmitter } from "./deps.ts";
import { RepositionError, ResizeError, ScreenBufferError } from "./errors.ts";
import { Color, ColorMode } from "./eunms.ts";

type _ = unknown | Promise<unknown>;

/**
 * A screen buffer made for efficient difference rendering with smart
 * cursor movement.
 */
export class ScreenBuffer extends EventEmitter<{
	// @todo Document event.
	data(): _;
	// @todo Document event.
	resize(
		oldSize: {
			width: number;
			height: number;
		},
		newSize: {
			width: number;
			height: number;
		},
	): _;
	// @todo Document event.
	move(
		oldPosition: {
			x: number;
			y: number;
		},
		newPosition: {
			x: number;
			y: number;
		},
	): _;
}> {

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
			: typeof b === "number" && typeof c === "number"
				? { w: b, h: c }
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
			this._[cy] = [];
			const row: Row = [];
			for (let cx = 0; cx < w; cx++) {
				row[cx] = {
					data: " ",
					state: 0,
					backgroundColor: Color.Default,
					foregroundColor: Color.Default,
					backgroundColorMode: ColorMode.Bit4,
					foregroundColorMode: ColorMode.Bit4
				};
			}
		}
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
	 */
	public setWidth(width: number): this {
		width = Math.floor(width);
		return this.setSize(width, this._height);
	}

	/**
	 * Set the height of this buffer.
	 * @param height The new height.
	 */
	public setHeight(height: number): this {
		height = Math.floor(height);
		return this.setSize(this._width, height);
	}

	/**
	 * Set the size of this buffer.
	 * @param width The new width.
	 * @param height The new height.
	 */
	public setSize(width: number, height: number): this {
		width = Math.floor(width);
		height = Math.floor(height);

		if (this._height === height && this._width === width) return this;

		if (width < 0) {
			throw new ResizeError("Width is less than 0!");
		}
		if (height < 0) {
			throw new ResizeError("Height is less than 0!");
		}

		// @todo 1.0 (IF   ) Check if the new height is less than the old height.
		// @todo 1.1 (BLOCK) Remove rows that are no longer used.
		// @todo 2.0 (IF   ) Check if the new width is less than the old width.
		// @todo 2.1 (BLOCK) Go through each row and remove columns that are no longer used.
		// @todo 2.2 (EL IF) Check if the new width is greater than the old width.
		// @todo 2.3 (BLOCK) Go through each row and add empty cells.
		// @todo 3.0 (IF   ) Check if the new height is greater than the old height.
		// @todo 3.1 (BLOCK) Add new rows with empty cells.

		const oSize = this.getSize();

		this._width = width;
		this._height = height;

		const nSize = this.getSize();

		this.emitSync("resize", oSize, nSize);

		return this;
	}
}
