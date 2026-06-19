# WebSocket API Contract: Collaborative Whiteboard (P3)

**Date**: 2026-06-19
**Purpose**: Define WebSocket events for real-time collaboration
**Protocol**: Socket.io v4.6+

---

## Connection

### Client → Server: `connection`

Establish WebSocket connection.

**Client Action**:
```javascript
const socket = io('wss://whiteboard.example.com', {
  query: {
    sessionId: 'c9f4e0a2-5a6b-4b1c-8e7f-345678901bcd',
    userId: 'user-xyz789'
  }
});
```

**Server Response**:
- Joins user to session room
- Emits `session:state` with current whiteboard state
- Broadcasts `user:joined` to other users in room

---

## Events

### 1. Session State

#### Server → Client: `session:state`

Send full whiteboard state to newly joined user.

**Payload**:
```javascript
{
  sessionId: string,
  strokes: Array<Stroke>,
  stickyNotes: Array<StickyNote>,
  users: Array<{userId: string, name: string, color: string}>
}
```

**Triggered**: On connection

**Client Handler**:
```javascript
socket.on('session:state', (state) => {
  // Initialize local state with server data
  strokes = state.strokes;
  stickyNotes = state.stickyNotes;
  renderAll(ctx, strokes, canvas.width, canvas.height);
});
```

---

### 2. Drawing Events

#### Client → Server: `stroke:add`

Broadcast a new stroke to other users.

**Payload**:
```javascript
{
  stroke: Stroke  // See data-model.md
}
```

**Server Action**:
1. Add stroke to session state
2. Broadcast to all users in room except sender

**Rate Limit**: 10 events/second per user

---

#### Server → Client: `stroke:added`

Receive stroke from another user.

**Payload**:
```javascript
{
  stroke: Stroke
}
```

**Client Handler**:
```javascript
socket.on('stroke:added', (data) => {
  strokes.push(data.stroke);
  renderAll(ctx, strokes, canvas.width, canvas.height);
});
```

---

#### Client → Server: `stroke:delete`

Delete a stroke.

**Payload**:
```javascript
{
  strokeId: string
}
```

**Server Action**:
1. Remove stroke from session state
2. Broadcast to all users in room

---

#### Server → Client: `stroke:deleted`

Receive stroke deletion from another user.

**Payload**:
```javascript
{
  strokeId: string
}
```

**Client Handler**:
```javascript
socket.on('stroke:deleted', (data) => {
  strokes = strokes.filter(s => s.id !== data.strokeId);
  renderAll(ctx, strokes, canvas.width, canvas.height);
});
```

---

### 3. Sticky Note Events

#### Client → Server: `note:create`

Create a new sticky note.

**Payload**:
```javascript
{
  note: StickyNote  // See data-model.md
}
```

**Server Action**:
1. Add note to session state
2. Broadcast to all users in room except sender

---

#### Server → Client: `note:created`

Receive new sticky note from another user.

**Payload**:
```javascript
{
  note: StickyNote
}
```

**Client Handler**:
```javascript
socket.on('note:created', (data) => {
  const { note, element } = createStickyNote(
    data.note.content,
    data.note.position,
    data.note.userId
  );
  stickyNotes.push(note);
  renderStickyNote(note, container);
});
```

---

#### Client → Server: `note:update`

Update sticky note content or position.

**Payload**:
```javascript
{
  noteId: string,
  updates: {
    content?: string,
    position?: {x: number, y: number}
  }
}
```

**Server Action**:
1. Update note in session state
2. Broadcast to all users in room except sender

---

#### Server → Client: `note:updated`

Receive sticky note update from another user.

**Payload**:
```javascript
{
  noteId: string,
  updates: {
    content?: string,
    position?: {x: number, y: number}
  }
}
```

**Client Handler**:
```javascript
socket.on('note:updated', (data) => {
  const note = stickyNotes.find(n => n.id === data.noteId);
  if (note) {
    Object.assign(note, data.updates);
    // Update DOM element
    updateStickyNoteDom(note);
  }
});
```

---

#### Client → Server: `note:delete`

Delete a sticky note.

**Payload**:
```javascript
{
  noteId: string
}
```

**Server Action**:
1. Remove note from session state
2. Broadcast to all users in room

---

#### Server → Client: `note:deleted`

Receive sticky note deletion from another user.

**Payload**:
```javascript
{
  noteId: string
}
```

**Client Handler**:
```javascript
socket.on('note:deleted', (data) => {
  stickyNotes = deleteStickyNote(stickyNotes, data.noteId, container);
});
```

---

### 4. User Events

#### Server → Client: `user:joined`

Another user joined the session.

**Payload**:
```javascript
{
  userId: string,
  name: string,
  color: string  // Hex color for cursor
}
```

**Client Handler**:
```javascript
socket.on('user:joined', (user) => {
  console.log(`${user.name} joined the session`);
  // Show notification or update user list
});
```

---

#### Server → Client: `user:left`

Another user left the session.

**Payload**:
```javascript
{
  userId: string
}
```

**Client Handler**:
```javascript
socket.on('user:left', (data) => {
  console.log(`User ${data.userId} left the session`);
  // Remove from user list
});
```

---

### 5. Error Events

#### Server → Client: `error`

Server error occurred.

**Payload**:
```javascript
{
  code: string,  // Error code
  message: string,
  details?: object
}
```

**Error Codes**:
- `SESSION_NOT_FOUND`: Session ID doesn't exist
- `SESSION_CAPACITY_EXCEEDED`: Too many strokes/notes
- `RATE_LIMIT_EXCEEDED`: Too many messages per second
- `INVALID_PAYLOAD`: Malformed event data

**Client Handler**:
```javascript
socket.on('error', (error) => {
  console.error('WebSocket error:', error);
  if (error.code === 'SESSION_CAPACITY_EXCEEDED') {
    alert('Whiteboard is full. Please delete some content.');
  }
});
```

---

## Connection Management

### Reconnection

**Client Behavior**:
```javascript
socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
  
  if (reason === 'io server disconnect') {
    // Server closed connection, manually reconnect
    socket.connect();
  }
  // Socket.io auto-reconnects for other reasons
});

socket.on('reconnect', (attemptNumber) => {
  console.log('Reconnected after', attemptNumber, 'attempts');
  // Re-sync state from server
  socket.emit('session:request-state');
});
```

**Exponential Backoff**:
```javascript
const socket = io(url, {
  reconnection: true,
  reconnectionDelay: 1000,      // Start at 1s
  reconnectionDelayMax: 5000,   // Max 5s
  reconnectionAttempts: 10      // Give up after 10 tries
});
```

---

### Heartbeat

**Server**: Ping every 25 seconds  
**Client**: Pong response expected within 5 seconds  
**Timeout**: Disconnect if no pong received

Socket.io handles this automatically.

---

## Rate Limiting

**Per-user limits**:
- 10 events/second max
- Stroke events throttled to 50ms intervals (20/sec)
- Other events: 10/sec

**Server Enforcement**:
```javascript
const rateLimiter = new Map(); // socketId → {count, resetTime}

function checkRateLimit(socketId) {
  const limit = rateLimiter.get(socketId) || { count: 0, resetTime: Date.now() + 1000 };
  
  if (Date.now() > limit.resetTime) {
    limit.count = 0;
    limit.resetTime = Date.now() + 1000;
  }
  
  if (limit.count >= 10) {
    return false; // Block
  }
  
  limit.count++;
  rateLimiter.set(socketId, limit);
  return true;
}
```

**Client Throttling** (stroke events):
```javascript
let lastStrokeTime = 0;
const STROKE_THROTTLE = 50; // ms

canvas.addEventListener('mousemove', (e) => {
  const now = Date.now();
  if (now - lastStrokeTime < STROKE_THROTTLE) return;
  
  lastStrokeTime = now;
  socket.emit('stroke:add', { stroke: currentStroke });
});
```

---

## Rooms & Namespaces

**Room Pattern**: One room per whiteboard session

```javascript
// Server: Join user to session room
socket.on('connection', (client) => {
  const { sessionId, userId } = client.handshake.query;
  client.join(sessionId);
  
  // Broadcast to room
  io.to(sessionId).emit('user:joined', { userId, name: 'Anonymous' });
});

// Emit to all users in room except sender
socket.to(sessionId).emit('stroke:added', { stroke });

// Emit to all users in room including sender
io.to(sessionId).emit('note:deleted', { noteId });
```

---

## Optimistic UI Updates

**Pattern**: Update local UI immediately, sync with server asynchronously

```javascript
// Client: Optimistic stroke creation
function handleMouseUp() {
  // 1. Update local state immediately
  strokes.push(currentStroke);
  renderAll(ctx, strokes, canvas.width, canvas.height);
  
  // 2. Emit to server (async)
  socket.emit('stroke:add', { stroke: currentStroke });
  
  // 3. Server confirms (optional acknowledgment)
  socket.on('stroke:confirmed', (data) => {
    console.log('Stroke saved on server:', data.strokeId);
  });
}
```

**Conflict Resolution**: Last-write-wins (version field for future CRDTs)

---

## Security

### Authentication (future)

**JWT in query params**:
```javascript
const socket = io(url, {
  query: {
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    sessionId: 'c9f4e0a2-5a6b-4b1c-8e7f-345678901bcd'
  }
});

// Server validates token
io.use((socket, next) => {
  const token = socket.handshake.query.token;
  if (isValidToken(token)) {
    next();
  } else {
    next(new Error('Authentication failed'));
  }
});
```

### Input Validation

**Server-side validation**:
```javascript
socket.on('stroke:add', (data) => {
  if (!isValidStroke(data.stroke)) {
    socket.emit('error', {
      code: 'INVALID_PAYLOAD',
      message: 'Stroke data is malformed'
    });
    return;
  }
  
  // Check capacity
  if (session.strokes.length >= 1000) {
    socket.emit('error', {
      code: 'SESSION_CAPACITY_EXCEEDED',
      message: 'Maximum strokes reached'
    });
    return;
  }
  
  // Process event
  session.addStroke(data.stroke);
  io.to(sessionId).emit('stroke:added', { stroke: data.stroke });
});
```

### XSS Prevention

**Sanitize sticky note content**:
```javascript
// Server
function sanitizeContent(text) {
  return text
    .substring(0, 500)        // Limit length
    .replace(/</g, '&lt;')    // Escape HTML
    .replace(/>/g, '&gt;')
    .trim();
}

socket.on('note:create', (data) => {
  data.note.content = sanitizeContent(data.note.content);
  // Proceed...
});
```

---

## Example: Complete Flow

### 1. User Joins Session

```javascript
// Client connects
const socket = io('wss://whiteboard.example.com', {
  query: { sessionId: 'abc123', userId: 'user-1' }
});

// Server sends initial state
socket.on('session:state', (state) => {
  strokes = state.strokes;
  stickyNotes = state.stickyNotes;
  renderAll(ctx, strokes, canvas.width, canvas.height);
});

// Other users notified
socket.on('user:joined', (user) => {
  console.log(`${user.name} joined`);
});
```

### 2. User Draws Stroke

```javascript
// Client emits stroke
socket.emit('stroke:add', { stroke: newStroke });

// Other clients receive
socket.on('stroke:added', (data) => {
  strokes.push(data.stroke);
  renderAll(ctx, strokes, canvas.width, canvas.height);
});
```

### 3. User Disconnects

```javascript
// Client closes connection
socket.disconnect();

// Server broadcasts to room
io.to(sessionId).emit('user:left', { userId: 'user-1' });
```

---

## Performance

### Message Size

- **Stroke**: ~1KB (100 points × 10 bytes/point + metadata)
- **Sticky Note**: ~0.5KB (500 char content + metadata)
- **Full session state**: ~500KB (500 strokes + 50 notes)

### Throughput

- **Per-user**: 10 events/sec × 1KB = 10KB/s
- **Per-session**: 5 users × 10KB/s = 50KB/s
- **Server**: 1000 sessions × 50KB/s = 50MB/s (manageable)

### Latency

- **LAN**: <10ms
- **Same region**: 20-50ms
- **Cross-region**: 100-200ms
- **Target**: <2s end-to-end (p95)

---

## Testing

### Mock Server (Development)

```javascript
// Mock Socket.io server for local testing
const mockServer = {
  emit: (event, data) => {
    console.log('Mock emit:', event, data);
  },
  on: (event, handler) => {
    console.log('Mock listener:', event);
  }
};
```

### Integration Tests (Jest)

```javascript
const io = require('socket.io-client');
const { createServer } = require('./server');

test('User can join session and receive state', async () => {
  const server = createServer();
  const socket = io('http://localhost:3000', {
    query: { sessionId: 'test-123', userId: 'user-1' }
  });
  
  return new Promise((resolve) => {
    socket.on('session:state', (state) => {
      expect(state.sessionId).toBe('test-123');
      socket.disconnect();
      server.close();
      resolve();
    });
  });
});
```

---

## Summary

| Event | Direction | Purpose | Rate Limit |
|-------|-----------|---------|------------|
| `session:state` | S→C | Initial whiteboard state | On connect |
| `stroke:add` | C→S | Broadcast new stroke | 10/sec |
| `stroke:added` | S→C | Receive stroke from other user | N/A |
| `stroke:delete` | C→S | Broadcast stroke deletion | 10/sec |
| `stroke:deleted` | S→C | Receive deletion | N/A |
| `note:create` | C→S | Broadcast new note | 10/sec |
| `note:created` | S→C | Receive note from other user | N/A |
| `note:update` | C→S | Broadcast note change | 10/sec |
| `note:updated` | S→C | Receive note update | N/A |
| `note:delete` | C→S | Broadcast note deletion | 10/sec |
| `note:deleted` | S→C | Receive deletion | N/A |
| `user:joined` | S→C | User connected to session | N/A |
| `user:left` | S→C | User disconnected | N/A |
| `error` | S→C | Server error occurred | N/A |

**Key Principles**:
- Optimistic UI updates (client updates before server confirms)
- Rate limiting prevents abuse
- Automatic reconnection with exponential backoff
- Room-based broadcasting (one room per session)
- Input validation on server side
