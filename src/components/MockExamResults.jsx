import React, { useState, useMemo } from 'react';
import { Trophy, CheckCircle2, XCircle, Lightbulb, ArrowLeft, TrendingUp, Zap } from 'lucide-react';
import { renderWithMath } from '../utils/mathRenderer';
import DiagnosticReport from './DiagnosticReport';

const renderOptionText = (text) => {
  return renderWithMath(text);
};

const MockExamResults = React.memo(({ questions, answers, exam, onReturn, schoolBranding }) => {
  const [tab, setTab] = useState('correction');

  // Get school scoring rules
  const brand = useMemo(() => schoolBranding[exam.school] || { scoring: { correct: 1, wrong: -0.25, empty: 0 } }, [schoolBranding, exam.school]);
  const rules = useMemo(() => brand.scoring || { correct: 1, wrong: -0.25, empty: 0 }, [brand]);

  const { score, pct, corrected } = useMemo(() => {
    let pts = 0;
    questions.forEach(q => {
      const ans = answers[q.id];
      if (ans === q.correct_answer) pts += rules.correct;
      else if (!ans) pts += rules.empty;
      else pts += rules.wrong;
    });

    const maxPossible = questions.length * rules.correct;
    const computedPct = maxPossible > 0 ? Math.max(0, Math.round((pts / maxPossible) * 100)) : 0;

    const computedCorrected = questions.map((q, idx) => ({
      q: idx + 1,
      question: q.question,
      correct: q.correct_answer,
      detected: answers[q.id] || null,
      result: answers[q.id] === q.correct_answer ? 'correct' : 'wrong',
      topic: q.topic || 'Général',
    }));

    return { score: pts, pct: computedPct, corrected: computedCorrected };
  }, [questions, answers, rules]);

  return (
    <div className="animate-fade-in" style={{ maxWidth: 900, margin: '0 auto', padding: 'clamp(1rem, 4vw, 2rem) clamp(0.875rem, 4vw, 1.5rem) 4rem' }}>
      {/* Trophy card */}
      <div className="glass-panel text-center" style={{ padding: '2.5rem 2rem', marginBottom: '1.5rem' }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%', margin: '0 auto 1.25rem',
          background: pct >= 50 ? 'var(--emerald-soft)' : 'var(--danger-soft)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: `2px solid ${pct >= 50 ? 'var(--emerald)' : 'var(--danger)'}`,
        }}>
          <Trophy size={32} color={pct >= 50 ? 'var(--emerald)' : 'var(--danger)'} />
        </div>
        <h1 className="text-gradient" style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>
          Rapport de Performance
        </h1>
        <div style={{ fontSize: '3.5rem', fontWeight: 900, margin: '0.5rem 0', lineHeight: 1 }}>
          {score}<span style={{ fontSize: '1.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>/{questions.length}</span>
        </div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
          background: pct >= 50 ? 'var(--emerald-soft)' : 'var(--danger-soft)',
          color: pct >= 50 ? 'var(--emerald)' : 'var(--danger)',
          padding: '0.35rem 1.1rem', borderRadius: '99px', fontWeight: 700,
          border: `1px solid ${pct >= 50 ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
          marginBottom: '1.25rem'
        }}>
          <Zap size={14} /> {pct}% de réussite
        </div>
        <button className="btn" style={{ marginTop: '0.75rem', margin: '0.75rem auto 0', display: 'flex', alignItems: 'center', gap: 6 }} onClick={onReturn}>
          <ArrowLeft size={16} /> Retour au Dashboard
        </button>
      </div>

      {/* Tab switcher */}
      <div style={{ display:'flex', gap:'0.5rem', marginBottom:'1.5rem', background:'var(--bg-glass)', padding:'0.35rem', borderRadius:'var(--radius-md)', border:'1px solid var(--border)', width:'fit-content', maxWidth:'100%', flexWrap:'wrap' }}>
        {[{id:'correction', label:'Correction', icon:<CheckCircle2 size={15}/>},{id:'diagnostic', label:'Diagnostic', icon:<TrendingUp size={15}/>}].map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{ display:'flex', alignItems:'center', gap:'0.4rem', padding:'0.5rem 1rem', borderRadius:'calc(var(--radius-md) - 3px)', border:'none', cursor:'pointer', fontWeight:700, fontSize:'0.85rem', fontFamily:'inherit', transition:'all 0.2s',
              background: tab===t.id ? 'var(--violet)' : 'transparent',
              color:      tab===t.id ? '#fff'           : 'var(--text-muted)',
              boxShadow:  tab===t.id ? '0 2px 8px var(--violet-glow)' : 'none',
            }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'correction' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {questions.map((q, idx) => {
            const userAns = answers[q.id];
            const isCorrect = userAns === q.correct_answer;
            return (
              <div key={q.id} className="glass-panel" style={{
                borderLeft: `4px solid ${isCorrect ? 'var(--emerald)' : 'var(--danger)'}`,
                padding: '1.5rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', fontWeight: 600 }}>
                    Question {idx + 1} {q.topic && `· ${q.topic}`}
                  </span>
                  {isCorrect
                    ? <CheckCircle2 size={20} color="var(--emerald)" />
                    : <XCircle size={20} color="var(--danger)" />}
                </div>
                <div style={{ marginBottom: '1.25rem', fontSize: '1rem', fontWeight: 500 }}>
                  {renderWithMath(q.question)}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div style={{ background: 'var(--bg-glass)', padding: '0.875rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginBottom: '0.4rem', fontWeight: 600 }}>VOTRE RÉPONSE</p>
                    {userAns
                      ? <span style={{ color: isCorrect ? 'var(--emerald)' : 'var(--danger)', fontWeight: 600 }}>
                          {userAns}) {renderOptionText(q.options.find(o => o.id === userAns)?.text)}
                        </span>
                      : <span className="text-muted">Aucune réponse</span>
                    }
                  </div>
                  <div style={{ background: 'var(--emerald-soft)', padding: '0.875rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(16,185,129,0.25)' }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--emerald)', marginBottom: '0.4rem', fontWeight: 600 }}>BONNE RÉPONSE</p>
                    <span style={{ color: 'var(--emerald)', fontWeight: 600 }}>
                      {q.correct_answer}) {renderOptionText(q.options.find(o => o.id === q.correct_answer)?.text)}
                    </span>
                  </div>
                </div>
                {!isCorrect && q.astuce && (
                  <div className="astuce-box">
                    <div className="astuce-header" style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: '0.9rem', color: 'var(--violet)' }}><Lightbulb size={16} /> Astuce</div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: '0.5rem 0 0' }}>{renderWithMath(q.astuce)}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab === 'diagnostic' && (
        <DiagnosticReport corrected={corrected} exam={exam} onClose={onReturn} />
      )}
    </div>
  );
});

MockExamResults.displayName = 'MockExamResults';

export default MockExamResults;
