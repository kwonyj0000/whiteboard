# Quickstart Guide: Collaborative Whiteboard

**Date**: 2026-06-19
**Purpose**: Validate end-to-end functionality of whiteboard features
**Audience**: Developers and QA testers

---

## Prerequisites

### Software Requirements

- **Browser**: Chrome 90+, Firefox 88+, Safari 14+, or Edge 90+
- **Node.js**: v18+ (for P3 collaboration server)
- **npm**: v8+ (bundled with Node.js)

### Hardware Requirements

- **Desktop**: 1920x1080 display recommended
- **Tablet**: 768x1024 or larger for touch testing
- **Network**: Stable connection (100ms latency or better for P3)

---

## Setup

### Phase 1-2: Local Whiteboard (Drawing + Sticky Notes)

**Step 1**: Clone and navigate to project
```bash
cd whiteboard/
```

**Step 2**: Open in browser (no build required)
```bash
# Option 1: Direct file open
open index.html

# Option 2: Local server (recommended for ES6 modules)
python3 -m http.server 8080
# Then open http://localhost:8080
```

**Step 3**: Verify console shows no errors
```javascript
// Browser DevTools Console should show:
// "Whiteboard initialized"
// "Loaded 0 strokes, 0 notes from localStorage"
```

---

### Phase 3: Collaboration Server

**Step 1**: Install server dependencies
```bash
cd server/
npm install
```

**Step 2**: Start WebSocket server
```bash
npm start
# Or for development with auto-reload:
npm run dev
```

**Expected output**:
```
WebSocket server listening on port 3000
Session cleanup interval: 5 minutes
```

**Step 3**: Configure frontend to connect to server
```javascript
// In js/main.js, set:
const COLLABORATION_ENABLED = true;
const WEBSOCKET_URL = 'http://localhost:3000';
```

**Step 4**: Open two browser windows at same URL
```
http://localhost:8080?session=test-123
```

---

## Validation Scenarios

### Scenario 1: Draw and Persist (P1)

**Goal**: Verify freehand drawing with localStorage persistence

**Steps**:
1. Open whiteboard in browser
2. Select "Medium" brush size from toolbar
3. Click and drag on canvas to draw a simple shape (e.g., circle)
4. Release mouse button
5. Draw 2-3 more strokes
6. Refresh the browser page (F5)

**Expected Results**:
- ✅ Lines appear smoothly as you drag (no lag)
- ✅ Strokes remain visible after drawing
- ✅ All strokes reappear after page refresh
- ✅ Stroke widths match selected brush size

**Pass Criteria**: All 4 results met

---

### Scenario 2: Brush Sizes (P1)

**Goal**: Verify three brush sizes are visually distinct

**Steps**:
1. Select "Thin" brush
2. Draw a horizontal line
3. Select "Medium" brush
4. Draw a parallel line below
5. Select "Thick" brush
6. Draw a parallel line below

**Expected Results**:
- ✅ Three lines with visually distinct widths
- ✅ Approximate widths: 2px (thin), 5px (medium), 10px (thick)

**Pass Criteria**: Brush sizes clearly distinguishable

---

### Scenario 3: Undo/Redo (P1)

**Goal**: Verify undo mechanism works correctly

**Steps**:
1. Draw 3 strokes on canvas
2. Click "Undo" button
3. Click "Undo" button again
4. Click "Redo" button
5. Click "Undo" button three times

**Expected Results**:
- ✅ First undo removes most recent stroke (canvas shows 2 strokes)
- ✅ Second undo removes previous stroke (canvas shows 1 stroke)
- ✅ Redo restores last undone stroke (canvas shows 2 strokes)
- ✅ Three undos leave canvas empty
- ✅ Undo button disabled when nothing to undo

**Pass Criteria**: All 5 results met

---

### Scenario 4: Stroke Deletion (P1)

**Goal**: Verify individual stroke deletion

**Steps**:
1. Draw 5 distinct strokes on canvas
2. Click on the 3rd stroke to select it (should highlight)
3. Press Delete key or click Delete button
4. Refresh page

**Expected Results**:
- ✅ Clicked stroke is visually highlighted/selected
- ✅ After delete, canvas shows 4 strokes (selected stroke removed)
- ✅ After refresh, 4 strokes persist (deleted stroke stays gone)

**Pass Criteria**: All 3 results met

---

### Scenario 5: Touch Drawing (P1 - Tablet Required)

**Goal**: Verify touch input works without scroll conflicts

**Steps**:
1. Open whiteboard on tablet device
2. Touch and drag finger on canvas to draw
3. Attempt to scroll page by touching canvas
4. Draw figure-8 shape with continuous touch gesture

**Expected Results**:
- ✅ Line follows finger smoothly
- ✅ Drawing does not trigger page scroll
- ✅ Figure-8 renders as continuous line (no breaks)
- ✅ No double-tap zoom occurs during drawing

**Pass Criteria**: All 4 results met

---

### Scenario 6: Create Sticky Note (P2)

**Goal**: Verify sticky note creation and editing

**Steps**:
1. Click "Add Note" button in toolbar
2. Observe new note appear on canvas
3. Type "Meeting notes: MVP scope"
4. Click outside the note
5. Click on the note again
6. Change text to "Sprint planning"

**Expected Results**:
- ✅ Note appears with text cursor focused
- ✅ Text appears in real-time as you type
- ✅ Clicking outside saves text and defocuses note
- ✅ Clicking note again refocuses for editing
- ✅ Text updates persist after blur

**Pass Criteria**: All 5 results met

---

### Scenario 7: Move Sticky Note (P2)

**Goal**: Verify sticky note repositioning

**Steps**:
1. Create a sticky note with some text
2. Click and hold on note's drag handle (title bar)
3. Drag note to new position (e.g., bottom-right corner)
4. Release mouse
5. Refresh page

**Expected Results**:
- ✅ Note moves smoothly following cursor
- ✅ Note position updates on release
- ✅ After refresh, note appears at new position

**Pass Criteria**: All 3 results met

---

### Scenario 8: Sticky Note Persistence (P2)

**Goal**: Verify sticky notes persist across sessions

**Steps**:
1. Create 3 sticky notes with different content
2. Position them at different canvas locations
3. Close browser completely
4. Reopen browser to same URL

**Expected Results**:
- ✅ All 3 notes reappear with correct content
- ✅ Notes appear at saved positions
- ✅ Notes are editable immediately

**Pass Criteria**: All 3 results met

---

### Scenario 9: Delete Sticky Note (P2)

**Goal**: Verify sticky note deletion

**Steps**:
1. Create 3 sticky notes
2. Click on 2nd note to select
3. Press Delete key
4. Click "Undo" button

**Expected Results**:
- ✅ Selected note is visually highlighted
- ✅ After delete, only 2 notes remain
- ✅ Undo restores deleted note at original position

**Pass Criteria**: All 3 results met

---

### Scenario 10: Clear All (P2)

**Goal**: Verify clear all functionality

**Steps**:
1. Draw 5 strokes on canvas
2. Create 3 sticky notes
3. Click "Clear All" button
4. Confirm action in dialog
5. Click "Undo"

**Expected Results**:
- ✅ Confirmation dialog appears before clearing
- ✅ After confirm, canvas is completely empty (no strokes or notes)
- ✅ Undo button disabled (clear all is not undoable per spec)
- ✅ Refresh shows empty canvas (cleared state persists)

**Pass Criteria**: All 4 results met

---

### Scenario 11: Real-time Collaboration (P3)

**Goal**: Verify two users can collaborate in real-time

**Prerequisites**: WebSocket server running on localhost:3000

**Steps**:
1. Open browser window A to `http://localhost:8080?session=collab-test`
2. Open browser window B (different window, not tab) to same URL
3. In window A, draw a stroke
4. In window B, draw a stroke
5. In window A, create a sticky note with text "Hello from A"
6. In window B, create a sticky note with text "Hello from B"

**Expected Results**:
- ✅ Both windows show initial session state (empty canvas)
- ✅ Stroke from A appears in B within 2 seconds
- ✅ Stroke from B appears in A within 2 seconds
- ✅ Both strokes visible in both windows
- ✅ Sticky note from A appears in B within 2 seconds
- ✅ Sticky note from B appears in A within 2 seconds
- ✅ Both notes visible in both windows

**Pass Criteria**: All 7 results met

---

### Scenario 12: Collaboration Sync (P3)

**Goal**: Verify late joiner receives full session state

**Prerequisites**: WebSocket server running

**Steps**:
1. Window A joins session `collab-sync-test`
2. Window A draws 3 strokes
3. Window A creates 2 sticky notes
4. Wait 2 seconds
5. Window B joins same session `collab-sync-test`

**Expected Results**:
- ✅ Window B immediately displays all 3 strokes
- ✅ Window B immediately displays both sticky notes
- ✅ Content matches exactly between windows

**Pass Criteria**: All 3 results met

---

### Scenario 13: Collaboration Deletion (P3)

**Goal**: Verify deletions propagate to other users

**Steps**:
1. Two windows join same session
2. Window A draws a stroke
3. Wait for stroke to appear in B
4. Window B deletes the stroke
5. Window A creates a note
6. Window B deletes the note

**Expected Results**:
- ✅ Stroke deletion in B removes stroke from A's canvas
- ✅ Note deletion in B removes note from A's canvas
- ✅ Deletions occur within 2 seconds

**Pass Criteria**: All 3 results met

---

### Scenario 14: Reconnection (P3)

**Goal**: Verify client reconnects after network interruption

**Steps**:
1. Open whiteboard with server connected
2. Draw 2 strokes
3. Stop server (`Ctrl+C` in server terminal)
4. Attempt to draw another stroke
5. Restart server (`npm start`)
6. Wait 10 seconds

**Expected Results**:
- ✅ UI shows "Disconnected" indicator when server stops
- ✅ Stroke drawn during disconnect saved locally
- ✅ After server restart, client auto-reconnects
- ✅ UI shows "Connected" indicator
- ✅ Locally saved stroke syncs to server

**Pass Criteria**: All 5 results met

---

### Scenario 15: Concurrent Editing (P3)

**Goal**: Verify simultaneous edits don't conflict

**Steps**:
1. Two windows join same session
2. Simultaneously (within 1 second):
   - Window A draws a vertical stroke on left side
   - Window B draws a horizontal stroke on right side
3. Observe both windows after 2 seconds

**Expected Results**:
- ✅ Both strokes appear in window A
- ✅ Both strokes appear in window B
- ✅ No strokes are lost or corrupted
- ✅ Stroke data matches in both windows

**Pass Criteria**: All 4 results met

---

## Performance Testing

### Test 1: High Stroke Count

**Goal**: Verify performance with 500 strokes

**Steps**:
1. Use script to generate 500 random strokes
```javascript
for (let i = 0; i < 500; i++) {
  const stroke = generateRandomStroke();
  strokes.push(stroke);
}
renderAll(ctx, strokes, canvas.width, canvas.height);
```
2. Measure render time in DevTools Performance tab
3. Attempt to draw new stroke
4. Refresh page and measure load time

**Expected Results**:
- ✅ Render time <16ms (60fps)
- ✅ Drawing new stroke feels responsive (<50ms latency)
- ✅ Page load time <2s

**Pass Criteria**: All 3 results met

---

### Test 2: localStorage Quota

**Goal**: Verify behavior approaching storage limit

**Steps**:
1. Check current storage usage:
```javascript
navigator.storage.estimate().then(est => {
  console.log('Used:', est.usage, 'Quota:', est.quota);
});
```
2. Generate strokes until approaching 5MB
3. Attempt to add more content

**Expected Results**:
- ✅ Warning shown at 80% quota (4MB)
- ✅ Error shown at 95% quota (4.75MB)
- ✅ QuotaExceededError caught gracefully

**Pass Criteria**: All 3 results met

---

### Test 3: Touch Performance (Tablet)

**Goal**: Verify 60fps touch drawing

**Steps**:
1. Open whiteboard on tablet
2. Enable "Show FPS" in browser DevTools
3. Draw continuous spiral gesture for 10 seconds
4. Observe FPS counter

**Expected Results**:
- ✅ FPS remains above 55 during drawing
- ✅ No visible lag or jittery lines

**Pass Criteria**: Both results met

---

## Troubleshooting

### Issue: Strokes don't persist after refresh

**Diagnosis**:
- Check browser console for localStorage errors
- Verify `localStorage.getItem('whiteboard-local')` returns data
- Check if private/incognito mode (blocks localStorage)

**Fix**: Disable private browsing or use regular window

---

### Issue: Touch drawing scrolls page

**Diagnosis**:
- Check if `touch-action: none` CSS applied to canvas
- Verify `e.preventDefault()` called in touchstart handler

**Fix**: Update CSS and event handlers per [client-api.md](./contracts/client-api.md)

---

### Issue: Collaboration not syncing

**Diagnosis**:
- Check server logs for WebSocket connections
- Verify client shows "Connected" indicator
- Check browser console for Socket.io errors
- Confirm both clients use same session ID

**Fix**:
1. Restart server
2. Hard refresh both clients (Ctrl+Shift+R)
3. Check firewall isn't blocking port 3000

---

### Issue: Performance degradation with many strokes

**Diagnosis**:
- Check stroke count > 500?
- Verify stroke simplification running (RDP algorithm)
- Measure render time in DevTools Performance

**Fix**: Implement stroke culling (only render visible strokes)

---

## Success Criteria Summary

| Phase | Scenarios | Pass Rate | Status |
|-------|-----------|-----------|--------|
| P1 (Drawing) | 1-5 | 5/5 | ✅ |
| P2 (Sticky Notes) | 6-10 | 5/5 | ✅ |
| P3 (Collaboration) | 11-15 | 5/5 | ✅ |
| **Total** | **15** | **15/15** | **✅ PASS** |

**Performance Tests**: 3/3 pass required

**Overall**: 18/18 scenarios must pass for production release

---

## Next Steps

After validation:

1. **Manual Testing**: Run all scenarios on target devices
2. **Browser Matrix**: Test on Chrome, Firefox, Safari, Edge
3. **Load Testing** (P3): Simulate 5 concurrent users per session
4. **Security Testing**: Verify XSS sanitization, rate limiting
5. **Accessibility**: Run Lighthouse audit, test keyboard navigation
6. **Deployment**: Deploy server to cloud (Heroku, AWS, DigitalOcean)

---

## Automated Testing (Optional)

### Unit Tests (Jest)

```bash
cd whiteboard/
npm test
```

**Expected coverage**: >80% for modules (strokes.js, storage.js, undo.js)

### Integration Tests (P3 Server)

```bash
cd server/
npm test
```

**Expected**: All WebSocket event handlers tested

---

## Support

- **Spec**: [spec.md](./spec.md)
- **Data Model**: [data-model.md](./data-model.md)
- **Client API**: [contracts/client-api.md](./contracts/client-api.md)
- **WebSocket API**: [contracts/websocket-api.md](./contracts/websocket-api.md)
- **Research**: [research.md](./research.md)
