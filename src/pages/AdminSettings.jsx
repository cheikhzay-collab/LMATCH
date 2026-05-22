import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Trash2, Settings, School, KeyRound, Eye, EyeOff, CheckCircle2, Sparkles, Image, Zap, RefreshCw, Layers, MousePointerClick } from 'lucide-react';

export default function AdminSettings() {
  const { schools, addSchool, removeSchool } = useAuth();
  const [newSchool, setNewSchool] = useState('');

  // Claude API Key
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('claudeApiKey') || '');
  const [showKey, setShowKey] = useState(false);
  const [keySaved, setKeySaved] = useState(false);

  // Gemini API Key
  const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem('geminiApiKey') || '');
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [geminiKeySaved, setGeminiKeySaved] = useState(false);

  // Together AI Key
  const [togetherKey, setTogetherKey] = useState(() => localStorage.getItem('togetherApiKey') || '');
  const [showTogetherKey, setShowTogetherKey] = useState(false);
  const [togetherKeySaved, setTogetherKeySaved] = useState(false);

  // HuggingFace Token
  const [hfKey, setHfKey] = useState(() => localStorage.getItem('hfApiKey') || '');
  const [showHfKey, setShowHfKey] = useState(false);
  const [hfKeySaved, setHfKeySaved] = useState(false);

  const saveGeminiKey = () => {
    localStorage.setItem('geminiApiKey', geminiKey.trim());
    setGeminiKeySaved(true);
    setTimeout(() => setGeminiKeySaved(false), 2500);
  };

  const saveTogetherKey = () => {
    localStorage.setItem('togetherApiKey', togetherKey.trim());
    setTogetherKeySaved(true);
    setTimeout(() => setTogetherKeySaved(false), 2500);
  };

  const saveHfKey = () => {
    localStorage.setItem('hfApiKey', hfKey.trim());
    setHfKeySaved(true);
    setTimeout(() => setHfKeySaved(false), 2500);
  };

  // ── Card Display Settings ──────────────────────────────────────────────────
  const [cardFlip,   setCardFlip]   = useState(() => localStorage.getItem('card_flip_animation') !== 'false');
  const [cardReveal, setCardReveal] = useState(() => localStorage.getItem('card_reveal_mode') || 'flip');
  const [cardSwipe,  setCardSwipe]  = useState(() => localStorage.getItem('card_swipe_gesture') !== 'false');
  const [cardSaved,  setCardSaved]  = useState(false);

  const saveCardSettings = () => {
    localStorage.setItem('card_flip_animation', String(cardFlip));
    localStorage.setItem('card_reveal_mode',    cardReveal);
    localStorage.setItem('card_swipe_gesture',  String(cardSwipe));
    setCardSaved(true);
    setTimeout(() => setCardSaved(false), 2500);
  };

  // Branding / Identity
  const [profName, setProfName] = useState(() => localStorage.getItem('profName') || '');
  const [profPhone, setProfPhone] = useState(() => localStorage.getItem('profPhone') || '');
  const [profSite, setProfSite] = useState(() => localStorage.getItem('profSite') || 'www.lconq.ma');
  const [brandSaved, setBrandSaved] = useState(false);

  const saveBranding = () => {
    localStorage.setItem('profName', profName.trim());
    localStorage.setItem('profPhone', profPhone.trim());
    localStorage.setItem('profSite', profSite.trim() || 'www.lconq.ma');
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

        {/* ── Flashcard Review Settings ── */}
        <div className="col-span-12 glass-panel">
          <h3 style={{ marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Layers size={20} /> Paramètres des Flashcards
          </h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.88rem' }}>
            Personnalisez l&apos;animation, le mode de révélation et les gestes des cartes de révision.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

            {/* Reveal Mode */}
            <div>
              <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Layers size={14} /> Mode de révélation de la réponse
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {[
                  { id: 'flip',    icon: '🔄', label: 'Retournement 3D',  desc: 'Animation de rotation (défaut)' },
                  { id: 'fade',    icon: '✨', label: 'Fondu enchaîné',   desc: 'Transition douce sans rotation' },
                  { id: 'instant', icon: '⚡', label: 'Instantané',       desc: 'Mode calme — boutons uniquement, sans glissement' },
                ].map(({ id, icon, label, desc }) => (
                  <button
                    key={id}
                    onClick={() => { setCardReveal(id); if (id !== 'flip') setCardFlip(false); else setCardFlip(true); }}
                    style={{
                      flex: '1 1 170px',
                      padding: '0.8rem 1rem',
                      borderRadius: 12,
                      cursor: 'pointer',
                      background: cardReveal === id ? 'rgba(99,102,241,0.1)' : 'var(--bg-glass)',
                      border: `2px solid ${cardReveal === id ? 'var(--violet)' : 'var(--border)'}`,
                      textAlign: 'left',
                      transition: 'all 0.2s',
                      boxShadow: cardReveal === id ? '0 4px 16px rgba(99,102,241,0.15)' : 'none',
                    }}
                  >
                    <div style={{ fontSize: '1.3rem', marginBottom: '0.3rem' }}>{icon}</div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: cardReveal === id ? 'var(--violet)' : 'var(--text-main)', marginBottom: '0.15rem' }}>{label}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>{desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Flip Animation toggle (only relevant for flip mode) */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.8rem 1rem', borderRadius: 12, background: 'var(--bg-glass)', border: '1px solid var(--border)', opacity: cardReveal === 'flip' ? 1 : 0.4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <RefreshCw size={18} style={{ color: 'var(--violet)' }} />
                <div>
                  <p style={{ fontWeight: 700, fontSize: '0.88rem', margin: 0 }}>Animation de rotation 3D</p>
                  <p style={{ fontSize: '0.73rem', color: 'var(--text-subtle)', margin: 0 }}>Actif uniquement en mode « Retournement »</p>
                </div>
              </div>
              <button
                disabled={cardReveal !== 'flip'}
                onClick={() => setCardFlip(v => !v)}
                style={{
                  width: 48, height: 26, borderRadius: 13, border: 'none', cursor: cardReveal !== 'flip' ? 'not-allowed' : 'pointer',
                  background: cardFlip && cardReveal === 'flip' ? 'var(--violet)' : 'var(--bg-card)',
                  position: 'relative', transition: 'background 0.2s',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                }}
              >
                <div style={{
                  width: 20, height: 20, borderRadius: '50%', background: '#fff',
                  position: 'absolute', top: 3, transition: 'left 0.2s',
                  left: cardFlip && cardReveal === 'flip' ? 25 : 3,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                }} />
              </button>
            </div>

            {/* Swipe gesture toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.8rem 1rem', borderRadius: 12, background: 'var(--bg-glass)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <MousePointerClick size={18} style={{ color: 'var(--emerald)' }} />
                <div>
                  <p style={{ fontWeight: 700, fontSize: '0.88rem', margin: 0 }}>Geste de glissement (Swipe)</p>
                  <p style={{ fontSize: '0.73rem', color: 'var(--text-subtle)', margin: 0 }}>Glisser à droite = Facile, à gauche = À revoir</p>
                </div>
              </div>
              <button
                onClick={() => setCardSwipe(v => !v)}
                style={{
                  width: 48, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer',
                  background: cardSwipe ? 'var(--emerald)' : 'var(--bg-card)',
                  position: 'relative', transition: 'background 0.2s',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                }}
              >
                <div style={{
                  width: 20, height: 20, borderRadius: '50%', background: '#fff',
                  position: 'absolute', top: 3, transition: 'left 0.2s',
                  left: cardSwipe ? 25 : 3,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                }} />
              </button>
            </div>

          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
            <button
              onClick={saveCardSettings}
              className="btn"
              style={{
                padding: '0.75rem 2rem',
                background: cardSaved ? 'linear-gradient(135deg,var(--emerald),#34d399)' : undefined,
                boxShadow: cardSaved ? '0 4px 16px rgba(16,185,129,0.35)' : undefined,
                transition: 'all 0.3s'
              }}
            >
              {cardSaved ? <><CheckCircle2 size={16} /> Sauvegardé !</> : 'Enregistrer les paramètres'}
            </button>
          </div>
        </div>

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

        {/* ── Gemini API Key ── */}
        <div className="col-span-12 glass-panel" style={{ borderColor: 'rgba(66,133,244,0.25)', background: 'linear-gradient(135deg, rgba(66,133,244,0.04) 0%, rgba(234,67,53,0.02) 100%)' }}>
          <h3 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 28, height: 28, borderRadius: '8px', background: 'linear-gradient(135deg,#4285F4,#EA4335,#FBBC05,#34A853)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Image size={14} color="#fff" />
            </div>
            Clé API Google Gemini <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '0.2rem 0.5rem', borderRadius: '99px', background: 'rgba(66,133,244,0.12)', color: '#4285F4', marginLeft: '0.25rem' }}>Imagen 3 — Génération d'images</span>
          </h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            Utilisée pour générer des visuels marketing avec <strong>Google Imagen 3</strong>. Obtenez votre clé gratuitement sur{' '}
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ color: '#4285F4', fontWeight: 600 }}>aistudio.google.com</a>.
            Elle est stockée uniquement dans ce navigateur.
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                type={showGeminiKey ? 'text' : 'password'}
                className="input-control"
                placeholder="AIzaSy..."
                value={geminiKey}
                onChange={e => setGeminiKey(e.target.value)}
                style={{ paddingRight: '3rem', fontFamily: geminiKey && !showGeminiKey ? 'monospace' : 'inherit', borderColor: geminiKey ? 'rgba(52,168,83,0.4)' : undefined }}
              />
              <button
                type="button"
                onClick={() => setShowGeminiKey(v => !v)}
                style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}
              >
                {showGeminiKey ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <button
              onClick={saveGeminiKey}
              className="btn"
              style={{
                padding: '0.75rem 1.5rem', whiteSpace: 'nowrap',
                background: geminiKeySaved ? 'linear-gradient(135deg,var(--emerald),#34d399)' : 'linear-gradient(135deg,#4285F4,#0F9D58)',
                boxShadow: geminiKeySaved ? '0 4px 16px rgba(16,185,129,0.35)' : '0 4px 16px rgba(66,133,244,0.3)',
                transition: 'all 0.3s'
              }}
            >
              {geminiKeySaved ? <><CheckCircle2 size={16} /> Sauvegardé !</> : 'Sauvegarder'}
            </button>
          </div>

          {geminiKey && (
            <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.78rem', color: '#34A853' }}>✓ Clé Gemini configurée — {geminiKey.slice(0, 10)}...</span>
              <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', borderRadius: '99px', background: 'rgba(52,168,83,0.12)', color: '#34A853', fontWeight: 600 }}>Imagen 3 activé ✨</span>
            </div>
          )}
        </div>

        {/* ── HuggingFace Token (FLUX.1 — FREE) ── */}
        <div className="col-span-12 glass-panel" style={{ borderColor: 'rgba(245,158,11,0.3)', background: 'linear-gradient(135deg, rgba(245,158,11,0.05) 0%, rgba(251,191,36,0.02) 100%)' }}>
          <h3 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 28, height: 28, borderRadius: '8px', background: 'linear-gradient(135deg, #F59E0B, #FCD34D)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={14} color="#1C1400" />
            </div>
            Token HuggingFace
            <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '0.2rem 0.5rem', borderRadius: '99px', background: 'rgba(245,158,11,0.15)', color: '#F59E0B', marginLeft: '0.25rem' }}>FLUX.1-schnell ✅ Gratuit</span>
          </h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '0.875rem', fontSize: '0.9rem', lineHeight: 1.6 }}>
            Utilisé pour générer des images IA professionnelles avec <strong>FLUX.1-schnell</strong> (Black Forest Labs).<br />
            <strong style={{ color: 'var(--emerald)' }}>Gratuit, sans carte bancaire.</strong> Créez un compte sur{' '}
            <a href="https://huggingface.co/settings/tokens" target="_blank" rel="noreferrer" style={{ color: '#F59E0B', fontWeight: 700 }}>huggingface.co/settings/tokens</a>
            {' '}→ "New token" → type <strong>Read</strong> → copier le token.
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                type={showHfKey ? 'text' : 'password'}
                className="input-control"
                placeholder="hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                value={hfKey}
                onChange={e => setHfKey(e.target.value)}
                style={{ paddingRight: '3rem', fontFamily: hfKey && !showHfKey ? 'monospace' : 'inherit', borderColor: hfKey ? 'rgba(245,158,11,0.5)' : undefined }}
              />
              <button
                type="button"
                onClick={() => setShowHfKey(v => !v)}
                style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}
              >
                {showHfKey ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <button
              onClick={saveHfKey}
              className="btn"
              style={{
                padding: '0.75rem 1.5rem', whiteSpace: 'nowrap',
                background: hfKeySaved ? 'linear-gradient(135deg,var(--emerald),#34d399)' : 'linear-gradient(135deg,#F59E0B,#FCD34D)',
                color: hfKeySaved ? '#fff' : '#1C1400',
                boxShadow: hfKeySaved ? '0 4px 16px rgba(16,185,129,0.35)' : '0 4px 16px rgba(245,158,11,0.35)',
                transition: 'all 0.3s'
              }}
            >
              {hfKeySaved ? <><CheckCircle2 size={16} /> Sauvegardé !</> : 'Sauvegarder'}
            </button>
          </div>

          {hfKey && (
            <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.78rem', color: '#F59E0B' }}>✓ Token HuggingFace configuré — {hfKey.slice(0, 16)}...</span>
              <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', borderRadius: '99px', background: 'rgba(245,158,11,0.12)', color: '#F59E0B', fontWeight: 600 }}>FLUX.1-schnell activé ✅</span>
            </div>
          )}
        </div>

        {/* ── Together AI Key (FLUX.1) ── */}
        <div className="col-span-12 glass-panel" style={{ borderColor: 'rgba(139,92,246,0.3)', background: 'linear-gradient(135deg, rgba(139,92,246,0.05) 0%, rgba(99,102,241,0.03) 100%)' }}>
          <h3 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 28, height: 28, borderRadius: '8px', background: 'linear-gradient(135deg, #8B5CF6, #6366F1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={14} color="#fff" />
            </div>
            Clé API Together AI
            <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '0.2rem 0.5rem', borderRadius: '99px', background: 'rgba(139,92,246,0.15)', color: '#8B5CF6', marginLeft: '0.25rem' }}>FLUX.1-schnell ⚡ Ultra rapide</span>
          </h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '0.875rem', fontSize: '0.9rem', lineHeight: 1.6 }}>
            Utilisée pour générer des visuels marketing IA avec <strong>FLUX.1-schnell</strong> — le modèle le plus rapide de Black Forest Labs.<br />
            Obtenez votre clé sur{' '}
            <a href="https://api.together.ai" target="_blank" rel="noreferrer" style={{ color: '#8B5CF6', fontWeight: 700 }}>api.together.ai</a>
            {' '}→ API Keys → Create.
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                type={showTogetherKey ? 'text' : 'password'}
                className="input-control"
                placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                value={togetherKey}
                onChange={e => setTogetherKey(e.target.value)}
                style={{ paddingRight: '3rem', fontFamily: togetherKey && !showTogetherKey ? 'monospace' : 'inherit', borderColor: togetherKey ? 'rgba(139,92,246,0.5)' : undefined }}
              />
              <button
                type="button"
                onClick={() => setShowTogetherKey(v => !v)}
                style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}
              >
                {showTogetherKey ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <button
              onClick={saveTogetherKey}
              className="btn"
              style={{
                padding: '0.75rem 1.5rem', whiteSpace: 'nowrap',
                background: togetherKeySaved ? 'linear-gradient(135deg,var(--emerald),#34d399)' : 'linear-gradient(135deg,#8B5CF6,#6366F1)',
                boxShadow: togetherKeySaved ? '0 4px 16px rgba(16,185,129,0.35)' : '0 4px 16px rgba(139,92,246,0.35)',
                transition: 'all 0.3s'
              }}
            >
              {togetherKeySaved ? <><CheckCircle2 size={16} /> Sauvegardé !</> : 'Sauvegarder'}
            </button>
          </div>

          {togetherKey && (
            <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.78rem', color: '#8B5CF6' }}>✓ Clé Together AI configurée — {togetherKey.slice(0, 12)}...</span>
              <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', borderRadius: '99px', background: 'rgba(139,92,246,0.12)', color: '#8B5CF6', fontWeight: 600 }}>FLUX.1 activé ⚡</span>
            </div>
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
              <input className="input-control" placeholder="www.lconq.ma" value={profSite} onChange={e => setProfSite(e.target.value)} />
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
