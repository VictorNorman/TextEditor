import type { Position } from "./interfaces";
import type { TextManager } from "./text";

/**
 * A Memento object stores information about how to undo a change to the
 * text. Every object represents existing text at a Position being
 * replaced with other text, and a final Position for the cursor afterward.
 *
 * The API allows the caller to record what was done, and to restore the text
 * to an old state (the caller does not have to figure out how to store info
 * to restore the state -- the code does that).
 *
 * All changes to text can be represented by replacing some text with other
 * text. Here are all the cases:
 * The user...
 * o CASE 1: deletes a single character at the cursor. This translates to:
 *   o replace a single character to the left of the cursor with the empty string.
 *   o note that as the user deletes single characters they need to be accumulated
 *     in one Memento, as an undo undoes all the consecutive deletes.
 *   --> This operation is undone by putting the old text back in.
 *       (Need to store old text.)
 * o CASE 2: inserts a single character at the cursor. This translates to:
 *   o replace no text at the cursor with a new single character.
 *   o note that as the user adds single characters the characters need to be
 *     accumulated in one Memento, as an undo undoes all the consecutive new characters.
 *   --> This operation is undone by removing the new characters from the text.
 *       This can be done by remembering the range of inserts (like a selection) and
 *       deleting that range. So, need to store a range to delete.
 * o CASE 3: inserts the clipboard at the cursor. This translates to:
 *   o replace no characters at the cursor with the clipboard string.
 *   --> This operation is undone by deleting the inserted range of characters.
 *       So, just store a range.
 * o CASE 4: deletes the highlighted selection. This translates to:
 *   o replace the characters in the selection with an empty string.
 *   --> This operation is undone by inserting at the cursor the deleted range.
 *       So, we have to store the old text.
 * o CASE 5: replaces the highlighted selection with the clipboard contents. This translates to:
 *   o replace the selection characters with the given string.
 *   --> This operation is undone by deleting the new range and inserting the old text.
 *       SO, we need to store the old text.
 *
 */
export class Memento {

  textMgr: TextManager;

  // To undo an operation we delete the final range, then insert at the start range.

  // text between finalStartPos and finalEndPos will be deleted
  finalStartPos: Position;
  finalEndPos: Position | null;

  // deletedText will be inserted at initStartPos
  initStartPos: Position;

  deletedText: string;     // replacement deleted text.

  constructor(
    textMgr: TextManager,
    initStartPos: Position,
    finalStartPos: Position,
    finalEndPos: Position | null,
    delText: string,
  ) {
    this.textMgr = textMgr;
    this.initStartPos = initStartPos;
    this.finalStartPos = finalStartPos;
    this.finalEndPos = finalEndPos;
    this.deletedText = delText;
  }

  static createNull(textMgr: TextManager): Memento {
    return new Memento(
      textMgr,
      { row: 0, col: 0 },
      { row: 0, col: 0 },
      { row: 0, col: 0 },
      '',
    );
  }

  restore(): Position {
    this.textMgr.deleteText(this.finalStartPos, this.finalEndPos || this.finalStartPos);
    return this.textMgr.insertText(this.initStartPos, this.deletedText);
  }


  // CASE 1: --- deletes a single character at the cursor. ---------------------
  static createSingleCharDeleteMemento(
    textMgr: TextManager,
    cursorPos: Position,
    newCursorPos: Position,     // usually the cursor just to the left, but could be on previous line
    text: string,         // the single character that was deleted.
  ): Memento {
    return new Memento(
      textMgr,
      newCursorPos,
      newCursorPos,   // text inserted where the last char was removed.
      null,
      text,
    );
  }

  // called when the code is "collecting" multiple consecutive deletes/backspaces
  // into one undoable operation.
  addDeleteToMemento(delCharPos: Position, text: string) {
    this.deletedText = text + this.deletedText;
    this.initStartPos = delCharPos;
  }

  // CASE 2: --- insert single character at the cursor -----------------------
  static createSingleCharacterInsertMemento(
    textMgr: TextManager,
    cursorPos: Position,
    newCharPos: Position,
  ): Memento {
    return new Memento(
      textMgr,
      cursorPos,
      cursorPos,
      newCharPos,
      '',
    );
  }

  addCharacterToMemento(newCharPos: Position) {
    this.finalEndPos = newCharPos;
  }

  // CASE 3: --- insert clipboard at the cursor ---------------------------
  static createStringInsertMemento(
    textMgr: TextManager,
    cursorPos: Position,
    endCursorPos: Position,
  ): Memento {
    return new Memento(
      textMgr,
      cursorPos,
      cursorPos,
      endCursorPos,     // Could be null?  Check it out.
      '',
    );
  }

  // CASE 4: --- user deletes a selection --------------------------------
  static createStringDeleteMemento(
    textMgr: TextManager,
    startPos: Position,
    endPos: Position,
    text: string,         // the deleted text
  ): Memento {
    return new Memento(
      textMgr,
      startPos,
      startPos,
      null,
      text,
    );
  }

  // CASE 5: --- user replaces the highlighted selection with a single character
  // or the clipboard string --------------------------------
  static createStringReplacementMemento(
    textMgr: TextManager,
    startPos: Position,
    endPos: Position,
    newTextEndPos: Position,  // new text start pos is same as selStartPos
    text: string,         // the replaced text, which is restored for undo.
  ): Memento {
    return new Memento(
      textMgr,
      startPos,
      startPos,
      newTextEndPos,
      text,
    );
  }

}

