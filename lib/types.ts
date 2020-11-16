import { ColorMode } from "./enums.ts";

export type Cell = {
	data: string;
	state: number;
	foregroundColor: number;
	backgroundColor: number;
	foregroundColorMode: ColorMode;
	backgroundColorMode: ColorMode;
};
export type Row = Cell[];
export type Rows = Row[];
