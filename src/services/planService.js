// src/services/planService.js
// Firestore service for subscription plans and activation codes
// Returns empty defaults when db is null (no Firebase configured).

import {
  doc,
  getDoc,
  setDoc,
  getDocs,
  collection,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

// ─── Plans ────────────────────────────────────────────────────────────────────

/**
 * Fetch all subscription plans from Firestore.
 * @returns {Promise<Plan[]>}
 */
export const getPlans = async () => {
  if (!db) return [];
  const snap = await getDoc(doc(db, 'config', 'plans'));
  if (!snap.exists()) return [];
  return snap.data().plans || [];
};

/**
 * Overwrite the full plans array in Firestore.
 * @param {Plan[]} plans
 */
export const savePlans = async (plans) => {
  if (!db) return;
  await setDoc(doc(db, 'config', 'plans'), { plans, updatedAt: serverTimestamp() });
};

// ─── Activation Codes ─────────────────────────────────────────────────────────

/**
 * Fetch ALL activation codes (admin only).
 * @returns {Promise<ActivationCode[]>}
 */
export const getAllCodes = async () => {
  if (!db) return [];
  const snap = await getDocs(collection(db, 'activationCodes'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

/**
 * Save a batch of new activation codes to Firestore.
 * Uses the code string as the document ID for fast lookups.
 * @param {ActivationCode[]} codes
 */
export const saveActivationCodes = async (codes) => {
  if (!db) return;
  const writes = codes.map(c =>
    setDoc(doc(db, 'activationCodes', c.code), {
      ...c,
      createdAt: serverTimestamp(),
    })
  );
  await Promise.all(writes);
};

/**
 * Mark an activation code as used.
 * @param {string} code
 * @param {string} usedBy — user name or email
 */
export const markCodeUsed = async (code, usedBy) => {
  if (!db) return;
  await updateDoc(doc(db, 'activationCodes', code), {
    isUsed:  true,
    usedBy,
    usedAt:  serverTimestamp(),
  });
};

/**
 * Fetch a single activation code document.
 * @returns {Promise<ActivationCode|null>}
 */
export const getCode = async (code) => {
  if (!db) return null;
  const snap = await getDoc(doc(db, 'activationCodes', code));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};
