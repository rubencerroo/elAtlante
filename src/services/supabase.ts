import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const STAFF_TOKEN_KEY = 'el_atlante_staff_token';

/**
 * Universal Supabase Client with a fetch-level interceptor.
 * Sends a cryptographically signed JWT via the 'x-staff-token' header
 * on every request if a session exists.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: async (url, options = {}) => {
      const headers = new Headers(options.headers || {});
      
      // Read the JWT token — prefer the active staff token (for PIN-based quick switch)
      const activeToken = localStorage.getItem('active_staff_token');
      const sessionToken = localStorage.getItem(STAFF_TOKEN_KEY);
      
      const token = activeToken || sessionToken;
      
      if (token) {
        headers.set('x-staff-token', token);
      }
      
      return fetch(url, { ...options, headers });
    }
  }
});

// For compatibility with other files
export const refreshSupabaseAuth = () => {
  // Now handled dynamically by the fetch interceptor
};
