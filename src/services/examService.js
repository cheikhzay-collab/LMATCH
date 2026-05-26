// src/services/examService.js
// Firestore CRUD for exams — the core content of L'Conq
// All functions return empty/null when db is null (no Firebase configured).

import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

const EXAMS_COL = 'exams';

// ─── Read ─────────────────────────────────────────────────────────────────────

/**
 * Fetch ALL exams (admin view).
 */
export const getAllExams = async () => {
  if (!db) return [];
  const snap = await getDocs(query(collection(db, EXAMS_COL), orderBy('dateAdded', 'desc')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

/**
 * Fetch only active, non-archived exams (student view).
 */
export const getActiveExams = async () => {
  if (!db) return [];
  const snap = await getDocs(
    query(
      collection(db, EXAMS_COL),
      where('isActive', '==', true),
      where('isArchived', '==', false)
    )
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

/**
 * Fetch a single exam by ID.
 */
export const getExamById = async (examId) => {
  if (!db) return null;
  const snap = await getDoc(doc(db, EXAMS_COL, examId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

// ─── Write ────────────────────────────────────────────────────────────────────

/**
 * Add a new exam to Firestore.
 * @param {Object} examData — { name, school, year, tier, questions, pdfUrl }
 * @returns {Promise<string>} — new exam ID
 */
export const addExam = async (examData) => {
  if (!db) return null;
  const ref = await addDoc(collection(db, EXAMS_COL), {
    ...examData,
    isActive: true,
    isArchived: false,
    dateAdded: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
};

/**
 * Update specific fields of an exam.
 */
export const updateExam = async (examId, updates) => {
  if (!db) return;
  await updateDoc(doc(db, EXAMS_COL, examId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};

/**
 * Toggle the active/inactive status of an exam.
 */
export const toggleExamStatus = async (examId, currentStatus) => {
  if (!db) return;
  await updateDoc(doc(db, EXAMS_COL, examId), {
    isActive: !currentStatus,
    updatedAt: serverTimestamp(),
  });
};

/**
 * Toggle archived status of an exam.
 */
export const toggleArchiveExam = async (examId, currentArchived) => {
  if (!db) return;
  await updateDoc(doc(db, EXAMS_COL, examId), {
    isArchived: !currentArchived,
    updatedAt: serverTimestamp(),
  });
};

/**
 * Permanently delete an exam.
 */
export const deleteExam = async (examId) => {
  if (!db) return;
  await deleteDoc(doc(db, EXAMS_COL, examId));
};
