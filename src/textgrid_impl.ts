import type { CursorIface, Position, TextEditorIface } from "./interfaces";
import { EventHandler } from "./event_handler";
import type { TextManager } from "./text";
import { HTMLGridCursor } from "./cursor";
import { comparePositions, getStartAndEndColumnsOnALineForTextBetween2Positions } from "./utils";

export class TextGridTextEditor implements TextEditorIface {

  private textMgr: TextManager;
  charWidth: number;
  charHeight: number;
  private textGridElem: HTMLElement;
  private cursor: CursorIface;
  eventHandler: EventHandler | null = null;


  constructor(
    htmlElemId: string,
    textMgr: TextManager,
  ) {
    this.textMgr = textMgr;
    this.textGridElem = document.getElementById(htmlElemId)!;

    // For Courier 16.
    this.charWidth = 9.5;     // rough guess, but seems to work.
    this.charHeight = 16;

    this.cursor = new HTMLGridCursor(this.textGridElem);
  }

  // Register a callback with the event handler (handling key strokes, mouse clicks, etc.).
  // This function will be called whenever there is a change that needs to be reflected
  // on the screen -- cursor movement, new selection, new text, etc.
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

  public getCursor(): CursorIface {
    return this.cursor;
  }

  public getDrawingElem(): Element {
    return this.textGridElem;
  }

  public mouseEventToPosition(event: MouseEvent): Position {
    // 1) Element bounds relative to viewport
    const rect = this.textGridElem.getBoundingClientRect();
    // 2) Mouse position relative to viewport
    const clientX = event.clientX;
    const clientY = event.clientY;
    // 3) Account for the text grid's own scroll offset
    const xInContent = clientX - rect.left + this.textGridElem.scrollLeft;
    const yInContent = clientY - rect.top + this.textGridElem.scrollTop;
    const row = Math.floor(yInContent / this.charHeight);
    const col = Math.floor(xInContent / this.charWidth);
    return { row, col };
  }


  /**
   * Thinking about scrolling so that the current line being edited is always
   * in the viewport.
   *
   * VSCode makes sure that if the cursor is moved downward, the current line plus 4 lines
   * below are always in the viewport.
   * --> on down arrow:
   *   o if already scrolled to bottom, do nothing.
   *   o if (bottom line in viewport) - cursor line < 4, scroll up one line.
   *     e.g. assume 30 lines in the file, and bottom line being shown is line 20. If cursor is moved,
   *          from 15 to 16, then bottom 5 lines are 20, 19, 18, 17, 16 -- OK.
   *          If cursor is moved down to line 17, the only 3 lines below the cursor line are shown
   *          (i.e., 20 - 17 = 3 which is < 4),
   *          so scroll up one, so that the new bottom line is 21.
   *   o vs code will even show 4 blank lines below the bottom line of the file if the cursor is
   *     moved to the bottom line -- so, as if there were 34 lines in the file.
   * --> On up arrow,
   *   o if top of file is shown at the top (i.e., scroll bar is all the way at the top),
   *     do nothing.
   *   o if one can scroll up, when cursor reaches the 5th line shown, scroll up by one line.
   *     e.g., line 71 is the top line being shown, if cursor is moved up to 75, no change.
   *           when cursor is moved up to line 74, scroll up one line so that 70 becomes the top line.
   *           so: if cursor line - (top line in viewport) < 4, scroll up one.
   *
   * To do these, we need to know what lines in the file are being shown in the viewport currently.
   *
   * Get top line in viewport:
   * Math.floor(textGridElem.scrollTop / 16)
   * bottom line is top line +
   *
   *     const rect = this.textGridElem.getBoundingClientRect();
    console.log(`mEtP: rect.top = ${rect.top}, bottom = ${rect.bottom}`);

    console.log(`mEtP: scrollTop = ${this.textGridElem.scrollTop}`);
    console.log('top row in viewport is ', Math.floor(this.textGridElem.scrollTop / 16));
    console.log('bottom row in viewport is ', Math.floor((this.textGridElem.scrollTop + rect.bottom) / 16));

   */



  public redraw(): void {
    // Remove all text lines
    this.textGridElem.replaceChildren();

    // console.log('redraw: text = ', this.textMgr.getText());

    this.textMgr.getText().forEach((line: string, index: number) => {
      this.addTextLineToTextGrid(line, index);
    });

    // Scroll up or down to make sure cursor is in the viewport.
    const cursorPos = this.eventHandler!.getSelStart();

    const rect = this.textGridElem.getBoundingClientRect();
    const cursorLine = cursorPos.row;
    // TODO: have to subtract 3 right now to make it right...
    const firstShownLine = Math.floor(this.textGridElem.scrollTop / 16);
    const lastShownLine = Math.floor((this.textGridElem.scrollTop + rect.bottom) / 16) - 3;

    if (lastShownLine - cursorLine < 4) {
      // Assumes character height is 16.
      this.textGridElem.scrollBy(0, 16);
    } else if (cursorLine - firstShownLine < 4) {
      this.textGridElem.scrollBy(0, -16);
    }
  }

  // Place a line of text in the text-grid, with <span>s enclosing parts that are
  // next to the cursor and/or part of the selection.
  private addTextLineToTextGrid(text: string, lineNum: number) {

    const rowElem = document.createElement('div');
    this.textGridElem.appendChild(rowElem);

    const selStart = this.eventHandler!.getSelStart();
    const selEnd = this.eventHandler!.getSelEnd();

    let startCol = -1;
    let endCol = -1;

    // If there is a selection somewhere in the text, get the column
    // values for text in this line in the selection.
    if (selEnd) {
      // In results below, startCol <= endCol.
      [startCol, endCol] =
        getStartAndEndColumnsOnALineForTextBetween2Positions(selStart, selEnd, lineNum, text);
    } else {

      // ✅ Handle a line with the cursor and no selection exists, above.
      // if there is no selection, the cursor is at the start -- if it is on
      // this line.
      if (selStart.row === lineNum) {
        const beforeCursor = text.substring(0, selStart.col);
        const afterCursor = text.substring(selStart.col + 1);
        // If we are at the end of the line, we get 'undefined', so put
        // put nothing in the span -- i.e., an empty string.
        const cursorText = text[selStart.col] || '';
        const cursorHtml = `${beforeCursor}<span class="cursor-loc">${cursorText}</span>${afterCursor}`;
        rowElem.innerHTML = cursorHtml;
        return;
      }
    }

    // ✅ Handle a line with no cursor and no selection part on this line.
    if (startCol === -1 && endCol === -1) {
      rowElem.textContent = text;
      return;
    }

    // ✅ Handle a line with entire selection on this line -- and thus, the cursor is here too.
    // Cursor could be at beginning or end, depending on direction of the selection.
    if (selStart.row === lineNum && selEnd!.row === lineNum) {
      // if backwards selection:
      const beforeSelection = text.substring(0, startCol);
      const selectionText = text.substring(startCol, endCol) || '';
      const afterSelection = text.substring(endCol);
      if (comparePositions(selStart, selEnd!) > 0) {
        rowElem.innerHTML = beforeSelection +
          `<span class='cursor-loc selected'>${selectionText}</span>` +
          afterSelection;
        return;
      }
      // else (forward selection):
      //   add empty span after the selection with 'cursor-loc' class.
      rowElem.innerHTML = beforeSelection +
        `<span class='selected'>${selectionText}</span>` +
        `<span class='cursor-loc'></span>` +
        afterSelection;
      return;
    }

    // ✅ selection ends on this line (and starts on another line...)
    if (selEnd!.row === lineNum) {
      if (comparePositions(selStart, selEnd!) > 0) {
        //  if backwards selection:  (start is on line below.)
        const beforeSelection = text.substring(0, startCol);
        const selectionText = text.substring(startCol, endCol) || '';
        rowElem.innerHTML = beforeSelection +
          `<span class='cursor-loc selected'>${selectionText}</span>`;
        return;
      }
      // else (forward selection):  (start is on line above).
      const selectionText = text.substring(startCol, endCol) || '';
      const afterSelection = text.substring(endCol);
      rowElem.innerHTML =
        `<span class='selected'>${selectionText}</span>` +
        `<span class='cursor-loc'></span>` +
        afterSelection;
      return;
    }
    // ✅ selection starts on this line and ends on another line below or above.
    if (selStart.row === lineNum) {
      // if backwards selection: (end is on line above).
      if (comparePositions(selStart, selEnd!) > 0) {
        const selectionText = text.substring(0, endCol);
        const afterSelection = text.substring(endCol);
        rowElem.innerHTML =
          `<span class='selected'>${selectionText}</span>` +
          afterSelection;
        return;
      }
      // else (forward selection): (end is on line below).
      const beforeSelection = text.substring(0, startCol);
      const selectionText = text.substring(startCol, endCol) || '';
      rowElem.innerHTML =
        beforeSelection +
        `<span class='selected'>${selectionText}</span>`;
      return;
    }

    // ✅ selection includes this line but starts/ends above or below.
    rowElem.innerHTML =
      `<span class='selected'>${text}</span>`;
  }
}