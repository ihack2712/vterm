import { ColorMode } from "./eunms.ts";

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
