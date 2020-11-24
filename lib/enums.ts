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
	Default = 9,
	BrightBlack = 60,
	BrightRed = 61,
	BrightGreen = 62,
	BrightYellow = 63,
	BrightBlue = 64,
	BrightMagenta = 65,
	BrightCyan = 66,
	BrightWhite = 67,
}

export enum ScreenBufferDifferenceKind {
	State,
	Data,
	Foreground,
	Background
}
