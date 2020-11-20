export enum ColorMode {
	Bit4,
	Bit8,
	Bit24,
}

export enum Color {
	Black,
	Red,
	Green,
	Yellow,
	Blue,
	Magenta,
	Cyan,
	White,
	Default = 9
}

export enum ScreenBufferDifferenceKind {
	State,
	Data,
	Foreground,
	Background
}
