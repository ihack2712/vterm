import { ColorMode, ScreenBufferDifferenceKind } from "./enums.ts";

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

export type ColorProp = {
	color: number,
	kind: ColorMode
};

export type ScreenBufferDifference = [
	kind: ScreenBufferDifferenceKind.Data,
	oldCharacter: string,
	newCharacter: string
] | [
	kind: ScreenBufferDifferenceKind.State,
	oldState: number,
	newState: number
] | [
	kind: ScreenBufferDifferenceKind.Foreground,
	oldProp: ColorProp,
	newProp: ColorProp
] | [
	kind: ScreenBufferDifferenceKind.Background,
	oldProp: ColorProp,
	newProp: ColorProp
];

export type ScreenBufferUpdate = [
	x: number,
	y: number,
	changes: ScreenBufferDifference[]
];

export type ScreenBufferUpdates = ScreenBufferUpdate[];

export interface IWriter {
	getForegroundColorMode(): ColorMode;
	getBackgroundColorMode(): ColorMode;
	getForegroundColor(): number;
	getBackgroundColor(): number;
	setForegroundColorMode(mode: ColorMode): this;
	setBackgroundColorMode(mode: ColorMode): this;
	setForegroundColor(color: number, mode?: ColorMode): this;
	setBackgroundColor(color: number, mode?: ColorMode): this;
	getCursorPos(): Location;
	setCursorPos(x: number, y: number): this;
	getCursorX(): number;
	getCursorY(): number;
	setCursorX(x: number): this;
	setCursorY(y: number): this;
}
