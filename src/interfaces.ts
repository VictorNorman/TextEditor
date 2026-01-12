// This is a position in a grid of characters, upper-left is row = 0, col = 0.
export interface Position {
  row: number;
  col: number;
}

export interface TextEditorIface {
  // init(): void;
  getDrawingElem(): Element;
  mouseEventToPosition(event: MouseEvent): Position;
  redraw(): void;
}

export interface CursorIface {
  setPosition(pos: Position): void;
  stop(): void;
  start(): void;
}

interface Selection {
  start: Position;
  end: Position | null;
}

export class Observable {
  observers: Array<(args: any) => void>;

  constructor() {
    this.observers = [];
  }

  subscribe(func: (args: any) => void) {
    this.observers.push(func);
  }

  unsubscribe(func: () => void) {
    this.observers = this.observers.filter((observer) => observer !== func);
  }

  notify(data: Selection) {
    this.observers.forEach((observer) => observer(data));
  }
}