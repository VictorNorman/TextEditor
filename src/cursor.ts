import type { CursorIface, Position } from "./interfaces";



/**
 * Cursor is responsible for flashing a cursor at the current edit position.
 * This position is given to it as (x, y), which are locations
 * in the grid of character positions: (0, 0) is 0th row, 0th column, (0, 1): 0th row, 1st column...
 */
export class HTMLGridCursor implements CursorIface {
  private cursorCol: number;
  private cursorRow: number;
  private htmlGridElem: HTMLElement;

  constructor(
    containingElem: HTMLElement,
  ) {
    this.htmlGridElem = containingElem;
    this.cursorCol = 0;
    this.cursorRow = 0;

  }

  public setPosition(pos: Position): void {
    const { row, col } = pos;
    if (row < 0 || col < 0) {
      return;
    }

    this.cursorRow = row;
    this.cursorCol = col;

    this.stop();
    // there was code here.
    this.start();
  }

  public stop() {
  }

  public start() {
    // blinking is done in css by creating an element
    // with the class 'cursor-loc'.
  }

}

