import React, { useState, useMemo } from 'react';
import { Trophy, CheckCircle2, XCircle, Lightbulb, ArrowLeft, TrendingUp, Zap } from 'lucide-react';
import { renderWithMath } from '../utils/mathRenderer';
import DiagnosticReport from './DiagnosticReport';

const renderOptionText = (text) => renderWithMath(text);

const MockExamResults = React.memo(({ questions, answers, exam, onReturn, schoolBranding }) => {
  const [tab, setTab] = useState('correction');

  const brand = useMemo(
    () => schoolBranding[exam.school] || { scoring: { correct: 1, wrong: -0.25, empty: 0 } },
    [schoolBranding, exam.school]
  );
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
    <div className="mock-results-root animate-fade-in">

      {/* ── Trophy / Score card ───────────────────────────────────── */}
      <div className="mock-results-header glass-panel">
        {/* Trophy icon */}
        <div
          className="mock-results-trophy"
          style={{
            background: pct >= 50 ? 'var(--emerald-soft)' : 'var(--danger-soft)',
            border: `2px solid ${pct >= 50 ? 'var(--emerald)' : 'var(--danger)'}`,
          }}
        >
          <Trophy size={30} color={pct >= 50 ? 'var(--emerald)' : 'var(--danger)'} />
        </div>

        <h1 className="mock-results-title text-gradient">Rapport de Performance</h1>

        {/* Score */}
        <div className="mock-results-score">
          {score}
          <span className="mock-results-score-denom">/{questions.length}</span>
        </div>

        {/* % badge */}
        <div
          className="mock-results-pct-badge"
          style={{
            background: pct >= 50 ? 'var(--emerald-soft)' : 'var(--danger-soft)',
            color:      pct >= 50 ? 'var(--emerald)'      : 'var(--danger)',
            border:     `1px solid ${pct >= 50 ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
          }}
        >
          <Zap size={13} /> {pct}% de réussite
        </div>

        {/* Return button */}
        <button className="btn mock-results-return-btn" onClick={onReturn}>
          <ArrowLeft size={15} /> Retour au Dashboard
        </button>
      </div>

      {/* ── Tab switcher ──────────────────────────────────────────── */}
      <div className="mock-results-tabs">
        {[
          { id: 'correction', label: 'Correction',  icon: <CheckCircle2 size={14} /> },
          { id: 'diagnostic', label: 'Diagnostic',  icon: <TrendingUp   size={14} /> },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`mock-results-tab-btn${tab === t.id ? ' active' : ''}`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── Correction tab ────────────────────────────────────────── */}
      {tab === 'correction' && (
        <div className="mock-results-list">
          {questions.map((q, idx) => {
            const userAns  = answers[q.id];
            const isCorrect = userAns === q.correct_answer;
            return (
              <div
                key={q.id}
                className="mock-results-card glass-panel"
                style={{ borderLeftColor: isCorrect ? 'var(--emerald)' : 'var(--danger)' }}
              >
                {/* Question meta row */}
                <div className="mock-results-card-meta">
                  <span className="mock-results-card-label">
                    Question {idx + 1}{q.topic && ` · ${q.topic}`}
                  </span>
                  {isCorrect
                    ? <CheckCircle2 size={18} color="var(--emerald)" />
                    : <XCircle      size={18} color="var(--danger)"  />
                  }
                </div>

                {/* Question text */}
                <div className="mock-results-card-question">
                  {renderWithMath(q.question)}
                </div>

                {/* Answer columns — stack on mobile */}
                <div className="mock-results-answers">
                  <div className="mock-results-answer-box mock-results-answer-user">
                    <p className="mock-results-answer-label">VOTRE RÉPONSE</p>
                    {userAns
                      ? <span style={{ color: isCorrect ? 'var(--emerald)' : 'var(--danger)', fontWeight: 600 }}>
                          {userAns}) {renderOptionText(q.options.find(o => o.id === userAns)?.text)}
                        </span>
                      : <span className="text-muted">Aucune réponse</span>
                    }
                  </div>

                  <div className="mock-results-answer-box mock-results-answer-correct">
                    <p className="mock-results-answer-label" style={{ color: 'var(--emerald)' }}>BONNE RÉPONSE</p>
                    <span style={{ color: 'var(--emerald)', fontWeight: 600 }}>
                      {q.correct_answer}) {renderOptionText(q.options.find(o => o.id === q.correct_answer)?.text)}
                    </span>
                  </div>
                </div>

                {/* Astuce */}
                {!isCorrect && q.astuce && (
                  <div className="astuce-box" style={{ marginTop: '0.75rem' }}>
                    <div className="astuce-header">
                      <Lightbulb size={15} /> Astuce
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0.4rem 0 0' }}>
                      {renderWithMath(q.astuce)}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Diagnostic tab ────────────────────────────────────────── */}
      {tab === 'diagnostic' && (
        <DiagnosticReport corrected={corrected} exam={exam} onClose={onReturn} />
      )}
    </div>
  );
});

MockExamResults.displayName = 'MockExamResults';
export default MockExamResults;
