export const S_BOLD /*             */ = 0b0000000000000001;
export const S_DIM  /*             */ = 0b0000000000000010;
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

export const CSI = [ESC, CSO];
export const G_RESET = [...CSI, PM];

export const GM_RESET = 0x00;
export const GM_BOLD = 0x01;
export const GM_DIM = 0x02;
export const GM_ITALIC = 0x03;
export const GM_UNDERLINE = 0x04;
export const GM_SLOW_BLINK = 0x05;
