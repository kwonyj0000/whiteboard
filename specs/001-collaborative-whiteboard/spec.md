# Feature Specification: Collaborative Whiteboard

**Feature Branch**: `001-collaborative-whiteboard`

**Created**: 2026-06-19

**Status**: Draft

**Input**: User description: "공유협업 화이트보드를 구축하려고합니다. 사용자가 마우스나 터치로 화면에 자유롭게 선을 그릴수 있는 로컬 화이트보드 캔버스 기능을 넣어주고, 스티커 메모와 같이 메모를 작성할수 있는기능을 넣어줘."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Freehand Drawing on Canvas (Priority: P1)

Users need to sketch ideas, diagrams, and visual concepts directly on a digital whiteboard using natural drawing gestures with mouse or touch input.

**Why this priority**: Core whiteboard functionality - without drawing, it's not a whiteboard. This is the foundation that all other features build upon.

**Independent Test**: Can be fully tested by opening the whiteboard, drawing lines/shapes with mouse or touch, and verifying the strokes appear and persist during the session. Delivers immediate value as a local drawing tool.

**Acceptance Scenarios**:

1. **Given** the whiteboard canvas is displayed, **When** the user clicks/touches and drags on the canvas, **Then** a continuous line appears following the pointer/finger movement in real-time
2. **Given** the user is drawing, **When** the user releases the mouse button or lifts their finger, **Then** the completed stroke remains on the canvas
3. **Given** multiple strokes have been drawn, **When** the user draws a new stroke, **Then** all previous strokes remain visible and the new stroke appears without erasing existing content
4. **Given** the user is using a touch device, **When** the user draws with their finger, **Then** the drawing responds smoothly with minimal latency (perceived as instantaneous)
5. **Given** the canvas contains drawings, **When** the user refreshes the browser or returns to the page, **Then** all drawings are restored from localStorage
6. **Given** the user selects a brush size (thin/medium/thick), **When** the user draws, **Then** the stroke appears with the selected width
7. **Given** the user has drawn a stroke, **When** the user clicks the undo button, **Then** the most recent stroke is removed from the canvas
8. **Given** the user clicks on a stroke to select it, **When** the user presses delete, **Then** that specific stroke is removed from the canvas

---

### User Story 2 - Create and Edit Sticky Notes (Priority: P2)

Users need to add text-based notes and annotations to complement their visual drawings, similar to physical sticky notes on a whiteboard.

**Why this priority**: Text notes are essential for collaborative brainstorming, but can be added after basic drawing works. Users can still get value from drawing alone.

**Independent Test**: Can be tested independently by creating sticky notes, editing text, positioning them on the canvas, and verifying they persist. Delivers value even without drawing features.

**Acceptance Scenarios**:

1. **Given** the whiteboard is open, **When** the user triggers the "add sticky note" action, **Then** a new empty sticky note appears on the canvas with a text input field focused
2. **Given** a sticky note is created, **When** the user types text into the note, **Then** the text appears in the note in real-time
3. **Given** a sticky note contains text, **When** the user clicks outside the note, **Then** the note saves the text and displays it in a readable format
4. **Given** a sticky note exists on the canvas, **When** the user clicks on the note, **Then** the text becomes editable again
5. **Given** a sticky note exists, **When** the user drags the note to a new position, **Then** the note moves smoothly and stays at the new position
6. **Given** sticky notes have been created, **When** the user refreshes the browser, **Then** all sticky notes and their content are restored from localStorage
7. **Given** the user clicks on a sticky note to select it, **When** the user presses delete, **Then** that sticky note is removed from the canvas
8. **Given** the user performs an action (create, move, or delete note), **When** the user clicks undo, **Then** the action is reversed

---

### User Story 3 - Multi-User Collaboration (Priority: P3)

Multiple users need to work on the same whiteboard simultaneously, seeing each other's changes in real-time for effective remote collaboration.

**Why this priority**: Collaboration is valuable but requires more complex infrastructure. Local drawing and notes deliver immediate value while this is being built.

**Independent Test**: Can be tested by opening the same whiteboard in two browser windows/devices, making changes in one, and verifying they appear in the other within 2 seconds. Delivers team collaboration value.

**Backend Architecture Decision (Updated 2026-06-19)**: System uses **Supabase** as backend instead of custom WebSocket server.
- **Rationale**: Supabase provides managed PostgreSQL with real-time subscriptions, eliminating need for custom backend server
- **Benefits**: Built-in RLS security, automatic persistence, real-time via PostgreSQL Change Data Capture
- **Trade-offs**: Dependency on external service vs self-hosted WebSocket server

**Acceptance Scenarios**:

1. **Given** two users have the same whiteboard open, **When** User A draws a stroke, **Then** User B sees the stroke appear on their canvas within 2 seconds
2. **Given** two users are collaborating, **When** User A creates a sticky note, **Then** User B sees the new sticky note with its content within 2 seconds
3. **Given** multiple users are editing, **When** User A moves a sticky note, **Then** User B sees the note move to its new position
4. **Given** users are collaborating, **When** User A draws and User B draws simultaneously, **Then** both strokes appear correctly on both canvases without conflicts
5. **Given** a user joins an existing whiteboard session, **When** the whiteboard loads, **Then** all existing drawings and sticky notes are displayed from Supabase
6. **Given** Supabase connection fails, **When** the user continues working, **Then** the system falls back to localStorage and displays disconnected status

---

### Edge Cases

- What happens when the user draws outside the canvas boundaries? (Should clip to canvas or extend canvas?)
- How does the system handle very long continuous strokes (performance consideration)?
- What happens when multiple users try to edit the same sticky note simultaneously?
- How does touch drawing distinguish between drawing gestures and scrolling on mobile devices?
- What happens when the network connection is lost during collaboration? (Does drawing continue locally?)
- How does the system handle canvas resize or zoom? (Do drawings scale appropriately?)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST render a canvas element that accepts mouse pointer and touch input for drawing
- **FR-002**: System MUST capture continuous pointer/touch movement and render strokes in real-time with less than 50ms perceived latency
- **FR-003**: System MUST persist all drawn strokes locally during the browser session
- **FR-004**: Users MUST be able to create new sticky notes on the canvas
- **FR-005**: Users MUST be able to enter and edit text content within sticky notes
- **FR-006**: Users MUST be able to reposition sticky notes by dragging them to new coordinates
- **FR-007**: System MUST persist sticky note content and positions locally during the browser session
- **FR-008**: System MUST support multiple users viewing and editing the same whiteboard simultaneously via Supabase real-time subscriptions
- **FR-009**: System MUST synchronize changes between users within 2 seconds using PostgreSQL Change Data Capture
- **FR-010**: System MUST distinguish between touch drawing gestures and other touch interactions (e.g., scrolling)
- **FR-011**: System MUST display all existing whiteboard content when a user joins a collaboration session (loaded from Supabase PostgreSQL)
- **FR-017**: System MUST persist all whiteboard data (strokes, sticky notes, sessions) to Supabase PostgreSQL database
- **FR-018**: System MUST implement Row Level Security (RLS) policies for public whiteboard access
- **FR-019**: System MUST fall back to localStorage when Supabase connection is unavailable or fails

- **FR-012**: System MUST support multiple brush sizes (thin, medium, thick) for drawing strokes
- **FR-013**: System MUST persist whiteboard content to browser localStorage so content survives page refresh and browser restart on the same device
- **FR-014**: Users MUST be able to delete individual strokes and sticky notes by selecting them
- **FR-015**: System MUST provide an undo mechanism to reverse the last action (draw, create note, delete, move)
- **FR-016**: System MUST provide a "clear all" function to remove all content from the whiteboard

### Key Entities *(include if feature involves data)*

- **Stroke**: Represents a single drawn line consisting of a series of coordinate points, timestamp, and user identifier
- **Sticky Note**: Text-based annotation with content, position (x, y coordinates), dimensions (width, height), timestamp, and user identifier
- **Whiteboard Session**: Container for all strokes and sticky notes, with a unique identifier for sharing between users
- **User**: Participant in a whiteboard session (for collaboration features)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can draw a simple diagram (3-5 strokes) with perceived real-time responsiveness (no visible lag)
- **SC-002**: Users can create and position 10 sticky notes on the canvas within 2 minutes
- **SC-003**: System supports at least 5 concurrent users editing the same whiteboard without performance degradation
- **SC-004**: Changes made by one user appear on other users' screens within 2 seconds (95th percentile)
- **SC-005**: Drawing strokes contain smooth curves without visible jagged segments at normal zoom levels
- **SC-006**: Touch drawing works correctly on tablets and phones with appropriate gesture recognition (95% accuracy distinguishing draw vs scroll)
- **SC-007**: Whiteboard remains usable with up to 500 strokes and 50 sticky notes without noticeable performance impact
- **SC-008**: Users can switch between 3 brush sizes and see immediate visual difference in stroke width
- **SC-009**: All whiteboard content (drawings and notes) persists to Supabase and survives browser close/reopen across any device
- **SC-010**: Users can undo their last action within 1 second of triggering undo
- **SC-011**: Users can select and delete individual items with 2 clicks/taps maximum
- **SC-012**: System displays connection status (connected/disconnected) to Supabase in the UI
- **SC-013**: When Supabase is unavailable, system continues to function using localStorage fallback

## Assumptions

- Users have modern web browsers supporting HTML5 Canvas API, touch events, and localStorage
- Users have stable internet connectivity for real-time collaboration features (100ms latency or better)
- Mobile support is in-scope for drawing and sticky notes, but optimized for tablets rather than small phones
- Users require basic whiteboard functionality only - advanced features like shapes, templates, or image uploads are out of scope for v1
- **Real-time collaboration uses Supabase PostgreSQL with real-time subscriptions (PostgreSQL Change Data Capture)**
- **Backend infrastructure managed by Supabase (no custom WebSocket server required)**
- Whiteboard sessions are created on-demand and do not require user authentication for v1 (public RLS policies)
- Each whiteboard session has a unique identifier stored in Supabase sessions table
- **Whiteboard content persists to Supabase PostgreSQL and syncs across all devices (not limited to single device)**
- **localStorage serves as fallback when Supabase is unavailable**
- Drawing supports three brush sizes but single color (black) for initial version
- Sticky notes have fixed size and single color scheme for visual consistency
- Undo stack tracks last 20 actions per session for memory efficiency
- Selection mechanism uses click/tap to select individual items for deletion
