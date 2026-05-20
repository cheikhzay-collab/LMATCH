import React, { createContext, useState, useContext, useEffect } from 'react';

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
    if (!raw) return { exams: [], needsSave: false };
    const parsed = JSON.parse(raw);
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

  // Progress state for SRS: { [questionId]: { interval, repetitions, easeFactor, nextReviewDate } }
  const [progress, setProgress] = useState(() => {
    const saved = localStorage.getItem('progress');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem('progress', JSON.stringify(progress));
  }, [progress]);

  const [users, setUsers] = useState([
    { id: '1', name: 'Youssef Alaoui', email: 'youssef@massar.ma', tier: 'freemium', joined: '2026-05-10', xp: 450 },
    { id: '2', name: 'Sara Bennani', email: 'premium@lmatch.ma', tier: 'premium', joined: '2026-05-01', xp: 8450 },
    { id: '3', name: 'Aymane Idrissi', email: 'free@lmatch.ma', tier: 'freemium', joined: '2026-05-12', xp: 120 },
  ]);

  const login = (email, password) => {
    if (email === 'admin@lmatch.ma') {
      setUser({ name: 'Directeur', email: email, role: 'admin' });
    } else {
      const existingUser = users.find(u => u.email === email);
      if (existingUser) {
        setUser({ ...existingUser, role: 'student', rank: existingUser.tier === 'premium' ? 12 : 445, totalStudents: 1200, streak: 3 });
      } else {
        setUser({ name: 'Élève', email: email, role: 'student', tier: 'freemium', rank: 445, totalStudents: 1200, xp: 0, streak: 0 });
      }
    }
  };

  const logout = () => {
    setUser(null);
  };

  const addExam = (name, school, year, tier, questions, pdfUrl = null) => {
    // Sanitize all question text fields at storage time to prevent CR/LF corruption
    const cleanQuestions = sanitizeExams([{ questions }])[0].questions;
    setExams([...exams, {
      id: Math.random().toString(36).substr(2, 9),
      name,
      school,
      year,
      tier,
      questions: cleanQuestions,
      pdfUrl,
      isActive: true,
      dateAdded: new Date().toISOString()
    }]);
  };

  const toggleExamStatus = (examId) => {
    setExams(exams.map(e => e.id === examId ? { ...e, isActive: e.isActive === false ? true : false } : e));
  };

  const updateExamDetails = (examId, updates) => {
    setExams(exams.map(e => e.id === examId ? { ...e, ...updates } : e));
  };

  const updateUserTier = (userId, newTier) => {
    setUsers(users.map(u => u.id === userId ? { ...u, tier: newTier } : u));
    if (user && user.id === userId) {
      setUser({ ...user, tier: newTier });
    }
  };

  // SM-2 Algorithm Implementation
  const updateCardProgress = (questionId, quality) => {
    // Quality: 0 = failed, 3 = hard, 4 = good, 5 = easy
    setProgress((prev) => {
      const card = prev[questionId] || { interval: 0, repetitions: 0, easeFactor: 2.5 };
      let { interval, repetitions, easeFactor } = card;

      if (quality >= 3) {
        if (repetitions === 0) {
          interval = 1;
        } else if (repetitions === 1) {
          interval = 6;
        } else {
          interval = Math.round(interval * easeFactor);
        }
        repetitions += 1;
      } else {
        repetitions = 0;
        interval = 1;
      }

      easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
      if (easeFactor < 1.3) easeFactor = 1.3;

      const nextReviewDate = new Date();
      nextReviewDate.setDate(nextReviewDate.getDate() + interval);

      return {
        ...prev,
        [questionId]: {
          interval,
          repetitions,
          easeFactor,
          nextReviewDate: nextReviewDate.toISOString()
        }
      };
    });

    // Reward XP for good answers (Moved OUTSIDE setProgress to avoid React StrictMode issues)
    if (user && quality >= 3) {
      setUser(u => ({ ...u, xp: u.xp + (quality * 10) }));
    }
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

  const addSchool = (name) => {
    if (name && !schools.includes(name)) {
      setSchools([...schools, name]);
    }
  };

  const removeSchool = (name) => {
    setSchools(schools.filter(s => s !== name));
    // Remove any branding for this school
    setSchoolBranding(prev => { const n = { ...prev }; delete n[name]; return n; });
  };

  const renameSchool = (oldName, newName) => {
    if (!newName || newName === oldName) return;
    setSchools(prev => prev.map(s => s === oldName ? newName : s));
    // Move branding to new name
    setSchoolBranding(prev => {
      const n = { ...prev };
      if (n[oldName]) { n[newName] = n[oldName]; delete n[oldName]; }
      return n;
    });
    // Update exams that reference this school
    setExams(prev => prev.map(e => e.school === oldName ? { ...e, school: newName } : e));
  };

  const updateSchoolBranding = (name, patch) => {
    setSchoolBranding(prev => ({ ...prev, [name]: { ...(prev[name] || {}), ...patch } }));
  };

  return (
    <AuthContext.Provider value={{ 
      user, users, login, logout, exams, addExam, updateUserTier, 
      toggleExamStatus, updateExamDetails,
      progress, updateCardProgress, theme, toggleTheme,
      schools, addSchool, removeSchool, renameSchool,
      schoolBranding, updateSchoolBranding
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
