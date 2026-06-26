// src/lib/supabase.js
// Supabase initialization — config values come from Vercel environment variables or .env.local
//
// If VITE_SUPABASE_URL is absent (local dev without .env.local),
// Supabase is NOT initialized and the client is null.
// AuthContext checks SUPABASE_ENABLED before using these exports.

import { createClient } from '@supabase/supabase-js';

const supabaseUrl     = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase = null;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      // ── FIX: use sessionStorage so auth tokens are NEVER mixed
      //    with the heavy app data stored in localStorage.
      //    sessionStorage is cleared on tab close → no stale tokens.
      //    This prevents the quota-exceeded → token-lost → 401 loop.
      storage:             window.sessionStorage,
      persistSession:      true,
      autoRefreshToken:    true,   // silently renews tokens before expiry
      detectSessionInUrl:  true,   // handles OAuth /auth/callback redirects
    },
    global: {
      // Reasonable timeout — avoids hanging requests on flaky mobile networks
      fetch: (url, options = {}) => {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 15_000); // 15s max
        return fetch(url, { ...options, signal: controller.signal })
          .finally(() => clearTimeout(id));
      },
    },
  });
} else {
  console.warn(
    '[Supabase] No VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY found — running in localStorage-only mode.\n' +
    'To enable Supabase, copy .env.example to .env.local and fill in your credentials.'
  );
}

export { supabase };
export default supabase;
