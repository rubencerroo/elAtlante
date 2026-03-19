import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Universal Supabase Client with a fetch-level interceptor.
 * This guarantees that every request includes the 'x-staff-id' header
 * if a session exists in localStorage, bypassing any builder-cloning issues.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: async (url, options = {}) => {
      // Create a Headers instance to safely modify headers
      const headers = new Headers(options.headers || {});
      
      const sessionStr = localStorage.getItem('el_atlante_staff_session');
      const activeStaffId = localStorage.getItem('active_staff_id');
      
      let staffId = activeStaffId;
      
      if (!staffId && sessionStr) {
        try {
          const session = JSON.parse(sessionStr);
          staffId = session.id;
        } catch (e) {}
      }
      
      if (staffId) {
        headers.set('x-staff-id', staffId);
      }
      
      return fetch(url, { ...options, headers });
    }
  }
});

// For compatibility with other files
export const refreshSupabaseAuth = () => {
  // Now handled dynamically by the fetch interceptor
};
