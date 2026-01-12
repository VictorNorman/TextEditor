
/**
 * This class records a history of changes to the text, so that we can implement
 * the infinite undo feature.
 *
 */

import type { Position } from "./interfaces";
import { Memento } from "./memento";

export class History {

  /*
   * Obviously, change records will be stored in a stack. We create a change
   * record for each insertion or deletion the user executes.
   */

  private stack: Array<Memento>;

  constructor() {
    this.stack = [];
  }

  storeNewMemento(mem: Memento): void {
    console.log("Mem = ", mem);
    this.pushSnapshot(mem);
  }

  hasSnapshotToRestore() {
    return this.stack.length != 0;
  }

  restoreFromSnapshot(): [Position, Position | null] {
    const mem = this.popSnapshot()!;
    const res = mem.restore();
    // TODO: return is not correct.
    return [res, null];
  }

  private pushSnapshot(s: Memento) {
    this.stack.push(s);
  }

  private popSnapshot(): Memento | undefined {
    return this.stack.pop();
  }
}
