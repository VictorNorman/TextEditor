import type { Position } from "./interfaces";
import { getStartAndEndColumnsOnALineForTextBetween2Positions } from "./utils";
import { Memento } from "./memento";


export class TextManager {
  private text: string[];

  constructor() {
    this.text = [];
  }

  // return a new Position that moves the given position left or right or
  // up or down by the given values of row or col in the parameter change.
  public changePosition(pos: Readonly<Position>, change: Readonly<Position>): Position {

    // NOTE: we assume (for now) that either change.row OR change.col
    // has a value and the other one is 0. So, we are moving left right,
    // OR up or down.
    if (change.col != 0) {
      return this.changePosLeftOrRight(pos, change.col);
    } else {
      return this.changePosUpOrDown(pos, change.row);
    }
  }

  private changePosLeftOrRight(pos: Readonly<Position>, numCharsLeftOrRight: number): Position {
    let { row, col } = pos;
    if (numCharsLeftOrRight > 0) { // moving right
      while (true) {
        const charsToRight = this.text[row].length - col;
        // moving past end of this line.
        if (numCharsLeftOrRight > charsToRight) {
          if (row === this.text.length - 1) {
            // on the last line: move pos to end of the line.
            return { row, col: this.text[this.text.length - 1].length };
          }
          row++;
          col = 0;
          // Moving to next row is like jumping over the implicit \n so
          // decrement an extra 1.
          numCharsLeftOrRight -= charsToRight + 1;
        } else {
          return { row, col: col + numCharsLeftOrRight };
        }
      }
    } else { // moving Position to the left
      numCharsLeftOrRight *= -1;   // make it positive amount to move left.
      while (true) {
        const charsToLeft = col;
        // moving past beginning of this line.
        if (numCharsLeftOrRight > charsToLeft) {
          if (row === 0) {
            // on the first line: move pos to beginning of line.
            return { row: 0, col: 0 };
          }
          // move to end of previous row.
          row--;
          // TODO: this may be wrong for when numCharsLorR > 1.
          col = this.text[row].length;
          numCharsLeftOrRight -= charsToLeft + 1;
        } else {
          return { row, col: col - numCharsLeftOrRight };
        }
      }
    }
  }

  private changePosUpOrDown(pos: Readonly<Position>, numRowsUpOrDown: number): Position {
    // TODO: only handling up or down by 1 row for now.
    if (numRowsUpOrDown === 1) {   // moving down a row.

      // if in the last row, do nothing.
      if (pos.row >= this.text.length - 1) {
        return { ...pos };
      }

      // if the row below has more characters than the current position in the current row,
      // just increment the row (move straight down).
      if (pos.col <= this.text[pos.row + 1].length) {
        return { ...pos, row: pos.row + 1 };
      }
      // if row below has fewer characters than the current position on the current row,
      // move cursor down to the end of the next row.
      return { row: pos.row + 1, col: this.text[pos.row + 1].length };

    } else {       // moving up a row.

      // If in row 0, do nothing.
      if (pos.row === 0) {
        return { ...pos };
      }

      // if row above has more characters than the current position in this row,
      //   just decrement the row (move straight up).
      if (pos.col <= this.text[pos.row - 1].length) {
        return { ...pos, row: pos.row - 1 };
      }
      // if row above has fewer character than the current positioin in this row,
      //   put the cursor on the previous row at the end.
      return { row: pos.row - 1, col: this.text[pos.row - 1].length };
    }

  }

  public getText(): string[] {
    return this.text;
  }

  // TODO: can this be removed eventually?
  public setText(newText: string[]): void {
    this.text = newText;
  }

  // NOTE: we assert that pos1 is "before" pos2.
  public getTextBetweenPositions(pos1: Position, pos2: Position): string {
    let res = '';
    for (let line = pos1.row; line <= pos2.row; line++) {
      const [startCol, endCol] =
        getStartAndEndColumnsOnALineForTextBetween2Positions(pos1, pos2, line, this.text[line]);
      res += this.text[line].slice(startCol, endCol);
      if (line < pos2.row) {
        res += '\n';
      }
    }
    return res;
  }

  // insert the given string at the given position and return where
  // the cursor should be afterward.
  public insertText(pos: Readonly<Position>, s: string): Position {
    // if s is a regular string (no newline), then
    //  just insert it at the position and move the pos over.
    if (s !== '\n') {
      if (s.includes('\n')) {
        // Our new text includes one or more new lines.
        // Split it into pieces and recursively insert!
        const splitLines = s.split('\n');
        splitLines.forEach((l, idx) => {
          pos = this.insertText(pos, l);
          // Don't insert a new line after the last string.
          if (idx < splitLines.length - 1) {
            pos = this.insertText(pos, '\n');
          }
        });
        return pos;
      } else {
        this.text[pos.row] = this.text[pos.row].slice(0, pos.col) + s +
          this.text[pos.row].slice(pos.col);
        return { row: pos.row, col: pos.col + s.length };
      }
    }
    // We are inserting a single newline. So, move everything on the line after
    // the given position to a new line below.
    const begOfLine = this.text[pos.row].slice(0, pos.col);
    const restOfLine = this.text[pos.row].slice(pos.col);
    this.text[pos.row] = begOfLine;
    // weird syntax: delete no items at index row, and add restOfLine.
    this.text.splice(pos.row + 1, 0, restOfLine);
    return { row: pos.row + 1, col: 0 };
  }

  public deleteText(pos: Readonly<Position>, endPos: Readonly<Position>): Position {
    // Do nothing if the range is empty.
    if (pos.row === endPos.row && pos.col === endPos.col) {
      return { ...pos };
    }

    if (endPos.row === pos.row) {
      if (endPos.col < pos.col) { // deleting to the left on same line
        this.text[pos.row] = this.text[pos.row].slice(0, endPos.col) +
          this.text[pos.row].slice(pos.col);
        return endPos;
      } else {
        this.text[pos.row] = this.text[pos.row].slice(0, pos.col) +
          this.text[pos.row].slice(endPos.col);
        return pos;
      }
    } else {
      // reassign to firstPos and secondPos so first is always "before" second.
      const [firstPos, secondPos] = pos.row < endPos.row ? [pos, endPos] :
        [endPos, pos];
      // grab end of line after secondPos
      const restOfEndPos = this.text[secondPos.row].slice(secondPos.col);
      // remove the line where the delete range ends.
      this.text.splice(secondPos.row, 1);
      // remove any lines between the start and end lines.
      this.text.splice(firstPos.row + 1, secondPos.row - firstPos.row - 1);
      // cut out the end characters of firstPos.row and
      // add the rest of the line from the end row.
      this.text[firstPos.row] = this.text[firstPos.row].slice(0, firstPos.col) +
        restOfEndPos;
      // return the position we deleted from.
      return { ...firstPos };
    }
  }

  // Given a row and col where a user clicked, move the cursor
  // to the correct place.
  // If the user clicks below all text, put the cursor at the end of the last
  // line of text.
  // If the user clicks to the right of the last character on a row,
  // put the cursor at the last character in the row.
  public getEditPositionFromPos(pos: Readonly<Position>): Position {
    let { row, col } = pos;
    if (row >= this.text.length) {
      row = this.text.length - 1;
      col = this.text[row].length;
    } else if (col > this.text[row].length) {
      col = this.text[row].length;
    }
    return { row, col };
  }

  // public createSnapshot(pos1: Position, pos2: Position | null): Memento {
  //   console.log('creating a snapshot');
  //   return new Memento(this.text, pos1, pos2);
  // }

  public restoreFromSnapshot(text: string[]): void {
    console.log('textMgr: restoreFromSnapshot: ', text);
    this.text = text;
  }
}
