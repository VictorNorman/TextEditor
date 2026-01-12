import { TextManager } from "./text";
import { EventHandler } from "./event_handler";
import { HTMLCanvasTextEditor } from "./canvas_impl";
import { History } from "./history";

const selStartElem = document.getElementById('sel-start-info')!;
const selEndElem = document.getElementById('sel-end-info')!;

const textMgr = new TextManager();
const historyMgr = new History();

// For debugging, put some text in.
const manylines = [
  'Line 1',
  'Line 2: longer',
  '12345678901234567890',
  '01234567890123456789',
  'Line 3: less',
  'Line 4: very very long',
  'Line 5: last',
];
textMgr.setText(manylines);


// A bit of circular dependency here. So, set machine after creating cte.
const cte = new HTMLCanvasTextEditor('canvas', textMgr);
const eventHandler = new EventHandler(textMgr, cte, historyMgr);
cte.setEventHandler(eventHandler);

const canvas = cte.getDrawingElem() as HTMLCanvasElement;
canvas.addEventListener('mousedown', (e) => eventHandler.handleMouseDown(e));
canvas.addEventListener('mouseup', (e) => eventHandler.handleMouseUp(e));
canvas.addEventListener('mousemove', (e) => eventHandler.handleMouseMoved(e));

const cursor = cte.getCursor();

// Set debug info initially.
const s = eventHandler.getSelStart();
selStartElem.textContent = `(${s.row}, ${s.col})`;
const e = eventHandler.getSelEnd();
selEndElem.textContent = `(${e ? e.row : 'n/a'}, ${e ? e.col : 'n/a'})`;

// Watch for changes whenever the selection / edit position changes.
eventHandler.subscribe(({ start, end }) => {
  // Update debug info.
  selStartElem.textContent = `(${start.row}, ${start.col})`;
  selEndElem.textContent = `(${end ? end.row : 'n/a'}, ${end ? end.col : 'n/a'})`;
});

// When the user moves off of the canvas, stop the cursor from blinking.
canvas.addEventListener('blur', () => {
  cursor.stop();
});

// Unbind the default behavior on the window, so that, e.g., a right-arrow does not
// scroll the canvas to the right.
window.addEventListener('keydown', function (event) {
  event.preventDefault();
  if (event.key === 'Shift' || event.key === 'Alt' || event.key === 'Meta' ||
    event.key === 'Control' || event.key === 'Escape') {
    return;
  }
  eventHandler.handleKeyStrokes(event);
});

// Handle key strokes: arrow keys, regular keys, delete/backspace, etc.
// After every keystroke, redraw the canvas.
window.addEventListener('keyup', function (event: KeyboardEvent) {
  // Ignore it when only a special key is down.
  if (event.key === 'Shift' || event.key === 'Alt' || event.key === 'Meta' ||
    event.key === 'Control' || event.key === 'Escape') {
    return;
  }
  // eventHandler.handleKeyStrokes(event);
});

// redraw everything the first time to display the test text.
cte.redraw();


const loadFileElem = document.getElementById('load-file-input');

loadFileElem?.addEventListener('change', (event: any) => {
  const selectedFile = event.target.files[0];

  if (selectedFile) {
    // Create a new FileReader
    const reader = new FileReader();

    // Handle successful file read
    reader.onload = function (_e) {
      textMgr.setText((reader.result! as string).split('\n'));
      cte.redraw();
    };

    // Read the file as text: onload event will trigger when it is done.
    reader.readAsText(selectedFile);
  }
});
