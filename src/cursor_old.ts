// Quesiton should I have a Cursor Interface and have this implement it?
// Will I need to implement the cursor functionality for a different system?

import type { CursorIface, Position } from "./interfaces";


/**
 * Cursor is responsible for flashing a cursor at the current edit position.
 * This position is given to it as (x, y), which are locations
 * in the grid of character positions: (0, 0) is 0th row, 0th column, (0, 1): 0th row, 1st column...
 * The Cursor class knows the width and height in pixels of a character.
 */
export class CanvasCursor implements CursorIface {

  // NOTE: on the canvas, X is horizontal and Y is vertical

  private cursorX: number;
  private cursorY: number;
  private cursorHeight: number;
  private intervalHandle: number | null;
  private ctx: CanvasRenderingContext2D;
  private cursorIsOn = true;    // or false if the blink is off.
  private charWidth = -1;
  private charHeight = -1;
  static readonly CURSOR_WIDTH = 1;

  constructor(
    ctx: CanvasRenderingContext2D, charWidth: number, charHeight: number,
    initCursorX?: number, initCursorY?: number
  ) {
    this.cursorX = initCursorX ?? 0;
    this.cursorY = initCursorY ?? 0;
    this.intervalHandle = null;
    this.ctx = ctx;
    this.cursorHeight = charHeight;
    this.charWidth = charWidth;
    this.charHeight = charHeight;

    this.start();
  }

  public setPosition(pos: Position) {
    const { row, col } = pos;
    if (row < 0 || col < 0) {
      return;
    }

    this.stop();
    this.cursorX = col * this.charWidth;
    this.cursorY = row * this.charHeight;
    this.start();
  }

  public stop() {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
      this.cursorIsOn = false;
    }
  }

  public start() {
    this.blink();
    this.intervalHandle = setInterval(() => this.blink(), 500);
  }

  private blink() {
    if (this.cursorIsOn) {
      this.ctx.clearRect(this.cursorX, this.cursorY,
        CanvasCursor.CURSOR_WIDTH, this.cursorHeight);
    } else {
      const existingFillStyle = this.ctx.fillStyle;  // get current color.
      this.ctx.fillStyle = 'black';
      this.ctx.fillRect(this.cursorX, this.cursorY,
        CanvasCursor.CURSOR_WIDTH, this.cursorHeight);
      this.ctx.fillStyle = existingFillStyle;   // restore the existing color.
    }
    this.cursorIsOn = !this.cursorIsOn;
  }
}

