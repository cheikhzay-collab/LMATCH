import React, { useState, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { BookOpen, RefreshCw, Download, Settings, ChevronDown, ChevronUp, BookMarked, Layers, FileText, Eye } from 'lucide-react';
import { generateEbookHTML, openPrintWindow } from '../utils/generateExamPDF';

const SETTINGS_KEY = 'ebookSettings';

const defaultSettings = () => ({
  showCover: true,
  showTricks: true,
  showPageNumbers: true,
  startPage: 1,
  questionsPerPage: 3,  // Estimate only (for page count display)
});

const loadSettings = () => {
  try { return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}; } catch { return {}; }
};
const saveSettings = (data) => localStorage.setItem(SETTINGS_KEY, JSON.stringify(data));

// Estimated page count (cover=1 + content pages)
const estimatePages = (qCount, qPerPage, hasCover) =>
  (hasCover ? 1 : 0) + Math.max(1, Math.ceil(qCount / Math.max(1, qPerPage)));

export default function AdminEbooks() {
  const { exams } = useAuth();
  const [allSettings, setAllSettings] = useState(loadSettings);
  const [expanded, setExpanded] = useState(null);  // which topic is expanded
  const [generated, setGenerated] = useState({});   // { topic: timestamp }

  // Build topic map from all exams
  const topicMap = useMemo(() => {
    const map = {};
    exams.filter(exam => exam.isArchived !== true).forEach(exam => {
      (exam.questions || []).forEach(q => {
        const t = q.subject || q.topic || 'Général';
        if (!map[t]) map[t] = [];
        map[t].push({ ...q, _source: exam.name, _year: exam.year });
      });
    });
    return map;
  }, [exams]);

  const topics = useMemo(() =>
    Object.entries(topicMap).sort((a, b) => b[1].length - a[1].length),
    [topicMap]
  );

  const totalQ = useMemo(() => Object.values(topicMap).reduce((s, a) => s + a.length, 0), [topicMap]);
  const totalSources = useMemo(() => new Set(exams.filter(e => e.isArchived !== true).map(e => e.name)).size, [exams]);

  const getSettings = (topic) => ({ ...defaultSettings(), ...(allSettings[topic] || {}) });

  const updateSetting = (topic, key, value) => {
    const next = { ...allSettings, [topic]: { ...getSettings(topic), [key]: value } };
    setAllSettings(next);
    saveSettings(next);
  };

  const handleGenerate = useCallback((topic, questions) => {
    const s = getSettings(topic);
    // Inject branding from AdminSettings (localStorage)
    s.profName  = localStorage.getItem('profName')  || '';
    s.profPhone = localStorage.getItem('profPhone') || '';
    s.profSite  = localStorage.getItem('profSite')  || 'www.lconq.ma';
    const html = generateEbookHTML(topic, questions, s);
    openPrintWindow(html, `ebook-${topic}`);
    setGenerated(prev => ({ ...prev, [topic]: Date.now() }));
  }, [allSettings]);

  const fmtDate = (ts) => ts
    ? new Date(ts).toLocaleString('fr-MA', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    : null;

  const badge = (color, bg, text) => (
    <span style={{ background: bg, color, padding: '0.15rem 0.55rem', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700, border: `1px solid ${color}22`, display: 'inline-block' }}>
      {text}
    </span>
  );

  return (
    <div className="animate-fade-in" style={{ maxWidth: 1100, margin: '0 auto' }}>

      {/* ── Header ── */}
      <header style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
              <div style={{ width: 40, height: 40, borderRadius: '12px', background: 'linear-gradient(135deg, var(--violet), var(--emerald))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BookMarked size={22} color="#fff" />
              </div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>Bibliothèque E-Books</h1>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: 0 }}>
              Générez des guides PDF de maîtrise par domaine · Mis à jour automatiquement avec chaque import
            </p>
          </div>
        </div>

        {/* Stats bar */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
          {[
            { icon: <Layers size={18} />, val: topics.length, lbl: 'Domaines disponibles', clr: '#7c3aed', bg: 'rgba(124,58,237,0.08)' },
            { icon: <FileText size={18} />, val: totalQ, lbl: 'Questions compilées', clr: '#1a56db', bg: 'rgba(30,86,219,0.08)' },
            { icon: <BookOpen size={18} />, val: totalSources, lbl: 'Concours sources', clr: 'var(--emerald)', bg: 'rgba(16,185,129,0.08)' },
            { icon: <Download size={18} />, val: Object.keys(generated).length, lbl: 'E-Books générés (session)', clr: 'var(--warning)', bg: 'rgba(245,158,11,0.08)' },
          ].map((s, i) => (
            <div key={i} style={{ flex: '1 1 180px', background: s.bg, border: `1px solid ${s.clr}33`, borderRadius: 12, padding: '0.9rem 1.2rem', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ color: s.clr }}>{s.icon}</span>
              <div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: s.clr, lineHeight: 1 }}>{s.val}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 3 }}>{s.lbl}</div>
              </div>
            </div>
          ))}
        </div>
      </header>

      {/* ── Topic Cards ── */}
      {topics.length === 0 ? (
        <div className="glass-panel" style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <BookOpen size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
          <p style={{ fontSize: '1rem' }}>Aucun domaine trouvé.</p>
          <p style={{ fontSize: '0.82rem', marginTop: 6 }}>Importez des examens via <strong>Import IA</strong> ou <strong>Upload CSV</strong> pour générer des e-books.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
          {topics.map(([topic, questions]) => {
            const s = getSettings(topic);
            const sources = [...new Set(questions.map(q => q._source))];
            const estPages = estimatePages(questions.length, s.questionsPerPage, s.showCover);
            const isExpanded = expanded === topic;
            const lastGen = fmtDate(generated[topic]);

            return (
              <div key={topic} className="glass-panel" style={{ padding: 0, overflow: 'hidden', border: isExpanded ? '1px solid var(--violet)' : '1px solid var(--border)', transition: 'border-color 0.2s' }}>

                {/* Card Header */}
                <div style={{ padding: '1.1rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: '1rem', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <BookOpen size={15} style={{ color: 'var(--violet)', flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{topic}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        {badge('#1a56db', 'rgba(30,86,219,0.1)', `${questions.length} questions`)}
                        {badge('var(--emerald)', 'rgba(16,185,129,0.1)', `${sources.length} concours`)}
                        {badge('#7c3aed', 'rgba(124,58,237,0.1)', `~${estPages} pages`)}
                      </div>
                    </div>

                    {/* Settings toggle */}
                    <button onClick={() => setExpanded(isExpanded ? null : topic)}
                      style={{ background: isExpanded ? 'rgba(124,58,237,0.1)' : 'var(--bg-glass)', border: `1px solid ${isExpanded ? 'var(--violet)' : 'var(--border)'}`, borderRadius: 8, padding: '0.35rem 0.5rem', cursor: 'pointer', color: isExpanded ? 'var(--violet)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>
                      <Settings size={13} />
                      {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                  </div>

                  {/* Sources */}
                  <div style={{ marginTop: '0.6rem', fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    {sources.slice(0, 3).join(' · ')}{sources.length > 3 ? ` +${sources.length - 3}` : ''}
                  </div>
                </div>

                {/* ── Settings Panel ── */}
                {isExpanded && (
                  <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', background: 'rgba(124,58,237,0.03)' }}>
                    <p style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--violet)', marginBottom: '0.85rem' }}>⚙ Paramètres du livre</p>

                    {/* Questions per page */}
                    <div style={{ marginBottom: '0.85rem' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        Questions par page (estimation)
                        <strong className="text-main">{s.questionsPerPage} Q/page</strong>
                      </label>
                      <input type="range" min={1} max={6} value={s.questionsPerPage}
                        onChange={e => updateSetting(topic, 'questionsPerPage', +e.target.value)}
                        style={{ width: '100%', accentColor: 'var(--violet)' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 2 }}>
                        <span>Détaillé (1)</span><span>Compact (6)</span>
                      </div>
                    </div>

                    {/* Start page */}
                    <div style={{ marginBottom: '0.85rem' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        Numéro de la 1ère page
                        <strong className="text-main">Page {s.startPage}</strong>
                      </label>
                      <input type="number" min={1} max={999} value={s.startPage}
                        onChange={e => updateSetting(topic, 'startPage', Math.max(1, +e.target.value))}
                        style={{ width: '100%', padding: '0.45rem 0.7rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-glass)', color: 'var(--text-main)', fontSize: '0.85rem', outline: 'none' }} />
                    </div>

                    {/* Toggles */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {[
                        { key: 'showCover', label: '📖 Page de couverture', val: s.showCover },
                        { key: 'showTricks', label: '⚡ Section Coup de Grâce', val: s.showTricks },
                        { key: 'showPageNumbers', label: '🔢 Numérotation des pages', val: s.showPageNumbers },
                      ].map(opt => (
                        <label key={opt.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', cursor: 'pointer', padding: '0.3rem 0' }}>
                          <span className="text-muted">{opt.label}</span>
                          <div onClick={() => updateSetting(topic, opt.key, !opt.val)}
                            style={{ width: 36, height: 20, borderRadius: 10, background: opt.val ? 'var(--violet)' : 'var(--border)', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
                            <div style={{ position: 'absolute', top: 3, left: opt.val ? 18 : 3, width: 14, height: 14, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
                          </div>
                        </label>
                      ))}
                    </div>

                    {/* Estimated pages summary */}
                    <div style={{ marginTop: '0.85rem', padding: '0.6rem 0.85rem', borderRadius: 8, background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.15)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      📐 Estimation : <strong className="text-violet">~{estPages} pages</strong>
                      {s.showCover ? ' (dont 1 couverture)' : ''}
                      · Commence à la page <strong className="text-violet">{s.startPage}</strong>
                    </div>
                  </div>
                )}

                {/* Card Footer — Generate */}
                <div style={{ padding: '0.85rem 1.25rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {lastGen && (
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', flex: 1 }}>
                      ✓ Généré {lastGen}
                    </span>
                  )}
                  <button onClick={() => handleGenerate(topic, questions)}
                    style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, padding: '0.55rem 1rem', borderRadius: 9, border: 'none', background: 'linear-gradient(135deg,#7c3aed,#6366f1)', color: '#fff', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', boxShadow: '0 4px 14px rgba(124,58,237,0.35)', transition: 'transform 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
                    {generated[topic] ? <RefreshCw size={13} /> : <Download size={13} />}
                    {generated[topic] ? 'Regénérer' : 'Générer PDF'}
                  </button>

                  <button onClick={() => handleGenerate(topic, questions)}
                    title="Aperçu"
                    style={{ padding: '0.55rem 0.6rem', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--bg-glass)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <Eye size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
