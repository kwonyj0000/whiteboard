/**
 * Configuration Module
 * Handles environment-specific configuration
 */

// Supabase configuration
// In production, these should be loaded from environment variables
export const config = {
    supabase: {
        url: import.meta.env?.SUPABASE_URL || 'https://pbddchilbzrrooxknlzu.supabase.co',
        anonKey: import.meta.env?.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiZGRjaGlsYnpycm9veGtubHp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MjcyNTAsImV4cCI6MjA5NzQwMzI1MH0.EnL_uGHa5Ijxnio55iOOLXPh73OueSV5nE-jB7cFjJI'
    },
    defaultSessionName: 'default',
    // Fallback to localStorage if Supabase is not configured
    useLocalStorage: false
};

/**
 * Check if Supabase is properly configured
 * @returns {boolean}
 */
export function isSupabaseConfigured() {
    return config.supabase.url !== 'YOUR_SUPABASE_URL'
        && config.supabase.anonKey !== 'YOUR_SUPABASE_ANON_KEY'
        && config.supabase.url.includes('supabase.co');
}

/**
 * Override config for testing or manual setup
 * @param {Object} overrides - Config overrides
 */
export function setConfig(overrides) {
    Object.assign(config, overrides);
}
