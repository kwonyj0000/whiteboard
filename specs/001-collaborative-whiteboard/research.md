# Technical Research: Collaborative Whiteboard

**Date**: 2026-06-19
**Feature**: Collaborative Whiteboard
**Purpose**: Resolve technical clarifications for vanilla JS implementation

---

## Research Questions

From Technical Context, we need to resolve:
1. WebSocket library selection (native vs socket.io)
2. Backend server technology choice
3. Testing strategy for vanilla JS
4. Session storage mechanism (in-memory vs persistent)

---

## 1. WebSocket Library Selection

### Decision: **Native WebSocket API (P1/P2), Socket.io (P3)**

**Rationale**:
- **For P1/P2 (local features)**: No WebSocket needed, localStorage only
- **For P3 (collaboration)**: Socket.io preferred over native WebSocket

**Alternatives Considered**:

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| Native WebSocket API | Zero dependencies, built-in browser support, lightweight | No automatic reconnection, no fallback transports, manual heartbeat needed | Good for simple cases |
| Socket.io (client + server) | Auto-reconnection, fallback transports, rooms/namespaces, heartbeat built-in | Adds ~34KB client library (gzipped), requires socket.io server | **CHOSEN** - reliability outweighs size cost |
| ws (server-only) | Lightweight Node.js server, simple API | No client library, requires manual reconnection logic | Too basic for real-time collab |

**Implementation Plan**:
- P1/P2: No WebSocket dependency (localStorage sync only)
- P3: Add socket.io-client (CDN or local), socket.io server
- Connection management: Auto-reconnect with exponential backoff
- Room pattern: One room per whiteboard session ID

**Best Practices**:
- Emit binary data for stroke coordinates (more efficient than JSON)
- Throttle stroke events (batch points every 50ms to reduce message flood)
- Use acknowledgments for critical operations (create/delete)
- Implement optimistic UI updates (don't wait for server confirmation)

---

## 2. Backend Server Technology

### Decision: **Node.js with Express + Socket.io**

**Rationale**: 
- Minimal setup, mature ecosystem, excellent WebSocket support
- Aligns with "minimal dependencies" requirement (no heavy frameworks)
- JavaScript full-stack (same language as frontend)

**Alternatives Considered**:

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| Node.js + Express + Socket.io | Fast prototyping, huge ecosystem, native async/await, same language as frontend | Single-threaded (but sufficient for 5-50 users) | **CHOSEN** |
| Python + FastAPI + python-socketio | Type hints, async support, familiar for ML engineers | Slower than Node for real-time, adds language complexity | Rejected - consistency matters |
| Deno + Socket.io | Modern runtime, TypeScript native, secure by default | Smaller ecosystem, socket.io support less mature | Rejected - too cutting-edge |
| Go + Gorilla WebSocket | Excellent concurrency, fast, compiled | Different language, overkill for MVP scale | Rejected - over-engineered |

**Implementation Plan**:
- Express: Serve static HTML/CSS/JS files
- Socket.io: Handle real-time events (draw, create note, move, delete)
- No database initially (in-memory sessions)
- Session model: Map of sessionId → whiteboard state

**Dependencies** (package.json):
```json
{
  "dependencies": {
    "express": "^4.18.0",
    "socket.io": "^4.6.0"
  },
  "devDependencies": {
    "nodemon": "^2.0.0"
  }
}
```

---

## 3. Testing Strategy

### Decision: **Manual browser testing (P1/P2), Jest + jsdom (P3+)**

**Rationale**:
- Constitution requires backend tests; P1/P2 are frontend-only
- Vanilla JS testing adds complexity without clear ROI for MVP
- Focus testing effort on collaboration backend (P3) where bugs are costlier

**Alternatives Considered**:

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| Manual browser testing | Zero setup, tests real environment, fast iteration | Not automated, no CI/CD integration, regression risk | **CHOSEN for P1/P2** |
| Jest + jsdom | Industry standard, mocks DOM/Canvas, CI-friendly | Requires build config, jsdom != real browser, Canvas API limited | **CHOSEN for P3 backend** |
| Playwright/Cypress | E2E tests, real browser, visual regression | Heavy setup, slow tests, overkill for MVP | Rejected - too heavyweight |
| Vitest | Fast, modern, Vite integration | Requires build setup (conflicts with vanilla approach) | Rejected - unnecessary complexity |

**Implementation Plan**:

**Phase 1-2 (Frontend)**:
- Manual checklist testing in Chrome, Firefox, Safari
- Test matrix: Desktop (1920x1080), Tablet (768x1024), Touch events
- Focus: Visual correctness, localStorage persistence, undo/redo

**Phase 3 (Backend)**:
- Jest for WebSocket message handling (unit tests)
- Supertest for HTTP endpoints (if added)
- Mock socket.io connections for session logic
- Target: >80% coverage on server-side code

**Test Checklist** (manual, P1/P2):
```markdown
- [ ] Drawing: Smooth lines on mouse drag
- [ ] Drawing: Touch drawing on tablet (no scroll conflict)
- [ ] Brush: Three sizes visually distinct
- [ ] Persistence: Refresh page → strokes remain
- [ ] Undo: Last stroke removed
- [ ] Delete: Click stroke → delete button → stroke removed
- [ ] Sticky: Create note, type text, drag to move
- [ ] Sticky: Persist after refresh
```

---

## 4. Session Storage Mechanism

### Decision: **In-memory Map (P3 MVP), Redis (future scaling)**

**Rationale**:
- 5-50 users per session, ~1000 sessions total = manageable in memory
- Simplifies deployment (no database setup for MVP)
- Session data is ephemeral (whiteboard dies when server restarts)

**Alternatives Considered**:

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| In-memory Map | Zero dependencies, fast, simple | Data lost on restart, no horizontal scaling | **CHOSEN for MVP** |
| Redis | Persistent, pub/sub for multi-server, fast | Adds deployment complexity, external service | Deferred to post-MVP |
| PostgreSQL/MySQL | Relational integrity, long-term storage | Overkill for ephemeral sessions, slower | Rejected - unnecessary |
| MongoDB | Flexible schema, good for documents | Requires MongoDB instance, complexity | Rejected - overengineering |

**Implementation Plan**:

**Data Structure** (in-memory):
```javascript
// Server-side session storage
const sessions = new Map(); // sessionId → WhiteboardState

class WhiteboardState {
  constructor(sessionId) {
    this.sessionId = sessionId;
    this.strokes = [];      // Array of stroke objects
    this.stickyNotes = [];  // Array of note objects
    this.users = new Set(); // Connected socket IDs
    this.createdAt = Date.now();
  }
}
```

**Session Lifecycle**:
1. First user connects → create session in Map
2. Subsequent users → join existing session
3. Last user disconnects → (optional) delete session after 5min timeout
4. Server restart → all sessions lost (acceptable for MVP)

**Future Migration Path** (post-MVP):
- Add Redis adapter for socket.io (socket.io-redis)
- Persist sessions to Redis with TTL (24 hours)
- Enable horizontal scaling (multiple server instances)

---

## Additional Technical Decisions

### 5. HTML5 Canvas Rendering Strategy

**Decision**: Single canvas with full redraw on change

**Rationale**:
- 500 strokes max = fast enough to redraw all (<16ms at 60fps)
- Simpler than layered canvas or dirty region tracking
- Undo/redo just clears and redraws entire state

**Rendering Flow**:
```javascript
function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  strokes.forEach(stroke => drawStroke(stroke));
  // Sticky notes are DOM elements (not canvas), separate rendering
}
```

### 6. Touch Gesture Handling

**Decision**: `touch-action: none` CSS + preventDefault on touchstart

**Best Practices**:
```css
#canvas {
  touch-action: none; /* Disable native touch behaviors */
}
```

```javascript
canvas.addEventListener('touchstart', (e) => {
  e.preventDefault(); // Prevent scroll/zoom during drawing
  // Handle drawing...
});
```

**Trade-off**: User cannot scroll canvas while touching it. Accept this for MVP (full-screen canvas).

### 7. Undo Stack Implementation

**Decision**: Command pattern with 20-action circular buffer

**Structure**:
```javascript
class UndoStack {
  constructor(maxSize = 20) {
    this.actions = []; // Array of { type, data, timestamp }
    this.maxSize = maxSize;
    this.pointer = -1; // Current position in stack
  }
  
  push(action) {
    // Truncate redo branch, add new action, enforce max size
  }
  
  undo() { /* Restore state to pointer - 1 */ }
  redo() { /* Restore state to pointer + 1 */ }
}
```

**Actions tracked**: draw, createNote, moveNote, deleteStroke, deleteNote

---

## Performance Optimization Strategy

### Throttling & Debouncing

1. **Drawing events**: Throttle pointer move to 50ms intervals (20 updates/sec)
2. **localStorage saves**: Debounce by 500ms after last change
3. **WebSocket messages**: Batch stroke points, send every 50ms

### Memory Management

1. **Stroke simplification**: Use Ramer-Douglas-Peucker algorithm if stroke >100 points
2. **localStorage quota**: Monitor usage, warn at 80% (4MB), block at 95%
3. **Session cleanup**: Remove disconnected users after 5min timeout

### Bundle Size

- No bundler = no code splitting needed
- Load collaboration.js only on P3 (async script tag or dynamic import)
- Use CDN for socket.io-client (fallback to local copy)

---

## Security Considerations

### P3 Collaboration Threats

1. **Session hijacking**: UUIDs are guessable → Use crypto.randomUUID() (v4)
2. **Message flooding**: Rate limit socket messages (10/sec per user)
3. **XSS in sticky notes**: Sanitize text content (use textContent not innerHTML)
4. **Memory exhaustion**: Limit strokes per session (1000 max), notes (100 max)

### Implementation

```javascript
// Server-side rate limiting
const rateLimiter = new Map(); // socketId → { count, resetTime }

function checkRateLimit(socketId) {
  const limit = rateLimiter.get(socketId);
  if (!limit || Date.now() > limit.resetTime) {
    rateLimiter.set(socketId, { count: 1, resetTime: Date.now() + 1000 });
    return true;
  }
  if (limit.count >= 10) return false; // Block
  limit.count++;
  return true;
}
```

---

## Summary of Decisions

| Question | Decision | Rationale |
|----------|----------|-----------|
| WebSocket library | Socket.io (P3 only) | Auto-reconnect, fallback, reliability for real-time |
| Backend server | Node.js + Express | Minimal setup, mature WebSocket support, JS full-stack |
| Testing strategy | Manual (P1/P2), Jest (P3) | Focus testing on backend where bugs are costlier |
| Session storage | In-memory Map (MVP) | Simple, fast, sufficient for 5-50 users per session |
| Canvas rendering | Single canvas, full redraw | Fast enough for 500 strokes, simpler than layering |
| Touch gestures | `touch-action: none` | Prevent scroll conflicts during drawing |
| Undo mechanism | Command pattern, 20-action buffer | Memory-efficient, supports redo |

**All NEEDS CLARIFICATION items resolved. Ready for Phase 1 design.**
