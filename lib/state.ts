// Imports
import {
	S_ALT_FONT,
	S_BOLD,
	S_DIM,
	S_DOUBLE_UNDERLINE,
	S_HIDE,
	S_ITALIC,
	S_RAPID_BLINK,
	S_REVERSE,
	S_SLOW_BLINK,
	S_STRIKETHROUGH,
	S_UNDERLINE,
} from "./constants.ts";

/**
 * Check whether or not a state is bold.
 * @param state The state.
 */
export function isBold(state: number): boolean {
	return (state & S_BOLD) === S_BOLD;
}

/**
 * Set the bold state.
 * @param state The original state bit field.
 * @param enable The bold state.
 */
export function setBold(state: number, enable = true): number {
	if (!enable) return isBold(state) ? state - S_BOLD : state;
	return state | S_BOLD;
}

/**
 * Check whether or not the a state is dimmed.
 * @param state The original state bit field.
 */
export function isDim(state: number): boolean {
	return (state & S_DIM) === S_DIM;
}

/**
 * Set the dim state.
 * @param state The orginal state bit field.
 * @param enable The dim state.
 */
export function setDim(state: number, enable = true): number {
	if (!enable) return isDim(state) ? state - S_DIM : state;
	return state | S_DIM;
}

/**
 * Check whether or not the a state is italic.
 * @param state The original state bit field.
 */
export function isItalic(state: number): boolean {
	return (state & S_ITALIC) === S_ITALIC;
}

/**
 * Set the italic state.
 * @param state The orginal state bit field.
 * @param enable The italic state.
 */
export function setItalic(state: number, enable = true): number {
	if (!enable) return isItalic(state) ? state - S_ITALIC : state;
	return state | S_ITALIC;
}

/**
 * Check whether or not the a state is underlined.
 * @param state The original state bit field.
 */
export function isUnderline(state: number): boolean {
	return (state & S_UNDERLINE) === S_UNDERLINE;
}

/**
 * Set the underline state.
 * @param state The orginal state bit field.
 * @param enable The underline state.
 */
export function setUnderline(state: number, enable = true): number {
	if (!enable) return isUnderline(state) ? state - S_UNDERLINE : state;
	if (isDoubleUnderline(state)) state = setDoubleUnderline(state, false);
	return state | S_UNDERLINE;
}

/**
 * Check whether or not the a state is double underlined.
 * @param state The original state bit field.
 */
export function isDoubleUnderline(state: number): boolean {
	return (state & S_DOUBLE_UNDERLINE) === S_DOUBLE_UNDERLINE;
}

/**
 * Set the double underline state.
 * @param state The orginal state bit field.
 * @param enable The double underline state.
 */
export function setDoubleUnderline(
	state: number,
	enable = true,
): number {
	if (!enable) {
		return isDoubleUnderline(state) ? state - S_DOUBLE_UNDERLINE : state;
	}
	if (isUnderline(state)) state = setUnderline(state, false);
	return state | S_DOUBLE_UNDERLINE;
}

/**
 * Check whether or not the a state has slow blink.
 * @param state The original state bit field.
 */
export function isSlowBlink(state: number): boolean {
	return (state & S_SLOW_BLINK) === S_SLOW_BLINK;
}

/**
 * Set the slow blink state.
 * @param state The orginal state bit field.
 * @param enable The slow blink state.
 */
export function setSlowBlink(state: number, enable = true): number {
	if (!enable) return isSlowBlink(state) ? state - S_SLOW_BLINK : state;
	if (isRapidBlink(state)) state = setRapidBlink(state, false);
	return state | S_SLOW_BLINK;
}

/**
 * Check whether or not a state has rapid blink.
 * @param state The original state bit field.
 */
export function isRapidBlink(state: number): boolean {
	return (state & S_RAPID_BLINK) === S_RAPID_BLINK;
}

/**
 * Set the rapid blink state.
 * @param state The original state bit field.
 * @param enable The rapid blink state.
 */
export function setRapidBlink(state: number, enable = true): number {
	if (!enable) return isRapidBlink(state) ? state - S_RAPID_BLINK : state;
	if (isSlowBlink(state)) state = setSlowBlink(state, false);
	return state | S_RAPID_BLINK;
}

/**
 * Check whether or not a state has reverse.
 * @param state The original state bit field.
 */
export function isReverse(state: number): boolean {
	return (state & S_REVERSE) === S_REVERSE;
}

/**
 * Set the reverse state.
 * @param state The original state bit field.
 * @param enable The reverse blink state.
 */
export function setReverse(state: number, enable: boolean): number {
	if (!enable) return isReverse(state) ? state - S_REVERSE : state;
	return state | S_REVERSE;
}

/**
 * Check whether or not a state has hide.
 * @param state The original state bit field.
 */
export function isHide(state: number): boolean {
	return (state & S_HIDE) === S_HIDE;
}

/**
 * Set the hide state.
 * @param state The original state bit field.
 * @param enable The hide blink state.
 */
export function setHide(state: number, enable: boolean): number {
	if (!enable) return isHide(state) ? state - S_HIDE : state;
	return state | S_HIDE;
}

/**
 * Check whether or not the state has strike through.
 * @param state The original state bit field.
 */
export function isStrike(state: number): boolean {
	return (state & S_STRIKETHROUGH) === S_STRIKETHROUGH;
}

/**
 * Set the strike through state.
 * @param state The original state bit field.
 * @param enable The strike through state.
 */
export function setStrike(state: number, enable = true): number {
	if (!enable) return isStrike(state) ? state - S_STRIKETHROUGH : state;
	return state | S_STRIKETHROUGH;
}

export function getAlternateFont(state: number): number {
	return (state & S_ALT_FONT) >> 9;
}

export function setAlternateFont(state: number, n = 0): number {
	return (state - (state & S_ALT_FONT)) | (n % 9);
}
