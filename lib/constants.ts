export const S_BOLD /*             */ = 0b0000000000000001;
export const S_DIM /*              */ = 0b0000000000000010;
export const S_ITALIC /*           */ = 0b0000000000000100;
export const S_UNDERLINE /*        */ = 0b0000000000001000;
export const S_SLOW_BLINK /*       */ = 0b0000000000010000;
export const S_REVERSE /*          */ = 0b0000000000100000;
export const S_HIDE /*             */ = 0b0000000001000000;
export const S_STRIKETHROUGH /*    */ = 0b0000000010000000;
export const S_ALT_FONT /*         */ = 0b0000111100000000;
export const S_DOUBLE_UNDERLINE /* */ = 0b0001000000000000;

export const MAX_STATE /*          */ = 0b0001100111111111;

export const ALT_FONT_POS = 8;

export const ESC = 0x1B; // \x1b - Escape Character
export const DEL = 0x3B; // ; - Delimeter
export const CSO = 0x5B; // [ - Control Sequencse Opening
export const PM = 0x6D; // m - Graphic Mode
export const QM = 0x3F; // ?
export const AH = 0x68; // h
export const AL = 0x6C; // l

export const CSI = [ESC, CSO];
export const G_RESET = [...CSI, PM];

export const GM_BOLD = 0x01;
export const GM_DIM = 0x02;
export const GM_ITALIC = 0x03;
export const GM_UNDERLINE = 0x04;
export const GM_SLOW_BLINK = 0x05;
export const GM_REVERSE = 0x07;
export const GM_HIDE = 0x08;
export const GM_STRIKE = 0x09;
export const GM_DBL_UNDERLINE = 0x15;

export const GO_INTENSITY = 0x16; // bold & dim
export const GO_ITALIC = 0x17;
export const GO_UNDERLINE = 0x18;
export const GO_BLINK = 0x19;
export const GO_REVERSE = 0x1B;
export const GO_HIDE = 0x1C;
export const GO_STRIKE = 0x1D;
