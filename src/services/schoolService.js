// src/services/schoolService.js
// Supabase service for schools list and per-school branding (logos, colors)
// Returns defaults when supabase is null (no Supabase configured).

import { supabase } from '../lib/supabase';

const DEFAULT_SCHOOLS = [
  'Médecine / Pharmacie',
  'ENSA',
  'ENSAM',
  'ENCG',
  'INPT',
  'INSEA',
  'Général (Prépa)',
];

/**
 * Fetch schools config from Supabase.
 * Returns { schools: string[], branding: Record<string, Object> }
 */
export const getSchoolsConfig = async () => {
  if (!supabase) return { schools: DEFAULT_SCHOOLS, branding: {} };

  const { data, error } = await supabase
    .from('config')
    .select('value')
    .eq('key', 'schools')
    .maybeSingle();

  if (error || !data) {
    return { schools: DEFAULT_SCHOOLS, branding: {} };
  }

  const val = data.value || {};
  return {
    schools:  val.schools  || DEFAULT_SCHOOLS,
    branding: val.branding || {},
  };
};

/**
 * Save the full schools config back to Supabase.
 * @param {string[]} schools
 * @param {Record<string, Object>} branding
 */
export const saveSchoolsConfig = async (schools, branding) => {
  if (!supabase) return;
  const { error } = await supabase
    .from('config')
    .upsert({
      key: 'schools',
      value: { schools, branding },
      updated_at: new Date().toISOString(),
    });

  if (error) {
    console.error('[Supabase] Failed to save schools config:', error);
    throw error;
  }
};
