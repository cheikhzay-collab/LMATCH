import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, Camera, CheckCircle2, XCircle, AlertCircle,
  BrainCircuit, Zap, RotateCcw, Loader2, Check, TrendingUp, Printer, Home
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { scanAnswerSheet, readQRCodeFromImage } from '../utils/OMRScanner';
import DiagnosticReport from '../components/DiagnosticReport';
import { renderWithMath } from '../utils/mathRenderer';
import SmartCameraScanner from '../components/SmartCameraScanner';
import { generateStudentReportHTML, openPrintWindow } from '../utils/generateExamPDF';

const CHOICES = ['A', 'B', 'C', 'D', 'E'];

/* ── Math Helper ──────────────────────────────────────────────── */
function renderMathSnippet(text) {
  return renderWithMath(text);
}

/* ── Confidence Indicator ────────────────────────────────────────── */
function ConfidenceDot({ confidence }) {
  const color = confidence > 0.6 ? 'var(--emerald)' : confidence > 0.3 ? 'var(--warning)' : 'var(--danger)';
  const label = confidence > 0.6 ? 'Clair' : confidence > 0.3 ? 'À vérifier' : 'Ambigu';
  return (
    <span title={`Confiance : ${Math.round(confidence * 100)}% — ${label}`} style={{
      display:'inline-flex', alignItems:'center', gap:'0.25rem',
      fontSize:'0.7rem', color, fontWeight:700,
    }}>
      <span style={{ width:7, height:7, borderRadius:'50%', background:color, display:'inline-block' }} />
      {Math.round(confidence * 100)}%
    </span>
  );
}

/* ── Verification Row ───────────────────────────────────────────── */
function VerifyGrid({ scanned, questions, onChange, isMobile }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: isMobile ? 320 : 420, overflowY: 'auto', paddingRight: '6px' }}>
      {scanned.map((row, idx) => {
        const qTextRaw = questions[idx]?.question || `Question ${row.q}`;
        const isLowConfidence = row.confidence < 0.35;
        return (
          <div key={row.q} className="verify-grid-row" style={{
            display: 'flex', 
            flexDirection: 'column',
            gap: '0.6rem',
            padding: isMobile ? '0.6rem 0.8rem' : '0.75rem 1rem',
            background: isLowConfidence ? 'rgba(245, 158, 11, 0.05)' : 'rgba(255, 255, 255, 0.02)',
            borderRadius: '1rem',
            border: `1.5px solid ${isLowConfidence ? 'rgba(245, 158, 11, 0.25)' : 'var(--border)'}`,
            transition: 'border-color 0.2s, background-color 0.2s'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <span style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-main)' }}>Question {row.q}</span>
              <ConfidenceDot confidence={row.confidence} />
            </div>
            
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', display: 'block', width: '100%' }}>
              {renderMathSnippet(qTextRaw)}
            </span>

            {/* Option selection buttons */}
            <div style={{ display: 'flex', gap: isMobile ? '0.45rem' : '0.35rem', flexWrap: 'wrap', marginTop: '0.2rem', alignItems: 'center' }}>
              {CHOICES.map(opt => (
                <button 
                  key={opt} 
                  onClick={() => onChange(idx, opt)} 
                  style={{
                    width: isMobile ? 38 : 32, 
                    height: isMobile ? 38 : 32, 
                    borderRadius: '50%', 
                    fontWeight: 800, 
                    fontSize: isMobile ? '0.95rem' : '0.85rem',
                    cursor: 'pointer', 
                    transition: 'all 0.2s ease',
                    background: row.answer === opt ? 'var(--violet)' : 'rgba(255,255,255,0.03)',
                    color: row.answer === opt ? '#fff' : 'var(--text-muted)',
                    border: row.answer === opt ? '2px solid var(--violet)' : '1px solid var(--border)',
                    boxShadow: row.answer === opt ? '0 4px 12px var(--violet-glow)' : 'none',
                  }}
                  onMouseEnter={e => {
                    if (row.answer !== opt) {
                      e.currentTarget.style.borderColor = 'var(--violet)';
                      e.currentTarget.style.color = 'var(--text-main)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (row.answer !== opt) {
                      e.currentTarget.style.borderColor = 'var(--border)';
                      e.currentTarget.style.color = 'var(--text-muted)';
                    }
                  }}
                >
                  {opt}
                </button>
              ))}
              <button 
                onClick={() => onChange(idx, null)} 
                style={{
                  padding: isMobile ? '0 1rem' : '0 0.75rem', 
                  height: isMobile ? 38 : 32, 
                  borderRadius: '0.5rem', 
                  fontWeight: 800, 
                  fontSize: isMobile ? '0.82rem' : '0.75rem',
                  cursor: 'pointer', 
                  transition: 'all 0.2s ease',
                  background: row.answer === null ? 'var(--danger-soft)' : 'rgba(255,255,255,0.03)',
                  color: row.answer === null ? 'var(--danger)' : 'var(--text-muted)',
                  border: `1px solid ${row.answer === null ? 'var(--danger)' : 'var(--border)'}`,
                }}
              >
                Laisser Vide
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Correction Result Row ───────────────────────────────────────── */
function ResultRow({ row }) {
  const cfg = {
    correct: { bg: 'var(--emerald-soft)', border: 'var(--emerald)', icon: <CheckCircle2 size={16}/>, label: 'Correct', color: 'var(--emerald)' },
    wrong: { bg: 'var(--danger-soft)', border: 'var(--danger)', icon: <XCircle size={16}/>, label: 'Incorrect', color: 'var(--danger)' },
    empty: { bg: 'rgba(255,255,255,0.01)', border: 'var(--border)', icon: <AlertCircle size={16}/>, label: 'Laissé Vide', color: 'var(--text-muted)' },
  };
  const status = row.detected === null ? 'empty' : row.result;
  const c = cfg[status];
  return (
    <div style={{
      display: 'flex', 
      flexDirection: 'column', 
      gap: '0.5rem',
      padding: '0.85rem 1rem',
      background: c.bg, 
      borderRadius: '1rem',
      borderLeft: `4px solid ${c.border}`,
      borderTop: '1px solid var(--border)',
      borderRight: '1px solid var(--border)',
      borderBottom: '1px solid var(--border)',
      boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 900, fontSize: '0.95rem', color: 'var(--text-main)' }}>Question {row.q}</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: c.color, fontSize: '0.8rem', fontWeight: 800 }}>
          {c.icon} {c.label}
        </span>
      </div>
      
      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', display: 'block' }}>
        {renderMathSnippet(row.question)}
      </span>
      
      <div className="result-row-details">
        <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Réponse cochée :</span>
        <span style={{ 
          padding: '0.2rem 0.6rem', 
          borderRadius: '0.35rem', 
          background: status === 'correct' ? 'rgba(16, 185, 129, 0.12)' : status === 'wrong' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(255, 255, 255, 0.05)', 
          fontWeight: 900, 
          color: status === 'correct' ? 'var(--emerald)' : status === 'wrong' ? 'var(--danger)' : 'var(--text-muted)' 
        }}>
          {row.detected || '—'}
        </span>
        {status !== 'correct' && (
          <>
            <span style={{ color: 'var(--text-subtle)' }}>→</span>
            <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Réponse attendue :</span>
            <span style={{ padding: '0.2rem 0.6rem', borderRadius: '0.35rem', background: 'rgba(16, 185, 129, 0.12)', fontWeight: 900, color: 'var(--emerald)' }}>
              {row.correct}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Main Global Scanner Page ────────────────────────────────────── */
export default function OMRScannerPage() {
  const { user, theme, mockExamHistory, updateCardProgress, saveMockExamResult, schoolBranding, exams, isExamLocked, profName, profPhone, profSite, loadExamQuestions } = useAuth();
  const navigate = useNavigate();

  const isDark = theme === 'dark';
  const textMainColor = isDark ? '#E4E4E7' : '#0F172A';
  const textMutedColor = isDark ? '#A1A1AA' : '#334155';
  const textSubtleColor = isDark ? '#8F8F98' : '#4E5D73';
  const borderCol = isDark ? 'rgba(255, 255, 255, 0.05)' : '#E2E8F0';
  const cardBg = isDark ? 'rgba(24, 24, 27, 0.7)' : '#FFFFFF';

  const emeraldColor = isDark ? '#10B981' : '#059669';
  const dangerColor = isDark ? '#EF4444' : '#DC2626';
  const warningColor = isDark ? '#F59E0B' : '#D97706';
  const emeraldSoftColor = isDark ? 'rgba(16, 185, 129, 0.08)' : 'rgba(5, 150, 105, 0.08)';
  const dangerSoftColor = isDark ? 'rgba(239, 68, 68, 0.08)' : 'rgba(220, 38, 38, 0.08)';


  const isDirectCaptureEnabled = localStorage.getItem('scanner_direct_capture_enabled') !== 'false';
  const [activeExam,   setActiveExam]   = useState(null);
  const [phase,        setPhase]        = useState('upload');
  const [scanMethod,   setScanMethod]   = useState(() => localStorage.getItem('scanner_direct_capture_enabled') !== 'false' ? 'camera' : 'file');
  const [imagePreview, setImagePreview] = useState(null);
  const [scanned,      setScanned]      = useState([]);
  const [corrected,    setCorrected]    = useState([]);
  const [score,        setScore]        = useState(null);
  const [scanError,    setScanError]    = useState(null);
  const [scanStep,     setScanStep]     = useState(0);
  const [resultsTab,   setResultsTab]   = useState('list');

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fileRef = useRef(null);

  const handlePrintReport = () => {
    if (!activeExam || !score || !corrected.length) return;
    const settings = {
      profName: profName || '',
      profPhone: profPhone || '',
      profSite: profSite || 'www.lconq.ma'
    };
    const html = generateStudentReportHTML(activeExam, score, corrected, settings);
    openPrintWindow(html);
  };

  const questions = activeExam?.questions || [];
  const Q = questions.length;

  const brand = (activeExam ? schoolBranding[activeExam.school] : null) || { scoring: { correct: 1, wrong: -0.25, empty: 0 } };
  const rules = brand.scoring || { correct: 1, wrong: -0.25, empty: 0 };

  const isPremium = user?.role === 'admin' || user?.tier === 'premium';
  const scanLimit = 3;
  const omrScansCount = mockExamHistory ? mockExamHistory.filter(h => h.mode === 'omr').length : 0;
  const hasReachedLimit = !isPremium && omrScansCount >= scanLimit;

  const handleFile = useCallback(async (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setScanError(null);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
    setPhase('scanning');

    // Smooth step animations
    const steps = ['Optimisation', 'Détection QR', 'Calcul Score'];
    for (let i = 0; i < steps.length; i++) {
      await new Promise(r => setTimeout(r, 600));
      setScanStep(i + 1);
    }

    try {
      // 1. Scan and read the QR code on the sheet
      const qrPayload = await readQRCodeFromImage(file);
      if (!qrPayload || !qrPayload.examId) {
        throw new Error("Code QR L'Match introuvable. Veuillez cadrer correctement le haut de la feuille avec une bonne luminosité.");
      }

      // 2. Lookup exam metadata (supports starts-with for 8-char prefixes)
      const found = exams.find(e => 
        qrPayload.examId.length === 8 
          ? e.id.toLowerCase().startsWith(qrPayload.examId.toLowerCase()) 
          : e.id === qrPayload.examId
      );
      if (!found) {
        throw new Error(`Examen introuvable dans la bibliothèque (ID : ${qrPayload.examId.slice(0, 8)})`);
      }
      if (isExamLocked(found)) {
        throw new Error("Cet examen fait partie de l'offre Premium. Veuillez vous abonner pour scanner votre feuille de réponses et obtenir votre correction.");
      }

      // Load questions dynamically if they are not preloaded
      const loadedQuestions = await loadExamQuestions(found.id);
      const updatedExam = { ...found, questions: loadedQuestions };
      setActiveExam(updatedExam);

      // 3. Scan the grid bubbles dynamically
      const results = await scanAnswerSheet(file, loadedQuestions?.length || 0);
      setScanned(results);
      setPhase('verify');
    } catch (e) {
      setScanError(e.message);
      setPhase('upload');
    }
  }, [exams, isExamLocked, loadExamQuestions]);

  const handleDrop = (e) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files[0]);
  };

  const handleVerifyChange = (idx, newAnswer) => {
    setScanned(prev => prev.map((r, i) => i === idx ? { ...r, answer: newAnswer } : r));
  };

  const handleConfirmVerify = () => {
    if (!activeExam) return;
    let pts = 0, neg = 0;
    const rows = questions.map((q, idx) => {
      const sc = scanned[idx];
      const correct = q.correct_answer || q.answer;
      const detected = sc?.answer;
      let result;
      if (detected === null) {
        result = 'empty'; pts += rules.empty;
      } else if (detected === correct) {
        result = 'correct'; pts += rules.correct;
      } else {
        result = 'wrong'; neg += Math.abs(rules.wrong); pts += rules.wrong;
      }
      return { q: idx + 1, question: q.question, detected, correct, result, topic: q.topic || 'Général' };
    });
    
    setCorrected(rows);
    const maxPossible = Q * rules.correct;
    const pct = maxPossible > 0 ? Math.max(0, Math.round((pts / maxPossible) * 100)) : 0;
    setScore({ pts, neg, max: Q, pct });
    setResultsTab('list');

    // Push to Spaced Repetition (SRS)
    rows.forEach((row, idx) => {
      const id = questions[idx]?.id || idx;
      updateCardProgress(id, row.result === 'correct' ? 4 : 0);
    });

    // Save OMR exam results to student's mock history
    let correctCount = 0;
    let wrongCount = 0;
    let emptyCount = 0;
    rows.forEach(row => {
      if (row.result === 'correct') correctCount++;
      else if (row.result === 'wrong') wrongCount++;
      else emptyCount++;
    });

    saveMockExamResult({
      examId: activeExam.id,
      examName: activeExam.name,
      school: activeExam.school,
      score: pts,
      maxScore: Q,
      correctCount,
      wrongCount,
      emptyCount,
      pct,
      mode: 'omr'
    });

    setPhase('results');
  };

  const reset = () => {
    setPhase('upload'); setActiveExam(null); setImagePreview(url => { if (url) URL.revokeObjectURL(url); return null; }); setScanned([]);
    setCorrected([]); setScore(null); setScanStep(0); setScanError(null); setResultsTab('list');
    setScanMethod(localStorage.getItem('scanner_direct_capture_enabled') !== 'false' ? 'camera' : 'file');
  };

  const ambiguousCount = scanned.filter(r => r.confidence < 0.3).length;
  const wrongCount     = corrected.filter(r => r.result === 'wrong').length;
  const correctCount   = corrected.filter(r => r.result === 'correct').length;

  const phaseLabel = { upload:'Uploader', scanning:'Analyse…', verify:'Vérification', results:'Résultats' };

  const currentStepIndex = ['upload', 'scanning', 'verify', 'results'].indexOf(phase);

  return (
    <div className="animate-fade-in" style={{ padding: isMobile ? '0.5rem 0 5rem 0' : '0.5rem 0 3rem 0', width: '100%', overflowX: 'hidden' }}>
      {/* Page Title & Phase Indicators */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '0.75rem' : '1.25rem', marginBottom: isMobile ? '1.25rem' : '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: isMobile ? '0.15rem' : '0.4rem' }}>
              <div style={{ 
                width: isMobile ? 34 : 42, 
                height: isMobile ? 34 : 42, 
                borderRadius: isMobile ? '10px' : '12px', 
                background: 'linear-gradient(135deg, var(--violet), var(--emerald))', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                flexShrink: 0,
                boxShadow: '0 4px 14px var(--violet-glow)'
              }}>
                <Camera size={isMobile ? 16 : 20} color="#fff" />
              </div>
              <h1 style={{ fontSize: isMobile ? '1.35rem' : '1.6rem', fontWeight: 900, letterSpacing: '-0.03em', margin: 0, color: 'var(--text-main)' }}>
                Scanner Intelligent
              </h1>
            </div>
            {(!isMobile || phase === 'upload') && (
              <p style={{ color: 'var(--text-muted)', fontSize: isMobile ? '0.8rem' : '0.88rem', margin: 0, lineHeight: 1.5 }}>
                Prenez en photo votre feuille de réponses L'Match. L'IA s'occupe du reste.
              </p>
            )}
          </div>
        </div>
        
        {/* Phase indicators */}
        {isMobile ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            background: 'rgba(255, 255, 255, 0.02)',
            backdropFilter: 'blur(10px)',
            border: '1px solid var(--border)',
            padding: '0.75rem 1rem',
            borderRadius: '1.25rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--violet), var(--emerald))',
                color: '#fff',
                fontSize: '0.85rem',
                fontWeight: 800,
                boxShadow: '0 4px 10px var(--violet-glow)'
              }}>
                {currentStepIndex + 1}
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Étape {currentStepIndex + 1} sur 4
                </span>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: 800 }}>
                  {phaseLabel[phase]}
                </span>
              </div>
            </div>
            
            {/* Mini progress bar on the right */}
            <div style={{ width: '80px', height: '6px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '3px', overflow: 'hidden', border: '1px solid var(--border)' }}>
              <div style={{
                width: `${((currentStepIndex + 1) / 4) * 100}%`,
                height: '100%',
                background: 'linear-gradient(90deg, var(--violet), var(--emerald))',
                borderRadius: '3px',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        ) : (
          <div className="stepper-container" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            width: '100%', 
            background: 'rgba(255, 255, 255, 0.02)', 
            backdropFilter: 'blur(10px)',
            border: '1px solid var(--border)', 
            padding: '0.75rem 1.25rem', 
            borderRadius: '1.25rem',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {['upload', 'scanning', 'verify', 'results'].map((p, i) => {
              const isActive = phase === p;
              const isCompleted = ['upload', 'scanning', 'verify', 'results'].indexOf(phase) > i;
              return (
                <div key={p} className="step-item" style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  flex: i === 3 ? 'none' : 1,
                  position: 'relative'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    width: 24, 
                    height: 24, 
                    borderRadius: '50%', 
                    background: isActive ? 'var(--violet)' : isCompleted ? 'var(--emerald)' : 'rgba(255,255,255,0.05)',
                    border: `1.5px solid ${isActive ? 'var(--violet)' : isCompleted ? 'var(--emerald)' : 'var(--border)'}`,
                    color: isActive || isCompleted ? '#fff' : 'var(--text-muted)',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    boxShadow: isActive ? '0 0 10px var(--violet-glow)' : 'none',
                    transition: 'all 0.3s ease'
                  }}>
                    {isCompleted ? <Check size={12} strokeWidth={3} /> : i + 1}
                  </div>
                  <span className={`step-label ${isActive ? 'active' : ''}`} style={{ 
                    fontSize: '0.8rem', 
                    fontWeight: isActive ? 800 : 600, 
                    color: isActive ? 'var(--text-main)' : 'var(--text-muted)',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.3s ease'
                  }}>
                    {phaseLabel[p]}
                  </span>
                  
                  {i < 3 && (
                    <div className="step-line" style={{ 
                      flex: 1, 
                      height: 2, 
                      background: isCompleted ? 'var(--emerald)' : 'var(--border)', 
                      marginLeft: '0.75rem', 
                      marginRight: '0.75rem',
                      minWidth: 16
                    }} />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.25rem', width: '100%' }}>
        <div className="glass-panel" style={{ padding: isMobile ? '1rem' : '1.5rem', borderRadius: '1.5rem', border: '1px solid var(--border)', width: '100%', boxSizing: 'border-box' }}>
          
          {/* ── UPLOAD PHASE ── */}
          {phase === 'upload' && (
            <div style={{ maxWidth: 640, margin: '0 auto' }}>
              {hasReachedLimit ? (
                <div style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
                  <div style={{ 
                    width: 72, 
                    height: 72, 
                    borderRadius: '50%', 
                    background: 'var(--violet-soft)', 
                    color: 'var(--violet)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    margin: '0 auto 1.75rem', 
                    boxShadow: '0 8px 32px var(--violet-glow)',
                    border: '1.5px solid rgba(113, 109, 242, 0.2)'
                  }}>
                    <Zap size={32} fill="currentColor" />
                  </div>
                  <h3 style={{ fontWeight: 900, fontSize: '1.35rem', letterSpacing: '-0.02em', marginBottom: '0.75rem', color: 'var(--text-main)' }}>
                    Limite de scans gratuite atteinte
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.6, maxWidth: '440px', margin: '0 auto 2.5rem' }}>
                    Vous avez utilisé vos 3 scans gratuits OMR. Abonnez-vous pour profiter d'analyses de copies et de rapports d'erreurs illimités.
                  </p>
                  <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column', width: '100%', maxWidth: '300px', margin: '0 auto' }}>
                    <button onClick={() => navigate('/subscription')} className="btn" style={{ background: 'var(--btn-primary-bg)', boxShadow: 'var(--btn-primary-shadow)' }}>
                      ✦ Passer à l'offre Premium
                    </button>
                    <button onClick={() => navigate('/dashboard')} className="btn-outline">
                      Retour au Dashboard
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {scanError && (
                    <div style={{ 
                      padding: '1rem 1.25rem', 
                      background: 'var(--danger-soft)', 
                      border: '1px solid rgba(239, 68, 68, 0.2)', 
                      borderRadius: '1rem', 
                      marginBottom: '1.5rem', 
                      color: 'var(--danger)', 
                      fontSize: '0.88rem', 
                      fontWeight: 600, 
                      display: 'flex', 
                      gap: '0.75rem', 
                      alignItems: 'flex-start' 
                    }}>
                      <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', alignItems: 'flex-start' }}>
                        <span style={{ fontWeight: 700 }}>Erreur d'analyse</span>
                        <span style={{ color: 'var(--text-main)', opacity: 0.95, fontWeight: 500 }}>{scanError}</span>
                        {scanError.includes("Premium") && (
                          <button 
                            onClick={() => navigate('/subscription')} 
                            style={{ background: 'none', border: 'none', color: 'var(--violet)', padding: 0, fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', textAlign: 'left', textDecoration: 'underline', marginTop: '0.2rem' }}
                          >
                            Voir les formules d'abonnement formule Premium
                          </button>
                        )}
                      </div>
                    </div>
                  )}
              
                  {/* Premium Segmented Controller */}
                  {isDirectCaptureEnabled && (
                    <div style={{ 
                      display: 'flex', 
                      background: 'rgba(255, 255, 255, 0.02)', 
                      border: '1px solid var(--border)', 
                      padding: '0.3rem', 
                      borderRadius: '1.25rem', 
                      width: '100%',
                      marginBottom: '1.75rem'
                    }}>
                      <button 
                        onClick={() => setScanMethod('camera')}
                        style={{
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          padding: '0.75rem 1rem',
                          borderRadius: '1rem',
                          border: 'none',
                          fontWeight: 800,
                          fontSize: '0.85rem',
                          fontFamily: 'inherit',
                          cursor: 'pointer',
                          transition: 'all 0.25s',
                          background: scanMethod === 'camera' ? 'var(--violet)' : 'transparent',
                          color: scanMethod === 'camera' ? '#fff' : 'var(--text-muted)',
                          boxShadow: scanMethod === 'camera' ? '0 4px 16px var(--violet-glow)' : 'none'
                        }}
                      >
                        <Camera size={16} />
                        Utiliser la caméra
                      </button>
                      <button 
                        onClick={() => setScanMethod('file')}
                        style={{
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          padding: '0.75rem 1rem',
                          borderRadius: '1rem',
                          border: 'none',
                          fontWeight: 800,
                          fontSize: '0.85rem',
                          fontFamily: 'inherit',
                          cursor: 'pointer',
                          transition: 'all 0.25s',
                          background: scanMethod === 'file' ? 'var(--violet)' : 'transparent',
                          color: scanMethod === 'file' ? '#fff' : 'var(--text-muted)',
                          boxShadow: scanMethod === 'file' ? '0 4px 16px var(--violet-glow)' : 'none'
                        }}
                      >
                        <Upload size={16} />
                        Importer un fichier
                      </button>
                    </div>
                  )}

                  {scanMethod === 'camera' ? (
                    <SmartCameraScanner
                      onCapture={handleFile}
                      onCancel={() => setScanMethod('file')}
                      activeExam={activeExam}
                    />
                  ) : (
                    <div
                      onDrop={handleDrop} onDragOver={e => e.preventDefault()}
                      onClick={() => fileRef.current?.click()}
                      style={{ 
                        border: '2px dashed var(--border)', 
                        borderRadius: '1.5rem', 
                        padding: '3.5rem 1.5rem', 
                        textAlign: 'center', 
                        cursor: 'pointer', 
                        transition: 'all 0.25s', 
                        background: 'rgba(255, 255, 255, 0.01)',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                      onMouseEnter={e => { 
                        e.currentTarget.style.borderColor = 'var(--violet)'; 
                        e.currentTarget.style.background = 'var(--violet-soft)'; 
                      }}
                      onMouseLeave={e => { 
                        e.currentTarget.style.borderColor = 'var(--border)';  
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.01)'; 
                      }}
                    >
                      <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={e => handleFile(e.target.files[0])} />
                      <div style={{ 
                        width: 60, 
                        height: 60, 
                        borderRadius: '50%', 
                        background: 'var(--violet-soft)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        margin: '0 auto 1.25rem',
                        border: '1.5px solid rgba(113, 109, 242, 0.15)'
                      }}>
                        <Upload size={24} color="var(--violet)" />
                      </div>
                      <h3 style={{ fontWeight: 800, marginBottom: '0.35rem', fontSize: '1.1rem', color: 'var(--text-main)', letterSpacing: '-0.01em' }}>
                        Sélectionner une photo
                      </h3>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', lineHeight: 1.6, maxWidth: 380, margin: '0 auto' }}>
                        Faites glisser votre feuille de réponses ici ou cliquez pour parcourir vos dossiers.<br/>
                        <span style={{ color: 'var(--violet)', fontWeight: 700, fontSize: '0.78rem', marginTop: '0.5rem', display: 'inline-block' }}>
                          ⚡ Identification automatique par QR Code
                        </span>
                      </p>
                    </div>
                  )}

                  {/* Pro Tips */}
                  <div style={{ marginTop: '2.5rem' }}>
                    <h4 style={{ fontWeight: 800, fontSize: '0.85rem', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                      💡 Conseils pour un scan parfait :
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }}>
                      {[
                        ['💡','Éclairage homogène','Évitez les ombres portées et les reflets directs sur la feuille.'],
                        ['📐','Cadrage parallèle','Tenez votre caméra bien parallèle et au-dessus de la feuille.'],
                        ['🖊️','Remplissage complet','Remplissez entièrement les cercles de réponses au stylo noir ou bleu.'],
                        ['📷','Repères visibles','Les 4 repères carrés aux coins de la feuille doivent être parfaitement visibles.'],
                      ].map(([ic,t,d]) => (
                        <div key={t} style={{ display: 'flex', gap: '0.85rem', padding: '0.85rem 1rem', background: 'rgba(255,255,255,0.015)', borderRadius: '1rem', border: '1px solid var(--border)' }}>
                          <span style={{ fontSize: '1.25rem', flexShrink: 0, marginTop: '0.1rem' }}>{ic}</span>
                          <div>
                            <p style={{ fontWeight: 800, fontSize: '0.85rem', marginBottom: '0.15rem', color: 'var(--text-main)' }}>{t}</p>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', lineHeight: 1.45, margin: 0 }}>{d}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── SCANNING PHASE ── */}
          {phase === 'scanning' && (
            <div style={{ textAlign: 'center', padding: '2.5rem 0', maxWidth: 440, margin: '0 auto' }}>
              {imagePreview && (
                <div style={{ position: 'relative', display: 'inline-block', marginBottom: '2rem', borderRadius: '1.5rem', overflow: 'hidden', border: '1px solid var(--border)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
                  <img src={imagePreview} alt="scan" style={{ maxHeight: 250, maxWidth: '100%', objectFit: 'contain', display: 'block' }} />
                  {/* Glowing futuristic scanning beam */}
                  <div style={{
                    position: 'absolute', left: 0, right: 0, height: '3px',
                    background: 'linear-gradient(90deg, transparent, var(--violet), transparent)',
                    boxShadow: '0 0 16px var(--violet)',
                    animation: 'scanBeam 1.8s ease-in-out infinite'
                  }} />
                </div>
              )}
              
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', position: 'relative', width: 80, height: 80, marginBottom: '1.5rem' }}>
                <svg viewBox="0 0 72 72" style={{ position: 'absolute', inset: 0, animation: 'spin 1.2s linear infinite' }}>
                  <circle cx="36" cy="36" r="30" fill="none" stroke="var(--violet)" strokeWidth="3.5" strokeDasharray="60 100" strokeLinecap="round"/>
                </svg>
                <BrainCircuit size={32} color="var(--violet)" />
              </div>
              <h3 style={{ fontWeight: 900, fontSize: '1.3rem', letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>Analyse OMR intelligente…</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '2.25rem', lineHeight: 1.5 }}>L'IA calibre la feuille et extrait les réponses détectées.</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {[
                  'Traitement numérique & contraste',
                  "Lecture du QR Code & identification QCM",
                  'Extraction des réponses cochées',
                ].map((step, i) => (
                  <div key={step} style={{
                    display: 'flex', alignItems: 'center', gap: '0.85rem',
                    padding: '0.75rem 1.1rem', borderRadius: '1rem',
                    background: scanStep > i ? 'var(--emerald-soft)' : 'rgba(255, 255, 255, 0.01)',
                    border: `1px solid ${scanStep > i ? 'rgba(16, 185, 129, 0.2)' : 'var(--border)'}`,
                    transition: 'all 0.3s ease',
                  }}>
                    {scanStep > i
                      ? <CheckCircle2 size={16} color="var(--emerald)" style={{ flexShrink: 0 }} />
                      : <Loader2 size={16} color="var(--violet)" style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />}
                    <span style={{ fontSize: '0.85rem', color: scanStep > i ? 'var(--emerald)' : 'var(--text-muted)', fontWeight: scanStep > i ? 700 : 500 }}>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── VERIFY PHASE ── */}
          {phase === 'verify' && activeExam && (
            <div style={{ maxWidth: 760, margin: '0 auto' }}>
              <div style={{ 
                padding: '1.25rem 1.5rem', 
                borderRadius: '1.25rem', 
                marginBottom: '1.75rem', 
                display: 'flex', 
                gap: '1rem', 
                alignItems: 'flex-start',
                background: ambiguousCount > 0 ? 'var(--warning-soft)' : 'var(--emerald-soft)',
                border: `1px solid ${ambiguousCount > 0 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)'}` 
              }}>
                {ambiguousCount > 0
                  ? <AlertCircle size={22} color="var(--warning)" style={{ flexShrink: 0, marginTop: 2 }} />
                  : <CheckCircle2 size={22} color="var(--emerald)" style={{ flexShrink: 0, marginTop: 2 }} />}
                <div>
                  <h4 style={{ fontWeight: 900, fontSize: '1rem', margin: 0, letterSpacing: '-0.01em' }}>
                    {ambiguousCount > 0
                      ? `${ambiguousCount} réponse${ambiguousCount>1?'s':''} à vérifier`
                      : `Analyse complétée avec succès !`}
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.35rem', lineHeight: 1.5, margin: 0 }}>
                    {ambiguousCount > 0
                      ? 'L\'IA a détecté des signaux plus faibles sur les lignes orange. Cliquez sur la lettre correcte pour corriger avant validation.'
                      : `Toutes les ${Q} questions ont été identifiées avec une très haute confiance. Cliquez sur "Confirmer" pour voir vos notes.`}
                  </p>
                </div>
              </div>

              {/* Exam banner */}
              <div className="exam-banner">
                <div className="exam-banner-left">
                  <span style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--violet)', letterSpacing: '0.12em' }}>Examen Identifié</span>
                  <h3 style={{ fontWeight: 900, fontSize: '1.25rem', margin: '4px 0 0 0', letterSpacing: '-0.02em', color: 'var(--text-main)' }}>{activeExam.name}</h3>
                  <p style={{ color:'var(--text-muted)', fontSize: '0.82rem', margin: '4px 0 0 0', fontWeight: 500 }}>{activeExam.school} · {activeExam.year}</p>
                </div>
                <div className="exam-banner-right">
                  <span style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-main)' }}>{Q}</span>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', margin: 0, fontWeight: 500 }}>Questions lues</p>
                </div>
              </div>

              <VerifyGrid scanned={scanned} questions={questions} onChange={handleVerifyChange} isMobile={isMobile} />

              <div className="actions-row" style={isMobile ? {
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'var(--bg-card)',
                borderTop: '1px solid var(--border)',
                padding: '0.75rem 1rem calc(0.75rem + env(safe-area-inset-bottom))',
                zIndex: 400,
                display: 'flex',
                gap: '0.75rem',
                margin: 0,
                boxShadow: '0 -4px 16px rgba(0,0,0,0.1)'
              } : {}}>
                <button className="btn-outline" onClick={reset} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '0.875rem', flex: isMobile ? 1 : 'none' }}>
                  <RotateCcw size={15} /> Rescanner
                </button>
                <button className="btn" onClick={handleConfirmVerify} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 2rem', borderRadius: '0.875rem', background: 'var(--emerald)', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.2)', flex: isMobile ? 2 : 'none' }}>
                  <Check size={16} strokeWidth={2.5} /> {isMobile ? 'Valider' : 'Confirmer & Calculer la note'}
                </button>
              </div>
            </div>
          )}

          {/* ── RESULTS PHASE ── */}
          {phase === 'results' && score && activeExam && (
            <div style={{ maxWidth: 840, margin: '0 auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
                
                {/* Visual scorecard header */}
                <div className="scorecard-header">
                  {/* Left part: glowing glass badge with dynamic gradients based on score */}
                  <div className="scorecard-left" style={{ 
                    padding: isMobile ? '1.25rem 1rem' : '2.5rem 2rem',
                    background: `linear-gradient(135deg, ${score.pct >= 70 ? 'rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.05)' : score.pct >= 50 ? 'rgba(245, 158, 11, 0.15), rgba(217, 119, 6, 0.05)' : 'rgba(239, 68, 68, 0.15), rgba(220, 38, 38, 0.05)'})`
                  }}>
                    <p style={{ color: textMutedColor, fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '0.5rem' }}>NOTE SUR 20</p>
                    <h2 style={{ 
                      color: score.pct >= 70 ? emeraldColor : score.pct >= 50 ? warningColor : dangerColor, 
                      fontSize: isMobile ? '2.8rem' : '4.2rem', 
                      fontWeight: 900, 
                      lineHeight: 1, 
                      margin: 0,
                      letterSpacing: '-0.03em',
                      textShadow: `0 0 20px ${score.pct >= 70 ? 'rgba(16,185,129,0.3)' : score.pct >= 50 ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)'}`
                    }}>
                      {((score.pts / Q) * 20).toFixed(2)}
                    </h2>
                    <p style={{ color: textMutedColor, fontSize: isMobile ? '0.78rem' : '0.85rem', marginTop: isMobile ? '0.4rem' : '0.75rem', fontWeight: 600 }}>
                      Score : <strong style={{ color: textMainColor }}>{score.pts.toFixed(2)}</strong> / {Q} pts
                    </p>
                    <p style={{ color: textSubtleColor, fontSize: '0.75rem', marginTop: '0.25rem', fontStyle: 'italic' }}>
                      Pénalités : -{score.neg.toFixed(2)} pts (Faux: {wrongCount})
                    </p>
                  </div>
                  
                  {/* Right part: stats breakdown list */}
                  <div className="scorecard-right" style={{ flexWrap: isMobile ? 'nowrap' : 'wrap' }}>
                    {[{l:'Correctes',v:correctCount,c:emeraldColor,bg:emeraldSoftColor},{l:'Fausses',v:wrongCount,c:dangerColor,bg:dangerSoftColor}].map((s, sIdx)=>(
                      <div key={s.l} style={{ flex: 1, padding: isMobile ? '1rem 0.5rem' : '2rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRight: sIdx === 0 ? `1px solid ${borderCol}` : 'none' }}>
                        <div style={{ 
                          width: isMobile ? 32 : 44, 
                          height: isMobile ? 32 : 44, 
                          borderRadius: '50%', 
                          background: s.bg, 
                          color: s.c, 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          marginBottom: isMobile ? '0.4rem' : '0.75rem',
                          fontWeight: 800
                        }}>
                          {sIdx === 0 ? <Check size={isMobile ? 14 : 18} strokeWidth={2.5} /> : <XCircle size={isMobile ? 14 : 18} />}
                        </div>
                        <p style={{ fontWeight: 900, fontSize: isMobile ? '1.35rem' : '1.75rem', color: s.c, margin: 0 }}>{s.v}</p>
                        <p style={{ fontSize: isMobile ? '0.72rem' : '0.8rem', color: textMutedColor, fontWeight: 700, marginTop: '2px' }}>{s.l}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
                  {/* SRS Reminder card */}
                  {wrongCount > 0 && (
                    <div className="srs-reminder-card">
                      <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
                        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(113, 109, 242, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <BrainCircuit size={22} color="var(--violet)" />
                        </div>
                        <div>
                          <h4 style={{ fontWeight: 800, fontSize: '0.95rem', margin: 0, color: 'var(--text-main)' }}>Planification SRS Activée</h4>
                          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0', lineHeight: 1.45 }}>
                            Les {wrongCount} questions incorrectes ont été ajoutées à votre cycle de révision espacée.
                          </p>
                        </div>
                      </div>
                      <button className="btn" onClick={() => navigate(`/study?exam=${activeExam.id}`)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', fontWeight: 800, whiteSpace: 'nowrap', padding: '0.6rem 1.25rem', borderRadius: '0.75rem' }}>
                        <Zap size={14} /> Lancer la révision
                      </button>
                    </div>
                  )}

                  {/* Corrections / Diagnostics details */}
                  <div style={{ background: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--border)', borderRadius: '1.5rem', padding: '1.25rem' }}>
                    <div className="results-tabs-wrapper">
                      <div className="results-tabs-container">
                        {[{id:'list',label:'Feuille de Correction',icon:<CheckCircle2 size={14}/>},{id:'diagnostic',label:'Analyse Thématique',icon:<TrendingUp size={14}/>}].map(t=>(
                          <button key={t.id} onClick={()=>setResultsTab(t.id)}
                            className="results-tab-button"
                            style={{ 
                              background: resultsTab === t.id ? 'var(--violet)' : 'transparent',
                              color: resultsTab === t.id ? '#fff' : 'var(--text-muted)',
                              boxShadow: resultsTab === t.id ? '0 2px 8px var(--violet-glow)' : 'none'
                            }}>
                            {t.icon}{t.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {resultsTab === 'list' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 400, overflowY: 'auto', paddingRight: '4px' }}>
                        {corrected.map(row => <ResultRow key={row.q} row={row} />)}
                      </div>
                    )}

                    {resultsTab === 'diagnostic' && (
                      <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                        <DiagnosticReport corrected={corrected} exam={activeExam} onClose={() => {}} />
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Action row */}
              <div className="results-actions-row" style={isMobile ? {
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'var(--bg-card)',
                borderTop: '1px solid var(--border)',
                padding: '0.75rem 1rem calc(0.75rem + env(safe-area-inset-bottom))',
                zIndex: 400,
                display: 'flex',
                gap: '0.5rem',
                margin: 0,
                boxShadow: '0 -4px 16px rgba(0,0,0,0.1)',
                flexDirection: 'row',
                justifyContent: 'space-between'
              } : {}}>
                <button 
                  className="btn-outline" 
                  onClick={reset} 
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.7rem 1rem', borderRadius: '0.875rem', flex: 1, fontSize: '0.82rem' }}
                >
                  <RotateCcw size={15} /> {isMobile ? 'Recommencer' : 'Scanner une autre copie'}
                </button>
                <button 
                  className="btn" 
                  onClick={handlePrintReport} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    gap: '0.4rem', 
                    padding: '0.7rem 1.2rem', 
                    borderRadius: '0.875rem',
                    fontWeight: 700,
                    flex: 1.2,
                    fontSize: '0.82rem'
                  }}
                >
                  <Printer size={15} /> {isMobile ? 'Rapport PDF' : 'Télécharger le Rapport PDF'}
                </button>
                <button 
                  className="btn-outline" 
                  onClick={() => navigate('/dashboard')} 
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.7rem', borderRadius: '0.875rem', width: 44, height: 44, flexShrink: 0 }}
                  title="Retour à l'accueil"
                >
                  <Home size={17} />
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
      <style>{`
        @keyframes scanBeam {
          0% { top: 0%; opacity: 0.3; }
          50% { top: 100%; opacity: 1; }
          100% { top: 0%; opacity: 0.3; }
        }

        /* Responsive stepper wizard */
        @media (max-width: 768px) {
          .stepper-container {
            padding: 0.6rem 0.8rem !important;
            border-radius: 1rem !important;
          }
          .step-item {
            gap: 0.25rem !important;
          }
          .step-label {
            display: none;
          }
          .step-label.active {
            display: inline;
            font-size: 0.75rem !important;
          }
          .step-line {
            margin-left: 0.4rem !important;
            margin-right: 0.4rem !important;
            min-width: 8px !important;
          }
        }

        /* Responsive Scorecard Header */
        .scorecard-header {
          border-radius: 1.5rem; 
          overflow: hidden; 
          border: 1px solid ${borderCol}; 
          box-shadow: var(--shadow-card);
          display: flex;
          flex-direction: row;
          background: ${cardBg};
        }
        .scorecard-left {
          text-align: center;
          flex: 1.2;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          border-right: 1px solid ${borderCol};
          position: relative;
        }
        .scorecard-left h2 {
          font-weight: 900 !important;
          line-height: 1 !important;
          margin: 0 !important;
          letter-spacing: -0.03em !important;
        }
        .scorecard-right {
          flex: 1; 
          display: flex; 
          background: rgba(255, 255, 255, 0.015);
        }

        /* Responsive SRS Card */
        .srs-reminder-card {
          padding: 1.5rem; 
          background: var(--violet-soft); 
          border: 1px solid rgba(113, 109, 242, 0.15); 
          border-radius: 1.5rem; 
          display: flex; 
          flex-direction: column; 
          justify-content: space-between;
          align-items: center;
          gap: 1.25rem;
        }
        @media (min-width: 640px) {
          .srs-reminder-card {
            flex-direction: row;
          }
        }
        @media (max-width: 480px) {
          .srs-reminder-card {
            padding: 1.25rem 1rem;
            align-items: stretch;
          }
          .srs-reminder-card button {
            width: 100%;
          }
        }

        /* Responsive Exam Banner in Verify */
        .exam-banner {
          background: rgba(255, 255, 255, 0.01); 
          border: 1px solid var(--border); 
          border-radius: 1.25rem; 
          padding: 1.25rem 1.5rem; 
          margin-bottom: 1.75rem; 
          display: flex; 
          justify-content: space-between; 
          align-items: center;
          gap: 1rem;
        }
        .exam-banner-left {
          text-align: left;
        }
        .exam-banner-right {
          text-align: right;
          flex-shrink: 0;
        }
        @media (max-width: 480px) {
          .exam-banner {
            flex-direction: column;
            align-items: flex-start;
            padding: 1rem;
          }
          .exam-banner-right {
            text-align: left;
            margin-top: 0.25rem;
          }
        }

        /* Responsive Action Row Buttons */
        .actions-row {
          display: flex;
          gap: 0.85rem;
          margin-top: 2.5rem;
          justify-content: flex-end;
          flex-wrap: wrap;
        }
        .results-actions-row {
          display: flex; 
          gap: 0.85rem; 
          margin-top: 3rem; 
          border-top: 1px solid var(--border); 
          padding-top: 1.5rem; 
          justify-content: flex-end; 
          flex-wrap: wrap;
        }
        @media (max-width: 600px) {
          .actions-row, .results-actions-row {
            flex-direction: column;
            align-items: stretch;
            width: 100%;
          }
          .actions-row button, .results-actions-row button {
            width: 100%;
            justify-content: center;
          }
        }

        /* Results Tab responsiveness */
        .results-tabs-wrapper {
          display: flex;
          align-items: center;
          margin-bottom: 1.25rem;
        }
        .results-tabs-container {
          display: flex;
          gap: 0.3rem;
          background: rgba(255, 255, 255, 0.02);
          padding: 0.25rem;
          border-radius: 0.875rem;
          border: 1px solid var(--border);
          width: 100%;
        }
        .results-tab-button {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          padding: 0.5rem 1rem;
          border-radius: 0.65rem;
          border: none;
          cursor: pointer;
          font-weight: 700;
          font-size: 0.82rem;
          font-family: inherit;
          transition: all 0.2s;
        }
        @media (max-width: 480px) {
          .results-tab-button {
            padding: 0.5rem 0.5rem;
            font-size: 0.75rem;
          }
        }

        .result-row-details {
          display: flex;
          gap: 0.6rem;
          align-items: center;
          font-size: 0.82rem;
          margin-top: 0.2rem;
          flex-wrap: wrap;
        }
      `}</style>
    </div>
  );
}
