import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { onAuthChange, loginWithEmail, logoutUser, registerStudent } from '../services/authService';
import { getUserDoc, updateUserDoc, saveQuestionProgress, getAllProgress, saveMockResult, getMockHistory, incrementDailyActivity, getRecentActivity, getAllUsers } from '../services/userService';
import { getAllExams, getActiveExams, addExam as fbAddExam, updateExam as fbUpdateExam, deleteExam as fbDeleteExam, toggleExamStatus as fbToggleExamStatus, toggleArchiveExam as fbToggleArchiveExam } from '../services/examService';
import { getSchoolsConfig, saveSchoolsConfig } from '../services/schoolService';
import { getPlans, savePlans, getAllCodes, saveActivationCodes, markCodeUsed, getCode } from '../services/planService';


// ── Firebase availability guard ───────────────────────────────────────────────
// If VITE_FIREBASE_API_KEY is not set (e.g. local dev without .env.local),
// the app falls back gracefully to localStorage-only mode.
const FIREBASE_ENABLED = !!import.meta.env.VITE_FIREBASE_API_KEY;

const AuthContext = createContext();

/* ─── Data Schema Version ────────────────────────────────────────────────────
 *  Bump this number whenever a migration is needed.
 *  On app load, if stored version < SCHEMA_VERSION, the migration runs
 *  automatically and saves the cleaned data back to localStorage.
 */
const SCHEMA_VERSION = 3;

/**
 * Master text sanitizer — strips ALL control characters from a string.
 * Prevents CR/LF/Tab from corrupting LaTeX expressions when stored data
 * comes from CSV files with Windows line endings.
 */
const sanitizeText = (s) => {
  if (typeof s !== 'string') return s;
  return s
    .replace(/\r\n/g, ' ')   // Windows CRLF
    .replace(/[\r\n]/g, ' ') // lone CR or LF
    .replace(/\t/g, ' ')     // Tab
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // other control chars
    .replace(/[\u200B-\u200D\uFEFF]/g, '')              // zero-width / BOM
    .replace(/ {2,}/g, ' ')  // collapse spaces
    .trim();
};

/**
 * Sanitizes ALL text fields of every question in every exam.
 * Safe to run multiple times (idempotent).
 */
const sanitizeExams = (exams) => {
  if (!Array.isArray(exams)) return [];
  return exams.map(exam => ({
    ...exam,
    questions: Array.isArray(exam.questions)
      ? exam.questions.map(q => ({
          ...q,
          question: sanitizeText(q.question),
          context:  sanitizeText(q.context),
          astuce:   sanitizeText(q.astuce),
          trick:    sanitizeText(q.trick),
          options:  Array.isArray(q.options)
            ? q.options.map(opt => ({ ...opt, text: sanitizeText(opt.text) }))
            : q.options,
        }))
      : exam.questions,
  }));
};

/**
 * Loads exams from localStorage, runs migration if schema version is outdated.
 * Returns { exams, needsSave } — needsSave=true when data was migrated.
 */
const loadAndMigrateExams = () => {
  try {
    const raw = localStorage.getItem('exams');
    const version = parseInt(localStorage.getItem('examsSchemaVersion') || '0', 10);

    const defaultSeed = [
      {
        id: "QVVOBFE7",
        name: "Concours Médecine / Pharmacie 2024",
        school: "Médecine / Pharmacie",
        year: "2024",
        tier: "freemium",
        isActive: true,
        dateAdded: new Date().toISOString(),
        questions: Array.from({ length: 20 }, (_, i) => {
          const answers = ["C", "A", "B", "D", "C", "A", "E", "B", "C", "D", "B", "B", "A", "C", "D", "E", "B", "A", "D", "C"];
          const topics = ["Analyse", "Géométrie", "Algèbre", "Physique", "Chimie"];
          const optTexts = ["Option A", "Option B", "Option C", "Option D", "Option E"];
          return {
            id: `qvvobfe7-q-${i + 1}`,
            question: `Question ${i + 1} de concours Médecine/Pharmacie`,
            topic: topics[i % topics.length],
            correct_answer: answers[i],
            options: optTexts.map((txt, oIdx) => ({
              id: ["A", "B", "C", "D", "E"][oIdx],
              text: txt
            }))
          };
        })
      }
    ];

    if (!raw) {
      return { exams: defaultSeed, needsSave: true };
    }
    const parsed = JSON.parse(raw);
    
    // Ensure QVVOBFE7 is always present in the loaded list for testing
    const hasQVV = parsed.some(e => e.id === "QVVOBFE7");
    if (!hasQVV) {
      parsed.push(defaultSeed[0]);
      return { exams: parsed, needsSave: true };
    }

    if (version >= SCHEMA_VERSION) {
      return { exams: Array.isArray(parsed) ? parsed : [], needsSave: false };
    }
    // Migration needed — sanitize all text fields
    const migrated = sanitizeExams(parsed);
    return { exams: migrated, needsSave: true };
  } catch {
    return { exams: [], needsSave: false };
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  // ── Firebase Auth listener ───────────────────────────────────────────────
  // Stays in sync with Firebase Auth state changes (login, logout, token refresh).
  // On sign-in, enriches the local user state with Firestore profile data.
  useEffect(() => {
    if (!FIREBASE_ENABLED) return;
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const profile = await getUserDoc(firebaseUser.uid);
          if (profile) {
            const enriched = {
              uid:          firebaseUser.uid,
              name:         profile.name || firebaseUser.displayName || 'Élève',
              email:        firebaseUser.email,
              role:         profile.role || 'student',
              tier:         profile.tier || 'freemium',
              xp:           profile.xp   || 0,
              streak:       profile.streak || 0,
              rank:         profile.rank  || null,
              totalStudents: profile.totalStudents || 1200,
              subscription: profile.subscription || null,
            };
            setUser(enriched);
          }
        } catch (e) {
          console.warn('[Firebase] Failed to fetch user profile:', e.message);
        }
      } else {
        // Firebase signed out — only clear if we were using Firebase auth
        const saved = localStorage.getItem('user');
        const localUser = saved ? JSON.parse(saved) : null;
        if (localUser?.uid) setUser(null); // uid means it was a Firebase user
      }
    });
    return () => unsubscribe();
  }, []);

  const { exams: initialExams, needsSave } = loadAndMigrateExams();
  const [exams, setExams] = useState(initialExams);

  // Persist migration result immediately if schema was upgraded
  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useEffect(() => {
    if (needsSave) {
      localStorage.setItem('exams', JSON.stringify(initialExams));
      localStorage.setItem('examsSchemaVersion', String(SCHEMA_VERSION));
    }
  }, []); // run once on mount

  useEffect(() => {
    localStorage.setItem('user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('exams', JSON.stringify(exams));
    localStorage.setItem('examsSchemaVersion', String(SCHEMA_VERSION));
  }, [exams]);



  
  // Theme Management
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });

  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Progress state for SRS: { [questionId]: { difficulty, stability, repetitions, easeFactor, lastReviewDate, nextReviewDate } }
  // Migrated from legacy SM-2: { interval, repetitions, easeFactor, nextReviewDate }
  const [progress, setProgress] = useState(() => {
    const saved = localStorage.getItem('progress');
    if (!saved) return {};
    try {
      const parsed = JSON.parse(saved);
      let migrated = false;
      const migratedProgress = {};
      Object.entries(parsed).forEach(([id, card]) => {
        if (card && card.repetitions !== undefined && card.difficulty === undefined) {
          migrated = true;
          const easeFactor = card.easeFactor || 2.5;
          const interval = card.interval || 1;
          const difficulty = Math.max(1.0, Math.min(10.0, 12.0 - 4.0 * easeFactor));
          const stability = Math.max(0.5, interval);
          const nextReviewDate = card.nextReviewDate || new Date().toISOString();
          const lastReview = new Date(nextReviewDate);
          lastReview.setDate(lastReview.getDate() - Math.round(stability));

          migratedProgress[id] = {
            difficulty,
            stability,
            repetitions: card.repetitions,
            easeFactor, // keep stored for stats backward-compatibility
            lastReviewDate: lastReview.toISOString(),
            nextReviewDate
          };
        } else {
          migratedProgress[id] = card;
        }
      });
      if (migrated) {
        localStorage.setItem('progress', JSON.stringify(migratedProgress));
      }
      return migratedProgress;
    } catch (e) {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem('progress', JSON.stringify(progress));
  }, [progress]);

  // Mock Exam History state: [ { id, date, examId, examName, school, score, maxScore, pct, correctCount, wrongCount, emptyCount, mode } ]
  const [mockExamHistory, setMockExamHistory] = useState(() => {
    const saved = localStorage.getItem('mockExamHistory');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('mockExamHistory', JSON.stringify(mockExamHistory));
  }, [mockExamHistory]);

  const saveMockExamResult = async (result) => {
    const localId = Math.random().toString(36).substr(2, 9);
    const newResult = {
      date: new Date().toISOString(),
      ...result
    };
    
    if (FIREBASE_ENABLED && user?.uid) {
      try {
        await saveMockResult(user.uid, newResult);
        // reload history from firebase to be in sync
        const fbHistory = await getMockHistory(user.uid);
        setMockExamHistory(fbHistory);
      } catch (e) {
        console.error('[Firebase] Failed to save mock result:', e);
      }
    } else {
      setMockExamHistory(prev => [
        { id: localId, ...newResult },
        ...prev
      ]);
    }
  };


  const [users, setUsers] = useState([
    { id: '1', name: 'Youssef Alaoui', email: 'youssef@massar.ma', tier: 'freemium', joined: '2026-05-10', xp: 450 },
    { id: '2', name: 'Sara Bennani', email: 'premium@lconq.ma', tier: 'premium', joined: '2026-05-01', xp: 8450 },
    { id: '3', name: 'Aymane Idrissi', email: 'free@lconq.ma', tier: 'freemium', joined: '2026-05-12', xp: 120 },
  ]);

  // Check subscription expiration on mount/updates
  useEffect(() => {
    const now = new Date();
    let changed = false;
    const checkedUsers = users.map(u => {
      if (u.subscription && new Date(u.subscription.endDate) < now && u.subscription.status === 'active') {
        changed = true;
        return {
          ...u,
          tier: 'freemium',
          subscription: {
            ...u.subscription,
            status: 'expired'
          }
        };
      }
      return u;
    });

    if (changed) {
      setUsers(checkedUsers);
      if (user && user.subscription && new Date(user.subscription.endDate) < now && user.subscription.status === 'active') {
        setUser(u => ({
          ...u,
          tier: 'freemium',
          subscription: {
            ...u.subscription,
            status: 'expired'
          }
        }));
      }
    }
  }, [users, user]);

  const login = async (email, password) => {
    // ── Admin shortcut (no Firebase needed) ──────────────────────────────────
    if (email === 'admin@lconq.ma') {
      setUser({ name: 'Directeur', email: email, role: 'admin' });
      return;
    }

    // ── Firebase Auth login ───────────────────────────────────────────────────
    if (FIREBASE_ENABLED) {
      try {
        const fbUser = await loginWithEmail(email, password);
        setUser(fbUser);
        return;
      } catch (err) {
        if (err.message !== 'ADMIN_LOCAL') {
          throw err; // re-throw so the login form can show the error
        }
      }
    }

    // ── Fallback: legacy mock users (local dev without Firebase) ─────────────
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      setUser({ ...existingUser, role: 'student', rank: existingUser.tier === 'premium' ? 12 : 445, totalStudents: 1200, streak: 3 });
    } else {
      setUser({ name: 'Élève', email: email, role: 'student', tier: 'freemium', rank: 445, totalStudents: 1200, xp: 0, streak: 0 });
    }
  };

  // ── Firebase registration ────────────────────────────────────────────────
  const register = async (name, email, password) => {
    if (!FIREBASE_ENABLED) {
      throw new Error('Firebase is not configured. Add your .env.local file.');
    }
    const newUser = await registerStudent(name, email, password);
    setUser(newUser);
    return newUser;
  };

  const logout = async () => {
    if (FIREBASE_ENABLED && user?.uid) {
      try { await logoutUser(); } catch (e) { /* ignore */ }
    }
    setUser(null);
  };

  const addExam = async (name, school, year, tier, questions, pdfUrl = null) => {
    const cleanQuestions = sanitizeExams([{ questions }])[0].questions;
    const newExam = {
      name,
      school,
      year,
      tier,
      questions: cleanQuestions,
      pdfUrl,
      isActive: true,
      isArchived: false,
      dateAdded: new Date().toISOString()
    };
    
    if (FIREBASE_ENABLED) {
      try {
        const newId = await fbAddExam(newExam);
        setExams(prev => [...prev, { id: newId, ...newExam }]);
      } catch (e) {
        console.error('[Firebase] Failed to add exam:', e);
      }
    } else {
      setExams(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), ...newExam }]);
    }
  };

  const toggleExamStatus = async (examId) => {
    const target = exams.find(e => e.id === examId);
    if (!target) return;
    if (FIREBASE_ENABLED) {
      try {
        await fbToggleExamStatus(examId, target.isActive);
        setExams(prev => prev.map(e => e.id === examId ? { ...e, isActive: !e.isActive } : e));
      } catch (e) {
        console.error('[Firebase] Failed to toggle exam status:', e);
      }
    } else {
      setExams(prev => prev.map(e => e.id === examId ? { ...e, isActive: !e.isActive } : e));
    }
  };

  const updateExamDetails = async (examId, updates) => {
    if (FIREBASE_ENABLED) {
      try {
        await fbUpdateExam(examId, updates);
        setExams(prev => prev.map(e => e.id === examId ? { ...e, ...updates } : e));
      } catch (e) {
        console.error('[Firebase] Failed to update exam details:', e);
      }
    } else {
      setExams(prev => prev.map(e => e.id === examId ? { ...e, ...updates } : e));
    }
  };

  const deleteExam = async (examId) => {
    if (FIREBASE_ENABLED) {
      try {
        await fbDeleteExam(examId);
        setExams(prev => prev.filter(e => e.id !== examId));
      } catch (e) {
        console.error('[Firebase] Failed to delete exam:', e);
      }
    } else {
      setExams(prev => prev.filter(e => e.id !== examId));
    }
  };

  const toggleArchiveExam = async (examId) => {
    const target = exams.find(e => e.id === examId);
    if (!target) return;
    if (FIREBASE_ENABLED) {
      try {
        await fbToggleArchiveExam(examId, target.isArchived);
        setExams(prev => prev.map(e => e.id === examId ? { ...e, isArchived: !e.isArchived } : e));
      } catch (e) {
        console.error('[Firebase] Failed to toggle archive status:', e);
      }
    } else {
      setExams(prev => prev.map(e => e.id === examId ? { ...e, isArchived: !e.isArchived } : e));
    }
  };

  const updateUserTier = async (userId, newTier) => {
    if (FIREBASE_ENABLED) {
      try {
        await updateUserDoc(userId, { tier: newTier });
        setUsers(prev => prev.map(u => u.id === userId || u.uid === userId ? { ...u, tier: newTier } : u));
        if (user && (user.id === userId || user.uid === userId)) {
          setUser(u => ({ ...u, tier: newTier }));
        }
      } catch (e) {
        console.error('[Firebase] Failed to update user tier:', e);
      }
    } else {
      setUsers(users.map(u => u.id === userId ? { ...u, tier: newTier } : u));
      if (user && user.id === userId) {
        setUser({ ...user, tier: newTier });
      }
    }
  };

  const [plans, setPlans] = useState(() => {
    const saved = localStorage.getItem('plans');
    let parsed = null;
    if (saved) {
      try {
        parsed = JSON.parse(saved);
      } catch (e) {
        parsed = null;
      }
    }
    
    // Default fallback plans aligned with the new Premium L'Conq mockup
    const defaultPlans = [
      {
        id: 'plan_lconq',
        name: "Premium L'Conq",
        price: 99,
        durationDays: 30,
        description: "Le pack complet pour la réussite.",
        isRecommended: true,
        features: [
          "Accès à toutes les archives (2010–2025)",
          "Astuces IA exclusives pour chaque QCM",
          "Simulateur de concours chronométré",
          "Heatmaps des faiblesses"
        ],
        allowedSchools: ['Médecine / Pharmacie', 'ENSA', 'ENSAM', 'ENCG', 'INPT', 'INSEA', 'Général (Prépa)']
      },
      {
        id: 'plan_complet',
        name: "Pack Premium Global",
        price: 699,
        durationDays: 365,
        description: "La préparation ultime sur le long terme.",
        isRecommended: false,
        features: [
          "Accès à toutes les archives (2010–2025)",
          "Astuces IA exclusives pour chaque QCM",
          "Simulateur de concours chronométré",
          "Heatmaps des faiblesses",
          "Accès prioritaire aux nouveautés"
        ],
        allowedSchools: ['Médecine / Pharmacie', 'ENSA', 'ENSAM', 'ENCG', 'INPT', 'INSEA', 'Général (Prépa)']
      }
    ];

    if (!parsed || !Array.isArray(parsed) || parsed.length === 0) {
      return defaultPlans;
    }

    // Ensure loaded plans have the features and description field
    return parsed.map(p => ({
      ...p,
      description: p.description !== undefined ? p.description : "Accès complet pour préparer vos concours.",
      isRecommended: p.isRecommended !== undefined ? p.isRecommended : (p.id === 'plan_complet'),
      features: Array.isArray(p.features) ? p.features : [
        "Accès à toutes les archives (2010–2025)",
        "Astuces IA exclusives pour chaque QCM",
        "Simulateur de concours chronométré",
        "Heatmaps des faiblesses"
      ]
    }));
  });

  useEffect(() => {
    localStorage.setItem('plans', JSON.stringify(plans));
  }, [plans]);

  const addPlan = async (name, price, durationDays, allowedSchools, description = '', isRecommended = false, features = []) => {
    const newPlan = {
      id: 'plan_' + Math.random().toString(36).substr(2, 9),
      name,
      price: parseFloat(price) || 0,
      durationDays: parseInt(durationDays) || 365,
      allowedSchools: allowedSchools || [],
      description: description || "Accès complet pour préparer vos concours.",
      isRecommended: !!isRecommended,
      features: Array.isArray(features) ? features : [
        "Accès à toutes les archives (2010–2025)",
        "Astuces IA exclusives pour chaque QCM",
        "Simulateur de concours chronométré",
        "Heatmaps des faiblesses"
      ]
    };
    const updatedPlans = [...plans, newPlan];
    setPlans(updatedPlans);
    if (FIREBASE_ENABLED) {
      try {
        await savePlans(updatedPlans);
      } catch (e) {
        console.error('[Firebase] Failed to save plans config:', e);
      }
    }
  };

  const removePlan = async (planId) => {
    const updatedPlans = plans.filter(p => p.id !== planId);
    setPlans(updatedPlans);
    if (FIREBASE_ENABLED) {
      try {
        await savePlans(updatedPlans);
      } catch (e) {
        console.error('[Firebase] Failed to remove plan:', e);
      }
    }
  };

  const updatePlan = async (planId, updates) => {
    const updatedPlans = plans.map(p => p.id === planId ? { ...p, ...updates } : p);
    setPlans(updatedPlans);
    if (FIREBASE_ENABLED) {
      try {
        await savePlans(updatedPlans);
      } catch (e) {
        console.error('[Firebase] Failed to update plan:', e);
      }
    }
  };

  const activateSubscription = async (userId, planId, durationDays) => {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + parseInt(durationDays));

    const subscription = {
      planId,
      status: 'active',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    };

    if (FIREBASE_ENABLED) {
      try {
        await setUserSubscription(userId, subscription, 'premium');
        setUsers(prev => prev.map(u => u.id === userId || u.uid === userId ? { ...u, tier: 'premium', subscription } : u));
        if (user && (user.uid === userId || user.id === userId)) {
          setUser(u => ({ ...u, tier: 'premium', subscription }));
        }
      } catch (e) {
        console.error('[Firebase] Failed to activate subscription:', e);
      }
    } else {
      const updatedUsers = users.map(u => {
        if (u.id === userId) {
          return {
            ...u,
            tier: 'premium',
            subscription
          };
        }
        return u;
      });

      setUsers(updatedUsers);

      if (user && user.id === userId) {
        const match = updatedUsers.find(u => u.id === userId);
        setUser({ ...user, ...match });
      }
    }
  };

  const cancelSubscription = async (userId) => {
    if (FIREBASE_ENABLED) {
      try {
        await setUserSubscription(userId, null, 'freemium');
        setUsers(prev => prev.map(u => u.id === userId || u.uid === userId ? { ...u, tier: 'freemium', subscription: null } : u));
        if (user && (user.uid === userId || user.id === userId)) {
          setUser(u => ({ ...u, tier: 'freemium', subscription: null }));
        }
      } catch (e) {
        console.error('[Firebase] Failed to cancel subscription:', e);
      }
    } else {
      const updatedUsers = users.map(u => {
        if (u.id === userId) {
          return {
            ...u,
            tier: 'freemium',
            subscription: null
          };
        }
        return u;
      });

      setUsers(updatedUsers);

      if (user && user.id === userId) {
        const match = updatedUsers.find(u => u.id === userId);
        setUser({ ...user, ...match });
      }
    }
  };

  const [activationCodes, setActivationCodes] = useState(() => {
    const saved = localStorage.getItem('activationCodes');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    
    // Seed some default test codes
    return [
      {
        code: 'LCONQ-PREM-TEST-30D',
        planId: 'plan_lconq',
        isUsed: false,
        usedBy: '',
        usedAt: '',
        batchName: 'Test Batch 30 Jours',
        createdDate: new Date().toISOString()
      },
      {
        code: 'LCONQ-GLOB-TEST-365',
        planId: 'plan_complet',
        isUsed: false,
        usedBy: '',
        usedAt: '',
        batchName: 'Test Batch 365 Jours',
        createdDate: new Date().toISOString()
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('activationCodes', JSON.stringify(activationCodes));
  }, [activationCodes]);

  const generateActivationCodes = async (planId, count, batchName) => {
    const newCodes = [];
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    for (let i = 0; i < count; i++) {
      // Generate code format: LCONQ-XXXX-XXXX
      let part1 = '';
      let part2 = '';
      for (let j = 0; j < 4; j++) {
        part1 += characters.charAt(Math.floor(Math.random() * characters.length));
        part2 += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      const codeStr = `LCONQ-${part1}-${part2}`;
      newCodes.push({
        code: codeStr,
        planId,
        isUsed: false,
        usedBy: '',
        usedAt: '',
        batchName: batchName || 'Manuel',
        createdDate: new Date().toISOString()
      });
    }
    setActivationCodes(prev => [...newCodes, ...prev]);
    if (FIREBASE_ENABLED) {
      try {
        await saveActivationCodes(newCodes);
      } catch (e) {
        console.error('[Firebase] Failed to save activation codes:', e);
      }
    }
    return newCodes;
  };

  const redeemActivationCode = async (codeStr) => {
    const cleanCode = codeStr.trim().toUpperCase();
    
    let codeObj = null;
    let foundIdx = -1;
    
    if (FIREBASE_ENABLED) {
      codeObj = await getCode(cleanCode);
    } else {
      foundIdx = activationCodes.findIndex(c => c.code.toUpperCase() === cleanCode);
      if (foundIdx !== -1) {
        codeObj = activationCodes[foundIdx];
      }
    }
    
    if (!codeObj) {
      throw new Error("Code d'activation invalide. Veuillez vérifier la saisie.");
    }
    
    if (codeObj.isUsed) {
      throw new Error(`Ce code a déjà été utilisé par ${codeObj.usedBy} le ${new Date(codeObj.usedAt).toLocaleDateString('fr-FR')}.`);
    }
    
    const plan = plans.find(p => p.id === codeObj.planId);
    if (!plan) {
      throw new Error("Plan d'abonnement introuvable pour ce code.");
    }
    
    if (!user) {
      throw new Error("Seuls les élèves connectés peuvent activer un abonnement.");
    }
    
    if (FIREBASE_ENABLED) {
      try {
        await markCodeUsed(cleanCode, user.name || user.email);
        setActivationCodes(prev => prev.map(c => c.code.toUpperCase() === cleanCode ? { ...c, isUsed: true, usedBy: user.name || user.email, usedAt: new Date().toISOString() } : c));
        await activateSubscription(user.uid, plan.id, plan.durationDays);
      } catch (e) {
        console.error('[Firebase] Failed to redeem code:', e);
        throw e;
      }
    } else {
      // Mark code as used locally
      const updatedCodes = [...activationCodes];
      updatedCodes[foundIdx] = {
        ...codeObj,
        isUsed: true,
        usedBy: user.name || user.email,
        usedAt: new Date().toISOString()
      };
      setActivationCodes(updatedCodes);
      activateSubscription(user.id, plan.id, plan.durationDays);
    }
    
    return plan;
  };

  // FSRS (Free Spaced Repetition Scheduler) Algorithm Implementation
  const updateCardProgress = (questionId, quality) => {
    // Quality: 0 = failed/forgot, 3 = hard, 4 = good, 5 = easy
    let updatedCardState = null;
    setProgress((prev) => {
      const card = prev[questionId] || {
        difficulty: 5.0,
        stability: 2.0,
        repetitions: 0,
        lastReviewDate: new Date().toISOString(),
        nextReviewDate: new Date().toISOString()
      };

      let { difficulty, stability, repetitions } = card;
      const now = new Date();
      const lastReview = card.lastReviewDate ? new Date(card.lastReviewDate) : now;

      // 1. Calculate elapsed days since last review
      const elapsedDays = Math.max(0.5, (now.getTime() - lastReview.getTime()) / (1000 * 3600 * 24));

      // 2. Update stats using FSRS formulas
      if (repetitions === 0) {
        // Initial setup
        if (quality < 3) {
          difficulty = 8.2;
          stability = 0.5;
        } else {
          // quality >= 3
          difficulty = Math.max(1.0, Math.min(10.0, 6.0 - 0.8 * (quality - 3)));
          stability = Math.max(1.0, 2.0 * (quality - 2)); // 3->2d, 4->4d, 5->6d
        }
        repetitions = 1;
      } else {
        // Recall probability (Retrievability)
        const retrievability = Math.pow(0.9, elapsedDays / stability);

        // Update Difficulty (D)
        const diffChange = -0.7 * (quality - 4);
        difficulty = Math.max(1.0, Math.min(10.0, difficulty + diffChange));

        // Update Stability (S)
        if (quality < 3) {
          // Forgot / lapse
          stability = Math.max(0.5, Math.min(stability * 0.2, 1.5));
          repetitions = 1; // reset streak-like repetitions count
        } else {
          // Succeeded
          const hardBonus = quality === 3 ? 0.75 : quality === 4 ? 1.0 : 1.5;
          const factor = 1.0 + Math.pow(9.0 - difficulty, 0.4) * Math.pow(stability, -0.15) * (Math.exp(Math.pow(1.0 - retrievability, 0.45)) - 0.45) * hardBonus;
          stability = Math.max(stability + 1.0, stability * factor);
          repetitions += 1;
        }
      }

      // 3. Compute Interval
      const interval = Math.round(stability);
      const nextReviewDate = new Date();
      nextReviewDate.setDate(nextReviewDate.getDate() + interval);

      // Map difficulty back to easeFactor equivalent for stats backward-compatibility
      const easeFactor = 3.0 - (difficulty - 1.0) / 4.5;

      updatedCardState = {
        difficulty,
        stability,
        repetitions,
        easeFactor,
        lastReviewDate: now.toISOString(),
        nextReviewDate: nextReviewDate.toISOString()
      };

      if (FIREBASE_ENABLED && user?.uid) {
        saveQuestionProgress(user.uid, questionId, updatedCardState).catch(e =>
          console.error('[Firebase] Failed to save card progress:', e)
        );
      }

      return {
        ...prev,
        [questionId]: updatedCardState
      };
    });

    // ── Track daily activity for stats & streak ──────────────────────────────
    const todayStr = new Date().toISOString().split('T')[0];
    // reviewDates: sorted list of unique days with at least 1 review
    const storedDates = JSON.parse(localStorage.getItem('reviewDates') || '[]');
    if (!storedDates.includes(todayStr)) {
      const updated = [...storedDates, todayStr].slice(-90); // keep last 90 days
      localStorage.setItem('reviewDates', JSON.stringify(updated));
    }
    // dailyActivity: { 'YYYY-MM-DD': count }
    const dailyActivity = JSON.parse(localStorage.getItem('dailyActivity') || '{}');
    dailyActivity[todayStr] = (dailyActivity[todayStr] || 0) + 1;
    localStorage.setItem('dailyActivity', JSON.stringify(dailyActivity));

    if (FIREBASE_ENABLED && user?.uid) {
      incrementDailyActivity(user.uid).catch(e =>
        console.error('[Firebase] Failed to increment daily activity:', e)
      );
    }

    // Reward XP for good answers
    if (user && quality >= 3) {
      const xpGain = quality * 10;
      const newXp = (user.xp || 0) + xpGain;
      setUser(u => ({ ...u, xp: newXp }));
      if (FIREBASE_ENABLED && user.uid) {
        updateUserDoc(user.uid, { xp: newXp }).catch(e =>
          console.error('[Firebase] Failed to update XP in Firestore:', e)
        );
      }
    }
  };

  // ── Student Statistics (computed from real progress data) ─────────────────
  const getStudentStats = () => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const activeExams = exams.filter(e => e.isActive !== false && e.isArchived !== true);
    const allQuestions = activeExams.flatMap(e =>
      (e.questions || []).map(q => ({ ...q, examName: e.name }))
    );
    const totalCards = allQuestions.length;

    let masteredCards = 0;
    let learningCards = 0;
    let dueToday = 0;
    const topicMap = {}; // topic -> { totalEF, count, mastered, total }

    allQuestions.forEach(q => {
      const p = progress[q.id];
      const topic = q.topic || 'Général';
      if (!topicMap[topic]) topicMap[topic] = { totalEF: 0, count: 0, mastered: 0, total: 0 };
      topicMap[topic].total++;
      if (!p) return;
      const { repetitions, easeFactor, nextReviewDate } = p;
      if (repetitions >= 3) { masteredCards++; topicMap[topic].mastered++; }
      else if (repetitions > 0) learningCards++;
      topicMap[topic].totalEF += easeFactor;
      topicMap[topic].count++;
      if (new Date(nextReviewDate) <= now) dueToday++;
    });

    // Topics sorted by avg ease factor (weakest first)
    const topicsArr = Object.entries(topicMap)
      .filter(([, s]) => s.count > 0)
      .map(([name, s]) => ({
        name,
        avgEF: s.totalEF / s.count,
        masteryPct: Math.round((s.mastered / s.total) * 100),
        mastered: s.mastered,
        total: s.total,
      }))
      .sort((a, b) => a.avgEF - b.avgEF);

    const weakTopics  = topicsArr.filter(t => t.avgEF < 2.2).slice(0, 4);
    const strongTopics = [...topicsArr].sort((a, b) => b.avgEF - a.avgEF).filter(t => t.avgEF >= 2.4).slice(0, 3);

    // Weekly activity from dailyActivity store
    const dailyActivity = JSON.parse(localStorage.getItem('dailyActivity') || '{}');
    const weeklyActivity = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (6 - i));
      const key = d.toISOString().split('T')[0];
      const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
      return { name: dayNames[d.getDay()], count: dailyActivity[key] || 0, isToday: key === todayStr };
    });

    // Streak: consecutive days with at least 1 review ending today or yesterday
    const reviewDates = JSON.parse(localStorage.getItem('reviewDates') || '[]');
    let streak = 0;
    let checkDate = new Date(now);
    for (let i = 0; i < 365; i++) {
      const ds = checkDate.toISOString().split('T')[0];
      if (reviewDates.includes(ds)) { streak++; checkDate.setDate(checkDate.getDate() - 1); }
      else break;
    }

    const globalMasteryPct = totalCards > 0 ? Math.round((masteredCards / totalCards) * 100) : 0;

    // Dynamic live rank based on XP
    const totalStudents = user?.totalStudents || 1200;
    const userXp = user?.xp || 0;
    const rank = Math.max(1, Math.min(totalStudents, Math.round(totalStudents * Math.pow(0.9992, userXp))));

    return {
      totalCards, masteredCards, learningCards,
      newCards: totalCards - masteredCards - learningCards,
      dueToday, globalMasteryPct, weakTopics, strongTopics,
      weeklyActivity, streak, rank, totalStudents,
    };
  };

  const [schools, setSchools] = useState(() => {
    const saved = localStorage.getItem('schools');
    return saved ? JSON.parse(saved) : ['Médecine / Pharmacie', 'ENSA', 'ENSAM', 'ENCG', 'INPT', 'INSEA', 'Général (Prépa)'];
  });

  useEffect(() => {
    localStorage.setItem('schools', JSON.stringify(schools));
  }, [schools]);

  // Custom branding per school (emoji overrides)
  const [schoolBranding, setSchoolBranding] = useState(() => {
    const saved = localStorage.getItem('schoolBranding');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem('schoolBranding', JSON.stringify(schoolBranding));
  }, [schoolBranding]);

  // ── Firebase Firestore Syncing ──────────────────────────────────────────────
  useEffect(() => {
    if (!FIREBASE_ENABLED) return;

    const loadConfigAndExams = async () => {
      try {
        // Fetch Schools
        const schoolsConfig = await getSchoolsConfig();
        if (schoolsConfig && schoolsConfig.schools && schoolsConfig.schools.length > 0) {
          setSchools(schoolsConfig.schools);
          setSchoolBranding(schoolsConfig.branding || {});
        } else {
          // Seed defaults if config document doesn't exist
          await saveSchoolsConfig(schools, schoolBranding);
        }

        // Fetch Plans
        const fbPlans = await getPlans();
        if (fbPlans && fbPlans.length > 0) {
          setPlans(fbPlans);
        } else {
          // Seed default plans if not present
          await savePlans(plans);
        }

        // Fetch Exams
        const fbExams = await getAllExams();
        if (fbExams && fbExams.length > 0) {
          setExams(fbExams);
        } else {
          // Seed the default exam to Firestore
          const defaultSeedExam = initialExams.find(e => e.id === "QVVOBFE7");
          if (defaultSeedExam) {
            await fbAddExam(defaultSeedExam);
          }
          setExams(initialExams);
        }
      } catch (e) {
        console.warn('[Firebase] Error syncing config/exams:', e.message);
      }
    };

    loadConfigAndExams();
  }, [user]);

  // Fetch User-specific data (progress, history) when a student logs in
  useEffect(() => {
    if (!FIREBASE_ENABLED || !user || user.role === 'admin') return;

    const loadStudentData = async () => {
      try {
        const [fbProgress, fbHistory] = await Promise.all([
          getAllProgress(user.uid),
          getMockHistory(user.uid)
        ]);
        setProgress(fbProgress || {});
        setMockExamHistory(fbHistory || []);
      } catch (e) {
        console.warn('[Firebase] Error loading student progress:', e.message);
      }
    };

    loadStudentData();
  }, [user]);

  // Fetch all registered users for Admin Dashboard when Admin is logged in
  useEffect(() => {
    if (!FIREBASE_ENABLED || user?.role !== 'admin') return;

    const loadAllUsers = async () => {
      try {
        const fbUsers = await getAllUsers();
        if (fbUsers && fbUsers.length > 0) {
          setUsers(fbUsers);
        }
        const fbCodes = await getAllCodes();
        if (fbCodes) {
          setActivationCodes(fbCodes);
        }
      } catch (e) {
        console.warn('[Firebase] Error loading admin users/codes:', e.message);
      }
    };

    loadAllUsers();
  }, [user]);


  const addSchool = async (name) => {
    if (name && !schools.includes(name)) {
      const updatedSchools = [...schools, name];
      setSchools(updatedSchools);
      if (FIREBASE_ENABLED) {
        try {
          await saveSchoolsConfig(updatedSchools, schoolBranding);
        } catch (e) {
          console.error('[Firebase] Failed to add school config:', e);
        }
      }
    }
  };

  const removeSchool = async (name) => {
    const updatedSchools = schools.filter(s => s !== name);
    const updatedBranding = { ...schoolBranding };
    delete updatedBranding[name];
    setSchools(updatedSchools);
    setSchoolBranding(updatedBranding);
    if (FIREBASE_ENABLED) {
      try {
        await saveSchoolsConfig(updatedSchools, updatedBranding);
      } catch (e) {
        console.error('[Firebase] Failed to remove school config:', e);
      }
    }
  };

  const renameSchool = async (oldName, newName) => {
    if (!newName || newName === oldName) return;
    const updatedSchools = schools.map(s => s === oldName ? newName : s);
    const updatedBranding = { ...schoolBranding };
    if (updatedBranding[oldName]) {
      updatedBranding[newName] = updatedBranding[oldName];
      delete updatedBranding[oldName];
    }
    setSchools(updatedSchools);
    setSchoolBranding(updatedBranding);
    setExams(prev => prev.map(e => e.school === oldName ? { ...e, school: newName } : e));
    if (FIREBASE_ENABLED) {
      try {
        await saveSchoolsConfig(updatedSchools, updatedBranding);
      } catch (e) {
        console.error('[Firebase] Failed to rename school config:', e);
      }
    }
  };

  const updateSchoolBranding = async (name, patch) => {
    const updatedBranding = { ...schoolBranding, [name]: { ...(schoolBranding[name] || {}), ...patch } };
    setSchoolBranding(updatedBranding);
    if (FIREBASE_ENABLED) {
      try {
        await saveSchoolsConfig(schools, updatedBranding);
      } catch (e) {
        console.error('[Firebase] Failed to update school branding:', e);
      }
    }
  };


  const isExamLocked = (exam) => {
    if (!exam) return true;
    if (user?.role === 'admin') return false;
    if (exam.tier === 'freemium') return false;
    
    // If not logged in or not premium, lock it
    if (!user || user.tier !== 'premium') return true;
    
    // Premium tier checks: verify plan allows this exam's school
    if (!user.subscription || user.subscription.status !== 'active') return true;
    
    const plan = plans.find(p => p.id === user.subscription.planId);
    if (!plan) return true;
    
    return !plan.allowedSchools.includes(exam.school);
  };

  return (
    <AuthContext.Provider value={{ 
      user, users, login, logout, register, exams, addExam, updateUserTier,
      toggleExamStatus, updateExamDetails, deleteExam, toggleArchiveExam,
      plans, activateSubscription, cancelSubscription, addPlan, removePlan, updatePlan,
      activationCodes, generateActivationCodes, redeemActivationCode,
      progress, updateCardProgress, getStudentStats,
      theme, toggleTheme,
      schools, addSchool, removeSchool, renameSchool,
      schoolBranding, updateSchoolBranding,
      mockExamHistory, saveMockExamResult,
      isExamLocked,
      firebaseEnabled: FIREBASE_ENABLED,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext) || {};
