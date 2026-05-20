import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, Unlock, Library, Eye, EyeOff, Edit, Save, X, FileText, Download, Search, BookOpen, Upload, Trash2, Image } from 'lucide-react';
import { Link } from 'react-router-dom';
import { generateSubjectHTML, generateCorrectionHTML, generateEbookHTML, openPrintWindow } from '../utils/generateExamPDF';

export default function AdminExams() {
  const { exams, toggleExamStatus, updateExamDetails, schools } = useAuth();
  const [editingExam, setEditingExam] = useState(null);
  const [showEbook, setShowEbook] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState('');
  
  const [localQuestions, setLocalQuestions] = useState([]);
  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'questions'
  const [selectedQuestionIdx, setSelectedQuestionIdx] = useState(0);

  const [editName, setEditName] = useState('');
  const [editSchool, setEditSchool] = useState('');
  const [editYear, setEditYear] = useState('');
  const [editTier, setEditTier] = useState('');

  useEffect(() => {
    if (editingExam) {
      setLocalQuestions(editingExam.questions || []);
      setEditName(editingExam.name || '');
      setEditSchool(editingExam.school || '');
      setEditYear(editingExam.year || '');
      setEditTier(editingExam.tier || 'freemium');
      setActiveTab('details');
      setSelectedQuestionIdx(0);
    } else {
      setLocalQuestions([]);
      setEditName('');
      setEditSchool('');
      setEditYear('');
      setEditTier('freemium');
      setSelectedQuestionIdx(0);
    }
  }, [editingExam]);

  // All unique topics + question count across all exams
  const topicMap = useMemo(() => {
    const map = {};
    exams.forEach(exam => {
      (exam.questions || []).forEach(q => {
        const t = q.subject || q.topic || 'Général';
        if (!map[t]) map[t] = [];
        map[t].push({ ...q, _source: exam.name, _year: exam.year });
      });
    });
    return map;
  }, [exams]);
  const topicList = Object.entries(topicMap).sort((a, b) => b[1].length - a[1].length);

  const handleGenerateEbook = () => {
    if (!selectedTopic || !topicMap[selectedTopic]?.length) return;
    const html = generateEbookHTML(selectedTopic, topicMap[selectedTopic]);
    openPrintWindow(html, `ebook-${selectedTopic}`);
    setShowEbook(false);
  };

  // ── Filters ──
  const [search, setSearch]     = useState('');
  const [filterSchool, setFilterSchool] = useState('');
  const [filterYear, setFilterYear]     = useState('');
  const [filterStatus, setFilterStatus] = useState('');   // 'active' | 'inactive' | ''
  const [filterTier, setFilterTier]     = useState('');   // 'freemium' | 'premium' | ''

  // Unique years from exams
  const years = useMemo(() => [...new Set(exams.map(e => e.year).filter(Boolean))].sort().reverse(), [exams]);

  // Filtered list
  const filtered = useMemo(() => exams.filter(e => {
    if (search && !e.name?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterSchool && e.school !== filterSchool) return false;
    if (filterYear && e.year !== filterYear) return false;
    if (filterStatus === 'active' && e.isActive === false) return false;
    if (filterStatus === 'inactive' && e.isActive !== false) return false;
    if (filterTier && e.tier !== filterTier) return false;
    return true;
  }), [exams, search, filterSchool, filterYear, filterStatus, filterTier]);

  const hasFilters = search || filterSchool || filterYear || filterStatus || filterTier;
  const clearFilters = () => { setSearch(''); setFilterSchool(''); setFilterYear(''); setFilterStatus(''); setFilterTier(''); };

  // ── CSV Export ──
  const downloadCSV = (exam) => {
    const esc = (v = '') => {
      const s = String(v).replace(/"/g, '""');
      return /[,"\n]/.test(s) ? `"${s}"` : s;
    };
    const rows = [
      ['Context', 'Topic', 'Question', 'Options', 'Réponse', 'Astuce', 'Trick'],
      ...(exam.questions || []).map(q => [
        esc(q.context || ''),
        esc(q.subject || q.topic || 'Général'),
        esc(q.question || ''),
        esc((q.options || []).map((o, i) => `${['A','B','C','D','E'][i]}) ${typeof o === 'string' ? o.replace(/^[A-E]\)\s*/, '') : (o?.text || '')}`).join(', ')),
        esc(q.correct_answer || ''),
        esc(q.astuce || ''),
        esc(q.trick || '')
      ])
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${exam.name || 'exam'}_${exam.year || ''}.csv`.replace(/\s+/g, '_');
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    updateExamDetails(editingExam.id, {
      name: editName,
      school: editSchool,
      year: editYear,
      tier: editTier,
      questions: localQuestions
    });
    setEditingExam(null);
  };

  const handleUpdateQuestionField = (index, field, value) => {
    setLocalQuestions(prev => prev.map((q, i) => i === index ? { ...q, [field]: value } : q));
  };

  const handleUpdateQuestionOption = (qIndex, optId, newText, optIdx) => {
    setLocalQuestions(prev => prev.map((q, i) => {
      if (i !== qIndex) return q;
      const updatedOptions = (q.options || []).map((opt, idx) => {
        if (typeof opt === 'string') {
          return idx === optIdx ? newText : opt;
        }
        return opt.id === optId ? { ...opt, text: newText } : opt;
      });
      return { ...q, options: updatedOptions };
    }));
  };

  const sel = { padding: '0.55rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-glass)', color: 'var(--text-main)', fontSize: '0.82rem', cursor: 'pointer', outline: 'none' };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative' }}>

      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: '12px', background: 'linear-gradient(135deg, var(--violet), var(--emerald))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Library size={22} color="#fff" />
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>Bibliothèque QCM</h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
            {filtered.length} / {exams.length} concours{hasFilters ? ' (filtrés)' : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <button onClick={() => setShowEbook(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.6rem 1rem', borderRadius: 10, background: 'linear-gradient(135deg,#7c3aed,#6366f1)', color: '#fff', border: 'none', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', boxShadow: '0 4px 14px rgba(124,58,237,0.35)' }}>
            <BookOpen size={16} /> Générer E-Book
          </button>
          <Link to="/admin/upload" className="btn">+ Nouveau Concours</Link>
        </div>
      </header>

      {/* ── Filter Bar ── */}
      <div className="glass-panel" style={{ padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 180 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Rechercher un concours..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ ...sel, width: '100%', paddingLeft: 30 }}
          />
        </div>

        {/* School */}
        <select value={filterSchool} onChange={e => setFilterSchool(e.target.value)} style={{ ...sel, flex: '1 1 160px' }}>
          <option value="">🏫 Toutes les écoles</option>
          {schools.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        {/* Year */}
        <select value={filterYear} onChange={e => setFilterYear(e.target.value)} style={{ ...sel, flex: '0 0 auto' }}>
          <option value="">📅 Toutes les années</option>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>

        {/* Status */}
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...sel, flex: '0 0 auto' }}>
          <option value="">👁 Tous les statuts</option>
          <option value="active">✅ Actifs</option>
          <option value="inactive">🔴 Désactivés</option>
        </select>

        {/* Tier */}
        <select value={filterTier} onChange={e => setFilterTier(e.target.value)} style={{ ...sel, flex: '0 0 auto' }}>
          <option value="">🔓 Tous les abonnements</option>
          <option value="freemium">Gratuit</option>
          <option value="premium">Premium</option>
        </select>

        {/* Clear */}
        {hasFilters && (
          <button onClick={clearFilters}
            style={{ ...sel, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--danger)', fontWeight: 700, whiteSpace: 'nowrap' }}>
            ✕ Effacer
          </button>
        )}
      </div>

      {/* ── Table ── */}
      <div className="glass-panel" style={{ overflow: 'hidden', padding: 0 }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Library size={48} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
            <p>{exams.length === 0 ? 'La bibliothèque est vide.' : 'Aucun résultat pour ces filtres.'}</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 900 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Concours</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>École</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>Année</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', textAlign: 'center' }}>Q</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>Abonnement</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', textAlign: 'right', whiteSpace: 'nowrap' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(exam => (
                  <tr key={exam.id} style={{ borderBottom: '1px solid var(--border)', opacity: exam.isActive === false ? 0.55 : 1, transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

                    {/* Name */}
                    <td style={{ padding: '0.9rem 1rem', fontWeight: 600, maxWidth: 200 }}>
                      <div style={{ fontSize: '0.9rem' }}>{exam.name}</div>
                      {exam.isActive === false && (
                        <span style={{ fontSize: '0.65rem', color: 'var(--danger)', padding: '0.1rem 0.35rem', border: '1px solid var(--danger)', borderRadius: 4, marginTop: 3, display: 'inline-block' }}>Désactivé</span>
                      )}
                    </td>

                    {/* School */}
                    <td style={{ padding: '0.9rem 1rem', color: 'var(--text-muted)', fontSize: '0.82rem', maxWidth: 130 }}>{exam.school || '—'}</td>

                    {/* Year */}
                    <td style={{ padding: '0.9rem 1rem', color: 'var(--text-muted)', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>{exam.year || '—'}</td>

                    {/* Questions count */}
                    <td style={{ padding: '0.9rem 1rem', textAlign: 'center', fontWeight: 700, fontSize: '0.9rem' }}>
                      <span style={{ background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 6, padding: '0.15rem 0.5rem', fontSize: '0.8rem' }}>
                        {exam.questions?.length || 0}
                      </span>
                    </td>

                    {/* Tier */}
                    <td style={{ padding: '0.9rem 1rem', whiteSpace: 'nowrap' }}>
                      {exam.tier === 'premium' ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--warning)', background: 'rgba(245,158,11,0.1)', padding: '0.2rem 0.65rem', borderRadius: '1rem', fontSize: '0.78rem', fontWeight: 700 }}>
                          <Lock size={12} /> Premium
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--emerald)', background: 'rgba(16,185,129,0.1)', padding: '0.2rem 0.65rem', borderRadius: '1rem', fontSize: '0.78rem', fontWeight: 700 }}>
                          <Unlock size={12} /> Free
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '0.9rem 1rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem', alignItems: 'center', flexWrap: 'nowrap' }}>

                        {/* CSV */}
                        <button onClick={() => downloadCSV(exam)} disabled={!exam.questions?.length}
                          title="Télécharger CSV"
                          style={{ padding: '0.3rem 0.55rem', borderRadius: 6, border: '1px solid rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.08)', color: 'var(--emerald)', cursor: exam.questions?.length ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.72rem', fontWeight: 700, opacity: exam.questions?.length ? 1 : 0.35 }}>
                          <Download size={12} /> CSV
                        </button>

                        {/* Sujet PDF */}
                        <button onClick={() => openPrintWindow(generateSubjectHTML(exam.name, exam.school, exam.year, exam.questions || []), 'sujet')}
                          title="Sujet Blanc PDF"
                          style={{ padding: '0.3rem 0.55rem', borderRadius: 6, border: '1px solid rgba(30,86,219,0.3)', background: 'rgba(30,86,219,0.08)', color: '#1a56db', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.72rem', fontWeight: 700 }}>
                          <FileText size={12} /> Sujet
                        </button>

                        {/* Corrigé PDF */}
                        <button onClick={() => openPrintWindow(generateCorrectionHTML(exam.name, exam.school, exam.year, exam.questions || []), 'corrigé')}
                          title="Corrigé Détaillé PDF"
                          style={{ padding: '0.3rem 0.55rem', borderRadius: 6, border: '1px solid rgba(124,58,237,0.3)', background: 'rgba(124,58,237,0.08)', color: '#7c3aed', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.72rem', fontWeight: 700 }}>
                          <FileText size={12} /> Corrigé
                        </button>

                        {/* Toggle active */}
                        <button onClick={() => toggleExamStatus(exam.id)}
                          title={exam.isActive === false ? 'Activer' : 'Désactiver'}
                          style={{ padding: '0.35rem 0.45rem', borderRadius: 6, border: 'none', cursor: 'pointer', background: exam.isActive === false ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', color: exam.isActive === false ? 'var(--danger)' : 'var(--emerald)', display: 'flex', alignItems: 'center' }}>
                          {exam.isActive === false ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>

                        {/* Edit */}
                        <button onClick={() => setEditingExam(exam)} className="btn-outline"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Edit size={12} /> Éditer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Edit Modal ── */}
      {editingExam && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '95vw', maxWidth: '1200px', height: '85vh', maxHeight: '85vh', padding: '2rem', borderRadius: '20px', border: '1px solid var(--border)', boxShadow: '0 30px 60px -12px rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexShrink: 0 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>Éditer le Concours</h2>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{editingExam.name} ({editingExam.year})</p>
              </div>
              <button 
                type="button" 
                onClick={() => setEditingExam(null)} 
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: 6, borderRadius: '50%', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-main)'; e.currentTarget.style.background = 'var(--bg-hover)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Tab Navigation */}
            <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-hover)', padding: '4px', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '1.5rem', flexShrink: 0 }}>
              <button 
                type="button"
                onClick={() => setActiveTab('details')}
                style={{ 
                  flex: 1,
                  padding: '0.55rem 1rem', 
                  borderRadius: '8px', 
                  border: 'none', 
                  background: activeTab === 'details' ? 'var(--violet)' : 'transparent', 
                  color: activeTab === 'details' ? '#fff' : 'var(--text-muted)', 
                  fontWeight: 700, 
                  fontSize: '0.82rem', 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  transition: 'all 0.2s',
                  boxShadow: activeTab === 'details' ? '0 4px 12px var(--violet-glow)' : 'none'
                }}
              >
                <FileText size={14} /> Détails Généraux
              </button>
              <button 
                type="button"
                onClick={() => setActiveTab('questions')}
                style={{ 
                  flex: 1,
                  padding: '0.55rem 1rem', 
                  borderRadius: '8px', 
                  border: 'none', 
                  background: activeTab === 'questions' ? 'var(--violet)' : 'transparent', 
                  color: activeTab === 'questions' ? '#fff' : 'var(--text-muted)', 
                  fontWeight: 700, 
                  fontSize: '0.82rem', 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  transition: 'all 0.2s',
                  boxShadow: activeTab === 'questions' ? '0 4px 12px var(--violet-glow)' : 'none'
                }}
              >
                <Image size={14} /> Questions & Figures ({localQuestions.length})
              </button>
            </div>

            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              
              {/* Tab 1: General Details */}
              {activeTab === 'details' && (
                <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
                  <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600 }}>Nom du Concours</label>
                    <input 
                      value={editName} 
                      onChange={(e) => setEditName(e.target.value)} 
                      required 
                      className="input-control" 
                      style={{ fontSize: '0.88rem' }} 
                    />
                  </div>
                  <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600 }}>École / Faculté</label>
                    <select 
                      value={editSchool} 
                      onChange={(e) => setEditSchool(e.target.value)} 
                      required 
                      className="input-control" 
                      style={{ fontSize: '0.88rem' }}
                    >
                      {schools.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: '1.25rem', marginBottom: '1.5rem' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600 }}>Année</label>
                      <input 
                        value={editYear} 
                        onChange={(e) => setEditYear(e.target.value)} 
                        required 
                        className="input-control" 
                        style={{ fontSize: '0.88rem' }} 
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600 }}>Abonnement</label>
                      <select 
                        value={editTier} 
                        onChange={(e) => setEditTier(e.target.value)} 
                        required 
                        className="input-control" 
                        style={{ fontSize: '0.88rem' }}
                      >
                        <option value="freemium">Gratuit</option>
                        <option value="premium">Premium</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Questions and Split View Editing */}
              {activeTab === 'questions' && (
                <div style={{ flex: 1, display: 'flex', gap: '1.5rem', overflow: 'hidden', marginBottom: '1.25rem' }}>
                  
                  {/* Left panel: List of Questions */}
                  <div style={{ width: '280px', borderRight: '1px solid var(--border)', paddingRight: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto', flexShrink: 0 }}>
                    {localQuestions.length === 0 ? (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', textAlign: 'center', padding: '1rem' }}>Aucune question</p>
                    ) : (
                      localQuestions.map((q, idx) => {
                        const isSelected = selectedQuestionIdx === idx;
                        return (
                          <button
                            key={q.id || idx}
                            type="button"
                            onClick={() => setSelectedQuestionIdx(idx)}
                            style={{
                              width: '100%',
                              padding: '0.75rem 1rem',
                              borderRadius: '10px',
                              border: `1px solid ${isSelected ? 'var(--violet)' : 'var(--border)'}`,
                              background: isSelected ? 'rgba(124,58,237,0.1)' : 'rgba(255,255,255,0.02)',
                              color: 'var(--text-main)',
                              textAlign: 'left',
                              cursor: 'pointer',
                              transition: 'all 0.15s',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '0.5rem'
                            }}
                          >
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ fontWeight: 800, fontSize: '0.82rem', color: isSelected ? 'var(--violet)' : 'var(--text-main)' }}>
                                Question {idx + 1}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
                                {q.topic || 'Général'} · {q.question || 'Vide'}
                              </div>
                            </div>
                            {q.image && (
                              <Image size={12} className="text-emerald" style={{ flexShrink: 0 }} />
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>

                  {/* Right panel: Question Editor */}
                  <div style={{ flex: 1, overflowY: 'auto', paddingRight: '6px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {localQuestions[selectedQuestionIdx] ? (() => {
                      const q = localQuestions[selectedQuestionIdx];
                      return (
                        <>
                          {/* Question Text */}
                          <div>
                            <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600 }}>Énoncé de la Question {selectedQuestionIdx + 1}</label>
                            <textarea
                              value={q.question || ''}
                              onChange={(e) => handleUpdateQuestionField(selectedQuestionIdx, 'question', e.target.value)}
                              className="input-control"
                              rows={3}
                              style={{ fontSize: '0.85rem', width: '100%', fontFamily: 'inherit', resize: 'vertical' }}
                              required
                            />
                          </div>

                          {/* Topic / Domain */}
                          <div style={{ display: 'flex', gap: '1rem' }}>
                            <div style={{ flex: 1 }}>
                              <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600 }}>Thème / Domaine</label>
                              <input
                                type="text"
                                value={q.topic || q.subject || ''}
                                onChange={(e) => handleUpdateQuestionField(selectedQuestionIdx, 'topic', e.target.value)}
                                className="input-control"
                                style={{ fontSize: '0.85rem' }}
                                placeholder="Ex: Analyse, Suites..."
                              />
                            </div>
                            <div style={{ flex: 1 }}>
                              <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600 }}>Réponse Correcte</label>
                              <select
                                value={q.correct_answer || ''}
                                onChange={(e) => handleUpdateQuestionField(selectedQuestionIdx, 'correct_answer', e.target.value)}
                                className="input-control"
                                style={{ fontSize: '0.85rem' }}
                              >
                                <option value="">-- Sélectionner --</option>
                                {(q.options || []).map((opt, optIdx) => {
                                  const optId = typeof opt === 'string' ? ['A','B','C','D','E'][optIdx] : opt.id;
                                  return <option key={optId} value={optId}>Option {optId}</option>;
                                })}
                              </select>
                            </div>
                          </div>

                          {/* Options Editing */}
                          <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600 }}>Options de réponse</label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                              {(q.options || []).map((opt, optIdx) => {
                                const isString = typeof opt === 'string';
                                const optId = isString ? ['A','B','C','D','E'][optIdx] : opt.id;
                                const optText = isString ? opt : (opt.text || '');
                                return (
                                  <div key={optId} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ 
                                      width: '28px', 
                                      height: '28px', 
                                      borderRadius: '6px', 
                                      background: q.correct_answer === optId ? 'rgba(16,185,129,0.12)' : 'var(--bg-hover)', 
                                      border: `1px solid ${q.correct_answer === optId ? 'var(--emerald)' : 'var(--border)'}`, 
                                      color: q.correct_answer === optId ? 'var(--emerald)' : 'var(--text-muted)', 
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      justifyContent: 'center', 
                                      fontWeight: 800, 
                                      fontSize: '0.8rem',
                                      flexShrink: 0
                                    }}>
                                      {optId}
                                    </span>
                                    <input
                                      type="text"
                                      value={optText}
                                      onChange={(e) => handleUpdateQuestionOption(selectedQuestionIdx, optId, e.target.value, optIdx)}
                                      className="input-control"
                                      style={{ fontSize: '0.82rem', padding: '0.4rem 0.65rem' }}
                                      placeholder={`Texte de l'option ${optId}`}
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Astuces & Tricks */}
                          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            <div style={{ flex: '1 1 240px' }}>
                              <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600 }}>Astuce (Explication)</label>
                              <textarea
                                value={q.astuce || ''}
                                onChange={(e) => handleUpdateQuestionField(selectedQuestionIdx, 'astuce', e.target.value)}
                                className="input-control"
                                rows={3}
                                style={{ fontSize: '0.82rem', width: '100%', fontFamily: 'inherit', resize: 'vertical' }}
                                placeholder="Expliquer la résolution..."
                              />
                            </div>
                            <div style={{ flex: '1 1 240px' }}>
                              <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600 }}>Trick (Raccourci rapide)</label>
                              <textarea
                                value={q.trick || ''}
                                onChange={(e) => handleUpdateQuestionField(selectedQuestionIdx, 'trick', e.target.value)}
                                className="input-control"
                                rows={3}
                                style={{ fontSize: '0.82rem', width: '100%', fontFamily: 'inherit', resize: 'vertical' }}
                                placeholder="Méthode rapide..."
                              />
                            </div>
                          </div>

                          {/* Figure/Image upload */}
                          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', padding: '1rem', borderRadius: '12px' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.2rem' }}>Figure ou Graphe</div>
                              <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)' }}>Associer un graphique ou schéma à cette question.</p>
                              
                              <div style={{ marginTop: '0.75rem' }}>
                                <input 
                                  type="file" 
                                  accept="image/*"
                                  id={`upload-img-${q.id || selectedQuestionIdx}`}
                                  style={{ display: 'none' }}
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      const reader = new FileReader();
                                      reader.onloadend = () => {
                                        handleUpdateQuestionField(selectedQuestionIdx, 'image', reader.result);
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  }}
                                />
                                <label 
                                  htmlFor={`upload-img-${q.id || selectedQuestionIdx}`}
                                  className="btn-outline"
                                  style={{ padding: '0.4rem 0.85rem', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', margin: 0, borderRadius: '8px' }}
                                >
                                  <Upload size={14} /> {q.image ? "Remplacer l'image" : "Importer une figure"}
                                </label>
                              </div>
                            </div>

                            {q.image && (
                              <div style={{ position: 'relative', width: '160px', height: '100px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)', background: '#000', flexShrink: 0 }}>
                                <img src={q.image} alt={`Preview Q${selectedQuestionIdx+1}`} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                <button 
                                  type="button"
                                  onClick={() => handleUpdateQuestionField(selectedQuestionIdx, 'image', null)}
                                  style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(239,68,68,0.95)', border: 'none', color: '#fff', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.3)', transition: 'all 0.15s' }}
                                  title="Supprimer la figure"
                                  onMouseEnter={e => e.currentTarget.style.background = 'var(--danger)'}
                                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.95)'}
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            )}
                          </div>
                        </>
                      );
                    })() : (
                      <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Sélectionnez une question pour l'éditer.</p>
                    )}
                  </div>

                </div>
              )}

              {/* Footer */}
              <div style={{ display: 'flex', gap: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem', flexShrink: 0 }}>
                <button type="button" className="btn-outline" onClick={() => setEditingExam(null)} style={{ flex: 1, padding: '0.75rem', borderRadius: '12px' }}>
                  Annuler
                </button>
                <button type="submit" className="btn" style={{ flex: 2, padding: '0.75rem', justifyContent: 'center', borderRadius: '12px' }}>
                  <Save size={14} /> Enregistrer
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
      {/* ── E-Book Modal ── */}
      {showEbook && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', zIndex: 1001, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: 560, padding: '2rem', boxShadow: '0 30px 60px -12px rgba(0,0,0,0.6)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <BookOpen size={20} className="text-violet" /> Générer un E-Book
                </h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>Compilez toutes les questions d'un domaine en un guide PDF illustré</p>
              </div>
              <button onClick={() => setShowEbook(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={22} /></button>
            </div>

            {topicList.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Aucun topic trouvé. Importez d'abord des examens avec sujets.</p>
            ) : (
              <>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.75rem', fontWeight: 600 }}>Sélectionnez un domaine :</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', maxHeight: 320, overflowY: 'auto', paddingRight: 4, marginBottom: '1.5rem' }}>
                  {topicList.map(([topic, qs]) => (
                    <button key={topic} onClick={() => setSelectedTopic(topic)}
                      style={{ padding: '0.65rem 0.9rem', borderRadius: 10, border: `2px solid ${selectedTopic === topic ? 'var(--violet)' : 'var(--border)'}`, background: selectedTopic === topic ? 'rgba(124,58,237,0.12)' : 'var(--bg-glass)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.82rem', color: selectedTopic === topic ? 'var(--violet)' : 'var(--text-main)' }}>{topic}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                        {qs.length} Q · {[...new Set(qs.map(q => q._source))].length} concours
                      </div>
                    </button>
                  ))}
                </div>
                <button onClick={handleGenerateEbook} disabled={!selectedTopic}
                  style={{ width: '100%', padding: '0.9rem', borderRadius: 12, border: 'none', background: selectedTopic ? 'linear-gradient(135deg,#7c3aed,#6366f1)' : 'var(--bg-glass)', color: selectedTopic ? '#fff' : 'var(--text-muted)', fontWeight: 800, fontSize: '0.9rem', cursor: selectedTopic ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: selectedTopic ? '0 8px 24px rgba(124,58,237,0.4)' : 'none', transition: 'all 0.2s' }}>
                  <BookOpen size={18} />
                  {selectedTopic ? `Générer "Guide ${selectedTopic}" (${topicMap[selectedTopic]?.length} Q)` : 'Choisissez un domaine'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
