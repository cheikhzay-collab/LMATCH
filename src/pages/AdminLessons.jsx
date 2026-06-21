import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  getAllLessons, toggleLessonStatus, deleteLesson 
} from '../services/lessonService';
import { 
  BookOpen, Sparkles, Search, Trash2, Eye, Edit,
  CheckCircle, XCircle, Library, PlusCircle, AlertCircle 
} from 'lucide-react';

export default function AdminLessons() {
  const { user, loading, profName, profPhone } = useAuth();
  const navigate = useNavigate();

  // Role Guard
  if (!loading && user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  // Component States
  const [lessons, setLessons] = useState([]);
  const [loadingLessons, setLoadingLessons] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('Tous');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState(null); // id of lesson to delete

  // Fetch Lessons
  const fetchLessonsList = async () => {
    setLoadingLessons(true);
    try {
      const data = await getAllLessons();
      setLessons(data);
    } catch (err) {
      console.error(err);
      setError('Erreur lors du chargement des fiches de cours.');
    } finally {
      setLoadingLessons(false);
    }
  };

  useEffect(() => {
    fetchLessonsList();
  }, []);

  // Handle Toggle Active/Inactive Status
  const handleToggleStatus = async (lessonId, currentStatus) => {
    try {
      await toggleLessonStatus(lessonId, currentStatus);
      setLessons(prev => prev.map(l => l.id === lessonId ? { ...l, isActive: !currentStatus } : l));
      setSuccess('Le statut de la fiche a été mis à jour.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      setError('Impossible de modifier le statut de la fiche.');
      setTimeout(() => setError(''), 4000);
    }
  };

  // Handle Delete
  const handleDeleteLesson = async () => {
    if (!showConfirmDelete) return;
    try {
      await deleteLesson(showConfirmDelete);
      setLessons(prev => prev.filter(l => l.id !== showConfirmDelete));
      setShowConfirmDelete(null);
      setSuccess('La fiche de cours a été supprimée avec succès.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      setError('Erreur lors de la suppression de la fiche.');
      setTimeout(() => setError(''), 4000);
    }
  };

  // Unique list of subjects for filters
  const subjects = ['Tous', ...new Set(lessons.map(l => l.subject).filter(Boolean))];

  // Filtering Logic
  const filteredLessons = lessons.filter(l => {
    const matchesSearch = l.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          l.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          l.teacher?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = selectedSubject === 'Tous' || l.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  // Stats
  const totalCount = lessons.length;
  const activeCount = lessons.filter(l => l.isActive).length;
  const inactiveCount = totalCount - activeCount;
  const uniqueSubjectsCount = new Set(lessons.map(l => l.subject).filter(Boolean)).size;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative' }}>
      
      {/* Background glow blobs */}
      <div style={{
        position: 'absolute', top: '-10%', left: '-5%', width: '350px', height: '350px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(113, 109, 242, 0.05) 0%, transparent 70%)',
        filter: 'blur(70px)', zIndex: 0, pointerEvents: 'none'
      }}></div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        
        {/* ── Page Header ── */}
        <header style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
              <div style={{ width: 44, height: 44, borderRadius: '14px', background: 'linear-gradient(135deg, var(--violet), var(--emerald))', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(113, 109, 242, 0.15)' }}>
                <Library size={22} color="#fff" />
              </div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0, color: 'var(--text-main)' }}>
                Bibliothèque de Fiches de Cours
              </h1>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: 0 }}>
              Gérez les fiches de cours dynamiques générées par IA avec mise en page LaTeX et impression PDF.
            </p>
          </div>

          <button
            onClick={() => navigate('/admin/ai-lessons')}
            className="btn"
            style={{
              background: 'linear-gradient(135deg, var(--violet), var(--emerald))',
              border: 'none', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.7rem 1.3rem', fontSize: '0.85rem', borderRadius: '12px',
              boxShadow: '0 8px 20px rgba(124, 58, 237, 0.2)'
            }}
          >
            <PlusCircle size={16} /> Générer une fiche (IA)
          </button>
        </header>

        {/* ── Status Notifications ── */}
        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid var(--danger)', borderRadius: '12px', padding: '1rem', color: 'var(--danger)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertCircle size={20} />
            <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem' }}>{error}</p>
          </div>
        )}
        {success && (
          <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid var(--emerald)', borderRadius: '12px', padding: '1rem', color: 'var(--emerald)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <CheckCircle size={20} />
            <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem' }}>{success}</p>
          </div>
        )}

        {/* ── Stats Indicators ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
          <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'var(--violet-soft)', color: 'var(--violet)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BookOpen size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Fiches</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900 }}>{totalCount}</div>
            </div>
          </div>
          
          <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Fiches Actives</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900 }}>{activeCount}</div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <XCircle size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Fiches Inactives</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900 }}>{inactiveCount}</div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Matières</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900 }}>{uniqueSubjectsCount}</div>
            </div>
          </div>
        </div>

        {/* ── Table Controls (Search & Filters) ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          
          {/* Search */}
          <div style={{ position: 'relative', width: '100%', maxWidth: '350px' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Rechercher une fiche ou enseignant..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ 
                width: '100%', padding: '0.75rem 1rem 0.75rem 3rem', background: 'var(--bg-glass)', 
                border: '1px solid var(--border)', borderRadius: '12px', color: 'white', outline: 'none',
                fontSize: '0.88rem'
              }}
            />
          </div>

          {/* Subject Pills Filter */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {subjects.map(sub => (
              <button
                key={sub}
                onClick={() => setSelectedSubject(sub)}
                style={{
                  padding: '0.45rem 1rem', borderRadius: '99px', fontSize: '0.78rem', fontWeight: 700,
                  cursor: 'pointer',
                  border: selectedSubject === sub ? '1px solid var(--violet)' : '1px solid var(--border)',
                  background: selectedSubject === sub ? 'var(--violet-soft)' : 'var(--bg-glass)',
                  color: selectedSubject === sub ? 'var(--violet)' : 'var(--text-muted)',
                  transition: 'all 0.2s'
                }}
              >
                {sub === 'Tous' ? 'Toutes les matières' : sub}
              </button>
            ))}
          </div>

        </div>

        {/* ── Lessons List ── */}
        <div className="glass-panel" style={{ overflow: 'hidden', padding: 0 }}>
          {loadingLessons ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid rgba(99,102,241,0.1)', borderTop: '3px solid var(--violet)', animation: 'spinList 1s linear infinite', marginBottom: '1rem' }} />
              <p>Chargement des fiches de cours...</p>
              <style>{`@keyframes spinList { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
          ) : filteredLessons.length === 0 ? (
            <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <BookOpen size={44} style={{ margin: '0 auto 1rem', opacity: 0.3, display: 'block' }} />
              <p style={{ fontWeight: 700, margin: 0 }}>Aucune fiche de cours trouvée.</p>
              <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
                {searchTerm || selectedSubject !== 'Tous' 
                  ? 'Essayez de réinitialiser vos critères de recherche.' 
                  : 'Générez votre première fiche de cours à l\'aide de l\'IA.'}
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '1.25rem 1.5rem', fontWeight: 800, fontSize: '0.82rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Fiche de Cours</th>
                    <th style={{ padding: '1.25rem 1.5rem', fontWeight: 800, fontSize: '0.82rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Matière</th>
                    <th style={{ padding: '1.25rem 1.5rem', fontWeight: 800, fontSize: '0.82rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Enseignant</th>
                    <th style={{ padding: '1.25rem 1.5rem', fontWeight: 800, fontSize: '0.82rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Statut</th>
                    <th style={{ padding: '1.25rem 1.5rem', fontWeight: 800, fontSize: '0.82rem', color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLessons.map(l => (
                    <tr 
                      key={l.id} 
                      style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}
                      className="table-row-hover"
                    >
                      {/* Fiche details */}
                      <td style={{ padding: '1.25rem 1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                          <div style={{ 
                            width: '38px', height: '38px', borderRadius: '10px', 
                            background: l.isActive ? 'rgba(99, 102, 241, 0.08)' : 'rgba(255,255,255,0.04)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: l.isActive ? 'var(--violet)' : 'var(--text-muted)', flexShrink: 0
                          }}>
                            <BookOpen size={16} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.92rem' }}>{l.title}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '0.15rem' }}>
                              Écoles : {l.schools?.join(', ') || 'Toutes'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Subject */}
                      <td style={{ padding: '1.25rem 1.5rem' }}>
                        <span style={{ 
                          background: l.subject === 'Physique' || l.subject === 'Chimie' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(99, 102, 241, 0.08)',
                          color: l.subject === 'Physique' || l.subject === 'Chimie' ? 'var(--emerald)' : 'var(--violet)',
                          padding: '0.25rem 0.65rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800
                        }}>
                          {l.subject}
                        </span>
                      </td>

                      {/* Teacher */}
                      <td style={{ padding: '1.25rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                        <div>{l.teacher || profName || 'Non spécifié'}</div>
                        {(l.phone || profPhone) && <div style={{ fontSize: '0.72rem', opacity: 0.8 }}>{l.phone || profPhone}</div>}
                      </td>

                      {/* Active Status Toggle */}
                      <td style={{ padding: '1.25rem 1.5rem' }}>
                        <button
                          onClick={() => handleToggleStatus(l.id, l.isActive)}
                          style={{
                            background: 'transparent', border: 'none', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '0.4rem',
                            color: l.isActive ? 'var(--emerald)' : 'var(--text-subtle)',
                            fontWeight: 700, fontSize: '0.8rem', padding: '0.2rem 0.5rem',
                            borderRadius: '6px', transition: 'all 0.2s'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          {l.isActive ? (
                            <><CheckCircle size={16} /> Publiée (Actif)</>
                          ) : (
                            <><XCircle size={16} /> Brouillon (Inactif)</>
                          )}
                        </button>
                      </td>

                      {/* Action buttons */}
                      <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                          <button
                            onClick={() => navigate(`/admin/lessons/${l.id}`)}
                            className="btn-outline"
                            title="Lire / Imprimer"
                            style={{ padding: '0.45rem', borderRadius: '8px', border: '1px solid var(--border)' }}
                          >
                            <Eye size={15} />
                          </button>
                          
                          <button
                            onClick={() => navigate(`/admin/lessons/${l.id}/edit`)}
                            className="btn-outline"
                            title="Modifier"
                            style={{ padding: '0.45rem', borderRadius: '8px', border: '1px solid var(--border)' }}
                          >
                            <Edit size={15} />
                          </button>
                          
                          <button
                            onClick={() => setShowConfirmDelete(l.id)}
                            className="btn-outline"
                            title="Supprimer"
                            style={{ 
                              padding: '0.45rem', borderRadius: '8px', border: '1px solid var(--border)',
                              color: 'var(--danger)', background: 'rgba(239, 68, 68, 0.02)'
                            }}
                            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--danger)'}
                            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                          >
                            <Trash2 size={15} />
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

      </div>

      {/* ── Confirmation Modal for Deletion ── */}
      {showConfirmDelete && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', 
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', 
          justifyContent: 'center', zIndex: 9999, padding: '1rem'
        }}>
          <div className="glass-panel" style={{ maxWidth: '420px', width: '100%', padding: '2rem', textAlign: 'center' }}>
            <Trash2 size={44} style={{ color: 'var(--danger)', margin: '0 auto 1.25rem', display: 'block' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>Confirmer la suppression</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.5, margin: '0 0 2rem 0' }}>
              Êtes-vous sûr de vouloir supprimer définitivement cette fiche de cours ? Cette action est irréversible et retirera le cours de la base de données.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button 
                onClick={() => setShowConfirmDelete(null)} 
                className="btn-outline" 
                style={{ flex: 1, padding: '0.75rem' }}
              >
                Annuler
              </button>
              <button 
                onClick={handleDeleteLesson} 
                className="btn" 
                style={{ flex: 1, padding: '0.75rem', background: 'linear-gradient(135deg, var(--danger) 0%, #b91c1c 100%)', border: 'none' }}
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
