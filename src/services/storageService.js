// src/services/storageService.js
// Supabase Storage service for uploading logos and question figures.
// Gracefully falls back to Object URLs in local-only mode.

import { supabase } from '../lib/supabase';

/**
 * Uploads a file to the 'gima-assets' bucket in Supabase Storage.
 * @param {File|Blob} file - The file to upload.
 * @param {string} path - The destination path in the bucket (e.g. 'logos/fac_med.png').
 * @returns {Promise<string>} - The public URL of the uploaded file.
 */
export const uploadAsset = async (file, path) => {
  if (!supabase) {
    console.warn('[Storage] Supabase not initialized — returning local Object URL fallback.');
    return URL.createObjectURL(file);
  }

  // Upload file to 'gima-assets' bucket
  const { error } = await supabase.storage
    .from('gima-assets')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (error) {
    console.error('[Supabase Storage] Failed to upload asset:', error);
    throw error;
  }

  // Retrieve public URL
  const { data: { publicUrl } } = supabase.storage
    .from('gima-assets')
    .getPublicUrl(path);

  return publicUrl;
};
