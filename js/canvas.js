/**
 * Canvas Rendering Module
 * Handles HTML5 Canvas drawing and rendering
 */

import { getBrushWidth } from './strokes.js';

/**
 * Initialize canvas for drawing
 * @param {HTMLCanvasElement} canvasElement - Canvas DOM element
 * @param {Object} options - {width, height, backgroundColor}
 * @returns {CanvasRenderingContext2D}
 */
export function initCanvas(canvasElement, options = {}) {
    const container = canvasElement.parentElement;
    const width = options.width || container.clientWidth;
    const height = options.height || container.clientHeight;
    const backgroundColor = options.backgroundColor || '#ffffff';

    // Set canvas dimensions (actual pixel dimensions)
    canvasElement.width = width;
    canvasElement.height = height;

    const ctx = canvasElement.getContext('2d');

    // Set background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Configure context defaults
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    return ctx;
}

/**
 * Render a single stroke on the canvas
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} stroke - Stroke object
 * @param {boolean} isSelected - Whether stroke is selected
 */
export function drawStroke(ctx, stroke, isSelected = false) {
    if (!stroke.points || stroke.points.length < 2) {
        return;
    }

    ctx.save();

    // Set stroke style
    ctx.strokeStyle = isSelected ? '#3b82f6' : stroke.color;
    ctx.lineWidth = getBrushWidth(stroke.brushSize);

    // Begin path
    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

    // Draw line through all points
    for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
    }

    ctx.stroke();

    // If selected, draw dashed outline
    if (isSelected) {
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = getBrushWidth(stroke.brushSize) + 4;
        ctx.setLineDash([5, 5]);
        ctx.globalAlpha = 0.3;
        ctx.stroke();
    }

    ctx.restore();
}

/**
 * Clear the entire canvas
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @param {string} backgroundColor - Background color (default: white)
 */
export function clearCanvas(ctx, width, height, backgroundColor = '#ffffff') {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);
}

/**
 * Render all strokes (full repaint)
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Array<Object>} strokes - Array of stroke objects
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @param {string|null} selectedStrokeId - ID of selected stroke
 */
export function renderAll(ctx, strokes, width, height, selectedStrokeId = null) {
    // Clear canvas
    clearCanvas(ctx, width, height);

    // Draw all strokes
    strokes.forEach(stroke => {
        const isSelected = selectedStrokeId === stroke.id;
        drawStroke(ctx, stroke, isSelected);
    });
}

/**
 * Get canvas coordinates from mouse/touch event
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {MouseEvent|Touch} event - Event or touch object
 * @returns {{x: number, y: number}}
 */
export function getCanvasPoint(canvas, event) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: Math.round(event.clientX - rect.left),
        y: Math.round(event.clientY - rect.top)
    };
}

/**
 * Check if point is near stroke (for selection)
 * @param {{x, y}} point - Point to check
 * @param {Object} stroke - Stroke object
 * @param {number} threshold - Distance threshold in pixels
 * @returns {boolean}
 */
export function isPointNearStroke(point, stroke, threshold = 10) {
    if (!stroke.points || stroke.points.length < 2) {
        return false;
    }

    // Check distance to each line segment
    for (let i = 0; i < stroke.points.length - 1; i++) {
        const p1 = stroke.points[i];
        const p2 = stroke.points[i + 1];

        const distance = distanceToLineSegment(point, p1, p2);
        if (distance <= threshold + getBrushWidth(stroke.brushSize) / 2) {
            return true;
        }
    }

    return false;
}

/**
 * Calculate distance from point to line segment
 * @param {{x, y}} point - Point to measure
 * @param {{x, y}} lineStart - Line start
 * @param {{x, y}} lineEnd - Line end
 * @returns {number} - Distance in pixels
 */
function distanceToLineSegment(point, lineStart, lineEnd) {
    const dx = lineEnd.x - lineStart.x;
    const dy = lineEnd.y - lineStart.y;
    const lengthSquared = dx * dx + dy * dy;

    if (lengthSquared === 0) {
        // Line start and end are the same
        const dpx = point.x - lineStart.x;
        const dpy = point.y - lineStart.y;
        return Math.sqrt(dpx * dpx + dpy * dpy);
    }

    // Calculate projection of point onto line
    let t = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / lengthSquared;
    t = Math.max(0, Math.min(1, t)); // Clamp to line segment

    // Find closest point on line segment
    const closestX = lineStart.x + t * dx;
    const closestY = lineStart.y + t * dy;

    // Calculate distance
    const dpx = point.x - closestX;
    const dpy = point.y - closestY;
    return Math.sqrt(dpx * dpx + dpy * dpy);
}
