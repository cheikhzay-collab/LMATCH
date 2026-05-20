import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BrainCircuit, Zap, TrendingUp, AlertTriangle,
  CheckCircle2, Target, BookOpen, ChevronRight, Award
} from 'lucide-react';

/* ── Helpers ─────────────────────────────────────────────────────── */

/** Build a topic-level performance map from a corrected results array.
 * @param {Array} corrected  [{ q, question, correct, detected, result, topic }]
 * @returns {Object} { topicName: { total, correct, wrong, pct, questions[] } }
 */
export function buildTopicMap(corrected) {
  const map = {};
  corrected.forEach(row => {
    const t = row.topic || 'Général';
    if (!map[t]) map[t] = { total: 0, correct: 0, wrong: 0, pct: 0, questions: [] };
    map[t].total   += 1;
    map[t].correct += row.result === 'correct' ? 1 : 0;
    map[t].wrong   += row.result === 'wrong'   ? 1 : 0;
    map[t].questions.push(row);
  });
  Object.values(map).forEach(v => {
    v.pct = v.total > 0 ? Math.round((v.correct / v.total) * 100) : 0;
  });
  return map;
}

/** Get color & label based on pct score */
function getLevel(pct) {
  if (pct >= 80) return { color: 'var(--emerald)', label: 'Maîtrisé',      icon: '✅', bg: 'var(--emerald-soft)' };
  if (pct >= 55) return { color: 'var(--warning)',  label: 'En progrès',    icon: '🟡', bg: 'var(--warning-soft)' };
  if (pct >= 30) return { color: '#F97316',          label: 'Fragile',       icon: '🟠', bg: 'rgba(249,115,22,0.1)' };
  return          { color: 'var(--danger)',  label: 'À retravailler', icon: '🔴', bg: 'var(--danger-soft)' };
}

/* ── Radial progress ring ────────────────────────────────────────── */
function RadialRing({ pct, size = 64, stroke = 6 }) {
  const r      = (size - stroke) / 2;
  const circ   = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  const level  = getLevel(pct);
  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
      <circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke={level.color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.3s', filter: `drop-shadow(0 0 6px ${level.color}99)` }}
      />
      <text x={size/2} y={size/2 + 5} textAnchor="middle"
        style={{ fontSize: size * 0.22 + 'px', fontWeight: 900, fill: level.color, fontFamily: 'inherit' }}>
        {pct}%
      </text>
    </svg>
  );
}

/* ── Topic card ──────────────────────────────────────────────────── */
function TopicCard({ topic, data, examId, onStudy }) {
  const level = getLevel(data.pct);
  const barW  = `${data.pct}%`;

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: `1px solid ${data.wrong > 0 ? level.color + '44' : 'var(--border)'}`,
      borderRadius: 'var(--radius-xl)',
      padding: '1.25rem 1.5rem',
      display: 'flex', flexDirection: 'column', gap: '0.875rem',
      boxShadow: data.wrong > 0 ? `0 4px 24px ${level.color}18` : 'var(--shadow-card)',
      transition: 'all 0.25s',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <RadialRing pct={data.pct} size={58} stroke={5} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
            <h4 style={{ fontWeight: 800, fontSize: '0.97rem', color: 'var(--text-main)' }}>{topic}</h4>
            <span style={{
              background: level.bg, color: level.color,
              padding: '0.15rem 0.6rem', borderRadius: '99px',
              fontSize: '0.68rem', fontWeight: 700,
              border: `1px solid ${level.color}33`,
            }}>
              {level.icon} {level.label}
            </span>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <strong className="text-emerald">{data.correct}</strong> correcte{data.correct > 1 ? 's' : ''} ·{' '}
            <strong className="text-danger">{data.wrong}</strong> fausse{data.wrong > 1 ? 's' : ''} ·{' '}
            {data.total} question{data.total > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div style={{ height: 6, borderRadius: '99px', background: 'var(--border)', overflow: 'hidden' }}>
          <div style={{
            width: barW, height: '100%', borderRadius: '99px',
            background: `linear-gradient(90deg, ${level.color}, ${level.color}bb)`,
            boxShadow: `0 0 10px ${level.color}66`,
            transition: 'width 0.8s ease',
          }} />
        </div>
      </div>

      {/* Recommendation */}
      {data.wrong > 0 && (
        <div style={{
          padding: '0.75rem 1rem',
          background: level.bg, borderRadius: 'var(--radius-md)',
          border: `1px solid ${level.color}33`,
          display: 'flex', alignItems: 'flex-start', gap: '0.625rem',
        }}>
          <Zap size={15} color={level.color} style={{ flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
            {data.pct < 30
              ? <>Niveau critique. Révisez <strong style={{ color: level.color }}>toutes</strong> les fiches "{topic}" avant la prochaine séance.</>
              : data.pct < 55
              ? <>Lacunes identifiées. Relisez les <strong>astuces</strong> des {data.wrong} question{data.wrong>1?'s':''} manquées.</>
              : <>Bonne base. Quelques erreurs sur "{topic}" — un rappel SRS suffira.</>}
          </p>
        </div>
      )}

      {/* CTA */}
      {data.wrong > 0 && (
        <button
          onClick={() => onStudy(topic)}
          style={{
            background: 'transparent', border: `1px solid ${level.color}66`,
            color: level.color, borderRadius: 'var(--radius-md)',
            padding: '0.5rem 1rem', cursor: 'pointer', fontFamily: 'inherit',
            fontWeight: 700, fontSize: '0.82rem',
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = level.bg; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
        >
          <BrainCircuit size={14} /> Réviser "{topic}" maintenant
          <ChevronRight size={14} />
        </button>
      )}
    </div>
  );
}

/* ── Main Diagnostic Report ──────────────────────────────────────── */
export default function DiagnosticReport({ corrected, exam, onClose }) {
  const navigate = useNavigate();

  const topicMap = useMemo(() => buildTopicMap(corrected), [corrected]);
  const topics   = Object.entries(topicMap).sort((a, b) => a[1].pct - b[1].pct); // weakest first

  const totalQ   = corrected.length;
  const totalOk  = corrected.filter(r => r.result === 'correct').length;
  const globalPct = totalQ > 0 ? Math.round((totalOk / totalQ) * 100) : 0;

  const weakTopics    = topics.filter(([, d]) => d.pct < 55 && d.wrong > 0);
  const strongTopics  = topics.filter(([, d]) => d.pct >= 80);
  const globalLevel   = getLevel(globalPct);

  const handleStudy = (topic) => {
    // Navigate to study with topic filter (StudyMode can pick this up)
    onClose?.();
    navigate(`/study?exam=${exam?.id}&topic=${encodeURIComponent(topic)}`);
  };

  return (
    <div className="animate-fade-in">
      {/* ── Hero summary ── */}
      <div style={{
        borderRadius: 'var(--radius-2xl)', overflow: 'hidden',
        marginBottom: '1.75rem', border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-card)',
      }}>
        {/* Gradient band */}
        <div style={{
          background: `linear-gradient(135deg, ${globalPct >= 70 ? '#065F46,#022C22' : globalPct >= 50 ? '#7C2D12,#451A03' : '#7F1D1D,#3B0000'})`,
          padding: '1.75rem 2rem',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            <RadialRing pct={globalPct} size={80} stroke={6} />
            <div>
              <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.3rem' }}>
                Rapport Diagnostique — {exam?.name}
              </p>
              <h2 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.35rem', letterSpacing: '-0.02em' }}>
                {totalOk} / {totalQ} questions correctes
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>
                {weakTopics.length > 0
                  ? `${weakTopics.length} domaine${weakTopics.length > 1 ? 's' : ''} nécessite${weakTopics.length === 1 ? '' : 'nt'} une révision prioritaire.`
                  : strongTopics.length === topics.length
                  ? 'Excellente maîtrise de tous les thèmes ! 🏆'
                  : 'Continuez vos révisions pour consolider vos acquis.'}
              </p>
            </div>
          </div>
        </div>

        {/* Quick stat pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', background: 'var(--bg-card)', borderTop: '1px solid var(--border)' }}>
          {[
            { icon: <CheckCircle2 size={14} />, label: 'Maîtrisés (≥80%)',   value: strongTopics.length,  color: 'var(--emerald)' },
            { icon: <AlertTriangle size={14}/>, label: 'À retravailler',      value: weakTopics.length,    color: 'var(--danger)'  },
            { icon: <BookOpen size={14} />,     label: 'Thèmes couverts',     value: topics.length,        color: 'var(--violet)'  },
            { icon: <Target size={14} />,       label: 'Score global',        value: `${globalPct}%`,      color: globalLevel.color},
          ].map(s => (
            <div key={s.label} style={{ flex: '1 0 110px', padding: '0.875rem 1rem', textAlign: 'center', borderRight: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', color: s.color, marginBottom: '0.2rem' }}>
                {s.icon} <span style={{ fontWeight: 900, fontSize: '1.15rem' }}>{s.value}</span>
              </div>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', fontWeight: 600 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Priority alert (weakest topics) ── */}
      {weakTopics.length > 0 && (
        <div style={{
          padding: '1rem 1.25rem',
          background: 'var(--danger-soft)', border: '1px solid var(--danger)33',
          borderRadius: 'var(--radius-xl)', marginBottom: '1.5rem',
          display: 'flex', alignItems: 'flex-start', gap: '0.875rem',
        }}>
          <AlertTriangle size={22} color="var(--danger)" style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ fontWeight: 800, fontSize: '0.92rem', marginBottom: '0.3rem' }}>
              🔴 Alerte académique — Thèmes prioritaires
            </p>
            <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Vous avez des lacunes identifiées dans :{' '}
              {weakTopics.map(([t]) => (
                <strong key={t} style={{ color: 'var(--danger)', marginRight: '0.25rem' }}>"{t}"</strong>
              ))}.{' '}
              Nous vous recommandons de <strong>réviser ces thèmes en SRS</strong> avant de passer à la prochaine session d'examen.
            </p>
          </div>
        </div>
      )}

      {/* ── Topic cards ── */}
      <h3 style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <TrendingUp size={18} color="var(--violet)" />
        Performance par thème <span style={{ color: 'var(--text-subtle)', fontWeight: 400, fontSize: '0.85rem' }}>(du plus faible au plus fort)</span>
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
        {topics.map(([topic, data]) => (
          <TopicCard
            key={topic}
            topic={topic}
            data={data}
            examId={exam?.id}
            onStudy={handleStudy}
          />
        ))}
      </div>

      {/* ── Global tip ── */}
      <div style={{
        marginTop: '1.5rem', padding: '1rem 1.25rem',
        background: 'var(--violet-soft)', border: '1px solid var(--violet)33',
        borderRadius: 'var(--radius-xl)',
        display: 'flex', alignItems: 'center', gap: '0.875rem',
      }}>
        <Award size={22} color="var(--violet)" style={{ flexShrink: 0 }} />
        <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
          <strong className="text-violet">💡 Conseil IA :</strong>{' '}
          {globalPct >= 80
            ? 'Performance excellente ! Maintenez votre rythme avec des sessions SRS hebdomadaires pour conserver vos acquis longtemps.'
            : globalPct >= 55
            ? 'Vous êtes sur la bonne voie. Concentrez-vous sur les thèmes orange et rouges ci-dessus en sessions courtes de 15 min/jour.'
            : 'Commencez par relire les fiches des thèmes les plus faibles, puis enchaînez avec les Astuces IA pour gagner du temps en concours.'}
        </p>
      </div>
    </div>
  );
}
