import { CanvasCursor } from "./cursor_old";
import type { CursorIface, Position, TextEditorIface } from "./interfaces";
import { getStartAndEndColumnsOnALineForTextBetween2Positions } from "./utils";
import { EventHandler } from "./event_handler";
import { TextManager } from "./text";

/**
 * This class implements the low-level details of drawing test, selections, etc.,
 * on an HTML canvas.
 */
export class HTMLCanvasTextEditor implements TextEditorIface {
  charWidth: number;
  charHeight: number;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  CANV_WIDTH: number;
  CANV_HEIGHT: number;
  cursor: CursorIface;
  text: TextManager;
  eventHandler: EventHandler | null = null;

  constructor(
    htmlElemId: string,
    text: TextManager,
  ) {
    this.text = text;
    this.canvas = document.getElementById(htmlElemId) as HTMLCanvasElement;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }
    this.ctx = ctx;

    this.setContextValues();
    const textMetrics = ctx.measureText("W");
    // Get/set basic text properties.
    this.charWidth = textMetrics.width;
    this.charHeight = textMetrics.emHeightDescent;

    this.CANV_WIDTH = this.canvas.width;
    this.CANV_HEIGHT = this.canvas.height;

    this.cursor = new CanvasCursor(ctx, this.charWidth, this.charHeight);

    console.log('Number of rows that can be displayed = ', this.canvas.height / this.charHeight);
  }

  private setContextValues() {
    // Requirement: canvas is 90% of width and 75% of height.
    this.canvas.width = window.innerWidth * .9;
    this.canvas.height = window.innerHeight * .75;
    // this.canvas.height = window.innerHeight * .25;

    this.ctx.font = "normal 16px Courier";
    this.ctx.textBaseline = "top";
  }

  public setEventHandler(evh: EventHandler): void {
    this.eventHandler = evh;
    // Subscribe to changes in selection, causing us to redraw.
    evh.subscribe((_sel: Selection) => {
      if (evh.selectionExists()) {
        this.cursor.setPosition(evh.getSelEnd()!);
      } else {
        this.cursor.setPosition(evh.getSelStart());
      }
      this.redraw();
    });
  }

  public getDrawingElem(): Element {
    return this.canvas;
  }

  public getCursor(): CursorIface {
    return this.cursor;
  }

  public mouseEventToPosition(event: MouseEvent): Position {
    return {
      row: Math.floor(event.offsetY / this.charHeight),
      col: Math.floor(event.offsetX / this.charWidth)
    };
  }

  redraw() {
    this.cursor.stop();

    // Clear the canvas
    this.ctx.clearRect(0, 0, this.CANV_WIDTH, this.CANV_HEIGHT);

    // redraw all text.
    this.text.getText().forEach((line: string, index: number) => {
      this.drawTextLineOnCanvas(line, index);
    });

    this.cursor.start();
  }

  // Text in this line might be part of a selection. If so,
  // draw the first part normally, then draw the selected part,
  // then draw the rest normally.
  private drawTextLineOnCanvas(text: string, lineNum: number) {
    const selStart = this.eventHandler!.getSelStart();
    const selEnd = this.eventHandler!.getSelEnd();
    let startCol = -1;
    let endCol = -1;

    if (selEnd === null) {
      // no selection, so draw the whole line as normal.
      this.ctx.fillText(text, 0, lineNum * this.charHeight);
      return;
    }

    [startCol, endCol] =
      getStartAndEndColumnsOnALineForTextBetween2Positions(selStart, selEnd, lineNum, text);


    // A selection exists but this line is not part of it.
    if (startCol === -1 && endCol === -1) {
      this.ctx.fillText(text, 0, lineNum * this.charHeight);
      return;
    }

    // draw the text before the selection starts.
    this.ctx.fillText(text.slice(0, startCol), 0, lineNum * this.charHeight);

    // draw the selected text: fill the background first, then draw the text over it.
    this.ctx.save();
    this.ctx.fillStyle = '#aaf';
    // draw background
    this.ctx.fillRect(
      startCol * this.charWidth, lineNum * this.charHeight,
      (endCol - startCol) * this.charWidth, this.charHeight);
    this.ctx.restore();
    // draw text -- to end of row.
    this.ctx.fillText(text.slice(startCol), startCol * this.charWidth, lineNum * this.charHeight);
    this.ctx.restore();
    // draw text
    this.ctx.fillText(
      text.slice(startCol, endCol), startCol * this.charWidth, lineNum * this.charHeight);

    // draw the text after the selection.
    this.ctx.fillText(text.slice(endCol), endCol * this.charWidth, lineNum * this.charHeight);
  }

}