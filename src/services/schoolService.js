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

/**
 * Fetch general platform branding (profName, profPhone, profSite) from Supabase.
 */
export const getBrandingConfig = async () => {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('config')
    .select('value')
    .eq('key', 'branding')
    .maybeSingle();

  if (error || !data) return null;
  return data.value;
};

/**
 * Save general platform branding (profName, profPhone, profSite) to Supabase.
 */
export const saveBrandingConfig = async (branding) => {
  if (!supabase) return;
  const { error } = await supabase
    .from('config')
    .upsert({
      key: 'branding',
      value: branding,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    console.error('[Supabase] Failed to save branding config:', error);
    throw error;
  }
};

/**
 * Fetch flashcard settings (reveal mode, flip animation, swipe gesture) from Supabase.
 */
export const getFlashcardSettingsConfig = async () => {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('config')
    .select('value')
    .eq('key', 'flashcard_settings')
    .maybeSingle();

  if (error || !data) return null;
  return data.value;
};

/**
 * Save flashcard settings to Supabase.
 */
export const saveFlashcardSettingsConfig = async (settings) => {
  if (!supabase) return;
  const { error } = await supabase
    .from('config')
    .upsert({
      key: 'flashcard_settings',
      value: settings,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    console.error('[Supabase] Failed to save flashcard settings config:', error);
    throw error;
  }
};

/**
 * Fetch PDF styling settings from Supabase.
 */
export const getPdfSettingsConfig = async () => {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('config')
    .select('value')
    .eq('key', 'pdf_settings')
    .maybeSingle();

  if (error || !data) return null;
  return data.value;
};

/**
 * Save PDF styling settings to Supabase.
 */
export const savePdfSettingsConfig = async (settings) => {
  if (!supabase) return;
  const { error } = await supabase
    .from('config')
    .upsert({
      key: 'pdf_settings',
      value: settings,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    console.error('[Supabase] Failed to save PDF settings config:', error);
    throw error;
  }
};


