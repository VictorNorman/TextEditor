import { TextManager } from "./text";
import { EventHandler } from "./event_handler";
import { History } from "./history";
import { TextGridTextEditor } from "./textgrid_impl";

const selStartElem = document.getElementById('sel-start-info')!;
const selEndElem = document.getElementById('sel-end-info')!;

const textMgr = new TextManager();
const historyMgr = new History();

// A bit of circular dependency here: event handler needs a reference
// to the textEd, and textEd needs a reference to the event handler.
const textEd = new TextGridTextEditor('text-grid', textMgr);
const eventHandler = new EventHandler(textMgr, textEd, historyMgr);
textEd.setEventHandler(eventHandler);

const textEdElem = textEd.getDrawingElem() as HTMLElement;

console.log('textEdElem lines visiable: ', textEdElem.scrollHeight / 16);

textEdElem.addEventListener('mousedown', (e) => eventHandler.handleMouseDown(e));
textEdElem.addEventListener('mouseup', (e) => eventHandler.handleMouseUp(e));
textEdElem.addEventListener('mousemove', (e) => eventHandler.handleMouseMoved(e));

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
textEdElem.addEventListener('keyup', function (event: KeyboardEvent) {
  // Ignore it when only a special key is down.
  if (event.key === 'Shift' || event.key === 'Alt' || event.key === 'Meta' ||
    event.key === 'Control' || event.key === 'Escape') {
    return;
  }
  // eventHandler.handleKeyStrokes(event);
});

const cursor = textEd.getCursor();
// When the user moves off of the canvas, stop the cursor from blinking.
textEdElem.addEventListener('blur', () => cursor.stop());

// For initial debugging.
textMgr.setText([
  "line 1",
  "line 2",
  "3 01234567890123456789",
  "4 01234567890123456789",
  "5 01234567890123456789",
  "6 01234567890123456789",
  "7 01234567890123456789",
  "8 01234567890123456789",
  "9 01234567890123456789",
  "10 01234567890123456789",
  "01234567890123456789",
  "01234567890123456789",
  "01234567890123456789",
  "01234567890123456789",
  "01234567890123456789",
  "01234567890123456789",
  "01234567890123456789",
  "01234567890123456789",
  "01234567890123456789",
  "20 01234567890123456789",
  "01234567890123456789",
  "01234567890123456789",
  "01234567890123456789",
  "01234567890123456789",
  "01234567890123456789",
  "01234567890123456789",
  "01234567890123456789",
  "01234567890123456789",
  "01234567890123456789",
  "30 01234567890123456789",
  "01234567890123456789",
  "01234567890123456789",
  "01234567890123456789",
  "01234567890123456789",
  "01234567890123456789",
  "01234567890123456789",
  "01234567890123456789",
  "01234567890123456789",
  "01234567890123456789",
  "40 01234567890123456789",
  "01234567890123456789",
  "01234567890123456789",
  "01234567890123456789",
  "01234567890123456789",
  "01234567890123456789",
  "01234567890123456789",
  "01234567890123456789",
  "01234567890123456789",
  "01234567890123456789",
  "50 01234567890123456789",
  "01234567890123456789",
  "01234567890123456789",
  "01234567890123456789",
  "01234567890123456789",
  "01234567890123456789",
  "01234567890123456789",
  "01234567890123456789",
  "01234567890123456789",
  "01234567890123456789",
  "60 01234567890123456789",
  "01234567890123456789",
  "01234567890123456789",
  "01234567890123456789",
  "01234567890123456789",
  "01234567890123456789",
  "01234567890123456789",
  "01234567890123456789",
  "01234567890123456789",
  "01234567890123456789",
  "70 01234567890123456789",
  "01234567890123456789",
  "01234567890123456789",
  "01234567890123456789",
  "01234567890123456789",
  "01234567890123456789",
  "01234567890123456789",
  "01234567890123456789",
  "01234567890123456789",
  "01234567890123456789",
  "80 01234567890123456789",
  "01234567890123456789",
  "01234567890123456789",
  "01234567890123456789",
  "01234567890123456789",
  "01234567890123456789",
  "01234567890123456789",
  "01234567890123456789",
  "01234567890123456789",
  "01234567890123456789",
  "90 01234567890123456789",
  "01234567890123456789",
  "01234567890123456789",
  "01234567890123456789",
  "01234567890123456789",
  "01234567890123456789",
  "01234567890123456789",
  "01234567890123456789",
  "01234567890123456789",
  "01234567890123456789",
  "100 01234567890123456789",
  "01234567890123456789",
  "01234567890123456789",
  "01234567890123456789",
  "01234567890123456789",
  "01234567890123456789",
  "01234567890123456789",
  "01234567890123456789",
  "01234567890123456789",
  "01234567890123456789",
  "110 01234567890123456789",
  "01234567890123456789",
  "01234567890123456789",
  "01234567890123456789",
  "01234567890123456789",
  "01234567890123456789",
  "01234567890123456789",
  "01234567890123456789",
  "01234567890123456789",
  "01234567890123456789",
  "120 01234567890123456789",
  "01234567890123456789",
  "01234567890123456789",
  "01234567890123456789",
  "01234567890123456789",
  "01234567890123456789",
  "01234567890123456789",
  "127 01234567890123456789",
]);



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



const loadFileElem = document.getElementById('load-file-input');

loadFileElem?.addEventListener('change', (event: any) => {
  const selectedFile = event.target.files[0];

  if (selectedFile) {
    // Create a new FileReader
    const reader = new FileReader();

    // Handle successful file read
    reader.onload = function (_e) {
      textMgr.setText((reader.result! as string).split('\n'));
      textEd.redraw();
    };

    // Read the file as text: onload event will trigger when it is done.
    reader.readAsText(selectedFile);
  }
});

// redraw everything the first time to display the test text.
textEd.redraw();

