import React, { useState, useRef, useCallback } from 'react';
import {
  Upload, Camera, CheckCircle2, XCircle, AlertCircle,
  BrainCircuit, Zap, RotateCcw, X, Loader2, Edit3, Check, TrendingUp
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { scanAnswerSheet, readQRCodeFromImage } from '../utils/OMRScanner';
import DiagnosticReport from './DiagnosticReport';
import { renderWithMath } from '../utils/mathRenderer';

const CHOICES = ['A', 'B', 'C', 'D', 'E'];



function renderMathSnippet(text) {
  return renderWithMath(text);
}

/* ── Confidence indicator ────────────────────────────────────────── */
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

/* ── Verification Grid ───────────────────────────────────────────── */
function VerifyGrid({ scanned, questions, onChange }) {
  // scanned: [{ q, answer, confidence }]
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'0.4rem', maxHeight:360, overflowY:'auto' }}>
      {scanned.map((row, idx) => {
        const qTextRaw = questions[idx]?.question || `Question ${row.q}`;
        return (
          <div key={row.q} className="verify-grid-row" style={{
            background: row.confidence < 0.3 ? 'var(--warning-soft)' : 'var(--bg-glass)',
            borderColor: row.confidence < 0.3 ? 'var(--warning)33' : 'var(--border)',
          }}>
            <span style={{ fontWeight:800, fontSize:'0.85rem', color:'var(--text-main)' }}>Q{row.q}</span>
            <span style={{ fontSize:'0.78rem', color:'var(--text-muted)', overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis', display:'block' }}>
              {renderMathSnippet(qTextRaw)}
            </span>

            {/* Option buttons */}
            <div style={{ display:'flex', gap:'0.25rem' }}>
              {CHOICES.map(opt => (
                <button key={opt} onClick={() => onChange(idx, opt)} style={{
                  width:26, height:26, borderRadius:'50%', fontWeight:800, fontSize:'0.75rem',
                  cursor:'pointer', transition:'all 0.15s',
                  background: row.answer === opt ? 'var(--violet)' : 'var(--bg-glass)',
                  color:      row.answer === opt ? '#fff' : 'var(--text-muted)',
                  border:     row.answer === opt ? '2px solid var(--violet)' : '1px solid var(--border)',
                  boxShadow:  row.answer === opt ? '0 2px 8px var(--violet-glow)' : 'none',
                }}>
                  {opt}
                </button>
              ))}
              {/* Force Empty Button */}
              <button onClick={() => onChange(idx, null)} style={{
                  padding:'0 0.5rem', height:26, borderRadius:'4px', fontWeight:700, fontSize:'0.65rem',
                  cursor:'pointer', transition:'all 0.15s',
                  background: row.answer === null ? 'var(--danger-soft)' : 'var(--bg-glass)',
                  color:      row.answer === null ? 'var(--danger)' : 'var(--text-muted)',
                  border:     `1px solid ${row.answer === null ? 'var(--danger)' : 'var(--border)'}`,
                }}>
                Vide
              </button>
            </div>

            <ConfidenceDot confidence={row.confidence} />
          </div>
        );
      })}
    </div>
  );
}

/* ── Result row ──────────────────────────────────────────────────── */
function ResultRow({ row }) {
  const cfg = {
    correct: { bg:'var(--emerald-soft)', border:'var(--emerald)', icon:<CheckCircle2 size={14}/>, label:'Correct', color:'var(--emerald)' },
    wrong:   { bg:'var(--danger-soft)',  border:'var(--danger)',  icon:<XCircle size={14}/>,      label:'Faux',    color:'var(--danger)'  },
    empty:   { bg:'var(--bg-glass)',     border:'var(--border)',  icon:<AlertCircle size={14}/>,   label:'Vide',    color:'var(--text-muted)' },
  };
  const status = row.detected === null ? 'empty' : row.result;
  const c = cfg[status];
  return (
    <div className="result-row" style={{
      background: c.bg,
      borderLeftColor: c.border,
    }}>
      <span style={{ fontWeight:800, fontSize:'0.88rem' }}>Q{row.q}</span>
      <span style={{ fontSize:'0.79rem', color:'var(--text-muted)', overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis', display:'block' }}>
        {renderMathSnippet(row.question)}
      </span>
      <div style={{ display:'flex', gap:'0.4rem', alignItems:'center', fontSize:'0.8rem' }}>
        <span style={{ padding:'0.1rem 0.5rem', borderRadius:'4px', background: status === 'correct' ? 'var(--emerald-soft)' : status === 'wrong' ? 'var(--danger-soft)' : 'var(--border)', fontWeight:800, color: status === 'correct' ? 'var(--emerald)' : status === 'wrong' ? 'var(--danger)' : 'var(--text-muted)' }}>
          {row.detected || '—'}
        </span>
        {status !== 'correct' && (<><span className="text-subtle">→</span><span style={{ padding:'0.1rem 0.5rem', borderRadius:'4px', background:'var(--emerald-soft)', fontWeight:800, color:'var(--emerald)' }}>{row.correct}</span></>)}
      </div>
      <span style={{ display:'inline-flex', alignItems:'center', gap:'0.3rem', color:c.color, fontSize:'0.75rem', fontWeight:700 }}>{c.icon} {c.label}</span>
    </div>
  );
}

/* ── Main modal ──────────────────────────────────────────────────── */
export default function ScanUploadModal({ exam, onClose, onSRSLaunch }) {
  const { user, updateCardProgress, schoolBranding, exams } = useAuth();
  
  const [activeExam, setActiveExam] = useState(exam);

  const questions = activeExam?.questions || [];
  const Q = questions.length;

  // Get school scoring rules
  const brand = (activeExam ? schoolBranding[activeExam.school] : null) || { scoring: { correct: 1, wrong: -0.25, empty: 0 } };
  const rules = brand.scoring || { correct: 1, wrong: -0.25, empty: 0 };

  const [phase,        setPhase]        = useState('upload');
  const [imagePreview, setImagePreview] = useState(null);
  const [scanned,      setScanned]      = useState([]);
  const [corrected,    setCorrected]    = useState([]);
  const [score,        setScore]        = useState(null);
  const [scanError,    setScanError]    = useState(null);
  const [scanStep,     setScanStep]     = useState(0);
  const [resultsTab,   setResultsTab]   = useState('list');  // 'list' | 'diagnostic'

  const fileRef = useRef(null);

  /* ── Handle file ──────────────────────────────────────────────── */
  const handleFile = useCallback(async (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setScanError(null);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
    setPhase('scanning');

    // Step animation
    const steps = [0, 1, 2];
    for (const s of steps) {
      await new Promise(r => setTimeout(r, 600));
      setScanStep(s + 1);
    }

    try {
      let targetExam = activeExam;
      
      // 1. Dynamic QR detection if exam is null
      if (!targetExam) {
        const qrPayload = await readQRCodeFromImage(file);
        if (!qrPayload || !qrPayload.examId) {
          throw new Error("Impossible de lire le code QR L'Match. Veuillez cadrer correctement toute la feuille et assurer une bonne luminosité.");
        }
        
        const found = exams.find(e => e.id === qrPayload.examId);
        if (!found) {
          throw new Error(`Examen introuvable dans la bibliothèque (ID: ${qrPayload.examId.slice(0, 8)})`);
        }
        
        targetExam = found;
        setActiveExam(found);
      }

      // 2. Perform bubbles scanning
      const results = await scanAnswerSheet(file, targetExam.questions.length);
      setScanned(results);
      setPhase('verify');
    } catch (e) {
      setScanError(e.message);
      setPhase('upload');
    }
  }, [activeExam, exams]);

  const handleDrop = (e) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files[0]);
  };

  /* ── Verify step: user corrects any ambiguous answers ─────────── */
  const handleVerifyChange = (idx, newAnswer) => {
    setScanned(prev => prev.map((r, i) => i === idx ? { ...r, answer: newAnswer } : r));
  };

  const handleConfirmVerify = () => {
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
    // Max possible score is Q * rules.correct
    const maxPossible = Q * rules.correct;
    setScore({ pts, neg, max: Q, pct: Math.max(0, (pts / maxPossible) * 100) });
    setResultsTab('list');

    // Push to SRS
    rows.forEach((row, idx) => {
      const id = questions[idx]?.id || idx;
      updateCardProgress(id, row.result === 'correct' ? 4 : 0);
    });

    setPhase('results');
  };

  const reset = () => {
    setPhase('upload'); setImagePreview(null); setScanned([]);
    setCorrected([]); setScore(null); setScanStep(0); setScanError(null); setResultsTab('list');
  };

  const ambiguousCount = scanned.filter(r => r.confidence < 0.3).length;
  const wrongCount     = corrected.filter(r => r.result === 'wrong').length;
  const correctCount   = corrected.filter(r => r.result === 'correct').length;

  const phaseLabel = { upload:'Uploader', scanning:'Analyse…', verify:'Vérifier', results:'Résultats' };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:2000, background:'rgba(0,0,0,0.78)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}
      onClick={e => e.target === e.currentTarget && onClose()}>

      <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'1.5rem', width:'100%', maxWidth: phase === 'results' ? 720 : 540, maxHeight:'92vh', overflow:'auto', boxShadow:'0 32px 80px rgba(0,0,0,0.6)', animation:'fadeIn 0.25s ease' }}>

        {/* ── Header ── */}
        <div style={{ padding:'1.25rem 1.5rem', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, background:'var(--bg-card)', zIndex:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
            <div style={{ width:36, height:36, borderRadius:'10px', background:'linear-gradient(135deg,var(--violet),var(--emerald))', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Camera size={18} color="#fff" />
            </div>
            <div>
              <h3 style={{ fontWeight:800, fontSize:'0.97rem' }}>Correction OMR — {activeExam ? activeExam.name : "Scanner Intelligent"}</h3>
              <p style={{ color:'var(--text-muted)', fontSize:'0.76rem' }}>{activeExam ? `${Q} questions` : "Détection automatique de l'examen via QR"} · Étape : <strong className="text-violet">{phaseLabel[phase]}</strong></p>
            </div>
          </div>
          {/* Phase stepper */}
          <div style={{ display:'flex', alignItems:'center', gap:'0.35rem', marginRight:'1rem' }}>
            {['upload','scanning','verify','results'].map((p, i) => (
              <div key={p} style={{ width: phase === p ? 20 : 7, height:7, borderRadius:'99px', background: ['upload','scanning','verify','results'].indexOf(phase) >= i ? 'var(--violet)' : 'var(--border)', transition:'all 0.3s' }} />
            ))}
          </div>
          <button className="btn-ghost" onClick={onClose}><X size={18} /></button>
        </div>

        <div style={{ padding:'1.5rem' }}>

          {/* ── UPLOAD ── */}
          {phase === 'upload' && (
            <div>
              {scanError && (
                <div style={{ padding:'0.75rem 1rem', background:'var(--danger-soft)', border:'1px solid var(--danger)33', borderRadius:'0.75rem', marginBottom:'1rem', color:'var(--danger)', fontSize:'0.85rem', fontWeight:600 }}>
                  ⚠ {scanError}
                </div>
              )}
              <div
                onDrop={handleDrop} onDragOver={e => e.preventDefault()}
                onClick={() => fileRef.current?.click()}
                style={{ border:'2px dashed var(--border)', borderRadius:'1.25rem', padding:'2.5rem 2rem', textAlign:'center', cursor:'pointer', transition:'all 0.2s', background:'var(--bg-glass)' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor='var(--violet)'; e.currentTarget.style.background='var(--violet-soft)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)';  e.currentTarget.style.background='var(--bg-glass)'; }}
              >
                <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display:'none' }} onChange={e => handleFile(e.target.files[0])} />
                <div style={{ width:60, height:60, borderRadius:'50%', background:'var(--violet-soft)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1.25rem' }}>
                  <Upload size={26} color="var(--violet)" />
                </div>
                <h4 style={{ fontWeight:800, marginBottom:'0.4rem' }}>Déposez la photo ici</h4>
                <p style={{ color:'var(--text-muted)', fontSize:'0.85rem', lineHeight:1.6 }}>
                  Ou appuyez pour choisir un fichier / prendre une photo.<br/>
                  <span style={{ color:'var(--violet)', fontWeight:600 }}>PNG, JPG, WebP</span> — cadrez toute la feuille.
                </p>
              </div>

              {/* Tips */}
              <div style={{ marginTop:'1.25rem', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.625rem' }}>
                {[
                  ['💡','Bonne lumière','Éclairage uniforme, pas de reflets.'],
                  ['📐','Feuille droite','Tenez le téléphone parallèle à la feuille.'],
                  ['🖊️','Bulles noircies','Remplissez complètement chaque cercle.'],
                  ['📷','Cadrage complet','Toute la feuille doit être visible.'],
                ].map(([ic,t,d]) => (
                  <div key={t} style={{ display:'flex', gap:'0.625rem', padding:'0.625rem 0.875rem', background:'var(--bg-glass)', borderRadius:'0.75rem', border:'1px solid var(--border)' }}>
                    <span style={{ fontSize:'1.15rem', flexShrink:0 }}>{ic}</span>
                    <div>
                      <p style={{ fontWeight:700, fontSize:'0.8rem' }}>{t}</p>
                      <p style={{ color:'var(--text-muted)', fontSize:'0.75rem' }}>{d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── SCANNING ── */}
          {phase === 'scanning' && (
            <div style={{ textAlign:'center', padding:'1.5rem 0' }}>
              {imagePreview && (
                <img src={imagePreview} alt="scan" style={{ maxHeight:200, borderRadius:'0.875rem', marginBottom:'1.25rem', border:'1px solid var(--border)', maxWidth:'100%', objectFit:'contain' }} />
              )}
              <div style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', position:'relative', width:72, height:72, marginBottom:'1.25rem' }}>
                <svg viewBox="0 0 72 72" style={{ position:'absolute', inset:0, animation:'spin 1s linear infinite' }}>
                  <circle cx="36" cy="36" r="30" fill="none" stroke="var(--violet)" strokeWidth="5" strokeDasharray="75 100" strokeLinecap="round"/>
                </svg>
                <BrainCircuit size={26} color="var(--violet)" />
              </div>
              <h4 style={{ fontWeight:800, marginBottom:'1rem' }}>Analyse OMR pixel par pixel…</h4>
              <div style={{ display:'flex', flexDirection:'column', gap:'0.4rem', maxWidth:340, margin:'0 auto' }}>
                {[
                  'Amélioration du contraste',
                  `Lecture des ${Q} grilles de réponse`,
                  'Calcul du niveau de confiance',
                ].map((step, i) => (
                  <div key={step} style={{
                    display:'flex', alignItems:'center', gap:'0.625rem',
                    padding:'0.5rem 0.875rem', borderRadius:'0.625rem',
                    background: scanStep > i ? 'var(--emerald-soft)' : 'var(--bg-glass)',
                    border:`1px solid ${scanStep > i ? 'var(--emerald)33' : 'var(--border)'}`,
                    transition:'all 0.4s ease',
                  }}>
                    {scanStep > i
                      ? <CheckCircle2 size={14} color="var(--emerald)" />
                      : <Loader2 size={14} color="var(--violet)" style={{ animation:'spin 1s linear infinite' }} />}
                    <span style={{ fontSize:'0.82rem', color: scanStep > i ? 'var(--emerald)' : 'var(--text-muted)', fontWeight: scanStep > i ? 700 : 400 }}>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── VERIFY ── */}
          {phase === 'verify' && (
            <div>
              {/* Info banner */}
              <div style={{ padding:'0.875rem 1.1rem', borderRadius:'0.875rem', marginBottom:'1.25rem', display:'flex', gap:'0.75rem', alignItems:'flex-start',
                background: ambiguousCount > 0 ? 'var(--warning-soft)' : 'var(--emerald-soft)',
                border:`1px solid ${ambiguousCount > 0 ? 'var(--warning)33' : 'var(--emerald)33'}` }}>
                {ambiguousCount > 0
                  ? <AlertCircle size={20} color="var(--warning)" style={{ flexShrink:0, marginTop:1 }} />
                  : <CheckCircle2 size={20} color="var(--emerald)" style={{ flexShrink:0, marginTop:1 }} />}
                <div>
                  <p style={{ fontWeight:700, fontSize:'0.9rem' }}>
                    {ambiguousCount > 0
                      ? `${ambiguousCount} réponse${ambiguousCount>1?'s':''} ambiguë${ambiguousCount>1?'s':''} — vérifiez avant de valider`
                      : `Toutes les ${Q} réponses lues avec haute confiance ✓`}
                  </p>
                  <p style={{ fontSize:'0.78rem', color:'var(--text-muted)', marginTop:'0.2rem' }}>
                    {ambiguousCount > 0
                      ? 'Les cases orange ont un signal faible. Cliquez sur la lettre correcte pour corriger.'
                      : 'Confirmez pour calculer votre score définitif.'}
                  </p>
                </div>
              </div>

              <VerifyGrid scanned={scanned} questions={questions} onChange={handleVerifyChange} />

              <div style={{ display:'flex', gap:'0.75rem', marginTop:'1.25rem', justifyContent:'flex-end' }}>
                <button className="btn-outline" onClick={reset} style={{ display:'flex', alignItems:'center', gap:'0.4rem' }}>
                  <RotateCcw size={14} /> Rescanner
                </button>
                <button className="btn-emerald" onClick={handleConfirmVerify} style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                  <Check size={15} /> Valider & calculer le score
                </button>
              </div>
            </div>
          )}

          {/* ── RESULTS ── */}
          {phase === 'results' && score && (
            <div>
              {/* Score hero */}
              <div style={{ borderRadius:'1.25rem', overflow:'hidden', marginBottom:'1.25rem', border:'1px solid var(--border)' }}>
                <div style={{ background:`linear-gradient(135deg,${score.pct>=70?'#065F46,#022C22':score.pct>=50?'#92400E,#451A03':'#7F1D1D,#3B0000'})`, padding:'1.5rem 2rem', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'1rem' }}>
                  <div>
                    <p style={{ color:'rgba(255,255,255,0.65)', fontSize:'0.75rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'0.35rem' }}>Score final</p>
                    <p style={{ color:'#fff', fontSize:'2.75rem', fontWeight:900, lineHeight:1 }}>
                      {score.pts.toFixed(2)} <span style={{ fontSize:'1.1rem', opacity:.7 }}>/ {Q}</span>
                    </p>
                    <p style={{ color:'rgba(255,255,255,0.55)', fontSize:'0.78rem', marginTop:'0.35rem' }}>Pénalités −{score.neg.toFixed(2)} pts (×0.25 / fausse réponse)</p>
                  </div>
                  <div style={{ width:76, height:76, borderRadius:'50%', background:'rgba(255,255,255,0.15)', border:'3px solid rgba(255,255,255,0.3)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <span style={{ color:'#fff', fontWeight:900, fontSize:'1.6rem' }}>{score.pct.toFixed(0)}%</span>
                  </div>
                </div>
                <div style={{ display:'flex', background:'var(--bg-glass)', borderTop:'1px solid var(--border)' }}>
                  {[{l:'Correctes',v:correctCount,c:'var(--emerald)'},{l:'Fausses',v:wrongCount,c:'var(--danger)'}].map(s=>(
                    <div key={s.l} style={{ flex:1, padding:'0.875rem', textAlign:'center', borderRight:'1px solid var(--border)' }}>
                      <p style={{ fontWeight:900, fontSize:'1.35rem', color:s.c }}>{s.v}</p>
                      <p style={{ fontSize:'0.73rem', color:'var(--text-muted)', fontWeight:600 }}>{s.l}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* SRS CTA */}
              {wrongCount > 0 && (
                <div style={{ padding:'1rem 1.25rem', background:'var(--violet-soft)', border:'1px solid var(--violet)33', borderRadius:'1rem', marginBottom:'1.25rem', display:'flex', alignItems:'center', gap:'1rem', flexWrap:'wrap' }}>
                  <BrainCircuit size={22} color="var(--violet)" style={{ flexShrink:0 }} />
                  <div style={{ flex:1 }}>
                    <p style={{ fontWeight:700, fontSize:'0.88rem' }}>{wrongCount} question{wrongCount>1?'s':''} ajoutée{wrongCount>1?'s':''} au SRS</p>
                    <p style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>Planifiées jusqu'à maîtrise complète.</p>
                  </div>
                  <button className="btn" onClick={() => { onClose(); onSRSLaunch?.(); }} style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                    <Zap size={14} /> Réviser maintenant
                  </button>
                </div>
              )}

              {/* Tabs */}
              <div style={{ display:'flex', gap:'0.4rem', marginBottom:'1rem', background:'var(--bg-glass)', padding:'0.3rem', borderRadius:'var(--radius-md)', border:'1px solid var(--border)', width:'fit-content' }}>
                {[{id:'list',label:'Correction',icon:<CheckCircle2 size={13}/>},{id:'diagnostic',label:'Diagnostic',icon:<TrendingUp size={13}/>}].map(t=>(
                  <button key={t.id} onClick={()=>setResultsTab(t.id)}
                    style={{ display:'flex',alignItems:'center',gap:'0.35rem',padding:'0.4rem 0.875rem',borderRadius:'calc(var(--radius-md) - 3px)',border:'none',cursor:'pointer',fontWeight:700,fontSize:'0.8rem',fontFamily:'inherit',transition:'all 0.2s',
                      background:resultsTab===t.id?'var(--violet)':'transparent',
                      color:resultsTab===t.id?'#fff':'var(--text-muted)',
                    }}>
                    {t.icon}{t.label}
                  </button>
                ))}
              </div>

              {/* Per-question list */}
              {resultsTab === 'list' && (
                <div style={{ display:'flex', flexDirection:'column', gap:'0.35rem', maxHeight:240, overflowY:'auto' }}>
                  {corrected.map(row => <ResultRow key={row.q} row={row} />)}
                </div>
              )}

              {/* Diagnostic */}
              {resultsTab === 'diagnostic' && (
                <div style={{ maxHeight:360, overflowY:'auto' }}>
                  <DiagnosticReport corrected={corrected} exam={activeExam} onClose={onClose} />
                </div>
              )}

              <div style={{ display:'flex', gap:'0.75rem', marginTop:'1.25rem', justifyContent:'flex-end' }}>
                <button className="btn-outline" onClick={reset} style={{ display:'flex', alignItems:'center', gap:'0.4rem' }}>
                  <RotateCcw size={14} /> Rescanner
                </button>
                <button className="btn" onClick={onClose}>Fermer</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
