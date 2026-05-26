// src/services/schoolService.js
// Firestore service for schools list and per-school branding (logos, colors)
// Returns defaults when db is null (no Firebase configured).

import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

const SCHOOLS_REF = () => db ? doc(db, 'config', 'schools') : null;

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
 * Fetch schools config from Firestore.
 * Returns { schools: string[], branding: Record<string, Object> }
 */
export const getSchoolsConfig = async () => {
  const ref = SCHOOLS_REF();
  if (!ref) return { schools: DEFAULT_SCHOOLS, branding: {} };

  const snap = await getDoc(ref);
  if (!snap.exists()) {
    return { schools: DEFAULT_SCHOOLS, branding: {} };
  }
  const data = snap.data();
  return {
    schools:  data.schools  || DEFAULT_SCHOOLS,
    branding: data.branding || {},
  };
};

/**
 * Save the full schools config back to Firestore.
 * @param {string[]} schools
 * @param {Record<string, Object>} branding
 */
export const saveSchoolsConfig = async (schools, branding) => {
  const ref = SCHOOLS_REF();
  if (!ref) return;
  await setDoc(ref, {
    schools,
    branding,
    updatedAt: serverTimestamp(),
  });
};
