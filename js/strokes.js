/**
 * Stroke Data Model and Management
 * Handles stroke creation, manipulation, and simplification
 */

/**
 * Generate UUID v4 (fallback for older browsers)
 * @returns {string}
 */
function generateId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    // Fallback UUID generation
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Create a new stroke object
 * @param {Array<{x, y}>} points - Array of coordinate points
 * @param {string} brushSize - "thin" | "medium" | "thick"
 * @param {string} userId - User identifier
 * @returns {Object} - Stroke object
 */
export function createStroke(points, brushSize = 'medium', userId = 'local') {
    return {
        id: generateId(),
        type: 'stroke',
        points: points || [],
        brushSize,
        color: '#000000', // Black only for v1
        userId,
        timestamp: Date.now(),
        version: 1
    };
}

/**
 * Add a point to an existing stroke (immutable)
 * @param {Object} stroke - Stroke object
 * @param {{x, y}} point - Point to add
 * @returns {Object} - New stroke with added point
 */
export function addPoint(stroke, point) {
    return {
        ...stroke,
        points: [...stroke.points, point]
    };
}

/**
 * Simplify stroke using Ramer-Douglas-Peucker algorithm
 * Reduces number of points while maintaining shape
 * @param {Object} stroke - Stroke object
 * @param {number} tolerance - Pixel tolerance (default: 2)
 * @returns {Object} - Simplified stroke
 */
export function simplifyStroke(stroke, tolerance = 2) {
    if (stroke.points.length <= 2) {
        return stroke;
    }

    const simplified = ramerDouglasPeucker(stroke.points, tolerance);

    return {
        ...stroke,
        points: simplified
    };
}

/**
 * Ramer-Douglas-Peucker algorithm implementation
 * @param {Array<{x, y}>} points - Points to simplify
 * @param {number} tolerance - Tolerance value
 * @returns {Array<{x, y}>} - Simplified points
 */
function ramerDouglasPeucker(points, tolerance) {
    if (points.length <= 2) {
        return points;
    }

    // Find point with maximum distance from line segment
    let maxDistance = 0;
    let maxIndex = 0;
    const end = points.length - 1;

    for (let i = 1; i < end; i++) {
        const distance = perpendicularDistance(
            points[i],
            points[0],
            points[end]
        );
        if (distance > maxDistance) {
            maxDistance = distance;
            maxIndex = i;
        }
    }

    // If max distance is greater than tolerance, recursively simplify
    if (maxDistance > tolerance) {
        const left = ramerDouglasPeucker(points.slice(0, maxIndex + 1), tolerance);
        const right = ramerDouglasPeucker(points.slice(maxIndex), tolerance);

        // Merge results (remove duplicate point at join)
        return [...left.slice(0, -1), ...right];
    } else {
        // Distance is small, return endpoints only
        return [points[0], points[end]];
    }
}

/**
 * Calculate perpendicular distance from point to line segment
 * @param {{x, y}} point - Point to measure
 * @param {{x, y}} lineStart - Line start point
 * @param {{x, y}} lineEnd - Line end point
 * @returns {number} - Distance in pixels
 */
function perpendicularDistance(point, lineStart, lineEnd) {
    const dx = lineEnd.x - lineStart.x;
    const dy = lineEnd.y - lineStart.y;

    const numerator = Math.abs(
        dy * point.x - dx * point.y + lineEnd.x * lineStart.y - lineEnd.y * lineStart.x
    );
    const denominator = Math.sqrt(dx * dx + dy * dy);

    return numerator / denominator;
}

/**
 * Find stroke by ID
 * @param {Array<Object>} strokes - Array of strokes
 * @param {string} id - Stroke ID
 * @returns {Object|undefined} - Stroke or undefined
 */
export function getStrokeById(strokes, id) {
    return strokes.find(s => s.id === id);
}

/**
 * Delete stroke by ID (immutable)
 * @param {Array<Object>} strokes - Array of strokes
 * @param {string} id - Stroke ID to delete
 * @returns {Array<Object>} - New array without deleted stroke
 */
export function deleteStroke(strokes, id) {
    return strokes.filter(s => s.id !== id);
}

/**
 * Get brush size in pixels
 * @param {string} size - "thin" | "medium" | "thick"
 * @returns {number} - Width in pixels
 */
export function getBrushWidth(size) {
    const sizes = {
        thin: 2,
        medium: 5,
        thick: 10
    };
    return sizes[size] || sizes.medium;
}
