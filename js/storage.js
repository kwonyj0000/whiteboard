/**
 * localStorage Persistence Module
 * Handles saving and loading whiteboard state
 */

const STORAGE_KEY_PREFIX = 'whiteboard-';

/**
 * Save whiteboard state to localStorage
 * @param {string} sessionId - Session identifier (default: 'local')
 * @param {Object} data - Whiteboard data {strokes, stickyNotes, updatedAt}
 * @throws {QuotaExceededError} if localStorage is full
 */
export function saveWhiteboard(sessionId = 'local', data) {
    const key = STORAGE_KEY_PREFIX + sessionId;
    const payload = {
        sessionId,
        strokes: data.strokes || [],
        stickyNotes: data.stickyNotes || [],
        version: 1,
        updatedAt: data.updatedAt || Date.now()
    };

    try {
        localStorage.setItem(key, JSON.stringify(payload));
    } catch (error) {
        if (error.name === 'QuotaExceededError') {
            console.error('localStorage quota exceeded');
            throw error;
        }
        console.error('Failed to save whiteboard:', error);
        throw error;
    }
}

/**
 * Load whiteboard state from localStorage
 * @param {string} sessionId - Session identifier
 * @returns {Object|null} - Whiteboard data or null if not found
 */
export function loadWhiteboard(sessionId = 'local') {
    const key = STORAGE_KEY_PREFIX + sessionId;

    try {
        const data = localStorage.getItem(key);
        if (!data) {
            return null;
        }

        const parsed = JSON.parse(data);
        return {
            strokes: parsed.strokes || [],
            stickyNotes: parsed.stickyNotes || [],
            updatedAt: parsed.updatedAt || Date.now()
        };
    } catch (error) {
        console.error('Failed to load whiteboard:', error);
        return null;
    }
}

/**
 * Delete whiteboard data from localStorage
 * @param {string} sessionId - Session identifier
 */
export function clearWhiteboard(sessionId = 'local') {
    const key = STORAGE_KEY_PREFIX + sessionId;
    localStorage.removeItem(key);
}

/**
 * Check localStorage usage (if supported)
 * @returns {Object|null} - {usage, quota, percentage} or null
 */
export async function checkStorageQuota() {
    if (!navigator.storage || !navigator.storage.estimate) {
        return null;
    }

    try {
        const estimate = await navigator.storage.estimate();
        return {
            usage: estimate.usage || 0,
            quota: estimate.quota || 0,
            percentage: estimate.quota > 0 ? (estimate.usage / estimate.quota) * 100 : 0
        };
    } catch (error) {
        console.error('Failed to estimate storage:', error);
        return null;
    }
}

/**
 * Monitor storage quota and warn if approaching limit
 * @returns {Promise<void>}
 */
export async function monitorStorageQuota() {
    const quota = await checkStorageQuota();

    if (!quota) {
        return;
    }

    if (quota.percentage >= 95) {
        console.error(`Storage quota critical: ${quota.percentage.toFixed(1)}% used`);
        alert('Storage is almost full. Please delete some content.');
    } else if (quota.percentage >= 80) {
        console.warn(`Storage quota warning: ${quota.percentage.toFixed(1)}% used`);
    }
}
