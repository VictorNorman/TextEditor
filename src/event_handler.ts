import type { History } from "./history";
import { Observable, type Position, type TextEditorIface } from "./interfaces";
import { comparePositions } from "./utils";
import { TextManager } from "./text";
import { Memento } from "./memento";

// Changes to selection values trigger Observers to be notified.
export class EventHandler extends Observable {

  // If we've just clicked somewhere, then selStart is that place.
  private selStart: Position;
  // If selEnd is set, then the user has defined a (highlighted) selection.
  private selEnd: Position | null;
  private text: TextManager;
  private textEd: TextEditorIface;
  private clipboard: string | null;
  private historyMgr: History;
  // True if the user has clicked and started moving -- i.e., dragging over text.
  private definingSelection = false;
  private seeingConsecutiveRegularKeys = false;
  private seeingConsecutiveBackspaceKeys = false;

  private mem: Memento;

  constructor(
    text: TextManager,
    textEd: TextEditorIface,
    historyMgr: History,
  ) {
    super();
    this.selStart = { row: 0, col: 0 };
    this.selEnd = null;
    this.text = text;
    this.textEd = textEd;
    this.clipboard = null;
    this.historyMgr = historyMgr;
    this.definingSelection = false;
    this.seeingConsecutiveRegularKeys = false;
    this.seeingConsecutiveBackspaceKeys = false;
    this.mem = Memento.createNull(this.text);
  }

  handleMouseDown(event: MouseEvent) {
    console.log('mouse down = ', event);

    // TODO: handle seeingConsecutive...

    // If we had a selection, get rid of it.
    if (this.selEnd) {
      this.removeSelection();
    }
    if (event.shiftKey) {
      this.setSelEndFromMouseEvent(event);
    } else {
      this.setSelStartFromMouseEvent(event);
    }
    this.definingSelection = true;
  }

  handleMouseMoved(event: MouseEvent) {
    // if the user is not holding the mouse button down -- i.e., not defining a selection.
    if (!this.definingSelection) {
      return;
    }
    this.setSelEndFromMouseEvent(event);
  }

  handleMouseUp(event: MouseEvent) {
    const pos = this.textEd.mouseEventToPosition(event);
    const orig = this.getSelStart()
    if (orig.row === pos.row && orig.col === pos.col) {
      // Click event
      this.removeSelection();
    }
    this.definingSelection = false;
  }

  handleKeyStrokes(event: KeyboardEvent) {

    // inner function to either start a selection, or if one is defined, extend it.
    // this is called to handle an arrow key or shift-arrow key.
    const startSelectionOrMoveCursor = (change: Position): void => {
      if (this.seeingConsecutiveRegularKeys || this.seeingConsecutiveBackspaceKeys) {
        this.historyMgr.storeNewMemento(this.mem);
        this.seeingConsecutiveRegularKeys = this.seeingConsecutiveBackspaceKeys = false;
      }
      if (event.shiftKey) {       // starting or expanding a selection
        // If end is null, there is no selection, so we are starting one now.
        if (!this.selEnd) {
          this.selEnd = { ...this.selStart };
        }
        this.setSelEnd(this.text.changePosition(this.selEnd, change));
      } else {
        if (this.selectionExists()) {
          // ending a selection so move cursor relative to end position of selection.
          this.setSelStart(this.text.changePosition(this.selEnd!, change));
        } else {
          // just regular movement of the cursor -- relative to start.
          this.setSelStart(this.text.changePosition(this.selStart, change));
        }
        this.removeSelection();   // if we had a selection, we don't anymore.
      }
    }

    // inner function to either insert a character or replace the selection with it.
    const handleRegularKey = (key: string) => {
      if (this.selectionExists()) {

        const diff = comparePositions(this.selStart, this.selEnd!);
        const [first, second] = diff < 0 ? [this.selStart, this.selEnd!] :
          [this.selEnd!, this.selStart];
        const text2del = this.text.getTextBetweenPositions(first, second);
        this.text.deleteText(this.selStart, this.selEnd!);
        const res = this.text.insertText(first, key);
        this.historyMgr.storeNewMemento(
          Memento.createStringReplacementMemento(
            this.text, first, second, res, text2del)
        );
        this.setSelStart(res);
        this.removeSelection();
      } else {
        if (this.seeingConsecutiveBackspaceKeys) {
          this.historyMgr.storeNewMemento(this.mem);
          this.seeingConsecutiveBackspaceKeys = false;
        }
        const newPos = this.text.insertText(this.selStart, key);
        if (this.seeingConsecutiveRegularKeys) {
          this.mem.addCharacterToMemento(newPos);
        } else {
          this.mem = Memento.createSingleCharacterInsertMemento(this.text, this.selStart, newPos);
        }
        this.setSelStart(newPos);
        this.seeingConsecutiveRegularKeys = true;
      }
    }

    if (event.key === 'ArrowLeft') {
      startSelectionOrMoveCursor({ row: 0, col: -1 });
      return;
    }
    if (event.key === 'ArrowRight') {
      startSelectionOrMoveCursor({ row: 0, col: 1 });
      return;
    }
    if (event.key === 'ArrowUp') {
      startSelectionOrMoveCursor({ row: -1, col: 0 });
      return;
    }
    if (event.key === 'ArrowDown') {
      startSelectionOrMoveCursor({ row: 1, col: 0 });
      return;
    }
    if (event.key === 'Enter') {
      handleRegularKey('\n');
      return;
    }
    if (event.key === 'Backspace') {
      if (this.selectionExists()) {
        const diff = comparePositions(this.selStart, this.selEnd!);
        const text2Del = diff < 0 ? this.text.getTextBetweenPositions(this.selStart, this.selEnd!) :
          this.text.getTextBetweenPositions(this.selEnd!, this.selStart);
        const newSelStart = this.text.deleteText(this.selStart, this.selEnd!);
        // for handling forward and backward selections
        this.historyMgr.storeNewMemento(
          Memento.createStringDeleteMemento(this.text,
            diff < 0 ? this.selStart : this.selEnd!, newSelStart,
            text2Del));
        this.setSelStart(newSelStart);
      } else {
        if (this.seeingConsecutiveRegularKeys) {
          // a backspace ends the collecting of consecutive keys into one undoable.
          this.historyMgr.storeNewMemento(this.mem);
          this.seeingConsecutiveRegularKeys = false;
        }
        const newPos = this.text.changePosition(this.selStart, { row: 0, col: -1 });
        const deletedText = this.text.getTextBetweenPositions(newPos, this.selStart);
        this.text.deleteText(this.selStart, newPos);
        if (this.seeingConsecutiveBackspaceKeys) {
          this.mem.addDeleteToMemento(newPos, deletedText);
        } else {
          this.mem = Memento.createSingleCharDeleteMemento(this.text, this.selStart, newPos, deletedText);
        }
        this.setSelStart(newPos);
        this.seeingConsecutiveBackspaceKeys = true;
      }
      this.removeSelection();
      return;
    }

    // Special keys: copy, paste, undo.
    if (event.ctrlKey) {

      // If the user has been typing keys, any Ctrl-* key ends the
      // current insertion/deletion sequence.
      if (this.seeingConsecutiveRegularKeys || this.seeingConsecutiveBackspaceKeys) {
        this.historyMgr.storeNewMemento(this.mem);
        this.seeingConsecutiveRegularKeys = this.seeingConsecutiveBackspaceKeys = false;
      }

      if (event.key === 'c') {          // copy to clipboard
        this.copySelectionToClipboard();
      } else if (event.key === 'z') {   // undo
        this.restoreStateFromSnapshot();
      } else if (event.key === 'v') {   // paste
        if (this.selectionExists()) {
          this.pasteClipboardOverSelection();
        } else {
          this.pasteClipboardAtCursor();
        }
      } else if (event.key === 'a') {
        this.setSelStart({ row: this.selStart.row, col: 0 });
        this.removeSelection();
      } else if (event.key === 'e') {
        // TODO: HACK!
        this.setSelStart(this.text.getEditPositionFromPos({ row: this.selStart.row, col: 1000000 }));
        this.removeSelection();
      }
      return;
    }

    // Regular text input
    handleRegularKey(event.key);
  }

  getSelStart(): Position {
    return this.selStart;
  }

  getSelEnd(): Position | null {
    return this.selEnd;
  }

  selectionExists(): boolean {
    return this.selEnd !== null;
  }

  private setSelStart(pos: Position): void {
    this.selStart = pos;
    this.notify({
      start: this.selStart,
      end: this.selEnd,
    });
  }

  private setSelEnd(pos: Position | null): void {
    this.selEnd = pos ? this.text.getEditPositionFromPos(pos) : pos;
    this.notify({
      start: this.selStart,
      end: this.selEnd,
    });
  }

  private setSelStartFromMouseEvent(event: MouseEvent): void {
    const pos = this.textEd.mouseEventToPosition(event);
    this.setSelStart(this.text.getEditPositionFromPos(pos));
  }

  private setSelEndFromMouseEvent(event: MouseEvent): void {
    const pos = this.textEd.mouseEventToPosition(event);
    this.setSelEnd(this.text.getEditPositionFromPos(pos));
  }

  // Remove the end, but leave the start position -- the cursor is always somewhere.
  private removeSelection() {
    this.setSelEnd(null);
  }

  private copySelectionToClipboard(): void {
    const diff = comparePositions(this.selStart, this.selEnd!);
    if (diff < 0) {
      this.clipboard = this.text.getTextBetweenPositions(this.selStart, this.selEnd!);
    } else if (diff > 0) {
      // selection is "backward"
      this.clipboard = this.text.getTextBetweenPositions(this.selEnd!, this.selStart);
    }
    console.log('clipbaord = ', this.clipboard);
  }

  private pasteClipboardOverSelection() {
    if (!this.clipboard) {   // nothing to paste.
      return;
    }

    const diff = comparePositions(this.selStart, this.selEnd!);
    const [first, second] = diff < 0 ? [this.selStart, this.selEnd!] :
      [this.selEnd!, this.selStart];
    const text2del = this.text.getTextBetweenPositions(first, second);
    this.text.deleteText(this.selStart, this.selEnd!);
    const res = this.text.insertText(first, this.clipboard);
    this.historyMgr.storeNewMemento(
      Memento.createStringReplacementMemento(
        this.text,
        first, second,
        res,
        text2del,
      )
    );
    this.removeSelection();
    this.setSelStart(res);
  }

  private pasteClipboardAtCursor() {
    if (!this.clipboard) {
      return;
    }
    const res = this.text.insertText(this.selStart, this.clipboard);
    this.mem = Memento.createStringInsertMemento(this.text, this.selStart, res);
    this.historyMgr.storeNewMemento(this.mem);
    this.setSelStart(res);
  }

  private restoreStateFromSnapshot() {
    if (this.historyMgr.hasSnapshotToRestore()) {
      const [s, e] = this.historyMgr.restoreFromSnapshot();
      this.setSelStart(s);
      this.setSelEnd(e);
    }
  }
}