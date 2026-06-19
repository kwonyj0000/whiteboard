/**
 * Sticky Notes Module (P2)
 * Handles sticky note creation, rendering, and interaction
 */

/**
 * Generate UUID v4
 * @returns {string}
 */
function generateId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Create a new sticky note object
 * @param {string} content - Note text content
 * @param {{x, y}} position - Position coordinates
 * @param {string} userId - User identifier
 * @returns {Object} - Sticky note object
 */
export function createStickyNote(content = '', position = {x: 100, y: 100}, userId = 'local') {
    return {
        id: generateId(),
        type: 'stickyNote',
        content: content.substring(0, 500), // Max 500 chars
        position,
        size: {width: 200, height: 150}, // Fixed size for v1
        color: '#fef08a', // Yellow
        userId,
        timestamp: Date.now(),
        updatedAt: Date.now(),
        version: 1
    };
}

/**
 * Update sticky note (immutable)
 * @param {Object} note - Sticky note object
 * @param {Object} updates - {content?, position?}
 * @returns {Object} - Updated note
 */
export function updateStickyNote(note, updates) {
    return {
        ...note,
        ...updates,
        updatedAt: Date.now(),
        version: note.version + 1
    };
}

/**
 * Delete sticky note from array and DOM
 * @param {Array<Object>} notes - Array of notes
 * @param {string} id - Note ID
 * @param {HTMLElement} container - Notes container
 * @returns {Array<Object>} - New array without deleted note
 */
export function deleteStickyNote(notes, id, container) {
    // Remove from DOM
    const element = document.getElementById(`note-${id}`);
    if (element) {
        element.remove();
    }

    // Remove from array
    return notes.filter(n => n.id !== id);
}

/**
 * Create and render sticky note DOM element
 * @param {Object} note - Sticky note object
 * @param {HTMLElement} container - Container element
 * @param {Object} callbacks - {onUpdate, onDelete, onDragStart, onDragEnd}
 * @returns {HTMLElement} - Note element
 */
export function renderStickyNote(note, container, callbacks = {}) {
    // Create note element
    const noteEl = document.createElement('div');
    noteEl.id = `note-${note.id}`;
    noteEl.className = 'sticky-note';
    noteEl.style.left = `${note.position.x}px`;
    noteEl.style.top = `${note.position.y}px`;
    noteEl.setAttribute('data-note-id', note.id);

    // Create header (drag handle)
    const header = document.createElement('div');
    header.className = 'sticky-note-header';
    header.textContent = 'Sticky Note';

    // Create content area
    const contentDiv = document.createElement('div');
    contentDiv.className = 'sticky-note-content';

    const textarea = document.createElement('textarea');
    textarea.className = 'sticky-note-textarea';
    textarea.placeholder = 'Type your note...';
    textarea.value = note.content;
    textarea.maxLength = 500;

    // Event listeners for content editing
    textarea.addEventListener('blur', () => {
        if (callbacks.onUpdate) {
            callbacks.onUpdate(note.id, {content: textarea.value});
        }
    });

    textarea.addEventListener('input', () => {
        // Auto-save after short delay (debounced in main.js)
        if (callbacks.onUpdate) {
            callbacks.onUpdate(note.id, {content: textarea.value});
        }
    });

    // Click to select/edit
    noteEl.addEventListener('click', (e) => {
        if (e.target !== textarea) {
            textarea.focus();
        }
        // Mark as selected for delete
        document.querySelectorAll('.sticky-note').forEach(n => n.classList.remove('selected'));
        noteEl.classList.add('selected');
    });

    // Prevent canvas drawing when interacting with note
    noteEl.addEventListener('mousedown', (e) => {
        e.stopPropagation();
    });

    noteEl.addEventListener('touchstart', (e) => {
        e.stopPropagation();
    });

    // Assemble note
    contentDiv.appendChild(textarea);
    noteEl.appendChild(header);
    noteEl.appendChild(contentDiv);
    container.appendChild(noteEl);

    // Setup dragging (on header)
    setupDragging(noteEl, header, note, callbacks);

    return noteEl;
}

/**
 * Setup dragging for sticky note
 * @param {HTMLElement} noteEl - Note element
 * @param {HTMLElement} handle - Drag handle element
 * @param {Object} note - Note data
 * @param {Object} callbacks - {onDragStart, onDragEnd}
 */
function setupDragging(noteEl, handle, note, callbacks) {
    let isDragging = false;
    let startX, startY;
    let initialX, initialY;

    const onDragStart = (clientX, clientY) => {
        isDragging = true;
        startX = clientX;
        startY = clientY;
        initialX = note.position.x;
        initialY = note.position.y;

        noteEl.style.cursor = 'grabbing';

        if (callbacks.onDragStart) {
            callbacks.onDragStart(note.id);
        }
    };

    const onDragMove = (clientX, clientY) => {
        if (!isDragging) return;

        const dx = clientX - startX;
        const dy = clientY - startY;

        let newX = initialX + dx;
        let newY = initialY + dy;

        // Boundary constraints (keep within canvas)
        const container = noteEl.parentElement;
        const maxX = container.clientWidth - note.size.width;
        const maxY = container.clientHeight - note.size.height;

        newX = Math.max(0, Math.min(newX, maxX));
        newY = Math.max(0, Math.min(newY, maxY));

        noteEl.style.left = `${newX}px`;
        noteEl.style.top = `${newY}px`;
    };

    const onDragEnd = () => {
        if (!isDragging) return;

        isDragging = false;
        noteEl.style.cursor = '';

        // Get final position
        const finalX = parseInt(noteEl.style.left);
        const finalY = parseInt(noteEl.style.top);

        if (callbacks.onDragEnd) {
            callbacks.onDragEnd(note.id, {x: finalX, y: finalY});
        }
    };

    // Mouse events
    handle.addEventListener('mousedown', (e) => {
        e.preventDefault();
        onDragStart(e.clientX, e.clientY);
    });

    document.addEventListener('mousemove', (e) => {
        onDragMove(e.clientX, e.clientY);
    });

    document.addEventListener('mouseup', () => {
        onDragEnd();
    });

    // Touch events
    handle.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        onDragStart(touch.clientX, touch.clientY);
    });

    document.addEventListener('touchmove', (e) => {
        if (isDragging) {
            const touch = e.touches[0];
            onDragMove(touch.clientX, touch.clientY);
        }
    });

    document.addEventListener('touchend', () => {
        onDragEnd();
    });
}

/**
 * Get sticky note by ID
 * @param {Array<Object>} notes - Array of notes
 * @param {string} id - Note ID
 * @returns {Object|undefined}
 */
export function getStickyNoteById(notes, id) {
    return notes.find(n => n.id === id);
}
