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

  // Mock Exam History state: [ { id, date, examId, examName, school, score, maxScore, pct, correctCount, wrongCount, emptyCount, mode } ]
  const [mockExamHistory, setMockExamHistory] = useState(() => {
    const saved = localStorage.getItem('mockExamHistory');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('mockExamHistory', JSON.stringify(mockExamHistory));
  }, [mockExamHistory]);

  const saveMockExamResult = (result) => {
    setMockExamHistory(prev => [
      {
        id: Math.random().toString(36).substr(2, 9),
        date: new Date().toISOString(),
        ...result
      },
      ...prev
    ]);
  };


  const [users, setUsers] = useState([
    { id: '1', name: 'Youssef Alaoui', email: 'youssef@massar.ma', tier: 'freemium', joined: '2026-05-10', xp: 450 },
    { id: '2', name: 'Sara Bennani', email: 'premium@lconq.ma', tier: 'premium', joined: '2026-05-01', xp: 8450 },
    { id: '3', name: 'Aymane Idrissi', email: 'free@lconq.ma', tier: 'freemium', joined: '2026-05-12', xp: 120 },
  ]);

  const login = (email, password) => {
    if (email === 'admin@lconq.ma') {
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
        [questionId]: { interval, repetitions, easeFactor, nextReviewDate: nextReviewDate.toISOString() }
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

    // Reward XP for good answers
    if (user && quality >= 3) {
      setUser(u => ({ ...u, xp: (u.xp || 0) + (quality * 10) }));
    }
  };

  // ── Student Statistics (computed from real progress data) ─────────────────
  const getStudentStats = () => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const activeExams = exams.filter(e => e.isActive !== false);
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
      progress, updateCardProgress, getStudentStats,
      theme, toggleTheme,
      schools, addSchool, removeSchool, renameSchool,
      schoolBranding, updateSchoolBranding,
      mockExamHistory, saveMockExamResult
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
