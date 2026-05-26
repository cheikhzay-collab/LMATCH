// src/lib/supabase.js
// Supabase initialization — config values come from Vercel environment variables or .env.local
//
// If VITE_SUPABASE_URL is absent (local dev without .env.local),
// Supabase is NOT initialized and the client is null.
// AuthContext checks SUPABASE_ENABLED before using these exports.

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase = null;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  console.warn(
    '[Supabase] No VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY found — running in localStorage-only mode.\n' +
    'To enable Supabase, copy .env.example to .env.local and fill in your credentials.'
  );
}

export { supabase };
export default supabase;
