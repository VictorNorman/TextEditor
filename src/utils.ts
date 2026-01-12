import type { Position } from "./interfaces";

// return -1 if pos1 is "before" pos2, 0 if they are equal, 1 otherwise.
export function comparePositions(pos1: Position, pos2: Position): number {
  if (pos1.row < pos2.row) {
    return -1;
  }
  if (pos1.row > pos2.row) {
    return 1;
  }
  // both on same row.
  if (pos1.col < pos2.col) {
    return -1;
  }
  if (pos1.col === pos2.col) {
    return 0;
  }
  return 1;
}

export function getStartAndEndColumnsOnALineForTextBetween2Positions(
  start: Position,
  end: Position,
  lineNum: number,
  text: string
): [number, number] {
  let startCol, endCol;

  if (start.row === lineNum) {
    if (end.row === lineNum) {
      // full selection is on this line -- forward or backward
      if (start.col <= end.col) {
        startCol = start.col;
        endCol = end.col;
      } else {
        startCol = end.col;
        endCol = start.col;
      }
    } else if (end.row > lineNum) {
      // selection goes from start.col to end of line.
      startCol = start.col;
      endCol = text.length;
    } else { // end.row < lineNum:  a backward selection.
      // selection goes from start of line to start.col.
      startCol = 0;
      endCol = start.col;
    }
  } else if (start.row < lineNum) {  // selection starts above this line.
    if (end.row === lineNum) {
      // selection goes from start of line to end.col.
      startCol = 0;
      endCol = end.col;
    } else if (end.row > lineNum) {
      // selection is entire line.
      startCol = 0;
      endCol = text.length;
    } else { // end.row < lineNum:
      // nothing is in the selection.
      startCol = -1;
      endCol = -1;
    }
  } else {   // start.row > lineNum:  // selection starts below this line.
    if (end.row === lineNum) {
      // selection is from end.col to end.
      startCol = end.col;
      endCol = text.length;
    } else if (end.row < lineNum) {
      // entire row is in selection.
      startCol = 0;
      endCol = text.length;
    } else {   // start > lineNum
      // nothing on this line is in the selection.
      startCol = -1;
      endCol = -1;
    }
  }
  return [startCol, endCol];
}
