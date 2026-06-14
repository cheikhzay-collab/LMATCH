// src/services/planService.js
// Supabase service for subscription plans and activation codes
// Returns empty defaults when supabase is null (no Supabase configured).

import { supabase } from '../lib/supabase';

// Helper to map code fields to DB columns
const mapCodeToDB = (c) => ({
  code: c.code,
  plan_id: c.planId,
  is_used: c.isUsed,
  used_by: c.usedBy,
  used_at: c.usedAt || null,
  batch_name: c.batchName,
  created_at: c.createdDate || c.createdAt || new Date().toISOString(),
});

// Helper to map DB columns to code fields
const mapDBToCode = (row) => {
  if (!row) return null;
  return {
    id: row.code,
    code: row.code,
    planId: row.plan_id,
    isUsed: row.is_used,
    usedBy: row.used_by || '',
    usedAt: row.used_at || '',
    batchName: row.batch_name,
    createdDate: row.created_at,
  };
};

// ─── Plans ────────────────────────────────────────────────────────────────────

/**
 * Fetch all subscription plans from Supabase.
 * @returns {Promise<Plan[]>}
 */
export const getPlans = async () => {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('config')
    .select('value')
    .eq('key', 'plans')
    .maybeSingle();

  if (error || !data) return [];
  return data.value?.plans || [];
};

/**
 * Overwrite the full plans array in Supabase.
 * @param {Plan[]} plans
 */
export const savePlans = async (plans) => {
  if (!supabase) return;
  const { error } = await supabase
    .from('config')
    .upsert({
      key: 'plans',
      value: { plans },
      updated_at: new Date().toISOString(),
    });

  if (error) {
    console.error('[Supabase] Failed to save plans:', error);
    throw error;
  }
};

// ─── Activation Codes ─────────────────────────────────────────────────────────

/**
 * Fetch ALL activation codes (admin only).
 * @returns {Promise<ActivationCode[]>}
 */
export const getAllCodes = async () => {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('activation_codes')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) {
    console.error('[Supabase] Failed to fetch activation codes:', error);
    return [];
  }
  return data.map(mapDBToCode);
};

/**
 * Save a batch of new activation codes to Supabase.
 * Uses the code string as the primary key.
 * @param {ActivationCode[]} codes
 */
export const saveActivationCodes = async (codes) => {
  if (!supabase) return;
  const dbCodes = codes.map(mapCodeToDB);
  const { error } = await supabase
    .from('activation_codes')
    .insert(dbCodes);

  if (error) {
    console.error('[Supabase] Failed to save activation codes:', error);
    throw error;
  }
};

/**
 * Mark an activation code as used.
 * @param {string} code
 * @param {string} usedBy — user name or email
 */
export const markCodeUsed = async (code, usedBy) => {
  if (!supabase) return;
  const { error } = await supabase
    .from('activation_codes')
    .update({
      is_used: true,
      used_by: usedBy,
      used_at: new Date().toISOString(),
    })
    .eq('code', code);

  if (error) {
    console.error('[Supabase] Failed to mark code as used:', error);
    throw error;
  }
};

/**
 * Fetch a single activation code document.
 * @returns {Promise<ActivationCode|null>}
 */
export const getCode = async (code) => {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('activation_codes')
    .select('*')
    .eq('code', code)
    .maybeSingle();

  if (error || !data) return null;
  return mapDBToCode(data);
};

/**
 * Redeem an activation code via secure Supabase RPC function.
 * Runs atomically on the database side.
 * @param {string} code
 * @param {string} usedBy — user name or email
 * @param {string} userId — user UID
 * @returns {Promise<Object>} — planId and durationDays
 */
export const redeemCodeViaRPC = async (code, usedBy, userId) => {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase.rpc('redeem_code', {
    input_code: code,
    user_name_or_email: usedBy,
    user_id: userId
  });

  if (error) {
    console.error('[Supabase] Failed to redeem code via RPC:', error);
    throw new Error(error.message || "Erreur lors de la validation du code.");
  }
  return data;
};
