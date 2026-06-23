import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import { onAuthChange, loginWithEmail, logoutUser, registerStudent, loginWithGoogle } from '../services/authService';
import { getUserDoc, createUserDoc, updateUserDoc, saveQuestionProgress, getAllProgress, getProgressDeltas, saveMockResult, getMockHistory, incrementDailyActivity, getRecentActivity, getAllUsers, setUserSubscription, getLeaderboard, addLoginLog, getLoginLogs } from '../services/userService';
import { getAllExams, addExam as dbAddExam, updateExam as dbUpdateExam, deleteExam as dbDeleteExam, toggleExamStatus as dbToggleExamStatus, toggleArchiveExam as dbToggleArchiveExam, getExamQuestionsOnly } from '../services/examService';
import { getSchoolsConfig, saveSchoolsConfig, getBrandingConfig, saveBrandingConfig, getFlashcardSettingsConfig, saveFlashcardSettingsConfig, getPdfSettingsConfig, savePdfSettingsConfig, getOmrScannerSettingsConfig, saveOmrScannerSettingsConfig, getWhatsAppSettingsConfig, saveWhatsAppSettingsConfig } from '../services/schoolService';
import { getPlans, savePlans, getAllCodes, saveActivationCodes, redeemCodeViaRPC } from '../services/planService';
import { sanitizeInputString, validatePhoneNumber } from '../utils/security';
import { supabase } from '../lib/supabase';



// ── Supabase availability guard ───────────────────────────────────────────────
// If VITE_SUPABASE_URL is not set (e.g. local dev without .env.local),
// the app falls back gracefully to localStorage-only mode.
const SUPABASE_ENABLED = !!import.meta.env.VITE_SUPABASE_URL;

const safeSetItem = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.warn(`[Storage] Failed to save '${key}' to localStorage:`, e.message || e);
  }
};

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
  /* eslint-disable no-control-regex */
  return s
    .replace(/\r\n/g, ' ')   // Windows CRLF
    .replace(/[\r\n]/g, ' ') // lone CR or LF
    .replace(/\t/g, ' ')     // Tab
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // other control chars
    .replace(/[\u200B-\u200D\uFEFF]/g, '')              // zero-width / BOM
    .replace(/ {2,}/g, ' ')  // collapse spaces
    .trim();
  /* eslint-enable no-control-regex */
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

const computeStudentStats = (exams, progress, leaderboard, user) => {
  if (!user) {
    return {
      totalCards: 0, masteredCards: 0, learningCards: 0, newCards: 0,
      dueToday: 0, globalMasteryPct: 0, weakTopics: [], strongTopics: [],
      weeklyActivity: [], streak: 0, rank: 1200, totalStudents: 1200,
    };
  }

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const activeExams = exams.filter(e => e.isActive !== false && e.isArchived !== true);

  let totalCards = 0;
  let masteredCards = 0;
  let learningCards = 0;
  let dueToday = 0;
  let totalWeightedMasterySum = 0;
  const topicMap = {}; // topic -> { totalEF, count, weightedMasterySum, total }

  activeExams.forEach(e => {
    if (!e.questions) return;
    totalCards += e.questions.length;

    e.questions.forEach(q => {
      const p = progress[q.id];
      const topic = q.topic || 'Général';
      if (!topicMap[topic]) topicMap[topic] = { totalEF: 0, count: 0, weightedMasterySum: 0, total: 0 };
      topicMap[topic].total++;
      if (!p) return;
      const { repetitions, easeFactor, nextReviewDate, stability } = p;
      
      // Calculate question mastery weight
      let weight = 0;
      
      // Fallback stability calculation for older card records
      const cardStability = stability !== undefined && stability !== null
        ? stability
        : (repetitions > 0 ? Math.max(1.0, 2.0 * Math.pow(3, repetitions - 1)) : 2.0);

      if (repetitions >= 3) {
        weight = 1.0;
        masteredCards++;
      } else if (repetitions === 2) {
        weight = 0.7;
        learningCards++;
      } else if (repetitions === 1) {
        if (cardStability > 1.0) {
          weight = 0.4;
        } else {
          weight = 0.0;
        }
        learningCards++;
      }

      topicMap[topic].weightedMasterySum += weight;
      totalWeightedMasterySum += weight;

      topicMap[topic].totalEF += easeFactor;
      topicMap[topic].count++;
      if (new Date(nextReviewDate) <= now) dueToday++;
    });
  });

  // Topics sorted by mastery (weakest first)
  const topicsArr = Object.entries(topicMap)
    .map(([name, s]) => {
      const masteryPct = s.total > 0 ? Math.round((s.weightedMasterySum / s.total) * 100) : 0;
      return {
        name,
        avgEF: s.count > 0 ? s.totalEF / s.count : 2.5,
        masteryPct,
        mastered: s.weightedMasterySum,
        total: s.total,
        count: s.count
      };
    });

  const weakTopics = [...topicsArr]
    .filter(t => t.count > 0 && t.masteryPct < 85)
    .sort((a, b) => a.masteryPct - b.masteryPct)
    .slice(0, 4);

  const strongTopics = [...topicsArr]
    .filter(t => t.count > 0 && t.masteryPct >= 70)
    .sort((a, b) => b.masteryPct - a.masteryPct)
    .slice(0, 3);

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

  // Global mastery percentage is relative to totalCards in active exams (curriculum coverage)
  const globalMasteryPct = totalCards > 0 
    ? Math.round((totalWeightedMasterySum / totalCards) * 100) 
    : 0;

  // Dynamic live rank based on real leaderboard or XP fallback
  let totalStudents;
  let rank;
  const userXp = user?.xp || 0;

  if (SUPABASE_ENABLED && leaderboard && leaderboard.length > 0) {
    totalStudents = leaderboard.length;
    const userIndex = leaderboard.findIndex(u => u.name === user?.name || u.email === user?.email);
    if (userIndex !== -1) {
      rank = userIndex + 1;
    } else {
      const higherXpCount = leaderboard.filter(u => u.xp > userXp).length;
      rank = higherXpCount + 1;
    }
  } else {
    totalStudents = user?.totalStudents || 1200;
    rank = Math.max(1, Math.min(totalStudents, Math.round(totalStudents * Math.pow(0.9992, userXp))));
  }

  return {
    totalCards, masteredCards, learningCards,
    newCards: totalCards - masteredCards - learningCards,
    dueToday, globalMasteryPct, weakTopics, strongTopics,
    weeklyActivity, streak, rank, totalStudents,
  };
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [upgradedPlan, setUpgradedPlan] = useState(null);
  // Initialize loading to true if Supabase is enabled so we can check and verify the session first
  const [loading, setLoading] = useState(SUPABASE_ENABLED);

  const [profName, setProfName] = useState(() => localStorage.getItem('profName') || '');
  const [profPhone, setProfPhone] = useState(() => localStorage.getItem('profPhone') || '');
  const [profSite, setProfSite] = useState(() => localStorage.getItem('profSite') || 'www.lconq.ma');

  const updateBrandingConfig = async (branding) => {
    const name = sanitizeInputString(branding.profName || '').trim();
    const phone = sanitizeInputString(branding.profPhone || '').trim();
    const site = sanitizeInputString(branding.profSite || '').trim() || 'www.lconq.ma';

    if (phone && !validatePhoneNumber(phone)) {
      console.warn('[Security] Invalid phone format in updateBrandingConfig.');
    }

    setProfName(name);
    setProfPhone(phone);
    setProfSite(site);

    localStorage.setItem('profName', name);
    localStorage.setItem('profPhone', phone);
    localStorage.setItem('profSite', site);

    if (SUPABASE_ENABLED) {
      try {
        await saveBrandingConfig({ profName: name, profPhone: phone, profSite: site });
      } catch (e) {
        console.error('[Supabase] Failed to save branding config:', e);
      }
    }
  };

  const updateFlashcardSettingsConfig = async (settings) => {
    if (SUPABASE_ENABLED) {
      try {
        await saveFlashcardSettingsConfig(settings);
      } catch (e) {
        console.error('[Supabase] Failed to save flashcard settings config:', e);
      }
    }
    localStorage.setItem('card_reveal_mode', settings.cardRevealMode);
    localStorage.setItem('card_flip_animation', String(settings.cardFlipEnabled));
    localStorage.setItem('card_swipe_gesture', String(settings.cardSwipeEnabled));
    localStorage.setItem('card_font_family', settings.cardFontFamily || 'Computer Modern Serif');
    localStorage.setItem('card_font_size', settings.cardFontSize || '1rem');
    localStorage.setItem('card_question_weight', settings.cardQuestionWeight || '400');
    localStorage.setItem('card_astuce_weight', settings.cardAstuceWeight || '400');
    localStorage.setItem('card_options_weight', settings.cardOptionsWeight || '400');
  };

  const updatePdfSettingsConfig = async (settings) => {
    if (SUPABASE_ENABLED) {
      try {
        await savePdfSettingsConfig(settings);
      } catch (e) {
        console.error('[Supabase] Failed to save PDF settings config:', e);
      }
    }
    localStorage.setItem('pdf_page_margins', settings.pdfPageMargins);
    localStorage.setItem('pdf_font_size', settings.pdfFontSize);
    localStorage.setItem('pdf_font_family', settings.pdfFontFamily);
    localStorage.setItem('pdf_template_style', settings.pdfTemplateStyle);
    localStorage.setItem('pdf_avoid_page_breaks', String(settings.pdfAvoidPageBreaks));
    localStorage.setItem('pdf_force_print_colors', String(settings.pdfForcePrintColors));
    localStorage.setItem('pdf_show_sidebar', String(settings.pdfShowSidebar));
  };

  const updateOmrScannerSettingsConfig = async (settings) => {
    if (SUPABASE_ENABLED) {
      try {
        await saveOmrScannerSettingsConfig(settings);
      } catch (e) {
        console.error('[Supabase] Failed to save OMR scanner settings config:', e);
      }
    }
    localStorage.setItem('scanner_direct_capture_enabled', settings.scannerDirectCapture ? 'true' : 'false');
  };

  const [whatsappSettings, setWhatsappSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('whatsappSettings');
      return saved ? JSON.parse(saved) : {
        enabled: true,
        phoneNumber: '',
        message: 'Bonjour, j\'ai une question concernant la plateforme Gima.',
        position: 'right',
        tooltipText: 'Besoin d\'aide ?'
      };
    } catch {
      return {
        enabled: true,
        phoneNumber: '',
        message: 'Bonjour, j\'ai une question concernant la plateforme Gima.',
        position: 'right',
        tooltipText: 'Besoin d\'aide ?'
      };
    }
  });

  const updateWhatsAppSettingsConfig = async (settings) => {
    setWhatsappSettings(settings);
    localStorage.setItem('whatsappSettings', JSON.stringify(settings));

    if (SUPABASE_ENABLED) {
      try {
        await saveWhatsAppSettingsConfig(settings);
      } catch (e) {
        console.error('[Supabase] Failed to save WhatsApp settings config:', e);
      }
    }
  };

  // ── Supabase Auth listener ───────────────────────────────────────────────
  // Stays in sync with Supabase Auth state changes (login, logout, token refresh).
  // On sign-in, enriches the local user state with database profile data.
  useEffect(() => {
    if (!SUPABASE_ENABLED) {
      setTimeout(() => setLoading(false), 0);
      return;
    }

    let active = true;

    // Safety net: force loading to false if auth doesn't resolve within 3 seconds
    const safetyTimeout = setTimeout(() => {
      console.warn('[Auth] Auth state resolution timed out. Forcing loading screen dismissal.');
      if (active) {
        // Offline fallback: restore from cached user if we haven't loaded yet
        const cached = localStorage.getItem('user');
        if (cached) {
          try {
            setUser(JSON.parse(cached));
          } catch (err) {
            console.warn('[Auth] Failed to parse cached user on timeout:', err);
          }
        }
        setLoading(false);
      }
    }, 3000);

    const initializeAuthAndListen = async () => {
      try {
        const { supabase } = await import('../lib/supabase');
        if (!supabase) {
          if (active) setLoading(false);
          return;
        }

        // 1. Fetch initial session using the official method
        const { data: { session }, error: sessionErr } = await supabase.auth.getSession();
        if (sessionErr) throw sessionErr;

        if (session?.user && active) {
          const supabaseUser = session.user;
          let profile = await getUserDoc(supabaseUser.id);
          if (!profile && active) {
            // Auto-create profile if missing (e.g. first-time Google OAuth)
            const defaultProfile = {
              name:         supabaseUser.user_metadata?.name || supabaseUser.user_metadata?.full_name || split_part_email(supabaseUser.email) || 'Élève',
              email:        supabaseUser.email,
              role:         'student',
              tier:         'freemium',
              xp:           0,
              streak:       0,
              rank:         null,
              totalStudents: 1200,
              joined:       new Date().toISOString(),
              subscription: null,
            };
            try {
              await createUserDoc(supabaseUser.id, defaultProfile);
              profile = { ...defaultProfile, uid: supabaseUser.id, id: supabaseUser.id };
            } catch (createErr) {
              console.warn('[Supabase] Failed to auto-create user profile:', createErr.message);
            }
          }

          if (profile && active) {
            const enriched = {
              uid:          supabaseUser.id,
              id:           supabaseUser.id,
              name:         profile.name || supabaseUser.user_metadata?.name || supabaseUser.user_metadata?.full_name || 'Élève',
              email:        supabaseUser.email,
              role:         profile.role || 'student',
              tier:         profile.tier || 'freemium',
              xp:           profile.xp   || 0,
              streak:       profile.streak || 0,
              rank:         profile.rank  || null,
              totalStudents: profile.totalStudents || 1200,
              subscription: profile.subscription || null,
              phone:        profile.phone || supabaseUser.user_metadata?.phone || '',
              city:         profile.city  || supabaseUser.user_metadata?.city  || '',
            };
            setUser(enriched);

            // Log session access log entry
            if (SUPABASE_ENABLED && !sessionStorage.getItem('logged_this_session')) {
              addLoginLog(supabaseUser.id).catch(err => console.warn('[Auth] Failed to add access log:', err));
              sessionStorage.setItem('logged_this_session', '1');
            }
          }
        } else if (active) {
          // No user session found
          setUser(null);
        }
      } catch (e) {
        console.warn('[Auth] Error during initial session recovery:', e.message);
        if (active) {
          // Offline fallback
          const cached = localStorage.getItem('user');
          if (cached) {
            try {
              setUser(JSON.parse(cached));
            } catch (err) {
              console.warn('[Auth] Failed to parse cached user:', err);
            }
          }
        }
      } finally {
        clearTimeout(safetyTimeout);
        if (active) {
          setLoading(false);
        }
      }
    };

    // Run session recovery
    initializeAuthAndListen();

    // 2. Subscribe to subsequent auth changes
    const unsubscribe = onAuthChange(async (event, session) => {
      // Ignore initial session event since we just recovered it
      if (event === 'INITIAL_SESSION') return;

      try {
        const supabaseUser = session?.user || null;
        if (supabaseUser) {
          let profile = await getUserDoc(supabaseUser.id);
          if (profile && active) {
            const enriched = {
              uid:          supabaseUser.id,
              id:           supabaseUser.id,
              name:         profile.name || supabaseUser.user_metadata?.name || supabaseUser.user_metadata?.full_name || 'Élève',
              email:        supabaseUser.email,
              role:         profile.role || 'student',
              tier:         profile.tier || 'freemium',
              xp:           profile.xp   || 0,
              streak:       profile.streak || 0,
              rank:         profile.rank  || null,
              totalStudents: profile.totalStudents || 1200,
              subscription: profile.subscription || null,
              phone:        profile.phone || supabaseUser.user_metadata?.phone || '',
              city:         profile.city  || supabaseUser.user_metadata?.city  || '',
            };
            setUser(enriched);
          }
        } else if (event === 'SIGNED_OUT' && active) {
          setUser(null);
        }
      } catch (e) {
        console.warn('[Auth] Error handling subsequent auth change:', e.message);
      }
    });

    return () => {
      active = false;
      clearTimeout(safetyTimeout);
      unsubscribe();
    };
  }, []);

  // Helper: extract readable name from email prefix
  const split_part_email = (email) => email ? email.split('@')[0] : 'Élève';


  const { exams: initialExams, needsSave } = loadAndMigrateExams();
  const [exams, setExams] = useState(initialExams);

  // Persist migration result immediately if schema was upgraded
  React.useEffect(() => {
    if (needsSave) {
      safeSetItem('exams', JSON.stringify(initialExams));
      safeSetItem('examsSchemaVersion', String(SCHEMA_VERSION));
    }
  }, [initialExams, needsSave]);

  useEffect(() => {
    safeSetItem('user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    // Save a light version of exams to localStorage to avoid exceeding the 5MB quota 
    // and prevent blocking the main thread with massive JSON serialization.
    const lightExams = exams.map(e => ({
      id: e.id,
      name: e.name,
      school: e.school,
      year: e.year,
      tier: e.tier,
      isActive: e.isActive,
      isArchived: e.isArchived,
      dateAdded: e.dateAdded,
      // Retain questions only for the default seed exam to allow offline development
      questions: e.id === "QVVOBFE7" ? e.questions : undefined
    }));
    safeSetItem('exams', JSON.stringify(lightExams));
    safeSetItem('examsSchemaVersion', String(SCHEMA_VERSION));
  }, [exams]);



  
  // Theme Management
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
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
        if (!card) return;
        
        let difficulty = card.difficulty;
        let stability = card.stability;
        let repetitions = card.repetitions;
        let easeFactor = card.easeFactor;
        let lastReviewDate = card.lastReviewDate;
        let nextReviewDate = card.nextReviewDate;

        // Migrate legacy card
        if (card.repetitions !== undefined && card.difficulty === undefined) {
          migrated = true;
          const ef = card.easeFactor || 2.5;
          const interval = card.interval || 1;
          difficulty = Math.max(1.0, Math.min(10.0, 12.0 - 4.0 * ef));
          stability = Math.max(0.5, interval);
          const nextDate = card.nextReviewDate || new Date().toISOString();
          const lastDateObj = new Date(nextDate);
          lastDateObj.setDate(lastDateObj.getDate() - Math.round(stability));
          lastReviewDate = lastDateObj.toISOString();
          nextReviewDate = nextDate;
          easeFactor = ef;
        }

        // Healing corrupt/NaN values
        if (difficulty === undefined || difficulty === null || isNaN(difficulty)) {
          const ef = easeFactor || 2.5;
          difficulty = Math.max(1.0, Math.min(10.0, 1.0 + 4.5 * (3.0 - ef)));
          if (isNaN(difficulty)) difficulty = 5.0;
          migrated = true;
        }
        if (stability === undefined || stability === null || isNaN(stability) || stability <= 0) {
          stability = repetitions > 0 ? Math.max(1.0, 2.0 * Math.pow(3, repetitions - 1)) : 2.0;
          if (isNaN(stability) || stability <= 0) stability = 2.0;
          migrated = true;
        }
        if (repetitions === undefined || repetitions === null || isNaN(repetitions)) {
          repetitions = 0;
          migrated = true;
        }
        if (easeFactor === undefined || easeFactor === null || isNaN(easeFactor)) {
          easeFactor = 3.0 - (difficulty - 1.0) / 4.5;
          if (isNaN(easeFactor)) easeFactor = 2.5;
          migrated = true;
        }
        
        // Date checks
        const checkLastDate = new Date(lastReviewDate);
        if (!lastReviewDate || isNaN(checkLastDate.getTime())) {
          lastReviewDate = new Date().toISOString();
          migrated = true;
        }
        const checkNextDate = new Date(nextReviewDate);
        if (!nextReviewDate || isNaN(checkNextDate.getTime())) {
          nextReviewDate = new Date().toISOString();
          migrated = true;
        }

        migratedProgress[id] = {
          difficulty,
          stability,
          repetitions,
          easeFactor,
          lastReviewDate,
          nextReviewDate
        };
      });
      if (migrated) {
        safeSetItem('progress', JSON.stringify(migratedProgress));
      }
      return migratedProgress;
    } catch {
      return {};
    }
  });

  const dueTodayCount = useMemo(() => {
    const now = new Date();
    let count = 0;
    Object.values(progress).forEach(p => {
      if (p && p.nextReviewDate && new Date(p.nextReviewDate) <= now) {
        count++;
      }
    });
    return count;
  }, [progress]);

  useEffect(() => {
    const timer = setTimeout(() => {
      safeSetItem('progress', JSON.stringify(progress));
    }, 1000);
    return () => clearTimeout(timer);
  }, [progress]);

  // Mock Exam History state: [ { id, date, examId, examName, school, score, maxScore, pct, correctCount, wrongCount, emptyCount, mode } ]
  const [mockExamHistory, setMockExamHistory] = useState(() => {
    const saved = localStorage.getItem('mockExamHistory');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    safeSetItem('mockExamHistory', JSON.stringify(mockExamHistory));
  }, [mockExamHistory]);

  const [leaderboard, setLeaderboard] = useState([]);

  const refreshLeaderboard = useCallback(async () => {
    if (!SUPABASE_ENABLED) return;
    try {
      const data = await getLeaderboard();
      setLeaderboard(data || []);
    } catch (e) {
      console.warn('[Supabase] Failed to refresh leaderboard:', e.message);
    }
  }, []);

  const saveMockExamResult = async (result) => {
    const localId = Math.random().toString(36).substr(2, 9);
    const newResult = {
      date: new Date().toISOString(),
      ...result
    };
    
    if (SUPABASE_ENABLED && (user?.uid || user?.id)) {
      const userId = user.uid || user.id;
      try {
        await saveMockResult(userId, newResult);
        // reload history from database to be in sync
        const dbHistory = await getMockHistory(userId);
        setMockExamHistory(dbHistory);
      } catch (e) {
        console.error('[Supabase] Failed to save mock result:', e);
      }
    } else {
      setMockExamHistory(prev => [
        { id: localId, ...newResult },
        ...prev
      ]);
    }
  };


  const [users, setUsers] = useState(() => {
    if (SUPABASE_ENABLED) return [];
    return [
      { id: '1', name: 'Youssef Alaoui', email: 'youssef@massar.ma', tier: 'freemium', joined: '2026-05-10', xp: 450 },
      { id: '2', name: 'Sara Bennani', email: 'premium@lconq.ma', tier: 'premium', joined: '2026-05-01', xp: 8450 },
      { id: '3', name: 'Aymane Idrissi', email: 'free@lconq.ma', tier: 'freemium', joined: '2026-05-12', xp: 120 },
    ];
  });

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
      setTimeout(() => {
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
      }, 0);
    }
  }, [users, user]);

  const login = async (email, password) => {
    // ── Supabase Auth login ───────────────────────────────────────────────────
    if (SUPABASE_ENABLED) {
      const sbUser = await loginWithEmail(email, password);
      setUser(sbUser);
      return;
    }

    // ── Fallback when Supabase is disabled ────────────────────────────────────
    if (email === 'admin@lconq.ma') {
      setUser({ name: 'Directeur', email: email, role: 'admin', uid: 'admin', id: 'admin' });
      return;
    }

    // ── Fallback: legacy mock users (local dev without Supabase) ─────────────
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      const mockUser = {
        ...existingUser,
        role: 'student',
        rank: existingUser.tier === 'premium' ? 12 : 445,
        totalStudents: 1200,
        streak: 3,
        uid: existingUser.id,
        id: existingUser.id
      };
      setUser(mockUser);
    } else {
      const mockUser = {
        name: 'Élève',
        email: email,
        role: 'student',
        tier: 'freemium',
        rank: 445,
        totalStudents: 1200,
        xp: 0,
        streak: 0,
        uid: 'mock_student',
        id: 'mock_student'
      };
      setUser(mockUser);
    }
  };

  const loginGoogle = async () => {
    if (SUPABASE_ENABLED) {
      return await loginWithGoogle();
    } else {
      // Fallback: mock Google OAuth user in local environment when Supabase is disabled
      const mockUser = {
        name: 'Élève Google',
        email: 'google-student@lconq.ma',
        role: 'student',
        tier: 'freemium',
        rank: 445,
        totalStudents: 1200,
        xp: 0,
        streak: 0,
        uid: 'mock_google_student',
        id: 'mock_google_student',
        joined: new Date().toISOString(),
        subscription: null,
      };
      setUser(mockUser);
    }
  };

  // ── Supabase registration ────────────────────────────────────────────────
  const register = async (name, email, password) => {
    if (!SUPABASE_ENABLED) {
      throw new Error('Supabase is not configured. Add your .env.local file.');
    }
    const newUser = await registerStudent(name, email, password);
    if (!newUser.needsConfirmation) {
      setUser(newUser);
    }
    return newUser;
  };

  const logout = async () => {
    if (SUPABASE_ENABLED && (user?.uid || user?.id)) {
      try { await logoutUser(); } catch { /* ignore */ }
    }
    // Clean up local review cache and sync info for privacy/security
    localStorage.removeItem('progress');
    localStorage.removeItem('progress_last_synced_at');
    localStorage.removeItem('last_synced_user_id');
    localStorage.removeItem('dailyActivity');
    localStorage.removeItem('reviewDates');
    localStorage.removeItem('mockExamHistory');
    setProgress({});
    setMockExamHistory([]);
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
    
    if (SUPABASE_ENABLED) {
      try {
        const newId = await dbAddExam(newExam);
        setExams(prev => [...prev, { id: newId, ...newExam }]);
      } catch (e) {
        console.error('[Supabase] Failed to add exam:', e);
      }
    } else {
      setExams(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), ...newExam }]);
    }
  };

  const toggleExamStatus = async (examId) => {
    const target = exams.find(e => e.id === examId);
    if (!target) return;
    if (SUPABASE_ENABLED) {
      try {
        await dbToggleExamStatus(examId, target.isActive);
        setExams(prev => prev.map(e => e.id === examId ? { ...e, isActive: !e.isActive } : e));
      } catch (e) {
        console.error('[Supabase] Failed to toggle exam status:', e);
      }
    } else {
      setExams(prev => prev.map(e => e.id === examId ? { ...e, isActive: !e.isActive } : e));
    }
  };

  const updateExamDetails = async (examId, updates) => {
    if (SUPABASE_ENABLED) {
      try {
        await dbUpdateExam(examId, updates);
        setExams(prev => prev.map(e => e.id === examId ? { ...e, ...updates } : e));
      } catch (e) {
        console.error('[Supabase] Failed to update exam details:', e);
      }
    } else {
      setExams(prev => prev.map(e => e.id === examId ? { ...e, ...updates } : e));
    }
  };

  const deleteExam = async (examId) => {
    if (SUPABASE_ENABLED) {
      try {
        await dbDeleteExam(examId);
        setExams(prev => prev.filter(e => e.id !== examId));
      } catch (e) {
        console.error('[Supabase] Failed to delete exam:', e);
      }
    } else {
      setExams(prev => prev.filter(e => e.id !== examId));
    }
  };

  const toggleArchiveExam = async (examId) => {
    const target = exams.find(e => e.id === examId);
    if (!target) return;
    if (SUPABASE_ENABLED) {
      try {
        await dbToggleArchiveExam(examId, target.isArchived);
        setExams(prev => prev.map(e => e.id === examId ? { ...e, isArchived: !e.isArchived } : e));
      } catch (e) {
        console.error('[Supabase] Failed to toggle archive status:', e);
      }
    } else {
      setExams(prev => prev.map(e => e.id === examId ? { ...e, isArchived: !e.isArchived } : e));
    }
  };

  const updateUserTier = async (userId, newTier) => {
    if (SUPABASE_ENABLED) {
      try {
        await updateUserDoc(userId, { tier: newTier });
        setUsers(prev => prev.map(u => u.id === userId || u.uid === userId ? { ...u, tier: newTier } : u));
        if (user && (user.id === userId || user.uid === userId)) {
          setUser(u => ({ ...u, tier: newTier }));
        }
      } catch (e) {
        console.error('[Supabase] Failed to update user tier:', e);
      }
    } else {
      setUsers(users.map(u => u.id === userId ? { ...u, tier: newTier } : u));
      if (user && user.id === userId) {
        setUser({ ...user, tier: newTier });
      }
    }
  };

  const updateProfile = async (updates) => {
    // Sanitize string properties and validate phone formats before DB operations
    const sanitizedUpdates = { ...updates };
    if (updates.name !== undefined) sanitizedUpdates.name = sanitizeInputString(updates.name);
    if (updates.phone !== undefined) {
      if (updates.phone && !validatePhoneNumber(updates.phone)) {
        throw new Error('Format de numéro de téléphone invalide.');
      }
      sanitizedUpdates.phone = sanitizeInputString(updates.phone);
    }
    if (updates.city !== undefined) sanitizedUpdates.city = sanitizeInputString(updates.city);

    if (SUPABASE_ENABLED && (user?.uid || user?.id)) {
      const userId = user.uid || user.id;
      try {
        await updateUserDoc(userId, sanitizedUpdates);
        setUser(u => ({ ...u, ...sanitizedUpdates }));
      } catch (dbErr) {
        console.warn("[Auth] Failed to update profiles table, falling back to auth metadata:", dbErr.message);
        try {
          // Attempt to update Supabase auth metadata as a fallback
          const { supabase } = await import('../lib/supabase');
          if (supabase) {
            await supabase.auth.updateUser({
              data: { phone: sanitizedUpdates.phone, city: sanitizedUpdates.city }
            });
          }
        } catch (authErr) {
          console.warn("[Auth] Failed to update auth metadata:", authErr.message);
        }
        // Enforce state update locally so the student is not blocked
        setUser(u => ({ ...u, ...sanitizedUpdates }));
      }
    } else {
      if (user) {
        const updated = { ...user, ...sanitizedUpdates };
        setUser(updated);
        setUsers(prev => prev.map(u => (u.id === user.id || u.uid === user.uid) ? { ...u, ...sanitizedUpdates } : u));
      }
    }
  };

  const [plans, setPlans] = useState(() => {
    const saved = localStorage.getItem('plans');
    let parsed = null;
    if (saved) {
      try {
        parsed = JSON.parse(saved);
      } catch {
        parsed = null;
      }
    }
    
    // Default fallback plans aligned with the new Premium L'CONQ mockup
    const defaultPlans = [
      {
        id: 'plan_lconq',
        name: "Premium L'CONQ",
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
    safeSetItem('plans', JSON.stringify(plans));
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
    if (SUPABASE_ENABLED) {
      try {
        await savePlans(updatedPlans);
      } catch (e) {
        console.error('[Supabase] Failed to save plans config:', e);
      }
    }
  };

  const removePlan = async (planId) => {
    const updatedPlans = plans.filter(p => p.id !== planId);
    setPlans(updatedPlans);
    if (SUPABASE_ENABLED) {
      try {
        await savePlans(updatedPlans);
      } catch (e) {
        console.error('[Supabase] Failed to remove plan:', e);
      }
    }
  };

  const updatePlan = async (planId, updates) => {
    const updatedPlans = plans.map(p => p.id === planId ? { ...p, ...updates } : p);
    setPlans(updatedPlans);
    if (SUPABASE_ENABLED) {
      try {
        await savePlans(updatedPlans);
      } catch (e) {
        console.error('[Supabase] Failed to update plan:', e);
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

    if (SUPABASE_ENABLED) {
      try {
        await setUserSubscription(userId, subscription, 'premium');
        setUsers(prev => prev.map(u => u.id === userId || u.uid === userId ? { ...u, tier: 'premium', subscription } : u));
        if (user && (user.uid === userId || user.id === userId)) {
          setUser(u => ({ ...u, tier: 'premium', subscription }));
        }
      } catch (e) {
        console.error('[Supabase] Failed to activate subscription:', e);
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
    if (SUPABASE_ENABLED) {
      try {
        await setUserSubscription(userId, null, 'freemium');
        setUsers(prev => prev.map(u => u.id === userId || u.uid === userId ? { ...u, tier: 'freemium', subscription: null } : u));
        if (user && (user.uid === userId || user.id === userId)) {
          setUser(u => ({ ...u, tier: 'freemium', subscription: null }));
        }
      } catch (e) {
        console.error('[Supabase] Failed to cancel subscription:', e);
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
      } catch {
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
    safeSetItem('activationCodes', JSON.stringify(activationCodes));
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
    if (SUPABASE_ENABLED) {
      try {
        await saveActivationCodes(newCodes);
      } catch (e) {
        console.error('[Supabase] Failed to save activation codes:', e);
      }
    }
    return newCodes;
  };

  const redeemActivationCode = async (codeStr) => {
    const cleanCode = codeStr.trim().toUpperCase();
    
    if (!user) {
      throw new Error("Seuls les élèves connectés peuvent activer un abonnement.");
    }
    
    if (SUPABASE_ENABLED) {
      try {
        // Call the secure atomic database function (handles RLS and trigger bypass)
        const result = await redeemCodeViaRPC(cleanCode, user.name || user.email, user.uid || user.id);
        
        const plan = plans.find(p => p.id === result.planId);
        if (!plan) {
          throw new Error("Plan d'abonnement introuvable pour ce code.");
        }
        
        // Update local activation codes state if cached locally
        setActivationCodes(prev => prev.map(c => c.code.toUpperCase() === cleanCode ? { ...c, isUsed: true, usedBy: user.name || user.email, usedAt: new Date().toISOString() } : c));
        
        // Update user profile tier and subscription locally
        const subscription = {
          planId: result.planId,
          status: 'active',
          startDate: new Date().toISOString(),
          endDate: new Date(new Date().getTime() + result.durationDays * 24 * 3600 * 1000).toISOString()
        };
        setUser(u => ({ ...u, tier: 'premium', subscription }));
        
        return plan;
      } catch (e) {
        console.error('[Supabase] Failed to redeem code:', e);
        throw e;
      }
    } else {
      const foundIdx = activationCodes.findIndex(c => c.code.toUpperCase() === cleanCode);
      if (foundIdx === -1) {
        throw new Error("Code d'activation invalide. Veuillez vérifier la saisie.");
      }
      const codeObj = activationCodes[foundIdx];
      if (codeObj.isUsed) {
        throw new Error(`Ce code a déjà été utilisé par ${codeObj.usedBy} le ${new Date(codeObj.usedAt).toLocaleDateString('fr-FR')}.`);
      }
      const plan = plans.find(p => p.id === codeObj.planId);
      if (!plan) {
        throw new Error("Plan d'abonnement introuvable pour ce code.");
      }
      
      const updatedCodes = [...activationCodes];
      updatedCodes[foundIdx] = {
        ...codeObj,
        isUsed: true,
        usedBy: user.name || user.email,
        usedAt: new Date().toISOString()
      };
      setActivationCodes(updatedCodes);
      activateSubscription(user.id, plan.id, plan.durationDays);
      return plan;
    }
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

      // Robust FSRS fields initialization for backward compatibility
      if (difficulty === undefined || difficulty === null) {
        const ef = card.easeFactor || 2.5;
        difficulty = Math.max(1.0, Math.min(10.0, 1.0 + 4.5 * (3.0 - ef)));
      }
      if (stability === undefined || stability === null) {
        stability = repetitions > 0 ? Math.max(1.0, 2.0 * Math.pow(3, repetitions - 1)) : 2.0;
      }

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
          const factor = 1.0 + Math.pow(Math.max(0, 9.0 - difficulty), 0.4) * Math.pow(stability, -0.15) * (Math.exp(Math.pow(1.0 - retrievability, 0.45)) - 0.45) * hardBonus;
          stability = Math.max(stability + 1.0, stability * factor);
          repetitions += 1;
        }
      }

      if (isNaN(difficulty)) difficulty = 5.0;
      if (isNaN(stability) || stability <= 0) stability = 2.0;
      if (isNaN(repetitions)) repetitions = 1;

      // 3. Compute Interval
      let interval = Math.round(stability);
      if (isNaN(interval) || interval <= 0) interval = 1;

      let nextReviewDate = new Date();
      nextReviewDate.setDate(nextReviewDate.getDate() + interval);
      if (isNaN(nextReviewDate.getTime())) {
        nextReviewDate = new Date();
        nextReviewDate.setDate(nextReviewDate.getDate() + 1);
      }

      // Map difficulty back to easeFactor equivalent for stats backward-compatibility
      const easeFactor = 3.0 - (difficulty - 1.0) / 4.5;

      updatedCardState = {
        difficulty,
        stability,
        repetitions,
        easeFactor: isNaN(easeFactor) ? 2.5 : easeFactor,
        lastReviewDate: now.toISOString(),
        nextReviewDate: nextReviewDate.toISOString()
      };

      if (SUPABASE_ENABLED && (user?.uid || user?.id)) {
        saveQuestionProgress(user.uid || user.id, questionId, updatedCardState).catch(e =>
          console.error('[Supabase] Failed to save card progress:', e)
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
      safeSetItem('reviewDates', JSON.stringify(updated));
    }
    // dailyActivity: { 'YYYY-MM-DD': count }
    const dailyActivity = JSON.parse(localStorage.getItem('dailyActivity') || '{}');
    dailyActivity[todayStr] = (dailyActivity[todayStr] || 0) + 1;
    safeSetItem('dailyActivity', JSON.stringify(dailyActivity));

    if (SUPABASE_ENABLED && (user?.uid || user?.id)) {
      incrementDailyActivity(user.uid || user.id).catch(e =>
        console.error('[Supabase] Failed to increment daily activity:', e)
      );
    }

    // Reward XP for good answers
    if (user && quality >= 3) {
      const xpGain = quality * 10;
      const newXp = (user.xp || 0) + xpGain;
      setUser(u => ({ ...u, xp: newXp }));
      if (SUPABASE_ENABLED && (user.uid || user.id)) {
        updateUserDoc(user.uid || user.id, { xp: newXp }).catch(e =>
          console.error('[Supabase] Failed to update XP in database:', e)
        );
      }
    }
  };

  const getStudentStats = React.useCallback(() => {
    return computeStudentStats(exams, progress, leaderboard, user);
  }, [exams, progress, leaderboard, user]);

  const [schools, setSchools] = useState(() => {
    const saved = localStorage.getItem('schools');
    return saved ? JSON.parse(saved) : ['Médecine / Pharmacie', 'ENSA', 'ENSAM', 'ENCG', 'INPT', 'INSEA', 'Général (Prépa)'];
  });

  useEffect(() => {
    safeSetItem('schools', JSON.stringify(schools));
  }, [schools]);

  // Custom branding per school (emoji overrides)
  const [schoolBranding, setSchoolBranding] = useState(() => {
    const saved = localStorage.getItem('schoolBranding');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    safeSetItem('schoolBranding', JSON.stringify(schoolBranding));
  }, [schoolBranding]);

  // ── Supabase Database Syncing ──────────────────────────────────────────────
  useEffect(() => {
    if (!SUPABASE_ENABLED) return;

    const loadConfigAndExams = async () => {
      try {
        // Fetch all config documents and exams in parallel with allSettled to prevent single-query failure from blocking everything
        const [
          schoolsConfigRes,
          brandConfigRes,
          flashcardConfigRes,
          pdfConfigRes,
          omrScannerConfigRes,
          whatsappConfigRes,
          fbPlansRes,
          fbExamsRes
        ] = await Promise.allSettled([
          getSchoolsConfig(),
          getBrandingConfig(),
          getFlashcardSettingsConfig(),
          getPdfSettingsConfig(),
          getOmrScannerSettingsConfig(),
          getWhatsAppSettingsConfig(),
          getPlans(),
          getAllExams()
        ]);

        const schoolsConfig = schoolsConfigRes.status === 'fulfilled' ? schoolsConfigRes.value : null;
        const brandConfig = brandConfigRes.status === 'fulfilled' ? brandConfigRes.value : null;
        const flashcardConfig = flashcardConfigRes.status === 'fulfilled' ? flashcardConfigRes.value : null;
        const pdfConfig = pdfConfigRes.status === 'fulfilled' ? pdfConfigRes.value : null;
        const omrScannerConfig = omrScannerConfigRes.status === 'fulfilled' ? omrScannerConfigRes.value : null;
        const whatsappConfig = whatsappConfigRes.status === 'fulfilled' ? whatsappConfigRes.value : null;
        const fbPlans = fbPlansRes.status === 'fulfilled' ? fbPlansRes.value : null;
        const fbExams = fbExamsRes.status === 'fulfilled' ? fbExamsRes.value : null;

        // Process Schools Config
        if (schoolsConfig && schoolsConfig.schools && schoolsConfig.schools.length > 0) {
          setSchools(schoolsConfig.schools);
          setSchoolBranding(schoolsConfig.branding || {});
        } else {
          // Seed defaults if config document doesn't exist
          await saveSchoolsConfig(schools, schoolBranding);
        }

        // Process General Branding
        if (brandConfig) {
          setProfName(brandConfig.profName || '');
          setProfPhone(brandConfig.profPhone || '');
          setProfSite(brandConfig.profSite || 'www.lconq.ma');
          localStorage.setItem('profName', brandConfig.profName || '');
          localStorage.setItem('profPhone', brandConfig.profPhone || '');
          localStorage.setItem('profSite', brandConfig.profSite || 'www.lconq.ma');
        } else {
          // Seed if not exists in DB
          await saveBrandingConfig({ profName, profPhone, profSite });
        }

        // Process Flashcard Settings
        if (flashcardConfig) {
          localStorage.setItem('card_reveal_mode', flashcardConfig.cardRevealMode || 'flip');
          localStorage.setItem('card_flip_animation', String(flashcardConfig.cardFlipEnabled !== false));
          localStorage.setItem('card_swipe_gesture', String(flashcardConfig.cardSwipeEnabled !== false));
          localStorage.setItem('card_font_family', flashcardConfig.cardFontFamily || 'Computer Modern Serif');
          localStorage.setItem('card_font_size', flashcardConfig.cardFontSize || '1rem');
          localStorage.setItem('card_question_weight', flashcardConfig.cardQuestionWeight || '400');
          localStorage.setItem('card_astuce_weight', flashcardConfig.cardAstuceWeight || '400');
          localStorage.setItem('card_options_weight', flashcardConfig.cardOptionsWeight || '400');
        } else {
          // Seed default settings if not exists in DB
          const defaultFlashcard = {
            cardRevealMode: 'flip',
            cardFlipEnabled: true,
            cardSwipeEnabled: true,
            cardFontFamily: 'Computer Modern Serif',
            cardFontSize: '1rem',
            cardQuestionWeight: '400',
            cardAstuceWeight: '400',
            cardOptionsWeight: '400'
          };
          await saveFlashcardSettingsConfig(defaultFlashcard);
          localStorage.setItem('card_reveal_mode', defaultFlashcard.cardRevealMode);
          localStorage.setItem('card_flip_animation', String(defaultFlashcard.cardFlipEnabled));
          localStorage.setItem('card_swipe_gesture', String(defaultFlashcard.cardSwipeEnabled));
          localStorage.setItem('card_font_family', defaultFlashcard.cardFontFamily);
          localStorage.setItem('card_font_size', defaultFlashcard.cardFontSize);
          localStorage.setItem('card_question_weight', defaultFlashcard.cardQuestionWeight);
          localStorage.setItem('card_astuce_weight', defaultFlashcard.cardAstuceWeight);
          localStorage.setItem('card_options_weight', defaultFlashcard.cardOptionsWeight);
        }

        // Process PDF Settings
        if (pdfConfig) {
          localStorage.setItem('pdf_page_margins', pdfConfig.pdfPageMargins || 'standard');
          localStorage.setItem('pdf_font_size', pdfConfig.pdfFontSize || '11pt');
          localStorage.setItem('pdf_font_family', pdfConfig.pdfFontFamily || 'Computer Modern Serif');
          localStorage.setItem('pdf_template_style', pdfConfig.pdfTemplateStyle || 'classic_latex');
          localStorage.setItem('pdf_avoid_page_breaks', String(pdfConfig.pdfAvoidPageBreaks !== false));
          localStorage.setItem('pdf_force_print_colors', String(pdfConfig.pdfForcePrintColors !== false));
          localStorage.setItem('pdf_show_sidebar', String(pdfConfig.pdfShowSidebar !== false));
        } else {
          const defaultPdf = {
            pdfPageMargins: 'standard',
            pdfFontSize: '11pt',
            pdfFontFamily: 'Computer Modern Serif',
            pdfTemplateStyle: 'classic_latex',
            pdfAvoidPageBreaks: true,
            pdfForcePrintColors: true,
            pdfShowSidebar: true
          };
          await savePdfSettingsConfig(defaultPdf);
          localStorage.setItem('pdf_page_margins', defaultPdf.pdfPageMargins);
          localStorage.setItem('pdf_font_size', defaultPdf.pdfFontSize);
          localStorage.setItem('pdf_font_family', defaultPdf.pdfFontFamily);
          localStorage.setItem('pdf_template_style', defaultPdf.pdfTemplateStyle);
          localStorage.setItem('pdf_avoid_page_breaks', String(defaultPdf.pdfAvoidPageBreaks));
          localStorage.setItem('pdf_force_print_colors', String(defaultPdf.pdfForcePrintColors));
          localStorage.setItem('pdf_show_sidebar', String(defaultPdf.pdfShowSidebar));
        }

        // Process OMR Scanner Settings
        if (omrScannerConfig) {
          localStorage.setItem('scanner_direct_capture_enabled', String(omrScannerConfig.scannerDirectCapture !== false));
        } else {
          const defaultOmr = {
            scannerDirectCapture: true
          };
          await saveOmrScannerSettingsConfig(defaultOmr);
          localStorage.setItem('scanner_direct_capture_enabled', String(defaultOmr.scannerDirectCapture));
        }

        // Process WhatsApp Settings
        if (whatsappConfig) {
          setWhatsappSettings(whatsappConfig);
          localStorage.setItem('whatsappSettings', JSON.stringify(whatsappConfig));
        } else {
          await saveWhatsAppSettingsConfig(whatsappSettings);
        }

        // Process Plans
        if (fbPlans && fbPlans.length > 0) {
          setPlans(fbPlans);
        } else {
          // Seed default plans if not present
          await savePlans(plans);
        }

        // Process Exams
        if (fbExams && fbExams.length > 0) {
          setExams(fbExams);
        } else {
          // Seed the default exam to Database
          const defaultSeedExam = initialExams.find(e => e.id === "QVVOBFE7");
          if (defaultSeedExam) {
            await dbAddExam(defaultSeedExam);
          }
          setExams(initialExams);
        }
      } catch (e) {
        console.warn('[Supabase] Error syncing config/exams:', e.message);
      }
    };

    loadConfigAndExams();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch User-specific data (progress, history, activity, leaderboard) when a student logs in
  useEffect(() => {
    if (!SUPABASE_ENABLED || !user || user.role === 'admin') return;

    const loadStudentData = async () => {
      const userId = user.uid || user.id;
      
      // Clear local storage and state if logging in as a different user to prevent data cross-talk
      const lastSyncedUser = localStorage.getItem('last_synced_user_id');
      let lastSyncedAt = localStorage.getItem('progress_last_synced_at');
      
      if (lastSyncedUser !== userId) {
        localStorage.removeItem('progress_last_synced_at');
        localStorage.setItem('last_synced_user_id', userId);
        lastSyncedAt = null;
        setProgress({});
      }

      try {
        const syncStartTime = new Date().toISOString();
        const [fbProgressDeltas, fbHistory, fbActivity, fbLeaderboard] = await Promise.all([
          getProgressDeltas(userId, lastSyncedAt),
          getMockHistory(userId),
          getRecentActivity(userId),
          getLeaderboard()
        ]);

        if (fbProgressDeltas) {
          setProgress(prev => {
            // If it is a full sync, replace. Otherwise, merge deltas
            const merged = lastSyncedAt ? { ...prev, ...fbProgressDeltas } : fbProgressDeltas;
            return merged;
          });
          localStorage.setItem('progress_last_synced_at', syncStartTime);
        }

        setMockExamHistory(fbHistory || []);
        setLeaderboard(fbLeaderboard || []);

        if (fbActivity) {
          localStorage.setItem('dailyActivity', JSON.stringify(fbActivity));
          const dates = Object.keys(fbActivity);
          localStorage.setItem('reviewDates', JSON.stringify(dates));
        }
      } catch (e) {
        console.warn('[Supabase] Error loading student progress:', e.message);
      }
    };

    loadStudentData();
  }, [user]);

  // Real-time listener for profile upgrades (e.g. manager activating premium)
  useEffect(() => {
    if (!SUPABASE_ENABLED || !user) return;
    const userId = user.uid || user.id;
    if (!userId || userId === 'mock_student' || userId === 'mock_google_student' || userId === 'admin') return;

    // Create channel
    const channel = supabase
      .channel(`profile-realtime-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          const newProfile = payload.new;
          if (newProfile) {
            // Check if user tier was upgraded from non-premium (or freemium) to premium
            setUser(prevUser => {
              if (prevUser && prevUser.tier !== 'premium' && newProfile.tier === 'premium') {
                // Find the new plan details to display in the celebration modal
                const planId = newProfile.subscription?.planId || 'plan_lconq';
                const plan = plans.find(p => p.id === planId) || plans[0] || {
                  name: "Premium L'Conq",
                  durationDays: 30
                };
                
                // Trigger global success modal
                setUpgradedPlan(plan);
              }
              
              // Return new state
              return {
                ...prevUser,
                tier: newProfile.tier,
                subscription: newProfile.subscription,
                phone: newProfile.phone || prevUser.phone,
                city: newProfile.city || prevUser.city,
                xp: newProfile.xp !== undefined ? newProfile.xp : prevUser.xp,
                streak: newProfile.streak !== undefined ? newProfile.streak : prevUser.streak,
                rank: newProfile.rank !== undefined ? newProfile.rank : prevUser.rank
              };
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.uid, user?.id, plans]);

  const refreshAdminData = useCallback(async () => {
    if (!SUPABASE_ENABLED || user?.role !== 'admin') return;
    try {
      const fbUsers = await getAllUsers();
      if (fbUsers) {
        setUsers(fbUsers);
      }
      const fbCodes = await getAllCodes();
      if (fbCodes) {
        setActivationCodes(fbCodes);
      }
    } catch (e) {
      console.warn('[Supabase] Error loading admin users/codes:', e.message);
    }
  }, [user?.role]);

  // Fetch all registered users for Admin Dashboard when Admin is logged in
  useEffect(() => {
    if (user?.role === 'admin') {
      setTimeout(() => {
        refreshAdminData();
      }, 0);
    }
  }, [user?.role, refreshAdminData]);


  const addSchool = async (name) => {
    if (name && !schools.includes(name)) {
      const updatedSchools = [...schools, name];
      setSchools(updatedSchools);
      if (SUPABASE_ENABLED) {
        try {
          await saveSchoolsConfig(updatedSchools, schoolBranding);
        } catch (e) {
          console.error('[Supabase] Failed to add school config:', e);
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
    if (SUPABASE_ENABLED) {
      try {
        await saveSchoolsConfig(updatedSchools, updatedBranding);
      } catch (e) {
        console.error('[Supabase] Failed to remove school config:', e);
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
    if (SUPABASE_ENABLED) {
      try {
        await saveSchoolsConfig(updatedSchools, updatedBranding);
      } catch (e) {
        console.error('[Supabase] Failed to rename school config:', e);
      }
    }
  };

  const updateSchoolBranding = async (name, patch) => {
    const updatedBranding = { ...schoolBranding, [name]: { ...(schoolBranding[name] || {}), ...patch } };
    setSchoolBranding(updatedBranding);
    if (SUPABASE_ENABLED) {
      try {
        await saveSchoolsConfig(schools, updatedBranding);
      } catch (e) {
        console.error('[Supabase] Failed to update school branding:', e);
      }
    }
  };


  const isExamLocked = (exam) => {
    if (!exam) return true;
    if (user?.role === 'admin') return false;
    
    // If not logged in, lock it (visitors must log in to access anything)
    if (!user) return true;
    
    if (exam.tier === 'freemium') return false;
    
    // If not premium, lock it
    if (user.tier !== 'premium') return true;
    
    // Premium tier checks: verify plan allows this exam's school
    if (!user.subscription || user.subscription.status !== 'active') return true;
    
    const plan = plans.find(p => p.id === user.subscription.planId);
    if (!plan) return true;
    
    return !plan.allowedSchools.includes(exam.school);
  };

  const loadExamQuestions = async (examId) => {
    if (!SUPABASE_ENABLED) return;
    const exam = exams.find(e => e.id === examId);
    if (exam && exam.questions && exam.questions.length > 0) {
      return exam.questions;
    }
    try {
      const questions = await getExamQuestionsOnly(examId);
      setExams(prev => prev.map(e => e.id === examId ? { ...e, questions } : e));
      return questions;
    } catch (err) {
      console.error('[Supabase] Failed to load questions for exam:', examId, err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, users, login, logout, register, loginWithGoogle: loginGoogle, exams, addExam, updateUserTier, updateProfile,
      toggleExamStatus, updateExamDetails, deleteExam, toggleArchiveExam,
      plans, activateSubscription, cancelSubscription, addPlan, removePlan, updatePlan,
      activationCodes, generateActivationCodes, redeemActivationCode,
      progress, updateCardProgress, getStudentStats, dueTodayCount,
      theme, toggleTheme,
      schools, addSchool, removeSchool, renameSchool,
      schoolBranding, updateSchoolBranding,
      mockExamHistory, saveMockExamResult,
      leaderboard, refreshLeaderboard,
      isExamLocked,
      loadExamQuestions,
      supabaseEnabled: SUPABASE_ENABLED,
      refreshAdminData,
      loading,
      profName, profPhone, profSite, updateBrandingConfig, updateFlashcardSettingsConfig, updatePdfSettingsConfig, updateOmrScannerSettingsConfig,
      whatsappSettings, updateWhatsAppSettingsConfig,
      upgradedPlan, setUpgradedPlan,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext) || {};
