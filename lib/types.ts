import { ColorMode } from "./enums.ts";

export type Cell = {
	data: string,
	state: number,
	foregroundColor: number,
	backgroundColor: number,
	foregroundColorMode: ColorMode,
	backgroundColorMode: ColorMode,
};
export type Row = Cell[];
export type Rows = Row[];

export type CellState = {
	altFont: number,
	bold: boolean,
	dim: boolean,
	doubleUnderline: boolean,
	underline: boolean,
	hide: boolean,
	italic: boolean,
	reverse: boolean,
	slowBlink: boolean,
	strikeThrough: boolean,
};

export type Size = {
	width: number,
	height: number,
};

export type Location = {
	x: number,
	y: number,
};
