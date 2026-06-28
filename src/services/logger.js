// src/services/logger.js
import { supabase } from '../lib/supabase';

/**
 * Safely logs an error to the Supabase database 'error_logs' table.
 * Fallbacks to console logging if Supabase is not configured or disabled.
 * 
 * @param {Error|any} error The error object or message
 * @param {Object} [extraInfo] Additional info (e.g. React componentStack)
 */
export async function logErrorToSupabase(error, extraInfo = {}) {
  // Always log to console as fallback/developer review
  console.error('[ErrorLogger]', error, extraInfo);

  if (!supabase) {
    console.warn('[ErrorLogger] Supabase client is not initialized. Skipping database log.');
    return;
  }

  try {
    const errorMsg = error?.message || (typeof error === 'string' ? error : JSON.stringify(error)) || 'Unknown Error';
    const errorStack = error?.stack || null;
    const componentStack = extraInfo?.componentStack || null;

    // Get current user session asynchronously (using cached session from supabase client if possible)
    let userId = null;
    try {
      const { data } = await supabase.auth.getSession();
      userId = data?.session?.user?.id || null;
    } catch (authError) {
      console.warn('[ErrorLogger] Failed to retrieve user session:', authError);
    }

    const logPayload = {
      user_id: userId,
      error_message: errorMsg,
      error_stack: errorStack,
      component_stack: componentStack,
      url: window.location.href,
      user_agent: navigator.userAgent,
    };

    const { error: insertError } = await supabase
      .from('error_logs')
      .insert([logPayload]);

    if (insertError) {
      console.error('[ErrorLogger] Failed to insert log to Supabase:', insertError);
    }
  } catch (err) {
    console.error('[ErrorLogger] Unexpected error within logger itself:', err);
  }
}
