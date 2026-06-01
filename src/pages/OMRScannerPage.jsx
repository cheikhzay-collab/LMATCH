import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, Camera, CheckCircle2, XCircle, AlertCircle,
  BrainCircuit, Zap, RotateCcw, Loader2, Check, TrendingUp, Sparkles, BookOpen, Printer
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
function VerifyGrid({ scanned, questions, onChange }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem', maxHeight:400, overflowY:'auto', paddingRight:'4px' }}>
      {scanned.map((row, idx) => {
        const qTextRaw = questions[idx]?.question || `Question ${row.q}`;
        return (
          <div key={row.q} className="verify-grid-row" style={{
            display:'flex', flexDirection:'column',
            gap:'0.5rem',
            padding:'0.6rem 0.8rem',
            background: row.confidence < 0.3 ? 'var(--warning-soft)' : 'var(--bg-glass)',
            borderRadius:'0.75rem',
            border: `1px solid ${row.confidence < 0.3 ? 'var(--warning)33' : 'var(--border)'}`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <span style={{ fontWeight:800, fontSize:'0.9rem', color:'var(--text-main)' }}>Q{row.q}</span>
              <ConfidenceDot confidence={row.confidence} />
            </div>
            
            <span style={{ fontSize:'0.8rem', color:'var(--text-muted)', overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis', display:'block', width: '100%' }}>
              {renderMathSnippet(qTextRaw)}
            </span>

            {/* Option selection buttons */}
            <div style={{ display:'flex', gap:'0.25rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
              {CHOICES.map(opt => (
                <button key={opt} onClick={() => onChange(idx, opt)} style={{
                  width:28, height:28, borderRadius:'50%', fontWeight:800, fontSize:'0.8rem',
                  cursor:'pointer', transition:'all 0.15s',
                  background: row.answer === opt ? 'var(--violet)' : 'var(--bg-glass)',
                  color:      row.answer === opt ? '#fff' : 'var(--text-muted)',
                  border:     row.answer === opt ? '2px solid var(--violet)' : '1px solid var(--border)',
                  boxShadow:  row.answer === opt ? '0 2px 8px var(--violet-glow)' : 'none',
                }}>
                  {opt}
                </button>
              ))}
              <button onClick={() => onChange(idx, null)} style={{
                  padding:'0 0.5rem', height:28, borderRadius:'6px', fontWeight:700, fontSize:'0.7rem',
                  cursor:'pointer', transition:'all 0.15s',
                  background: row.answer === null ? 'var(--danger-soft)' : 'var(--bg-glass)',
                  color:      row.answer === null ? 'var(--danger)' : 'var(--text-muted)',
                  border:     `1px solid ${row.answer === null ? 'var(--danger)' : 'var(--border)'}`,
                }}>
                Vide
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
    correct: { bg:'var(--emerald-soft)', border:'var(--emerald)', icon:<CheckCircle2 size={15}/>, label:'Correct', color:'var(--emerald)' },
    wrong:   { bg:'var(--danger-soft)',  border:'var(--danger)',  icon:<XCircle size={15}/>,      label:'Faux',    color:'var(--danger)'  },
    empty:   { bg:'var(--bg-glass)',     border:'var(--border)',  icon:<AlertCircle size={15}/>,   label:'Vide',    color:'var(--text-muted)' },
  };
  const status = row.detected === null ? 'empty' : row.result;
  const c = cfg[status];
  return (
    <div style={{
      display:'flex', flexDirection: 'column', gap:'0.4rem',
      padding:'0.6rem 0.8rem',
      background: c.bg, borderRadius:'0.75rem',
      borderLeft:`4px solid ${c.border}`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight:800, fontSize:'0.9rem' }}>Q{row.q}</span>
        <span style={{ display:'inline-flex', alignItems:'center', gap:'0.35rem', color:c.color, fontSize:'0.78rem', fontWeight:700 }}>{c.icon} {c.label}</span>
      </div>
      
      <span style={{ fontSize:'0.82rem', color:'var(--text-muted)', overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis', display:'block' }}>
        {renderMathSnippet(row.question)}
      </span>
      
      <div style={{ display:'flex', gap:'0.5rem', alignItems:'center', fontSize:'0.8rem', marginTop: '0.2rem' }}>
        <span style={{ color: 'var(--text-muted)' }}>Réponse:</span>
        <span style={{ padding:'0.15rem 0.5rem', borderRadius:'6px', background: status === 'correct' ? 'var(--emerald-soft)' : status === 'wrong' ? 'var(--danger-soft)' : 'var(--border)', fontWeight:800, color: status === 'correct' ? 'var(--emerald)' : status === 'wrong' ? 'var(--danger)' : 'var(--text-muted)' }}>
          {row.detected || '—'}
        </span>
        {status !== 'correct' && (
          <>
            <span style={{ color: 'var(--text-muted)' }}>→</span>
            <span style={{ padding:'0.15rem 0.5rem', borderRadius:'6px', background:'var(--emerald-soft)', fontWeight:800, color:'var(--emerald)' }}>{row.correct}</span>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Main Global Scanner Page ────────────────────────────────────── */
export default function OMRScannerPage() {
  const { user, updateCardProgress, saveMockExamResult, schoolBranding, exams, isExamLocked, profName, profPhone, profSite } = useAuth();
  const navigate = useNavigate();

  const [activeExam,   setActiveExam]   = useState(null);
  const [phase,        setPhase]        = useState('upload');
  const [scanMethod,   setScanMethod]   = useState('camera');
  const [imagePreview, setImagePreview] = useState(null);
  const [scanned,      setScanned]      = useState([]);
  const [corrected,    setCorrected]    = useState([]);
  const [score,        setScore]        = useState(null);
  const [scanError,    setScanError]    = useState(null);
  const [scanStep,     setScanStep]     = useState(0);
  const [resultsTab,   setResultsTab]   = useState('list');

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

      // 2. Lookup exam metadata
      const found = exams.find(e => e.id === qrPayload.examId);
      if (!found) {
        throw new Error(`Examen introuvable dans la bibliothèque (ID : ${qrPayload.examId.slice(0, 8)})`);
      }
      if (isExamLocked(found)) {
        throw new Error("Cet examen fait partie de l'offre Premium. Veuillez vous abonner pour scanner votre feuille de réponses et obtenir votre correction.");
      }

      setActiveExam(found);

      // 3. Scan the grid bubbles dynamically
      const results = await scanAnswerSheet(file, found.questions.length);
      setScanned(results);
      setPhase('verify');
    } catch (e) {
      setScanError(e.message);
      setPhase('upload');
    }
  }, [exams]);

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
    setPhase('upload'); setActiveExam(null); setImagePreview(null); setScanned([]);
    setCorrected([]); setScore(null); setScanStep(0); setScanError(null); setResultsTab('list');
    setScanMethod('camera');
  };

  const ambiguousCount = scanned.filter(r => r.confidence < 0.3).length;
  const wrongCount     = corrected.filter(r => r.result === 'wrong').length;
  const correctCount   = corrected.filter(r => r.result === 'correct').length;

  const phaseLabel = { upload:'Uploader', scanning:'Analyse…', verify:'Vérification', results:'Résultats' };

  return (
    <div className="animate-fade-in" style={{ padding: '0.25rem 0', width: '100%', overflowX: 'hidden' }}>
      {/* Page Title & Phase Indicators */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'linear-gradient(135deg, var(--violet), var(--emerald))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Camera size={18} color="#fff" />
            </div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0, color: 'var(--text-main)' }}>Scanner Intelligent</h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0, lineHeight: 1.4 }}>
            Prenez en photo votre feuille de réponses L'Match. L'IA s'occupe du reste.
          </p>
        </div>
        
        {/* Phase indicators */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'var(--bg-glass)', padding: '0.35rem 0.75rem', borderRadius: '1rem', border: '1px solid var(--border)', alignSelf: 'flex-start', width: '100%', justifyContent: 'space-between', overflowX: 'auto' }}>
          {['upload', 'scanning', 'verify', 'results'].map((p, i) => (
            <React.Fragment key={p}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: phase === p ? 'var(--violet)' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                {phaseLabel[p]}
              </span>
              {i < 3 && <span style={{ color: 'var(--border)', fontSize: '0.65rem' }}>→</span>}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', width: '100%' }}>
        <div className="glass-panel" style={{ padding: '1rem', borderRadius: '1.25rem', border: '1px solid var(--border)', width: '100%', boxSizing: 'border-box' }}>
          
          {/* ── UPLOAD PHASE ── */}
          {phase === 'upload' && (
            <div style={{ maxWidth: 640, margin: '0 auto' }}>
              {scanError && (
                <div style={{ padding:'0.875rem 1.25rem', background:'var(--danger-soft)', border:'1px solid var(--danger)33', borderRadius:'0.875rem', marginBottom:'1.5rem', color:'var(--danger)', fontSize:'0.88rem', fontWeight:600, display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <AlertCircle size={18} style={{ flexShrink: 0 }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'flex-start' }}>
                    <span>{scanError}</span>
                    {scanError.includes("Premium") && (
                      <button 
                        onClick={() => navigate('/subscription')} 
                        style={{ background: 'none', border: 'none', color: 'var(--violet)', padding: 0, fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', textAlign: 'left', textDecoration: 'underline' }}
                      >
                        Voir les formules d'abonnement
                      </button>
                    )}
                  </div>
                </div>
              )}
              
              {/* Clean scan method switcher tab */}
              <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-glass)', padding: '0.25rem', borderRadius: '0.75rem', border: '1px solid var(--border)', marginBottom: '1.5rem' }}>
                <button 
                  onClick={() => setScanMethod('camera')}
                  style={{
                    flex: 1, padding: '0.6rem', borderRadius: '0.6rem', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', transition: 'all 0.2s',
                    background: scanMethod === 'camera' ? 'var(--violet)' : 'transparent',
                    color: scanMethod === 'camera' ? '#fff' : 'var(--text-muted)'
                  }}
                >
                  <Camera size={15} /> Utiliser la caméra
                </button>
                <button 
                  onClick={() => setScanMethod('file')}
                  style={{
                    flex: 1, padding: '0.6rem', borderRadius: '0.6rem', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', transition: 'all 0.2s',
                    background: scanMethod === 'file' ? 'var(--violet)' : 'transparent',
                    color: scanMethod === 'file' ? '#fff' : 'var(--text-muted)'
                  }}
                >
                  <Upload size={15} /> Importer un fichier
                </button>
              </div>

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
                  style={{ border:'2px dashed var(--border)', borderRadius:'1.25rem', padding:'2.5rem 1rem', textAlign:'center', cursor:'pointer', transition:'all 0.25s', background:'var(--bg-glass)' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor='var(--violet)'; e.currentTarget.style.background='var(--violet-soft)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)';  e.currentTarget.style.background='var(--bg-glass)'; }}
                >
                  <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={e => handleFile(e.target.files[0])} />
                  <div style={{ width:54, height:54, borderRadius:'50%', background:'var(--violet-soft)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1rem' }}>
                    <Upload size={22} color="var(--violet)" />
                  </div>
                  <h3 style={{ fontWeight:800, marginBottom:'0.25rem', fontSize: '1rem', color: 'var(--text-main)' }}>Sélectionner une photo</h3>
                  <p style={{ color:'var(--text-muted)', fontSize:'0.78rem', lineHeight:1.5, maxWidth: 380, margin: '0 auto' }}>
                    Cliquez pour choisir une photo de votre galerie.<br/>
                    <span style={{ color:'var(--violet)', fontWeight:700 }}>Détection automatique via QR Code</span>
                  </p>
                </div>
              )}

              {/* Pro Tips */}
              <div style={{ marginTop:'2rem' }}>
                <h4 style={{ fontWeight:800, fontSize:'0.82rem', marginBottom:'0.75rem', textTransform:'uppercase', letterSpacing:'0.05em', color:'var(--text-subtle)' }}>💡 Conseils de numérisation :</h4>
                <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:'0.6rem' }}>
                  {[
                    ['💡','Éclairage homogène','Évitez les ombres portées et les reflets.'],
                    ['📐','Cadrage parallèle','Tenez votre caméra bien au-dessus de la feuille.'],
                    ['🖊️','Bulles foncées','Remplissez les cercles au stylo noir/bleu.'],
                    ['📷','Repères de coins','Les 4 repères de coins de la feuille doivent être visibles.'],
                  ].map(([ic,t,d]) => (
                    <div key={t} style={{ display:'flex', gap:'0.6rem', padding:'0.65rem 0.85rem', background:'var(--bg-glass)', borderRadius:'0.75rem', border:'1px solid var(--border)' }}>
                      <span style={{ fontSize:'1.1rem', flexShrink:0 }}>{ic}</span>
                      <div>
                        <p style={{ fontWeight:800, fontSize:'0.78rem', marginBottom:'0.1rem', color: 'var(--text-main)' }}>{t}</p>
                        <p style={{ color:'var(--text-muted)', fontSize:'0.72rem', lineHeight:1.3 }}>{d}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── SCANNING PHASE ── */}
          {phase === 'scanning' && (
            <div style={{ textAlign:'center', padding:'2rem 0', maxWidth: 420, margin: '0 auto' }}>
              {imagePreview && (
                <div style={{ position:'relative', display:'inline-block', marginBottom:'1.5rem' }}>
                  <img src={imagePreview} alt="scan" style={{ maxHeight:240, borderRadius:'1rem', border:'1px solid var(--border)', maxWidth:'100%', objectFit:'contain' }} />
                  {/* Glowing futuristic scanning beam */}
                  <div style={{
                    position: 'absolute', left: 0, right: 0, height: '4px',
                    background: 'linear-gradient(90deg, transparent, var(--violet), transparent)',
                    boxShadow: '0 0 12px var(--violet)',
                    animation: 'scanBeam 1.8s ease-in-out infinite'
                  }} />
                </div>
              )}
              
              <div style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', position:'relative', width:76, height:76, marginBottom:'1.25rem' }}>
                <svg viewBox="0 0 72 72" style={{ position:'absolute', inset:0, animation:'spin 1.2s linear infinite' }}>
                  <circle cx="36" cy="36" r="30" fill="none" stroke="var(--violet)" strokeWidth="4" strokeDasharray="60 100" strokeLinecap="round"/>
                </svg>
                <BrainCircuit size={28} color="var(--violet)" />
              </div>
              <h3 style={{ fontWeight:800, marginBottom:'0.5rem' }}>Analyse OMR intelligente…</h3>
              <p style={{ color: 'var(--text-muted)', fontSize:'0.88rem', marginBottom: '2rem' }}>L'IA calibre la feuille et extrait les repères.</p>

              <div style={{ display:'flex', display:'flex', flexDirection:'column', gap:'0.5rem' }}>
                {[
                  'Traitement numérique & contraste',
                  "Lecture du QR Code & identification QCM",
                  'Extraction des réponses cochées',
                ].map((step, i) => (
                  <div key={step} style={{
                    display:'flex', alignItems:'center', gap:'0.75rem',
                    padding:'0.6rem 1rem', borderRadius:'0.75rem',
                    background: scanStep > i ? 'var(--emerald-soft)' : 'var(--bg-glass)',
                    border:`1px solid ${scanStep > i ? 'var(--emerald)33' : 'var(--border)'}`,
                    transition:'all 0.3s ease',
                  }}>
                    {scanStep > i
                      ? <CheckCircle2 size={16} color="var(--emerald)" style={{ flexShrink:0 }} />
                      : <Loader2 size={16} color="var(--violet)" style={{ animation:'spin 1s linear infinite', flexShrink:0 }} />}
                    <span style={{ fontSize:'0.85rem', color: scanStep > i ? 'var(--emerald)' : 'var(--text-muted)', fontWeight: scanStep > i ? 700 : 400 }}>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── VERIFY PHASE ── */}
          {phase === 'verify' && activeExam && (
            <div style={{ maxWidth: 760, margin: '0 auto' }}>
              <div style={{ padding:'1rem 1.25rem', borderRadius:'1rem', marginBottom:'1.5rem', display:'flex', gap:'0.875rem', alignItems:'flex-start',
                background: ambiguousCount > 0 ? 'var(--warning-soft)' : 'var(--emerald-soft)',
                border:`1px solid ${ambiguousCount > 0 ? 'var(--warning)33' : 'var(--emerald)33'}` }}>
                {ambiguousCount > 0
                  ? <AlertCircle size={22} color="var(--warning)" style={{ flexShrink:0, marginTop:2 }} />
                  : <CheckCircle2 size={22} color="var(--emerald)" style={{ flexShrink:0, marginTop:2 }} />}
                <div>
                  <h4 style={{ fontWeight:800, fontSize:'0.95rem', margin:0 }}>
                    {ambiguousCount > 0
                      ? `${ambiguousCount} réponse${ambiguousCount>1?'s':''} à vérifier`
                      : `Analyse complétée avec succès !`}
                  </h4>
                  <p style={{ fontSize:'0.82rem', color:'var(--text-muted)', marginTop:'0.25rem', lineHeight: 1.4 }}>
                    {ambiguousCount > 0
                      ? 'L\'IA a détecté des signaux plus faibles sur les lignes orange. Cliquez sur la lettre correcte pour corriger avant validation.'
                      : `Toutes les ${Q} questions ont été identifiées avec une très haute confiance. Cliquez sur "Confirmer" pour voir vos notes.`}
                  </p>
                </div>
              </div>

              {/* Exam banner */}
              <div style={{ background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: '1rem', padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--violet)', letterSpacing: '0.1em' }}>Examen Identifié</span>
                  <h3 style={{ fontWeight: 800, fontSize: '1.1rem', margin: '2px 0 0 0' }}>{activeExam.name}</h3>
                  <p style={{ color:'var(--text-muted)', fontSize: '0.8rem', margin: '4px 0 0 0' }}>{activeExam.school} · {activeExam.year}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-main)' }}>{Q}</span>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: 0 }}>Questions lues</p>
                </div>
              </div>

              <VerifyGrid scanned={scanned} questions={questions} onChange={handleVerifyChange} />

              <div style={{ display:'flex', gap:'0.75rem', marginTop:'2rem', justifyContent:'flex-end' }}>
                <button className="btn-outline" onClick={reset} style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                  <RotateCcw size={15} /> Rescanner
                </button>
                <button className="btn-emerald" onClick={handleConfirmVerify} style={{ display:'flex', alignItems:'center', gap: '0.5rem', padding: '0.75rem 2rem' }}>
                  <Check size={16} /> Confirmer & calcul du score
                </button>
              </div>
            </div>
          )}

          {/* ── RESULTS PHASE ── */}
          {phase === 'results' && score && activeExam && (
            <div style={{ maxWidth: 840, margin: '0 auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '2rem' }}>
                
                {/* Left col: score card & quick stats */}
                <div>
                  <div style={{ borderRadius:'1.5rem', overflow:'hidden', border:'1px solid var(--border)', marginBottom:'1.5rem', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>
                    <div style={{ background:`linear-gradient(135deg,${score.pct>=70?'#065F46,#022C22':score.pct>=50?'#92400E,#451A03':'#7F1D1D,#3B0000'})`, padding:'2rem', textAlign:'center' }}>
                      <p style={{ color:'rgba(255,255,255,0.7)', fontSize:'0.75rem', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:'0.5rem' }}>NOTE SUR 20</p>
                      <h2 style={{ color:'#fff', fontSize:'3.5rem', fontWeight:900, lineHeight:1, margin: 0 }}>
                        {((score.pts / Q) * 20).toFixed(2)}
                      </h2>
                      <p style={{ color:'rgba(255,255,255,0.6)', fontSize:'0.82rem', marginTop:'0.5rem', fontWeight: 600 }}>
                        Score brut: {score.pts.toFixed(2)} / {Q} pts
                      </p>
                      <p style={{ color:'rgba(255,255,255,0.5)', fontSize:'0.72rem', marginTop:'0.5rem', fontStyle: 'italic' }}>
                        Pénalité: {score.neg.toFixed(2)} pts (faux: {wrongCount})
                      </p>
                    </div>
                    
                    <div style={{ display:'flex', background:'var(--bg-glass)', borderTop:'1px solid var(--border)' }}>
                      {[{l:'Correctes',v:correctCount,c:'var(--emerald)'},{l:'Fausses',v:wrongCount,c:'var(--danger)'}].map(s=>(
                        <div key={s.l} style={{ flex:1, padding:'1rem', textAlign:'center', borderRight:'1px solid var(--border)' }}>
                          <p style={{ fontWeight:900, fontSize:'1.5rem', color:s.c, margin: 0 }}>{s.v}</p>
                          <p style={{ fontSize:'0.75rem', color:'var(--text-muted)', fontWeight:700, marginTop: '2px' }}>{s.l}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* SRS Reminder card */}
                  {wrongCount > 0 && (
                    <div style={{ padding:'1.25rem', background:'var(--violet-soft)', border:'1px solid rgba(99,102,241,0.2)', borderRadius:'1.25rem', display:'flex', flexDirection:'column', gap:'0.75rem', marginBottom: '1.5rem' }}>
                      <div style={{ display:'flex', gap:'0.6rem', alignItems:'center' }}>
                        <BrainCircuit size={20} color="var(--violet)" />
                        <h4 style={{ fontWeight:800, fontSize:'0.88rem', margin: 0 }}>Planification SRS Activée</h4>
                      </div>
                      <p style={{ fontSize:'0.8rem', color:'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                        Les {wrongCount} questions ratées ont été ajoutées à vos rappels Spaced Repetition.
                      </p>
                      <button className="btn" onClick={() => navigate(`/study?exam=${activeExam.id}`)} style={{ display:'flex', alignItems:'center', gap:'0.5rem', justifyContent:'center', fontSize: '0.8rem', fontWeight: 800 }}>
                        <Zap size={13} /> Lancer la révision
                      </button>
                    </div>
                  )}
                </div>

                {/* Right col: Tabs list / Diagnostic details */}
                <div>
                  <div style={{ display:'flex', justifyBetween:'space-between', alignItems: 'center', marginBottom:'1.25rem' }}>
                    <div style={{ display:'flex', gap:'0.4rem', background:'var(--bg-glass)', padding:'0.3rem', borderRadius:'var(--radius-md)', border:'1px solid var(--border)' }}>
                      {[{id:'list',label:'Feuille de Correction',icon:<CheckCircle2 size={14}/>},{id:'diagnostic',label:'Analyse Thématique',icon:<TrendingUp size={14}/>}].map(t=>(
                        <button key={t.id} onClick={()=>setResultsTab(t.id)}
                          style={{ display:'flex',alignItems:'center',gap:'0.4rem',padding:'0.45rem 1rem',borderRadius:'calc(var(--radius-md) - 3px)',border:'none',cursor:'pointer',fontWeight:700,fontSize:'0.82rem',fontFamily:'inherit',transition:'all 0.2s',
                            background:resultsTab===t.id?'var(--violet)':'transparent',
                            color:resultsTab===t.id?'#fff':'var(--text-muted)',
                          }}>
                          {t.icon}{t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {resultsTab === 'list' && (
                    <div style={{ display:'flex', flexDirection:'column', gap:'0.4rem', maxHeight:420, overflowY:'auto', paddingRight: '4px' }}>
                      {corrected.map(row => <ResultRow key={row.q} row={row} />)}
                    </div>
                  )}

                  {resultsTab === 'diagnostic' && (
                    <div style={{ maxHeight:420, overflowY:'auto' }}>
                      <DiagnosticReport corrected={corrected} exam={activeExam} onClose={() => {}} />
                    </div>
                  )}
                </div>

              </div>

              {/* Action row */}
              <div style={{ display:'flex', gap:'0.75rem', marginTop:'2.5rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem', justifyContent:'flex-end', flexWrap: 'wrap' }}>
                <button className="btn-outline" onClick={reset} style={{ display:'flex', alignItems:'center', gap:'0.5rem', padding: '0.75rem 1.5rem' }}>
                  <RotateCcw size={15} /> Scanner une autre feuille
                </button>
                <button className="btn" onClick={handlePrintReport} style={{ display:'flex', alignItems:'center', gap:'0.5rem', padding: '0.75rem 1.75rem', background: 'linear-gradient(135deg, var(--violet), #4f46e5)', border: 'none', color: '#fff' }}>
                  <Printer size={15} /> Télécharger le Rapport PDF
                </button>
                <button className="btn" onClick={() => navigate('/dashboard')} style={{ padding: '0.75rem 2rem' }}>
                  Retour à l'accueil
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
      `}</style>
    </div>
  );
}
