// src/services/lessonService.js
// Supabase CRUD for lessons
// All functions return empty/null when supabase is null.

import { supabase } from '../lib/supabase';

// Helper to map lesson fields to DB columns
const mapLessonToDB = (l) => ({
  title: l.title,
  subject: l.subject,
  chapter_number: l.chapterNumber || l.chapter_number || null,
  teacher: l.teacher || null,
  phone: l.phone || null,
  schools: l.schools || [],
  content: l.content || {},
  is_active: l.isActive !== undefined ? l.isActive : true,
  updated_at: new Date().toISOString(),
});

// Helper to map DB columns to lesson fields
const mapDBToLesson = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    subject: row.subject,
    chapterNumber: row.chapter_number,
    teacher: row.teacher,
    phone: row.phone,
    schools: row.schools,
    content: row.content,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

// ─── Read ─────────────────────────────────────────────────────────────────────

/**
 * Fetch ALL lessons (admin view).
 */
export const getAllLessons = async () => {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('lessons')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Supabase] Failed to fetch all lessons:', error);
    return [];
  }
  return data.map(mapDBToLesson);
};

/**
 * Fetch only active lessons (student view).
 */
export const getActiveLessons = async () => {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('lessons')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Supabase] Failed to fetch active lessons:', error);
    return [];
  }
  return data.map(mapDBToLesson);
};

/**
 * Fetch a single lesson by ID.
 */
export const getLessonById = async (lessonId) => {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('lessons')
    .select('*')
    .eq('id', lessonId)
    .maybeSingle();

  if (error || !data) {
    console.error('[Supabase] Failed to fetch lesson by id:', error);
    return null;
  }
  return mapDBToLesson(data);
};

// ─── Write ────────────────────────────────────────────────────────────────────

/**
 * Add a new lesson.
 * @param {Object} lessonData
 * @returns {Promise<string>} — new lesson ID
 */
export const addLesson = async (lessonData) => {
  if (!supabase) return null;
  const id = lessonData.id || Math.random().toString(36).substr(2, 9).toUpperCase();
  const dbLesson = {
    id,
    ...mapLessonToDB(lessonData),
    created_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('lessons')
    .insert(dbLesson);

  if (error) {
    console.error('[Supabase] Failed to add lesson:', error);
    throw error;
  }
  return id;
};

/**
 * Update dynamic fields of a lesson.
 */
export const updateLesson = async (lessonId, updates) => {
  if (!supabase) return;
  const dbUpdates = {};
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.subject !== undefined) dbUpdates.subject = updates.subject;
  if (updates.chapterNumber !== undefined) dbUpdates.chapter_number = updates.chapterNumber;
  if (updates.teacher !== undefined) dbUpdates.teacher = updates.teacher;
  if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
  if (updates.schools !== undefined) dbUpdates.schools = updates.schools;
  if (updates.content !== undefined) dbUpdates.content = updates.content;
  if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
  dbUpdates.updated_at = new Date().toISOString();

  const { error } = await supabase
    .from('lessons')
    .update(dbUpdates)
    .eq('id', lessonId);

  if (error) {
    console.error('[Supabase] Failed to update lesson:', error);
    throw error;
  }
};

/**
 * Toggle the active/inactive status of a lesson.
 */
export const toggleLessonStatus = async (lessonId, currentStatus) => {
  if (!supabase) return;
  const { error } = await supabase
    .from('lessons')
    .update({
      is_active: !currentStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', lessonId);

  if (error) {
    console.error('[Supabase] Failed to toggle lesson status:', error);
    throw error;
  }
};

/**
 * Permanently delete a lesson.
 */
export const deleteLesson = async (lessonId) => {
  if (!supabase) return;
  const { error } = await supabase
    .from('lessons')
    .delete()
    .eq('id', lessonId);

  if (error) {
    console.error('[Supabase] Failed to delete lesson:', error);
    throw error;
  }
};
