# Client API Contract: Collaborative Whiteboard

**Date**: 2026-06-19
**Purpose**: Define the JavaScript API exposed by whiteboard modules for client-side usage

---

## Overview

The whiteboard exposes a modular JavaScript API with no framework dependencies. Each module provides a focused set of functions following functional programming principles (pure functions where possible, clear side effects).

**Target Environment**: Modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)

---

## Module: `canvas.js`

Handles HTML5 Canvas rendering and drawing operations.

### Functions

#### `initCanvas(canvasElement, options)`

Initialize the canvas for drawing.

**Parameters**:
```javascript
{
  canvasElement: HTMLCanvasElement,  // Canvas DOM element
  options: {
    width?: number,                  // Canvas width (default: container width)
    height?: number,                 // Canvas height (container height)
    backgroundColor?: string         // Background color (default: "#FFFFFF")
  }
}
```

**Returns**: `CanvasRenderingContext2D`

**Side effects**: Sets canvas dimensions, applies background

---

#### `drawStroke(ctx, stroke)`

Render a single stroke on the canvas.

**Parameters**:
```javascript
{
  ctx: CanvasRenderingContext2D,
  stroke: {
    points: Array<{x: number, y: number}>,
    brushSize: "thin" | "medium" | "thick",
    color: string  // Hex color
  }
}
```

**Returns**: `void`

**Side effects**: Draws line segments on canvas

---

#### `clearCanvas(ctx, width, height)`

Clear the entire canvas.

**Parameters**:
```javascript
{
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
}
```

**Returns**: `void`

**Side effects**: Clears canvas to background color

---

#### `renderAll(ctx, strokes, width, height)`

Render all strokes (full repaint).

**Parameters**:
```javascript
{
  ctx: CanvasRenderingContext2D,
  strokes: Array<Stroke>,  // See data-model.md
  width: number,
  height: number
}
```

**Returns**: `void`

**Side effects**: Clears canvas and redraws all strokes

---

## Module: `strokes.js`

Manages stroke data and drawing state.

### Functions

#### `createStroke(points, brushSize, userId)`

Create a new stroke object.

**Parameters**:
```javascript
{
  points: Array<{x: number, y: number}>,
  brushSize: "thin" | "medium" | "thick",
  userId: string  // UUID
}
```

**Returns**: `Stroke` (see data-model.md)

**Side effects**: None (pure function)

---

#### `addPoint(stroke, point)`

Add a point to an existing stroke (immutable).

**Parameters**:
```javascript
{
  stroke: Stroke,
  point: {x: number, y: number}
}
```

**Returns**: `Stroke` (new object with added point)

**Side effects**: None (pure function)

---

#### `simplifyStroke(stroke, tolerance)`

Simplify stroke using Ramer-Douglas-Peucker algorithm.

**Parameters**:
```javascript
{
  stroke: Stroke,
  tolerance: number  // Pixel tolerance (default: 2)
}
```

**Returns**: `Stroke` (new object with simplified points)

**Side effects**: None (pure function)

---

#### `getStrokeById(strokes, id)`

Find stroke by ID.

**Parameters**:
```javascript
{
  strokes: Array<Stroke>,
  id: string  // UUID
}
```

**Returns**: `Stroke | undefined`

**Side effects**: None (pure function)

---

#### `deleteStroke(strokes, id)`

Remove stroke by ID (immutable).

**Parameters**:
```javascript
{
  strokes: Array<Stroke>,
  id: string
}
```

**Returns**: `Array<Stroke>` (new array without deleted stroke)

**Side effects**: None (pure function)

---

## Module: `stickyNotes.js`

Manages sticky note DOM elements and data.

### Functions

#### `createStickyNote(content, position, userId)`

Create a new sticky note object and DOM element.

**Parameters**:
```javascript
{
  content: string,
  position: {x: number, y: number},
  userId: string
}
```

**Returns**: 
```javascript
{
  note: StickyNote,  // Data object (see data-model.md)
  element: HTMLElement  // DOM element to append
}
```

**Side effects**: Creates DOM element (not yet appended)

---

#### `renderStickyNote(note, container)`

Render sticky note into container.

**Parameters**:
```javascript
{
  note: StickyNote,
  container: HTMLElement  // Canvas container
}
```

**Returns**: `HTMLElement` (rendered element)

**Side effects**: Appends element to container, attaches event listeners

---

#### `updateStickyNote(note, updates)`

Update sticky note (immutable).

**Parameters**:
```javascript
{
  note: StickyNote,
  updates: {
    content?: string,
    position?: {x: number, y: number}
  }
}
```

**Returns**: `StickyNote` (new object with updates)

**Side effects**: None (pure function)

---

#### `deleteStickyNote(notes, id, container)`

Delete sticky note from data and DOM.

**Parameters**:
```javascript
{
  notes: Array<StickyNote>,
  id: string,
  container: HTMLElement
}
```

**Returns**: `Array<StickyNote>` (new array without deleted note)

**Side effects**: Removes DOM element from container

---

## Module: `storage.js`

Handles localStorage persistence.

### Functions

#### `saveWhiteboard(sessionId, data)`

Save whiteboard state to localStorage.

**Parameters**:
```javascript
{
  sessionId: string,
  data: {
    strokes: Array<Stroke>,
    stickyNotes: Array<StickyNote>,
    updatedAt: number
  }
}
```

**Returns**: `void`

**Side effects**: Writes to localStorage

**Throws**: `QuotaExceededError` if localStorage full

---

#### `loadWhiteboard(sessionId)`

Load whiteboard state from localStorage.

**Parameters**:
```javascript
{
  sessionId: string
}
```

**Returns**: 
```javascript
{
  strokes: Array<Stroke>,
  stickyNotes: Array<StickyNote>,
  updatedAt: number
} | null  // null if no saved data
```

**Side effects**: Reads from localStorage

---

#### `clearWhiteboard(sessionId)`

Delete whiteboard data from localStorage.

**Parameters**:
```javascript
{
  sessionId: string
}
```

**Returns**: `void`

**Side effects**: Removes key from localStorage

---

#### `checkStorageQuota()`

Check localStorage usage (if supported).

**Parameters**: None

**Returns**:
```javascript
{
  usage: number,      // Bytes used
  quota: number,      // Bytes available
  percentage: number  // Usage percentage (0-100)
} | null  // null if API not supported
```

**Side effects**: None

---

## Module: `undo.js`

Manages undo/redo stack.

### Functions

#### `createUndoStack(maxSize)`

Create a new undo stack.

**Parameters**:
```javascript
{
  maxSize: number  // Max actions to store (default: 20)
}
```

**Returns**: `UndoStack` object

**Side effects**: None

---

#### `push(stack, action)`

Add action to undo stack.

**Parameters**:
```javascript
{
  stack: UndoStack,
  action: {
    type: "drawStroke" | "createNote" | "moveNote" | "deleteStroke" | "deleteNote",
    data: object  // Action-specific data
  }
}
```

**Returns**: `UndoStack` (modified stack)

**Side effects**: Mutates stack (truncates redo branch)

---

#### `undo(stack, currentState)`

Undo last action.

**Parameters**:
```javascript
{
  stack: UndoStack,
  currentState: {
    strokes: Array<Stroke>,
    stickyNotes: Array<StickyNote>
  }
}
```

**Returns**:
```javascript
{
  strokes: Array<Stroke>,
  stickyNotes: Array<StickyNote>
} | null  // null if nothing to undo
```

**Side effects**: Updates stack pointer

---

#### `redo(stack, currentState)`

Redo previously undone action.

**Parameters**:
```javascript
{
  stack: UndoStack,
  currentState: {
    strokes: Array<Stroke>,
    stickyNotes: Array<StickyNote>
  }
}
```

**Returns**:
```javascript
{
  strokes: Array<Stroke>,
  stickyNotes: Array<StickyNote>
} | null  // null if nothing to redo
```

**Side effects**: Updates stack pointer

---

#### `canUndo(stack)`, `canRedo(stack)`

Check if undo/redo is available.

**Parameters**: `{ stack: UndoStack }`

**Returns**: `boolean`

**Side effects**: None (pure function)

---

## Module: `collaboration.js` (P3 only)

WebSocket client for real-time collaboration.

### Functions

#### `connectToSession(sessionId, userId, callbacks)`

Connect to a whiteboard session.

**Parameters**:
```javascript
{
  sessionId: string,
  userId: string,
  callbacks: {
    onStrokeAdded: (stroke: Stroke) => void,
    onNoteAdded: (note: StickyNote) => void,
    onNoteUpdated: (note: StickyNote) => void,
    onItemDeleted: (type: string, id: string) => void,
    onUserJoined: (user: User) => void,
    onUserLeft: (userId: string) => void,
    onError: (error: Error) => void
  }
}
```

**Returns**: `Promise<Socket>` (Socket.io client)

**Side effects**: Opens WebSocket connection

---

#### `emitStroke(socket, stroke)`

Broadcast stroke to other users.

**Parameters**:
```javascript
{
  socket: Socket,
  stroke: Stroke
}
```

**Returns**: `void`

**Side effects**: Sends WebSocket message

---

#### `emitStickyNote(socket, note, action)`

Broadcast sticky note operation.

**Parameters**:
```javascript
{
  socket: Socket,
  note: StickyNote,
  action: "create" | "update" | "delete"
}
```

**Returns**: `void`

**Side effects**: Sends WebSocket message

---

#### `disconnectFromSession(socket)`

Close WebSocket connection.

**Parameters**: `{ socket: Socket }`

**Returns**: `void`

**Side effects**: Closes connection, cleans up listeners

---

## Event Handling Contracts

### Canvas Mouse Events

```javascript
canvas.addEventListener('mousedown', (e) => {
  const rect = canvas.getBoundingClientRect();
  const point = {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };
  // Start new stroke
});

canvas.addEventListener('mousemove', (e) => {
  if (!isDrawing) return;
  const point = { /* same as mousedown */ };
  // Add point to current stroke
});

canvas.addEventListener('mouseup', (e) => {
  // Finalize stroke, save to storage
});
```

### Canvas Touch Events

```javascript
canvas.addEventListener('touchstart', (e) => {
  e.preventDefault(); // Prevent scroll
  const touch = e.touches[0];
  const point = {
    x: touch.clientX - rect.left,
    y: touch.clientY - rect.top
  };
  // Start new stroke
});

canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  // Same as mousemove
});

canvas.addEventListener('touchend', (e) => {
  // Finalize stroke
});
```

### Sticky Note Events

```javascript
note.addEventListener('click', () => {
  // Enter edit mode, focus textarea
});

note.addEventListener('blur', () => {
  // Save content, exit edit mode
});

note.addEventListener('mousedown', (e) => {
  if (e.target.classList.contains('drag-handle')) {
    // Start drag
  }
});
```

---

## Error Handling

### Storage Errors

```javascript
try {
  saveWhiteboard(sessionId, data);
} catch (error) {
  if (error.name === 'QuotaExceededError') {
    alert('Storage full. Please delete some strokes or notes.');
  }
}
```

### WebSocket Errors (P3)

```javascript
socket.on('error', (error) => {
  console.error('WebSocket error:', error);
  // Attempt reconnection with exponential backoff
});

socket.on('disconnect', (reason) => {
  if (reason === 'io server disconnect') {
    // Server closed connection, try to reconnect
    socket.connect();
  }
});
```

---

## Example Usage

### Initialize Whiteboard (P1)

```javascript
import { initCanvas, renderAll } from './canvas.js';
import { loadWhiteboard } from './storage.js';
import { createUndoStack } from './undo.js';

const canvas = document.getElementById('whiteboard-canvas');
const ctx = initCanvas(canvas, { width: 1920, height: 1080 });

const sessionId = 'local';
const savedData = loadWhiteboard(sessionId);
const strokes = savedData?.strokes || [];
const stickyNotes = savedData?.stickyNotes || [];
const undoStack = createUndoStack(20);

renderAll(ctx, strokes, canvas.width, canvas.height);
```

### Draw Stroke (P1)

```javascript
import { createStroke, simplifyStroke } from './strokes.js';
import { drawStroke } from './canvas.js';
import { saveWhiteboard } from './storage.js';
import { push } from './undo.js';

let currentStroke = null;
let isDrawing = false;

canvas.addEventListener('mousedown', (e) => {
  isDrawing = true;
  const point = getCanvasPoint(e);
  currentStroke = createStroke([point], 'medium', 'local');
});

canvas.addEventListener('mousemove', (e) => {
  if (!isDrawing) return;
  const point = getCanvasPoint(e);
  currentStroke = addPoint(currentStroke, point);
  drawStroke(ctx, currentStroke); // Real-time preview
});

canvas.addEventListener('mouseup', () => {
  isDrawing = false;
  if (currentStroke.points.length > 100) {
    currentStroke = simplifyStroke(currentStroke, 2);
  }
  strokes.push(currentStroke);
  push(undoStack, { type: 'drawStroke', data: { stroke: currentStroke } });
  saveWhiteboard(sessionId, { strokes, stickyNotes, updatedAt: Date.now() });
});
```

---

## Performance Considerations

1. **Throttle drawing events**: Limit mousemove/touchmove to 50ms intervals (20 updates/sec)
2. **Debounce storage saves**: Wait 500ms after last change before persisting
3. **Lazy render**: Only redraw canvas when state changes (not on every frame)
4. **Simplified strokes**: Reduce points for long strokes (RDP algorithm)

---

## Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Canvas API | ✅ 90+ | ✅ 88+ | ✅ 14+ | ✅ 90+ |
| localStorage | ✅ 90+ | ✅ 88+ | ✅ 14+ | ✅ 90+ |
| Touch events | ✅ 90+ | ✅ 88+ | ✅ 14+ | ✅ 90+ |
| crypto.randomUUID() | ✅ 92+ | ✅ 95+ | ✅ 15.4+ | ✅ 92+ |
| ES6 modules | ✅ 90+ | ✅ 88+ | ✅ 14+ | ✅ 90+ |

**Polyfill**: For `crypto.randomUUID()` in older Safari, use UUID library or Math.random fallback.
