import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Trash2, Settings, School, KeyRound, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

export default function AdminSettings() {
  const { schools, addSchool, removeSchool } = useAuth();
  const [newSchool, setNewSchool] = useState('');

  // Claude API Key
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('claudeApiKey') || '');
  const [showKey, setShowKey] = useState(false);
  const [keySaved, setKeySaved] = useState(false);

  // Branding / Identity
  const [profName, setProfName] = useState(() => localStorage.getItem('profName') || '');
  const [profPhone, setProfPhone] = useState(() => localStorage.getItem('profPhone') || '');
  const [profSite, setProfSite] = useState(() => localStorage.getItem('profSite') || 'www.lmatch.ma');
  const [brandSaved, setBrandSaved] = useState(false);

  const saveBranding = () => {
    localStorage.setItem('profName', profName.trim());
    localStorage.setItem('profPhone', profPhone.trim());
    localStorage.setItem('profSite', profSite.trim() || 'www.lmatch.ma');
    setBrandSaved(true);
    setTimeout(() => setBrandSaved(false), 2500);
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (newSchool.trim()) { addSchool(newSchool.trim()); setNewSchool(''); }
  };

  const saveApiKey = () => {
    localStorage.setItem('claudeApiKey', apiKey.trim());
    setKeySaved(true);
    setTimeout(() => setKeySaved(false), 2500);
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: '12px', background: 'linear-gradient(135deg, var(--violet), var(--emerald))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Settings size={22} color="#fff" />
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>Paramètres</h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: 0 }}>Gérez les options globales de la plateforme.</p>
        </div>
      </header>

      <div className="dashboard-grid">

        {/* ── Claude API Key ── */}
        <div className="col-span-12 glass-panel">
          <h3 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <KeyRound size={20} /> Clé API Claude (Anthropic)
          </h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            Utilisée pour l'import IA automatique de PDF. Obtenez votre clé sur{' '}
            <a href="https://console.anthropic.com" target="_blank" rel="noreferrer" className="text-violet">console.anthropic.com</a>.
            Elle est stockée uniquement dans ce navigateur.
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                type={showKey ? 'text' : 'password'}
                className="input-control"
                placeholder="sk-ant-api03-..."
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                style={{ paddingRight: '3rem', fontFamily: apiKey && !showKey ? 'monospace' : 'inherit' }}
              />
              <button
                type="button"
                onClick={() => setShowKey(v => !v)}
                style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}
              >
                {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <button
              onClick={saveApiKey}
              className="btn"
              style={{
                padding: '0.75rem 1.5rem', whiteSpace: 'nowrap',
                background: keySaved ? 'linear-gradient(135deg,var(--emerald),#34d399)' : undefined,
                boxShadow: keySaved ? '0 4px 16px rgba(16,185,129,0.35)' : undefined,
                transition: 'all 0.3s'
              }}
            >
              {keySaved ? <><CheckCircle2 size={16} /> Sauvegardé !</> : 'Sauvegarder'}
            </button>
          </div>

          {apiKey && (
            <p style={{ marginTop: '0.75rem', fontSize: '0.78rem', color: 'var(--emerald)' }}>
              ✓ Clé configurée — {apiKey.slice(0, 14)}...
            </p>
          )}
        </div>

        {/* ── Branding / Identity ── */}
        <div className="col-span-12 glass-panel">
          <h3 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🎨 Identité & Branding PDF
          </h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            Ces informations apparaissent dans l'en-tête et le pied-de-page de tous les PDF générés (E-Books, Sujets, Corrigés).
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Nom du Professeur</label>
              <input className="input-control" placeholder="Prof. Ahmed Benali" value={profName} onChange={e => setProfName(e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Téléphone / WhatsApp</label>
              <input className="input-control" placeholder="+212 6XX XXX XXX" value={profPhone} onChange={e => setProfPhone(e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Site web / URL QR</label>
              <input className="input-control" placeholder="www.lmatch.ma" value={profSite} onChange={e => setProfSite(e.target.value)} />
            </div>
          </div>
          <button onClick={saveBranding} className="btn"
            style={{ background: brandSaved ? 'linear-gradient(135deg,var(--emerald),#34d399)' : undefined, boxShadow: brandSaved ? '0 4px 16px rgba(16,185,129,0.35)' : undefined, transition: 'all 0.3s' }}>
            {brandSaved ? <><CheckCircle2 size={16} /> Sauvegardé !</> : 'Sauvegarder l\'identité'}
          </button>
        </div>

        {/* ── Schools ── */}
        <div className="col-span-12 glass-panel">
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <School size={20} /> Gestion des Écoles Cibles
          </h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.9rem' }}>
            Ces écoles apparaîtront dans le menu déroulant lors de l'upload d'un nouveau concours.
          </p>

          <form onSubmit={handleAdd} style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
            <input
              type="text"
              className="input-control"
              placeholder="Nom de l'école (ex: ISCAE)"
              value={newSchool}
              onChange={e => setNewSchool(e.target.value)}
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn" style={{ padding: '0.75rem 2rem' }}>
              <Plus size={20} /> Ajouter
            </button>
          </form>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
            {schools.map(school => (
              <div key={school} className="glass-panel" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-glass)', borderRadius: '1rem' }}>
                <span style={{ fontWeight: 600 }}>{school}</span>
                <button onClick={() => removeSchool(school)} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.4rem', borderRadius: '0.5rem', transition: 'background 0.2s' }} title="Supprimer">
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
