/**
 * Main Application Entry Point
 * Orchestrates canvas drawing, sticky notes, Supabase backend, and undo/redo
 */

import { config, isSupabaseConfigured } from './config.js';
import {
    initSupabase,
    getOrCreateSession,
    loadStrokes,
    saveStroke,
    deleteStroke as deleteStrokeDB,
    loadStickyNotes,
    saveStickyNote as saveStickyNoteDB,
    updateStickyNote as updateStickyNoteDB,
    deleteStickyNote as deleteStickyNoteDB,
    clearSession,
    subscribeToSession,
    unsubscribeFromSession
} from './supabase-client.js';
import { saveWhiteboard, loadWhiteboard, clearWhiteboard as clearStorage, monitorStorageQuota } from './storage.js';
import { UndoStack, applyUndo, applyRedo } from './undo.js';
import { createStroke, addPoint, simplifyStroke, deleteStroke, getStrokeById } from './strokes.js';
import { initCanvas, renderAll, getCanvasPoint, isPointNearStroke } from './canvas.js';
import { createStickyNote, renderStickyNote, updateStickyNote, deleteStickyNote, getStickyNoteById } from './stickyNotes.js';

// Application State
const state = {
    sessionId: null, // Will be set after Supabase initialization
    strokes: [],
    stickyNotes: [],
    currentStroke: null,
    isDrawing: false,
    brushSize: 'medium',
    selectedStrokeId: null,
    selectedNoteId: null,
    undoStack: new UndoStack(20),
    canvas: null,
    ctx: null,
    useSupabase: false,
    isRemoteUpdate: false // Flag to prevent echo in real-time sync
};

// Throttle helper
let lastSaveTime = 0;
const SAVE_DEBOUNCE = 500; // ms

/**
 * Initialize application
 */
async function init() {
    console.log('Whiteboard initializing...');

    // Get canvas
    state.canvas = document.getElementById('whiteboard-canvas');
    state.ctx = initCanvas(state.canvas);

    // Check if Supabase is configured
    state.useSupabase = isSupabaseConfigured();

    if (state.useSupabase) {
        try {
            console.log('Initializing Supabase backend...');
            initSupabase(config.supabase.url, config.supabase.anonKey);

            // Get or create session
            state.sessionId = await getOrCreateSession(config.defaultSessionName);
            console.log('Session ID:', state.sessionId);

            // Load data from Supabase
            const [strokes, notes] = await Promise.all([
                loadStrokes(state.sessionId),
                loadStickyNotes(state.sessionId)
            ]);

            state.strokes = strokes;
            state.stickyNotes = notes;
            console.log(`Loaded ${state.strokes.length} strokes, ${state.stickyNotes.length} notes from Supabase`);

            // Subscribe to real-time updates
            subscribeToSession(state.sessionId, {
                onStroke: handleRemoteStroke,
                onDeleteStroke: handleRemoteDeleteStroke,
                onNote: handleRemoteNote,
                onUpdateNote: handleRemoteUpdateNote,
                onDeleteNote: handleRemoteDeleteNote
            });

            // Update connection status
            updateConnectionStatus(true);
        } catch (error) {
            console.error('Supabase initialization failed, falling back to localStorage:', error);
            state.useSupabase = false;
            updateConnectionStatus(false);
        }
    }

    // Fallback to localStorage
    if (!state.useSupabase) {
        console.log('Using localStorage backend');
        state.sessionId = 'local';
        const saved = loadWhiteboard(state.sessionId);
        if (saved) {
            state.strokes = saved.strokes || [];
            state.stickyNotes = saved.stickyNotes || [];
            console.log(`Loaded ${state.strokes.length} strokes, ${state.stickyNotes.length} notes from localStorage`);
        }
        await monitorStorageQuota();
    }

    // Setup event listeners
    setupCanvasEvents();
    setupToolbarEvents();
    setupKeyboardShortcuts();

    // Initial render
    renderAll(state.ctx, state.strokes, state.canvas.width, state.canvas.height, state.selectedStrokeId);

    // Render saved sticky notes
    const notesContainer = document.getElementById('notes-container');
    state.stickyNotes.forEach(note => {
        renderStickyNote(note, notesContainer, {
            onUpdate: handleNoteUpdate,
            onDragEnd: handleNoteDragEnd
        });
    });

    console.log('Whiteboard initialized');
}

/**
 * Setup canvas drawing events
 */
function setupCanvasEvents() {
    const canvas = state.canvas;

    // Mouse events
    canvas.addEventListener('mousedown', handleDrawStart);
    canvas.addEventListener('mousemove', handleDrawMove);
    canvas.addEventListener('mouseup', handleDrawEnd);

    // Touch events
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchmove', handleTouchMove);
    canvas.addEventListener('touchend', handleTouchEnd);

    // Window resize
    window.addEventListener('resize', handleResize);
}

/**
 * Setup toolbar button events
 */
function setupToolbarEvents() {
    // Brush size buttons
    document.querySelectorAll('[data-size]').forEach(btn => {
        btn.addEventListener('click', () => {
            state.brushSize = btn.dataset.size;
            // Update active state
            document.querySelectorAll('[data-size]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // Undo/Redo
    document.getElementById('undo-btn').addEventListener('click', handleUndo);
    document.getElementById('redo-btn').addEventListener('click', handleRedo);

    // Delete button
    document.getElementById('delete-btn').addEventListener('click', handleDelete);

    // Add Note button (P2)
    document.getElementById('add-note-btn').addEventListener('click', handleAddNote);

    // Clear All
    document.getElementById('clear-all-btn').addEventListener('click', showClearModal);
    document.getElementById('clear-cancel-btn').addEventListener('click', hideClearModal);
    document.getElementById('clear-confirm-btn').addEventListener('click', handleClearAll);
}

/**
 * Setup keyboard shortcuts
 */
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl+Z / Cmd+Z - Undo
        if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            handleUndo();
        }

        // Ctrl+Y / Cmd+Y or Ctrl+Shift+Z - Redo
        if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
            e.preventDefault();
            handleRedo();
        }

        // Delete key
        if (e.key === 'Delete' || e.key === 'Backspace') {
            if (state.selectedStrokeId || state.selectedNoteId) {
                e.preventDefault();
                handleDelete();
            }
        }
    });
}

/**
 * Handle mouse/touch draw start
 */
function handleDrawStart(e) {
    state.isDrawing = true;
    const point = getCanvasPoint(state.canvas, e);
    state.currentStroke = createStroke([point], state.brushSize);

    // Clear selection
    state.selectedStrokeId = null;
    state.selectedNoteId = null;
    updateUI();
}

function handleTouchStart(e) {
    e.preventDefault(); // Prevent scroll
    if (e.touches.length !== 1) return;
    state.isDrawing = true;
    const point = getCanvasPoint(state.canvas, e.touches[0]);
    state.currentStroke = createStroke([point], state.brushSize);

    state.selectedStrokeId = null;
    state.selectedNoteId = null;
    updateUI();
}

/**
 * Handle mouse/touch draw move
 */
function handleDrawMove(e) {
    if (!state.isDrawing) return;
    const point = getCanvasPoint(state.canvas, e);
    state.currentStroke = addPoint(state.currentStroke, point);

    // Redraw with current stroke preview
    renderAll(state.ctx, [...state.strokes, state.currentStroke], state.canvas.width, state.canvas.height);
}

function handleTouchMove(e) {
    if (!state.isDrawing || e.touches.length !== 1) return;
    e.preventDefault();
    const point = getCanvasPoint(state.canvas, e.touches[0]);
    state.currentStroke = addPoint(state.currentStroke, point);

    renderAll(state.ctx, [...state.strokes, state.currentStroke], state.canvas.width, state.canvas.height);
}

/**
 * Handle mouse/touch draw end
 */
async function handleDrawEnd(e) {
    if (!state.isDrawing) return;
    state.isDrawing = false;

    // Simplify if too many points
    if (state.currentStroke.points.length > 100) {
        state.currentStroke = simplifyStroke(state.currentStroke, 2);
    }

    // Add to strokes array
    state.strokes.push(state.currentStroke);

    // Push to undo stack
    state.undoStack.push({
        type: 'drawStroke',
        data: {
            strokeId: state.currentStroke.id,
            stroke: state.currentStroke
        }
    });

    const strokeToSave = state.currentStroke;
    state.currentStroke = null;

    // Save to backend
    if (state.useSupabase) {
        try {
            await saveStroke(state.sessionId, strokeToSave);
        } catch (error) {
            console.error('Failed to save stroke to Supabase:', error);
        }
    } else {
        saveState();
    }

    renderAll(state.ctx, state.strokes, state.canvas.width, state.canvas.height, state.selectedStrokeId);
    updateUI();
}

function handleTouchEnd(e) {
    handleDrawEnd(e);
}

/**
 * Handle undo
 */
function handleUndo() {
    const action = state.undoStack.undo();
    if (!action) return;

    const currentState = {
        strokes: state.strokes,
        stickyNotes: state.stickyNotes
    };

    const newState = applyUndo(action, currentState);
    state.strokes = newState.strokes;
    state.stickyNotes = newState.stickyNotes;

    // Re-render notes if changed
    if (action.type.includes('Note')) {
        rerenderNotes();
    }

    saveState();
    renderAll(state.ctx, state.strokes, state.canvas.width, state.canvas.height);
    updateUI();
}

/**
 * Handle redo
 */
function handleRedo() {
    const action = state.undoStack.redo();
    if (!action) return;

    const currentState = {
        strokes: state.strokes,
        stickyNotes: state.stickyNotes
    };

    const newState = applyRedo(action, currentState);
    state.strokes = newState.strokes;
    state.stickyNotes = newState.stickyNotes;

    // Re-render notes if changed
    if (action.type.includes('Note')) {
        rerenderNotes();
    }

    saveState();
    renderAll(state.ctx, state.strokes, state.canvas.width, state.canvas.height);
    updateUI();
}

/**
 * Handle delete (stroke or note)
 */
async function handleDelete() {
    if (state.selectedStrokeId) {
        const stroke = getStrokeById(state.strokes, state.selectedStrokeId);
        if (!stroke) return;

        const strokeId = state.selectedStrokeId;
        state.strokes = deleteStroke(state.strokes, strokeId);

        state.undoStack.push({
            type: 'deleteStroke',
            data: {
                strokeId,
                stroke
            }
        });

        state.selectedStrokeId = null;

        // Delete from backend
        if (state.useSupabase) {
            try {
                await deleteStrokeDB(strokeId);
            } catch (error) {
                console.error('Failed to delete stroke from Supabase:', error);
            }
        } else {
            saveState();
        }

        renderAll(state.ctx, state.strokes, state.canvas.width, state.canvas.height);
        updateUI();
    } else if (state.selectedNoteId) {
        const note = getStickyNoteById(state.stickyNotes, state.selectedNoteId);
        if (!note) return;

        const noteId = state.selectedNoteId;
        const container = document.getElementById('notes-container');
        state.stickyNotes = deleteStickyNote(state.stickyNotes, noteId, container);

        state.undoStack.push({
            type: 'deleteNote',
            data: {
                noteId,
                note
            }
        });

        state.selectedNoteId = null;

        // Delete from backend
        if (state.useSupabase) {
            try {
                await deleteStickyNoteDB(noteId);
            } catch (error) {
                console.error('Failed to delete note from Supabase:', error);
            }
        } else {
            saveState();
        }

        updateUI();
    }
}

/**
 * Handle add sticky note (P2)
 */
async function handleAddNote() {
    const note = createStickyNote('', {x: 100 + state.stickyNotes.length * 20, y: 100 + state.stickyNotes.length * 20});
    state.stickyNotes.push(note);

    const container = document.getElementById('notes-container');
    const noteEl = renderStickyNote(note, container, {
        onUpdate: handleNoteUpdate,
        onDragEnd: handleNoteDragEnd
    });

    // Focus textarea
    const textarea = noteEl.querySelector('textarea');
    textarea.focus();

    // Push to undo stack
    state.undoStack.push({
        type: 'createNote',
        data: {
            noteId: note.id,
            note
        }
    });

    // Save to backend
    if (state.useSupabase) {
        try {
            await saveStickyNoteDB(state.sessionId, note);
        } catch (error) {
            console.error('Failed to save note to Supabase:', error);
        }
    } else {
        saveState();
    }

    updateUI();
}

/**
 * Handle note content update
 */
async function handleNoteUpdate(noteId, updates) {
    if (state.isRemoteUpdate) return; // Ignore if this is from remote sync

    const note = getStickyNoteById(state.stickyNotes, noteId);
    if (!note) return;

    const index = state.stickyNotes.findIndex(n => n.id === noteId);
    state.stickyNotes[index] = updateStickyNote(note, updates);

    // Debounced save
    const now = Date.now();
    if (now - lastSaveTime > SAVE_DEBOUNCE) {
        lastSaveTime = now;

        if (state.useSupabase) {
            try {
                await updateStickyNoteDB(noteId, updates);
            } catch (error) {
                console.error('Failed to update note in Supabase:', error);
            }
        } else {
            saveState();
        }
    }
}

/**
 * Handle note drag end
 */
async function handleNoteDragEnd(noteId, newPosition) {
    if (state.isRemoteUpdate) return; // Ignore if this is from remote sync

    const note = getStickyNoteById(state.stickyNotes, noteId);
    if (!note) return;

    const oldPosition = note.position;
    const index = state.stickyNotes.findIndex(n => n.id === noteId);
    state.stickyNotes[index] = updateStickyNote(note, {position: newPosition});

    // Push to undo stack
    state.undoStack.push({
        type: 'moveNote',
        data: {
            noteId,
            from: oldPosition,
            to: newPosition
        }
    });

    if (state.useSupabase) {
        try {
            await updateStickyNoteDB(noteId, {position: newPosition});
        } catch (error) {
            console.error('Failed to update note position in Supabase:', error);
        }
    } else {
        saveState();
    }
}

/**
 * Show clear all modal
 */
function showClearModal() {
    document.getElementById('clear-modal').style.display = 'flex';
}

/**
 * Hide clear all modal
 */
function hideClearModal() {
    document.getElementById('clear-modal').style.display = 'none';
}

/**
 * Handle clear all
 */
async function handleClearAll() {
    state.strokes = [];
    state.stickyNotes = [];
    state.selectedStrokeId = null;
    state.selectedNoteId = null;
    state.undoStack.clear();

    // Clear DOM notes
    const container = document.getElementById('notes-container');
    container.innerHTML = '';

    // Clear backend
    if (state.useSupabase) {
        try {
            await clearSession(state.sessionId);
        } catch (error) {
            console.error('Failed to clear session in Supabase:', error);
        }
    } else {
        saveState();
    }

    renderAll(state.ctx, state.strokes, state.canvas.width, state.canvas.height);
    updateUI();
    hideClearModal();
}

/**
 * Handle window resize
 */
function handleResize() {
    state.ctx = initCanvas(state.canvas);
    renderAll(state.ctx, state.strokes, state.canvas.width, state.canvas.height, state.selectedStrokeId);
    // Note: sticky notes maintain position via CSS
}

/**
 * Re-render all sticky notes
 */
function rerenderNotes() {
    const container = document.getElementById('notes-container');
    container.innerHTML = '';

    state.stickyNotes.forEach(note => {
        renderStickyNote(note, container, {
            onUpdate: handleNoteUpdate,
            onDragEnd: handleNoteDragEnd
        });
    });
}

/**
 * Save current state to localStorage
 */
function saveState() {
    try {
        saveWhiteboard(state.sessionId, {
            strokes: state.strokes,
            stickyNotes: state.stickyNotes,
            updatedAt: Date.now()
        });
    } catch (error) {
        if (error.name === 'QuotaExceededError') {
            alert('Storage full! Please delete some content.');
        }
    }
}

/**
 * Update UI state (button enabled/disabled)
 */
function updateUI() {
    document.getElementById('undo-btn').disabled = !state.undoStack.canUndo();
    document.getElementById('redo-btn').disabled = !state.undoStack.canRedo();
    document.getElementById('delete-btn').disabled = !state.selectedStrokeId && !state.selectedNoteId;
}

/**
 * Update connection status badge
 * @param {boolean} connected
 */
function updateConnectionStatus(connected) {
    const statusEl = document.getElementById('connection-status');
    const statusDot = statusEl.querySelector('.status-dot');
    const statusText = statusEl.querySelector('.status-text');

    if (state.useSupabase) {
        statusEl.style.display = 'flex';
        if (connected) {
            statusDot.style.backgroundColor = 'var(--success-color, #4ade80)';
            statusText.textContent = 'Connected';
        } else {
            statusDot.style.backgroundColor = 'var(--error-color, #f87171)';
            statusText.textContent = 'Disconnected';
        }
    } else {
        statusEl.style.display = 'none';
    }
}

/**
 * Handle remote stroke (real-time)
 * @param {Object} stroke
 */
function handleRemoteStroke(stroke) {
    console.log('Remote stroke received:', stroke.id);

    // Check if stroke already exists (prevent duplicate)
    const exists = state.strokes.find(s => s.id === stroke.id);
    if (exists) return;

    state.isRemoteUpdate = true;
    state.strokes.push(stroke);
    renderAll(state.ctx, state.strokes, state.canvas.width, state.canvas.height, state.selectedStrokeId);
    state.isRemoteUpdate = false;
}

/**
 * Handle remote stroke deletion (real-time)
 * @param {string} strokeId
 */
function handleRemoteDeleteStroke(strokeId) {
    console.log('Remote stroke delete:', strokeId);

    state.isRemoteUpdate = true;
    state.strokes = deleteStroke(state.strokes, strokeId);
    renderAll(state.ctx, state.strokes, state.canvas.width, state.canvas.height, state.selectedStrokeId);
    state.isRemoteUpdate = false;
}

/**
 * Handle remote sticky note creation (real-time)
 * @param {Object} note
 */
function handleRemoteNote(note) {
    console.log('Remote note received:', note.id);

    // Check if note already exists (prevent duplicate)
    const exists = state.stickyNotes.find(n => n.id === note.id);
    if (exists) return;

    state.isRemoteUpdate = true;
    state.stickyNotes.push(note);

    const container = document.getElementById('notes-container');
    renderStickyNote(note, container, {
        onUpdate: handleNoteUpdate,
        onDragEnd: handleNoteDragEnd
    });
    state.isRemoteUpdate = false;
}

/**
 * Handle remote sticky note update (real-time)
 * @param {Object} note
 */
function handleRemoteUpdateNote(note) {
    console.log('Remote note update:', note.id);

    state.isRemoteUpdate = true;
    const index = state.stickyNotes.findIndex(n => n.id === note.id);
    if (index === -1) return;

    state.stickyNotes[index] = note;

    // Re-render this specific note
    const container = document.getElementById('notes-container');
    const noteEl = container.querySelector(`[data-note-id="${note.id}"]`);
    if (noteEl) {
        noteEl.remove();
    }
    renderStickyNote(note, container, {
        onUpdate: handleNoteUpdate,
        onDragEnd: handleNoteDragEnd
    });
    state.isRemoteUpdate = false;
}

/**
 * Handle remote sticky note deletion (real-time)
 * @param {string} noteId
 */
function handleRemoteDeleteNote(noteId) {
    console.log('Remote note delete:', noteId);

    state.isRemoteUpdate = true;
    const container = document.getElementById('notes-container');
    state.stickyNotes = deleteStickyNote(state.stickyNotes, noteId, container);
    state.isRemoteUpdate = false;
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
