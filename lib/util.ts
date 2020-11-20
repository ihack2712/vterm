// Imports
import { CSI, DEL, PM } from "./constants.ts";
import { Color, ColorMode } from "./enums.ts";
import { ColorError } from "./errors.ts";

/**
 * Encode a number into a byte array.
 * @param n The number to encode.
 */
export function encodeNumber(n: number): number[] {
	if (n === 0) return [30];
	const array: number[] = [];
	n = Math.floor(n);
	while (n > 0) {
		const m = n / 10;
		n = Math.floor(m);
		array.unshift(((m - n) * 10) + 30);
	}
	return array;
}

/**
 * Create a grapic modes byte array.
 * @param modes The graphic modes.
 */
export function createGraphicMode(...modes: (number | number[])[]): number[] {
	modes = modes.flat();
	const arr = [...CSI];
	for (const mode of modes) {
		arr.push(...encodeNumber(mode as number));
		arr.push(DEL);
	}
	arr.pop();
	return [...arr, PM];
}

/**
 * Validate a color.
 * @param color The color to verify.
 * @param mode The color mode.
 * @throws A {@see ColorError} if the color number is less than
 *  0, or the color is invalid for the given mode.
 */
export function validateColor(color: number, mode: ColorMode) {
	if (mode === ColorMode.Bit4) {
		if (Color[color] === undefined)
			throw new ColorError("Invalid 4bit color!");
	} else if (mode === ColorMode.Bit8) {
		if (color > 255)
			throw new ColorError("Invalid 8bit color!");
	} else if (mode === ColorMode.Bit24) {
		if (color > 0xFFFFFF)
			throw new ColorError("Invalid 24bit color!");
	}
}
