/**
 * Supabase Client Module
 * Handles connection to Supabase backend
 */

// Supabase configuration from config.js
let supabaseClient = null;
let realtimeChannel = null;

/**
 * Initialize Supabase client
 * @param {string} supabaseUrl - Supabase project URL
 * @param {string} supabaseKey - Supabase anon key
 * @returns {Object} - Supabase client instance
 */
export function initSupabase(supabaseUrl, supabaseKey) {
    if (!window.supabase) {
        throw new Error('Supabase library not loaded. Include supabase-js CDN.');
    }

    supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
    console.log('Supabase client initialized');
    return supabaseClient;
}

/**
 * Get or create session
 * @param {string} sessionName - Session name (default: 'default')
 * @returns {Promise<string>} - Session UUID
 */
export async function getOrCreateSession(sessionName = 'default') {
    if (!supabaseClient) throw new Error('Supabase not initialized');

    // Check if session exists
    const { data: existingSessions, error: fetchError } = await supabaseClient
        .from('sessions')
        .select('id')
        .eq('session_name', sessionName)
        .limit(1);

    if (fetchError) {
        console.error('Error fetching session:', fetchError);
        throw fetchError;
    }

    if (existingSessions && existingSessions.length > 0) {
        return existingSessions[0].id;
    }

    // Create new session
    const { data: newSession, error: insertError } = await supabaseClient
        .from('sessions')
        .insert([{ session_name: sessionName }])
        .select('id')
        .single();

    if (insertError) {
        console.error('Error creating session:', insertError);
        throw insertError;
    }

    return newSession.id;
}

/**
 * Load all strokes for a session
 * @param {string} sessionId - Session UUID
 * @returns {Promise<Array>} - Array of stroke objects
 */
export async function loadStrokes(sessionId) {
    if (!supabaseClient) throw new Error('Supabase not initialized');

    const { data, error } = await supabaseClient
        .from('strokes')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error loading strokes:', error);
        throw error;
    }

    // Transform database format to app format
    return data.map(row => ({
        id: row.id,
        points: row.points,
        brushSize: row.brush_size,
        createdAt: row.created_at
    }));
}

/**
 * Save a stroke to Supabase
 * @param {string} sessionId - Session UUID
 * @param {Object} stroke - Stroke object {id, points, brushSize}
 * @returns {Promise<Object>} - Inserted stroke
 */
export async function saveStroke(sessionId, stroke) {
    if (!supabaseClient) throw new Error('Supabase not initialized');

    const { data, error } = await supabaseClient
        .from('strokes')
        .insert([{
            id: stroke.id,
            session_id: sessionId,
            points: stroke.points,
            brush_size: stroke.brushSize
        }])
        .select()
        .single();

    if (error) {
        console.error('Error saving stroke:', error);
        throw error;
    }

    return data;
}

/**
 * Delete a stroke from Supabase
 * @param {string} strokeId - Stroke UUID
 * @returns {Promise<void>}
 */
export async function deleteStroke(strokeId) {
    if (!supabaseClient) throw new Error('Supabase not initialized');

    const { error } = await supabaseClient
        .from('strokes')
        .delete()
        .eq('id', strokeId);

    if (error) {
        console.error('Error deleting stroke:', error);
        throw error;
    }
}

/**
 * Load all sticky notes for a session
 * @param {string} sessionId - Session UUID
 * @returns {Promise<Array>} - Array of sticky note objects
 */
export async function loadStickyNotes(sessionId) {
    if (!supabaseClient) throw new Error('Supabase not initialized');

    const { data, error } = await supabaseClient
        .from('sticky_notes')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error loading sticky notes:', error);
        throw error;
    }

    // Transform database format to app format
    return data.map(row => ({
        id: row.id,
        content: row.content,
        position: row.position,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    }));
}

/**
 * Save a sticky note to Supabase
 * @param {string} sessionId - Session UUID
 * @param {Object} note - Sticky note object {id, content, position}
 * @returns {Promise<Object>} - Inserted note
 */
export async function saveStickyNote(sessionId, note) {
    if (!supabaseClient) throw new Error('Supabase not initialized');

    const { data, error } = await supabaseClient
        .from('sticky_notes')
        .insert([{
            id: note.id,
            session_id: sessionId,
            content: note.content,
            position: note.position
        }])
        .select()
        .single();

    if (error) {
        console.error('Error saving sticky note:', error);
        throw error;
    }

    return data;
}

/**
 * Update a sticky note in Supabase
 * @param {string} noteId - Note UUID
 * @param {Object} updates - Updates {content?, position?}
 * @returns {Promise<Object>} - Updated note
 */
export async function updateStickyNote(noteId, updates) {
    if (!supabaseClient) throw new Error('Supabase not initialized');

    const payload = {};
    if (updates.content !== undefined) payload.content = updates.content;
    if (updates.position !== undefined) payload.position = updates.position;
    payload.updated_at = new Date().toISOString();

    const { data, error } = await supabaseClient
        .from('sticky_notes')
        .update(payload)
        .eq('id', noteId)
        .select()
        .single();

    if (error) {
        console.error('Error updating sticky note:', error);
        throw error;
    }

    return data;
}

/**
 * Delete a sticky note from Supabase
 * @param {string} noteId - Note UUID
 * @returns {Promise<void>}
 */
export async function deleteStickyNote(noteId) {
    if (!supabaseClient) throw new Error('Supabase not initialized');

    const { error } = await supabaseClient
        .from('sticky_notes')
        .delete()
        .eq('id', noteId);

    if (error) {
        console.error('Error deleting sticky note:', error);
        throw error;
    }
}

/**
 * Clear all strokes and notes for a session
 * @param {string} sessionId - Session UUID
 * @returns {Promise<void>}
 */
export async function clearSession(sessionId) {
    if (!supabaseClient) throw new Error('Supabase not initialized');

    // Delete all strokes
    const { error: strokeError } = await supabaseClient
        .from('strokes')
        .delete()
        .eq('session_id', sessionId);

    if (strokeError) {
        console.error('Error clearing strokes:', strokeError);
        throw strokeError;
    }

    // Delete all sticky notes
    const { error: noteError } = await supabaseClient
        .from('sticky_notes')
        .delete()
        .eq('session_id', sessionId);

    if (noteError) {
        console.error('Error clearing notes:', noteError);
        throw noteError;
    }
}

/**
 * Subscribe to real-time updates for a session
 * @param {string} sessionId - Session UUID
 * @param {Object} callbacks - {onStroke, onDeleteStroke, onNote, onUpdateNote, onDeleteNote}
 * @returns {Object} - Realtime channel
 */
export function subscribeToSession(sessionId, callbacks) {
    if (!supabaseClient) throw new Error('Supabase not initialized');

    // Unsubscribe from previous channel if exists
    if (realtimeChannel) {
        supabaseClient.removeChannel(realtimeChannel);
    }

    realtimeChannel = supabaseClient
        .channel(`session-${sessionId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'strokes',
                filter: `session_id=eq.${sessionId}`
            },
            (payload) => {
                if (callbacks.onStroke) {
                    const stroke = {
                        id: payload.new.id,
                        points: payload.new.points,
                        brushSize: payload.new.brush_size,
                        createdAt: payload.new.created_at
                    };
                    callbacks.onStroke(stroke);
                }
            }
        )
        .on(
            'postgres_changes',
            {
                event: 'DELETE',
                schema: 'public',
                table: 'strokes'
            },
            (payload) => {
                if (callbacks.onDeleteStroke) {
                    callbacks.onDeleteStroke(payload.old.id);
                }
            }
        )
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'sticky_notes',
                filter: `session_id=eq.${sessionId}`
            },
            (payload) => {
                if (callbacks.onNote) {
                    const note = {
                        id: payload.new.id,
                        content: payload.new.content,
                        position: payload.new.position,
                        createdAt: payload.new.created_at,
                        updatedAt: payload.new.updated_at
                    };
                    callbacks.onNote(note);
                }
            }
        )
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'sticky_notes'
            },
            (payload) => {
                if (callbacks.onUpdateNote) {
                    const note = {
                        id: payload.new.id,
                        content: payload.new.content,
                        position: payload.new.position,
                        updatedAt: payload.new.updated_at
                    };
                    callbacks.onUpdateNote(note);
                }
            }
        )
        .on(
            'postgres_changes',
            {
                event: 'DELETE',
                schema: 'public',
                table: 'sticky_notes'
            },
            (payload) => {
                if (callbacks.onDeleteNote) {
                    callbacks.onDeleteNote(payload.old.id);
                }
            }
        )
        .subscribe((status) => {
            console.log('Realtime subscription status:', status);
        });

    return realtimeChannel;
}

/**
 * Unsubscribe from real-time updates
 */
export function unsubscribeFromSession() {
    if (realtimeChannel && supabaseClient) {
        supabaseClient.removeChannel(realtimeChannel);
        realtimeChannel = null;
        console.log('Unsubscribed from real-time updates');
    }
}
