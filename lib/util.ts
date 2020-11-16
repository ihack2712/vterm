// Imports
import { CSI, DEL, PM } from "./constants.ts";

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
