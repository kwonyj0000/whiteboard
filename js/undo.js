/**
 * Undo/Redo Stack Management
 * Implements command pattern with 20-action circular buffer
 */

export class UndoStack {
    constructor(maxSize = 20) {
        this.actions = [];
        this.maxSize = maxSize;
        this.pointer = -1; // Current position in stack
    }

    /**
     * Push new action to stack
     * Truncates redo branch if exists
     * @param {Object} action - {type, data, timestamp}
     */
    push(action) {
        // Truncate redo branch (everything after pointer)
        this.actions = this.actions.slice(0, this.pointer + 1);

        // Add new action
        const actionWithTimestamp = {
            ...action,
            timestamp: action.timestamp || Date.now()
        };
        this.actions.push(actionWithTimestamp);

        // Enforce max size (circular buffer)
        if (this.actions.length > this.maxSize) {
            this.actions.shift();
        } else {
            this.pointer++;
        }
    }

    /**
     * Undo last action
     * @returns {Object|null} - Action to undo or null
     */
    undo() {
        if (!this.canUndo()) {
            return null;
        }

        const action = this.actions[this.pointer];
        this.pointer--;
        return action;
    }

    /**
     * Redo previously undone action
     * @returns {Object|null} - Action to redo or null
     */
    redo() {
        if (!this.canRedo()) {
            return null;
        }

        this.pointer++;
        const action = this.actions[this.pointer];
        return action;
    }

    /**
     * Check if undo is available
     * @returns {boolean}
     */
    canUndo() {
        return this.pointer >= 0;
    }

    /**
     * Check if redo is available
     * @returns {boolean}
     */
    canRedo() {
        return this.pointer < this.actions.length - 1;
    }

    /**
     * Clear all actions
     */
    clear() {
        this.actions = [];
        this.pointer = -1;
    }

    /**
     * Get current stack state (for debugging)
     * @returns {Object}
     */
    getState() {
        return {
            size: this.actions.length,
            pointer: this.pointer,
            canUndo: this.canUndo(),
            canRedo: this.canRedo()
        };
    }
}

/**
 * Apply undo action to current state
 * @param {Object} action - Action from undo stack
 * @param {Object} currentState - {strokes, stickyNotes}
 * @returns {Object} - New state
 */
export function applyUndo(action, currentState) {
    const newState = { ...currentState };

    switch (action.type) {
        case 'drawStroke':
            // Remove the stroke that was drawn
            newState.strokes = currentState.strokes.filter(
                s => s.id !== action.data.strokeId
            );
            break;

        case 'deleteStroke':
            // Restore the deleted stroke
            newState.strokes = [...currentState.strokes, action.data.stroke];
            break;

        case 'createNote':
            // Remove the note that was created
            newState.stickyNotes = currentState.stickyNotes.filter(
                n => n.id !== action.data.noteId
            );
            break;

        case 'deleteNote':
            // Restore the deleted note
            newState.stickyNotes = [...currentState.stickyNotes, action.data.note];
            break;

        case 'moveNote':
            // Restore note to original position
            newState.stickyNotes = currentState.stickyNotes.map(note =>
                note.id === action.data.noteId
                    ? { ...note, position: action.data.from }
                    : note
            );
            break;

        default:
            console.warn('Unknown action type:', action.type);
            return currentState;
    }

    return newState;
}

/**
 * Apply redo action to current state
 * @param {Object} action - Action from undo stack
 * @param {Object} currentState - {strokes, stickyNotes}
 * @returns {Object} - New state
 */
export function applyRedo(action, currentState) {
    const newState = { ...currentState };

    switch (action.type) {
        case 'drawStroke':
            // Re-add the stroke
            newState.strokes = [...currentState.strokes, action.data.stroke];
            break;

        case 'deleteStroke':
            // Re-delete the stroke
            newState.strokes = currentState.strokes.filter(
                s => s.id !== action.data.strokeId
            );
            break;

        case 'createNote':
            // Re-create the note
            newState.stickyNotes = [...currentState.stickyNotes, action.data.note];
            break;

        case 'deleteNote':
            // Re-delete the note
            newState.stickyNotes = currentState.stickyNotes.filter(
                n => n.id !== action.data.noteId
            );
            break;

        case 'moveNote':
            // Restore note to new position
            newState.stickyNotes = currentState.stickyNotes.map(note =>
                note.id === action.data.noteId
                    ? { ...note, position: action.data.to }
                    : note
            );
            break;

        default:
            console.warn('Unknown action type:', action.type);
            return currentState;
    }

    return newState;
}
