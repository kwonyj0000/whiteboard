# Data Model: Collaborative Whiteboard

**Date**: 2026-06-19
**Feature**: Collaborative Whiteboard
**Purpose**: Define data structures for strokes, sticky notes, and whiteboard sessions

---

## Entity Relationship Overview

```
WhiteboardSession (1) ──< (N) Stroke
                   (1) ──< (N) StickyNote
                   (1) ──< (N) User (active connections)
```

**Storage**:
- **Client-side**: localStorage (JSON serialization)
- **Server-side** (P3): In-memory Map (sessionId → WhiteboardState)

---

## 1. Stroke Entity

Represents a single drawn line on the canvas.

### Structure

```javascript
{
  id: string,              // UUID v4, e.g., "550e8400-e29b-41d4-a716-446655440000"
  type: "stroke",          // Entity discriminator
  points: Array<{x, y}>,   // Array of coordinate pairs
  brushSize: string,       // "thin" | "medium" | "thick"
  color: string,           // Hex color, e.g., "#000000" (black only for v1)
  userId: string,          // UUID of user who drew it (for P3 collaboration)
  timestamp: number,       // Unix timestamp (milliseconds), e.g., 1718812800000
  version: number          // Optimistic concurrency control (P3)
}
```

### Field Specifications

| Field | Type | Required | Constraints | Default | Notes |
|-------|------|----------|-------------|---------|-------|
| `id` | string | Yes | UUID v4 format | `crypto.randomUUID()` | Primary identifier |
| `type` | string | Yes | Enum: "stroke" | "stroke" | Discriminates from sticky notes |
| `points` | array | Yes | Min 2 points, max 1000 points | `[]` | Simplified if >100 points via RDP algorithm |
| `brushSize` | string | Yes | Enum: "thin", "medium", "thick" | "medium" | Maps to pixel widths: 2px, 5px, 10px |
| `color` | string | Yes | Hex format #RRGGBB | "#000000" | Black only for v1; expandable for v2 |
| `userId` | string | Yes | UUID v4 format | "local" (P1/P2) | "local" for single-user, UUID for P3 |
| `timestamp` | number | Yes | Positive integer | `Date.now()` | Creation time in ms since epoch |
| `version` | number | Yes | Positive integer | 1 | Incremented on update (P3 conflict resolution) |

### Validation Rules

1. **Points array**:
   - Must contain at least 2 points (start and end)
   - Each point: `{ x: number, y: number }` where 0 ≤ x ≤ canvasWidth, 0 ≤ y ≤ canvasHeight
   - Simplify if points.length > 100 using Ramer-Douglas-Peucker (tolerance: 2 pixels)

2. **BrushSize mapping**:
   ```javascript
   const BRUSH_SIZES = {
     thin: 2,    // pixels
     medium: 5,  // pixels
     thick: 10   // pixels
   };
   ```

3. **Immutability**: Once created, strokes are immutable (delete-only, no edit)

### Example

```json
{
  "id": "a7f2c8d0-3e4b-4f9a-8c5d-1234567890ab",
  "type": "stroke",
  "points": [
    {"x": 100, "y": 150},
    {"x": 102, "y": 152},
    {"x": 105, "y": 155},
    {"x": 110, "y": 160}
  ],
  "brushSize": "medium",
  "color": "#000000",
  "userId": "local",
  "timestamp": 1718812800000,
  "version": 1
}
```

---

## 2. StickyNote Entity

Represents a text-based note positioned on the canvas.

### Structure

```javascript
{
  id: string,              // UUID v4
  type: "stickyNote",      // Entity discriminator
  content: string,         // Note text content
  position: {x, y},        // Top-left corner coordinates
  size: {width, height},   // Dimensions in pixels
  color: string,           // Background color (yellow for v1)
  userId: string,          // UUID of user who created it
  timestamp: number,       // Creation time
  updatedAt: number,       // Last modification time
  version: number          // Optimistic concurrency control
}
```

### Field Specifications

| Field | Type | Required | Constraints | Default | Notes |
|-------|------|----------|-------------|---------|-------|
| `id` | string | Yes | UUID v4 format | `crypto.randomUUID()` | Primary identifier |
| `type` | string | Yes | Enum: "stickyNote" | "stickyNote" | Discriminates from strokes |
| `content` | string | Yes | Max 500 chars | "" | Plain text only, sanitized |
| `position` | object | Yes | `{x: number, y: number}` | `{x: 100, y: 100}` | Draggable within canvas bounds |
| `size` | object | Yes | `{width: number, height: number}` | `{width: 200, height: 150}` | Fixed for v1 |
| `color` | string | Yes | Hex format #RRGGBB | "#FFEB3B" | Yellow (#FFEB3B) for v1 |
| `userId` | string | Yes | UUID v4 format | "local" | Creator identifier |
| `timestamp` | number | Yes | Positive integer | `Date.now()` | Creation time |
| `updatedAt` | number | Yes | Positive integer | `Date.now()` | Last edit time |
| `version` | number | Yes | Positive integer | 1 | Conflict resolution version |

### Validation Rules

1. **Content sanitization**: Use `textContent` (not `innerHTML`) to prevent XSS
   ```javascript
   function sanitizeContent(text) {
     return text.substring(0, 500).trim();
   }
   ```

2. **Position boundaries**:
   - 0 ≤ position.x ≤ canvasWidth - size.width
   - 0 ≤ position.y ≤ canvasHeight - size.height
   - Snap to canvas edges if dragged outside

3. **Size constraints** (v1): Fixed at 200x150px (no resize)

### State Transitions

```
[Created] → content = "", focused = true
    ↓
[Editing] → user types, content updates in real-time
    ↓
[Saved] → blur event, persist to storage, focused = false
    ↓
[Editing] (click) → refocus, allow edit
    ↓
[Deleted] → removed from canvas and storage
```

### Example

```json
{
  "id": "b8e3d9f1-4f5c-4a0b-9d6e-234567890abc",
  "type": "stickyNote",
  "content": "Review architecture decisions",
  "position": {"x": 250, "y": 300},
  "size": {"width": 200, "height": 150},
  "color": "#FFEB3B",
  "userId": "local",
  "timestamp": 1718812850000,
  "updatedAt": 1718812900000,
  "version": 2
}
```

---

## 3. WhiteboardSession Entity

Container for all whiteboard content and active users (P3).

### Structure

```javascript
{
  sessionId: string,          // UUID v4, shareable identifier
  strokes: Array<Stroke>,     // All strokes in this session
  stickyNotes: Array<StickyNote>, // All notes in this session
  users: Set<string>,         // Active socket IDs (P3 only)
  createdAt: number,          // Session creation time
  updatedAt: number,          // Last modification time
  metadata: {
    title: string,            // Optional session name
    owner: string             // Creator user ID (future auth)
  }
}
```

### Field Specifications

| Field | Type | Required | Constraints | Default | Notes |
|-------|------|----------|-------------|---------|-------|
| `sessionId` | string | Yes | UUID v4 format | `crypto.randomUUID()` | URL path: `/whiteboard/:sessionId` |
| `strokes` | array | Yes | Max 1000 strokes | `[]` | Enforce limit to prevent memory issues |
| `stickyNotes` | array | Yes | Max 100 notes | `[]` | Enforce limit for performance |
| `users` | Set | No | Set of socket IDs | `new Set()` | P3 only, ephemeral (not persisted) |
| `createdAt` | number | Yes | Positive integer | `Date.now()` | Session start time |
| `updatedAt` | number | Yes | Positive integer | `Date.now()` | Last change timestamp |
| `metadata` | object | No | Optional fields | `{}` | Extensible for future features |

### Validation Rules

1. **Capacity limits**:
   - Reject new strokes if `strokes.length >= 1000`
   - Reject new notes if `stickyNotes.length >= 100`
   - Return error: `{ error: "Session capacity exceeded" }`

2. **SessionId generation**:
   ```javascript
   const sessionId = crypto.randomUUID(); // Cryptographically secure
   ```

3. **Cleanup policy** (P3):
   - Delete session 5 minutes after last user disconnects
   - Log cleanup event for monitoring

### Example

```json
{
  "sessionId": "c9f4e0a2-5a6b-4b1c-8e7f-345678901bcd",
  "strokes": [ /* array of Stroke objects */ ],
  "stickyNotes": [ /* array of StickyNote objects */ ],
  "users": ["socket-abc123", "socket-def456"],
  "createdAt": 1718812800000,
  "updatedAt": 1718813100000,
  "metadata": {
    "title": "Sprint Planning Q3",
    "owner": "user-xyz789"
  }
}
```

---

## 4. User Entity (P3 Collaboration)

Represents a connected user in a whiteboard session.

### Structure

```javascript
{
  userId: string,      // UUID v4, persistent identifier
  socketId: string,    // Socket.io connection ID (ephemeral)
  sessionId: string,   // Current whiteboard session
  color: string,       // User cursor color (for P3 multi-cursor)
  name: string,        // Display name (anonymous-1, anonymous-2, etc.)
  connectedAt: number  // Connection timestamp
}
```

### Field Specifications

| Field | Type | Required | Constraints | Default | Notes |
|-------|------|----------|-------------|---------|-------|
| `userId` | string | Yes | UUID v4 format | `crypto.randomUUID()` | Persists across reconnects (stored in client) |
| `socketId` | string | Yes | Socket.io ID | N/A | Changes on reconnect |
| `sessionId` | string | Yes | UUID v4 format | N/A | Foreign key to WhiteboardSession |
| `color` | string | No | Hex format #RRGGBB | Random from palette | Visual identifier (P3 feature) |
| `name` | string | No | Max 50 chars | "Anonymous-N" | Generated if not provided |
| `connectedAt` | number | Yes | Positive integer | `Date.now()` | Connection time |

### User Color Palette (P3)

```javascript
const USER_COLORS = [
  "#FF5252", // Red
  "#448AFF", // Blue
  "#69F0AE", // Green
  "#FFD740", // Yellow
  "#E040FB", // Purple
  "#FF6E40"  // Orange
];

function assignUserColor(userId) {
  const hash = hashCode(userId);
  return USER_COLORS[hash % USER_COLORS.length];
}
```

---

## 5. UndoAction Entity (Client-side only)

Represents a reversible action in the undo stack.

### Structure

```javascript
{
  id: string,          // UUID v4
  type: string,        // Action type discriminator
  timestamp: number,   // When action was performed
  data: object         // Action-specific data
}
```

### Action Types

| Type | Data Structure | Undo Behavior |
|------|----------------|---------------|
| `drawStroke` | `{ strokeId: string, stroke: Stroke }` | Remove stroke from canvas |
| `createNote` | `{ noteId: string, note: StickyNote }` | Remove note from canvas |
| `moveNote` | `{ noteId: string, from: {x,y}, to: {x,y} }` | Restore note to `from` position |
| `deleteStroke` | `{ strokeId: string, stroke: Stroke }` | Restore deleted stroke |
| `deleteNote` | `{ noteId: string, note: StickyNote }` | Restore deleted note |

### Example

```json
{
  "id": "d0a5b1c2-6a7b-4c8d-9e0f-456789012cde",
  "type": "drawStroke",
  "timestamp": 1718813000000,
  "data": {
    "strokeId": "a7f2c8d0-3e4b-4f9a-8c5d-1234567890ab",
    "stroke": { /* full Stroke object */ }
  }
}
```

---

## Storage Schemas

### localStorage Schema (P1/P2)

Key: `whiteboard-{sessionId}` (default: `whiteboard-local`)

```json
{
  "sessionId": "local",
  "strokes": [ /* array of Stroke objects */ ],
  "stickyNotes": [ /* array of StickyNote objects */ ],
  "version": 1,
  "updatedAt": 1718813100000
}
```

**Size Management**:
- Estimate: 1 stroke ≈ 1KB (100 points), 1 note ≈ 0.5KB
- 500 strokes + 50 notes ≈ 525KB (well under 5MB quota)
- Monitor quota: `navigator.storage.estimate()` (if supported)

### Server-side Storage (P3 - In-Memory)

```javascript
// Server: Map<sessionId, WhiteboardState>
const sessions = new Map();

class WhiteboardState {
  constructor(sessionId) {
    this.sessionId = sessionId;
    this.strokes = [];
    this.stickyNotes = [];
    this.users = new Set(); // Socket IDs
    this.createdAt = Date.now();
    this.updatedAt = Date.now();
  }
  
  addStroke(stroke) {
    if (this.strokes.length >= 1000) {
      throw new Error("Session capacity exceeded");
    }
    this.strokes.push(stroke);
    this.updatedAt = Date.now();
  }
  
  addStickyNote(note) {
    if (this.stickyNotes.length >= 100) {
      throw new Error("Session capacity exceeded");
    }
    this.stickyNotes.push(note);
    this.updatedAt = Date.now();
  }
  
  // Delete, update methods...
}
```

---

## Indexes & Queries

### Client-side (Array operations)

```javascript
// Find stroke by ID (O(n) - acceptable for 500 items)
const stroke = strokes.find(s => s.id === strokeId);

// Filter by user (P3)
const userStrokes = strokes.filter(s => s.userId === userId);

// Sort by timestamp (for undo stack)
const sorted = actions.sort((a, b) => a.timestamp - b.timestamp);
```

### Server-side (P3 - future optimization)

If scaling beyond in-memory:
- Index `sessionId` (primary key)
- Index `userId` for per-user queries
- Index `timestamp` for chronological ordering

---

## Data Migration

### Version 1 → Version 2 (future)

If adding color picker (multiple colors):

```javascript
function migrateStroke_v1_to_v2(stroke) {
  return {
    ...stroke,
    color: stroke.color || "#000000", // Default if missing
    version: 2
  };
}
```

**Rule**: Always include version field for forward compatibility.

---

## Summary

| Entity | Purpose | Storage | Max Count |
|--------|---------|---------|-----------|
| **Stroke** | Drawing line data | localStorage + server (P3) | 1000 per session |
| **StickyNote** | Text annotation data | localStorage + server (P3) | 100 per session |
| **WhiteboardSession** | Container for content | server (P3), implicit in localStorage | N/A |
| **User** | Connected participant | server (P3), ephemeral | 5-50 per session |
| **UndoAction** | Reversible action | client-only (in-memory) | 20 actions (circular buffer) |

**Relationships**:
- 1 WhiteboardSession : N Strokes
- 1 WhiteboardSession : N StickyNotes
- 1 WhiteboardSession : N Users (P3)
- Actions reference entities by ID for undo/redo

**Storage Efficiency**:
- Minimal overhead (UUIDs + metadata ≈ 100 bytes/entity)
- Stroke simplification for large drawings
- Fixed note size (no resize) reduces complexity
