---

description: "Task list for Collaborative Whiteboard implementation"
---

# Tasks: Collaborative Whiteboard

**Input**: Design documents from `specs/001-collaborative-whiteboard/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Manual browser testing per quickstart.md (tests not requested in spec)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Single-page web application structure at repository root:

```
whiteboard/
├── index.html
├── css/
│   ├── variables.css
│   ├── layout.css
│   └── components.css
└── js/
    ├── main.js
    ├── canvas.js
    ├── strokes.js
    ├── stickyNotes.js
    ├── storage.js
    ├── undo.js
    └── collaboration.js (P3)
```

---

## Phase 1: Setup

**Purpose**: Project initialization and basic structure

- [x] T001 Create project directory structure (whiteboard/, css/, js/)
- [x] T002 Create index.html with canvas element and toolbar skeleton
- [x] T003 [P] Create css/variables.css with design tokens (colors, spacing, brush sizes)
- [x] T004 [P] Create css/layout.css with canvas and toolbar layout
- [x] T005 [P] Create css/components.css with button and modal base styles

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T006 [P] Implement storage.js module with saveWhiteboard(), loadWhiteboard(), clearWhiteboard() functions
- [ ] T007 [P] Implement undo.js module with UndoStack class (20-action circular buffer)
- [ ] T008 Create js/main.js with application initialization and session management

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Freehand Drawing on Canvas (Priority: P1) 🎯 MVP

**Goal**: Users can draw on canvas with mouse/touch, select brush sizes, undo strokes, and persist drawings to localStorage

**Independent Test**: Open whiteboard, draw with mouse/touch, change brush sizes, undo actions, refresh page to verify persistence (see quickstart.md Scenario 1-5)

### Implementation for User Story 1

- [ ] T009 [P] [US1] Implement strokes.js with createStroke(), addPoint(), simplifyStroke(), getStrokeById(), deleteStroke() functions
- [ ] T010 [P] [US1] Implement canvas.js with initCanvas(), drawStroke(), clearCanvas(), renderAll() functions
- [ ] T011 [US1] Add brush size selector to toolbar in index.html (thin/medium/thick buttons)
- [ ] T012 [US1] Implement mouse drawing handlers in js/main.js (mousedown, mousemove, mouseup events)
- [ ] T013 [US1] Implement touch drawing handlers in js/main.js (touchstart, touchmove, touchend with preventDefault)
- [ ] T014 [US1] Integrate stroke creation with canvas rendering (real-time preview during draw)
- [ ] T015 [US1] Implement stroke simplification (RDP algorithm) for strokes >100 points in strokes.js
- [ ] T016 [US1] Add localStorage persistence on stroke completion in js/main.js (call saveWhiteboard after draw)
- [ ] T017 [US1] Implement stroke restoration on page load in js/main.js (loadWhiteboard → renderAll)
- [ ] T018 [US1] Add undo button to toolbar in index.html
- [ ] T019 [US1] Implement undo functionality in js/main.js (integrate undo.js with stroke removal)
- [ ] T020 [US1] Add redo functionality (update undo.js and main.js)
- [ ] T021 [US1] Implement stroke selection on click in js/main.js (highlight selected stroke)
- [ ] T022 [US1] Add delete button/keyboard handler for selected stroke in js/main.js
- [ ] T023 [US1] Add "Clear All" button to toolbar in index.html with confirmation modal
- [ ] T024 [US1] Style toolbar buttons and canvas container in css/components.css and css/layout.css
- [ ] T025 [US1] Add touch-action: none CSS to prevent scroll conflicts in css/layout.css

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. Run quickstart.md Scenarios 1-5.

---

## Phase 4: User Story 2 - Create and Edit Sticky Notes (Priority: P2)

**Goal**: Users can create text notes, edit content, drag to reposition, delete notes, and persist to localStorage

**Independent Test**: Create sticky notes, edit text, drag to move, delete notes, refresh to verify persistence (see quickstart.md Scenario 6-10)

### Implementation for User Story 2

- [x] T026 [P] [US2] Implement stickyNotes.js with createStickyNote(), renderStickyNote(), updateStickyNote(), deleteStickyNote() functions
- [ ] T027 [US2] Add "Add Note" button to toolbar in index.html
- [ ] T028 [US2] Design sticky note HTML structure and styles in css/components.css (yellow background, fixed 200x150px size)
- [ ] T029 [US2] Implement note creation on button click in js/main.js (create DOM element, focus textarea)
- [ ] T030 [US2] Add real-time text editing (contenteditable or textarea) with auto-save on blur in stickyNotes.js
- [ ] T031 [US2] Implement note dragging (mousedown on title bar → mousemove → mouseup) in stickyNotes.js
- [ ] T032 [US2] Add touch drag support for notes (touchstart → touchmove → touchend) in stickyNotes.js
- [ ] T033 [US2] Implement note boundary constraints (keep within canvas) in stickyNotes.js
- [ ] T034 [US2] Integrate sticky notes with localStorage (save on create/edit/move/delete) in js/main.js
- [ ] T035 [US2] Implement note restoration on page load in js/main.js (load from storage → renderStickyNote for each)
- [ ] T036 [US2] Add note selection on click in stickyNotes.js (visual highlight)
- [ ] T037 [US2] Implement note deletion (delete key or button) in js/main.js
- [ ] T038 [US2] Integrate sticky notes with undo/redo system in js/main.js (track create/move/delete actions)
- [ ] T039 [US2] Update "Clear All" to also remove sticky notes in js/main.js

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently. Run quickstart.md Scenarios 1-10.

---

## Phase 5: User Story 3 - Multi-User Collaboration (Priority: P3)

**Goal**: Multiple users see each other's changes in real-time via WebSocket synchronization

**Independent Test**: Open two browser windows with same session URL, draw/create notes in one, verify they appear in the other within 2s (see quickstart.md Scenario 11-15)

### Backend Setup (P3)

- [ ] T040 [P] [US3] Create server/ directory with package.json (express, socket.io dependencies)
- [ ] T041 [P] [US3] Create server/index.js with Express static file server and Socket.io initialization
- [ ] T042 [P] [US3] Implement server/session.js with WhiteboardState class (in-memory Map storage)
- [ ] T043 [US3] Implement Socket.io connection handler in server/index.js (join room on connect)
- [ ] T044 [US3] Implement session state broadcast (session:state event) in server/index.js
- [ ] T045 [US3] Implement stroke event handlers (stroke:add, stroke:delete) in server/index.js
- [ ] T046 [US3] Implement sticky note event handlers (note:create, note:update, note:delete) in server/index.js
- [ ] T047 [US3] Add rate limiting (10 events/sec per user) in server/index.js
- [ ] T048 [US3] Implement user join/leave notifications (user:joined, user:left) in server/index.js
- [ ] T049 [US3] Add error handling and capacity checks (1000 strokes, 100 notes max) in server/session.js

### Frontend Integration (P3)

- [ ] T050 [P] [US3] Implement js/collaboration.js with connectToSession(), emitStroke(), emitStickyNote(), disconnectFromSession()
- [ ] T051 [US3] Add Socket.io client library to index.html (CDN or local copy)
- [ ] T052 [US3] Add session ID generation/parsing from URL query params in js/main.js
- [ ] T053 [US3] Integrate WebSocket connection on app init in js/main.js (connect to server)
- [ ] T054 [US3] Implement session:state handler to initialize canvas with server data in js/collaboration.js
- [ ] T055 [US3] Emit stroke:add events after drawing in js/main.js
- [ ] T056 [US3] Handle incoming stroke:added events to render remote strokes in js/collaboration.js
- [ ] T057 [US3] Emit note:create/update events after note actions in js/main.js
- [ ] T058 [US3] Handle incoming note:created/updated events to render remote notes in js/collaboration.js
- [ ] T059 [US3] Emit delete events (stroke:delete, note:delete) in js/main.js
- [ ] T060 [US3] Handle incoming delete events to remove remote items in js/collaboration.js
- [ ] T061 [US3] Add connection status indicator to UI in index.html (Connected/Disconnected badge)
- [ ] T062 [US3] Implement auto-reconnection with exponential backoff in js/collaboration.js
- [ ] T063 [US3] Add optimistic UI updates (update local immediately, sync async) in js/main.js
- [ ] T064 [US3] Throttle stroke emission to 50ms intervals in js/main.js

**Checkpoint**: All user stories should now be independently functional. Run quickstart.md Scenarios 1-15.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T065 [P] Add responsive design media queries for tablet (768px) in css/layout.css
- [ ] T066 [P] Implement localStorage quota monitoring with warnings in js/storage.js
- [ ] T067 [P] Add keyboard shortcuts documentation (Ctrl+Z undo, Delete key, etc.) in index.html help modal
- [ ] T068 [P] Add loading indicator for page initialization in index.html
- [ ] T069 Optimize canvas rendering with requestAnimationFrame in js/canvas.js
- [ ] T070 Add accessibility improvements (ARIA labels, keyboard navigation) in index.html
- [ ] T071 Add user color assignment for multi-cursor visualization (P3 only) in js/collaboration.js
- [ ] T072 Implement session cleanup on server (5min timeout after last user disconnect) in server/session.js
- [ ] T073 Add performance monitoring (FPS counter, render time) to DevTools in js/main.js
- [ ] T074 Manual validation per quickstart.md (all 15 scenarios + 3 performance tests)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3, 4, 5)**: All depend on Foundational phase completion
  - User Story 1 (P1): Can start after Foundational - No dependencies on other stories
  - User Story 2 (P2): Can start after Foundational - Independent of US1 (but shares undo system)
  - User Story 3 (P3): Can start after Foundational - Extends US1 and US2 with networking
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Shares undo.js with US1 but independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Adds networking layer to US1/US2 features

### Within Each User Story

- **US1**: Stroke module → Canvas module → Drawing handlers → Persistence → Undo → Selection/Delete → UI polish
- **US2**: StickyNote module → Note creation → Text editing → Dragging → Persistence → Delete → Undo integration
- **US3**: Backend (can parallel) → Frontend WebSocket client → Event emission → Event handling → Reconnection

### Parallel Opportunities

- **Setup phase**: T003, T004, T005 (CSS files) can run in parallel
- **Foundational phase**: T006, T007 (storage.js, undo.js) can run in parallel
- **User Story 1**: T009, T010 (strokes.js, canvas.js) can run in parallel
- **User Story 2**: T026 (stickyNotes.js) independent, can start immediately after T008
- **User Story 3 Backend**: T040, T041, T042 (setup files) can run in parallel
- **User Story 3 Frontend**: T050 (collaboration.js) can start while backend tasks are in progress
- **Polish phase**: T065, T066, T067, T068, T070, T071 can all run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch foundational modules together:
Task: "Implement strokes.js module" (T009)
Task: "Implement canvas.js module" (T010)

# After both complete, proceed with sequential integration:
Task: "Implement mouse drawing handlers" (T012)
Task: "Implement touch drawing handlers" (T013)
# ... continue with integration tasks
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (T009-T025)
4. **STOP and VALIDATE**: Test User Story 1 independently per quickstart.md Scenarios 1-5
5. Deploy/demo if ready

**MVP Scope**: 16 core tasks (T001-T008 + T009-T025) = Fully functional local whiteboard

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 (T009-T025) → Test independently → Deploy/Demo (**MVP!**)
3. Add User Story 2 (T026-T039) → Test independently → Deploy/Demo (sticky notes added)
4. Add User Story 3 (T040-T064) → Test independently → Deploy/Demo (full collaboration)
5. Add Polish (T065-T074) → Final validation → Production release

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (T001-T008)
2. Once Foundational is done:
   - **Developer A**: User Story 1 (T009-T025) - Drawing features
   - **Developer B**: User Story 2 (T026-T039) - Sticky notes (can start immediately, shares undo system)
   - **Developer C**: User Story 3 Backend (T040-T049) - Server infrastructure
3. Developer C then handles US3 Frontend (T050-T064) after backend complete
4. All developers: Polish phase (T065-T074) in parallel

**Note**: US2 can start in parallel with US1 because stickyNotes.js is independent of strokes.js/canvas.js. They only share undo.js (from Foundational) and storage.js.

---

## Notes

- **[P] tasks** = different files, no dependencies, safe to parallel
- **[Story] label** maps task to specific user story for traceability
- Each user story is independently completable and testable
- Manual testing per quickstart.md (15 scenarios + 3 performance tests)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- **No automated tests** per research decision (manual browser testing for P1/P2, future Jest for P3 backend)
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence

---

## Task Count Summary

| Phase | Tasks | Parallelizable | Story |
|-------|-------|----------------|-------|
| Setup | 5 | 3 (T003-T005) | - |
| Foundational | 3 | 2 (T006-T007) | - |
| US1 (Drawing) | 17 | 2 (T009-T010) | P1 |
| US2 (Sticky Notes) | 14 | 1 (T026) | P2 |
| US3 (Collaboration) | 25 | 4 (T040-T042, T050) | P3 |
| Polish | 10 | 7 (T065-T068, T070-T071) | - |
| **Total** | **74** | **19** | **3 stories** |

**MVP (US1 only)**: 25 tasks (T001-T025)
**MVP + Notes (US1+US2)**: 39 tasks (T001-T039)
**Full Feature (All)**: 74 tasks (T001-T074)
