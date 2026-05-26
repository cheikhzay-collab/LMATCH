// src/lib/firebase.js
// Firebase initialization — config values come from Vercel environment variables
// so secrets never end up in version control.
//
// If VITE_FIREBASE_API_KEY is absent (local dev without .env.local),
// Firebase is NOT initialized and all exports are null.
// AuthContext checks FIREBASE_ENABLED before using any of these exports.

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const API_KEY = import.meta.env.VITE_FIREBASE_API_KEY;

let app  = null;
let db   = null;
let auth = null;

if (API_KEY) {
  // Only initialize if not already done (handles HMR in Vite dev mode)
  const existingApps = getApps();
  app = existingApps.length > 0
    ? existingApps[0]
    : initializeApp({
        apiKey:            API_KEY,
        authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId:             import.meta.env.VITE_FIREBASE_APP_ID,
      });
  db   = getFirestore(app);
  auth = getAuth(app);
} else {
  console.warn(
    '[Firebase] No VITE_FIREBASE_API_KEY found — running in localStorage-only mode.\n' +
    'To enable Firebase, copy .env.example to .env.local and fill in your credentials.'
  );
}

export { db, auth };
export default app;
