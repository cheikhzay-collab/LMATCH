import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Trash2, Settings, School, KeyRound, Eye, EyeOff, CheckCircle2, Sparkles, Image, Zap, RefreshCw, Layers, MousePointerClick, Crown, Download, Sliders, FileText } from 'lucide-react';

export default function AdminSettings() {
  const { 
    schools, addSchool, removeSchool, 
    plans, addPlan, removePlan, updatePlan, 
    activationCodes, generateActivationCodes,
    profName: initialProfName,
    profPhone: initialProfPhone,
    profSite: initialProfSite,
    updateBrandingConfig,
    updateFlashcardSettingsConfig,
    updatePdfSettingsConfig
  } = useAuth();
  const [newSchool, setNewSchool] = useState('');
  const [activeTab, setActiveTab] = useState('general');

  // Voucher states
  const [voucherPlanId, setVoucherPlanId] = useState(() => (plans && plans.length > 0) ? plans[0].id : '');
  const [voucherCount, setVoucherCount] = useState('10');
  const [voucherBatchName, setVoucherBatchName] = useState('');
  const [copiedCode, setCopiedCode] = useState('');
  const [voucherFilter, setVoucherFilter] = useState('all');

  // Subscription plan states
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanPrice, setNewPlanPrice] = useState('');
  const [newPlanDuration, setNewPlanDuration] = useState('365');
  const [newPlanSchools, setNewPlanSchools] = useState([]);
  const [newPlanDescription, setNewPlanDescription] = useState('');
  const [newPlanIsRecommended, setNewPlanIsRecommended] = useState(false);
  const [newPlanFeatures, setNewPlanFeatures] = useState('');

  // Claude API Key
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('claudeApiKey') || '');
  const [showKey, setShowKey] = useState(false);
  const [proxyUrl, setProxyUrl] = useState(() => localStorage.getItem('claudeProxyUrl') || '');
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
  const [cardFontFamily, setCardFontFamily] = useState(() => localStorage.getItem('card_font_family') || 'Computer Modern Serif');
  const [cardFontSize, setCardFontSize] = useState(() => localStorage.getItem('card_font_size') || '1rem');
  const [cardQuestionWeight, setCardQuestionWeight] = useState(() => localStorage.getItem('card_question_weight') || '400');
  const [cardAstuceWeight, setCardAstuceWeight] = useState(() => localStorage.getItem('card_astuce_weight') || '400');
  const [cardOptionsWeight, setCardOptionsWeight] = useState(() => localStorage.getItem('card_options_weight') || '400');
  const [cardSaved,  setCardSaved]  = useState(false);

  const saveCardSettings = async () => {
    await updateFlashcardSettingsConfig({
      cardRevealMode: cardReveal,
      cardFlipEnabled: cardFlip,
      cardSwipeEnabled: cardSwipe,
      cardFontFamily,
      cardFontSize,
      cardQuestionWeight,
      cardAstuceWeight,
      cardOptionsWeight
    });
    setCardSaved(true);
    setTimeout(() => setCardSaved(false), 2500);
  };

  // Branding / Identity
  const [profName, setProfName] = useState(initialProfName || '');
  const [profPhone, setProfPhone] = useState(initialProfPhone || '');
  const [profSite, setProfSite] = useState(initialProfSite || 'www.lconq.ma');
  const [brandSaved, setBrandSaved] = useState(false);

  React.useEffect(() => {
    Promise.resolve().then(() => {
      if (initialProfName !== undefined) setProfName(initialProfName);
      if (initialProfPhone !== undefined) setProfPhone(initialProfPhone);
      if (initialProfSite !== undefined) setProfSite(initialProfSite);
    });
  }, [initialProfName, initialProfPhone, initialProfSite]);

  const saveBranding = async () => {
    await updateBrandingConfig({
      profName: profName.trim(),
      profPhone: profPhone.trim(),
      profSite: profSite.trim() || 'www.lconq.ma'
    });
    setBrandSaved(true);
    setTimeout(() => setBrandSaved(false), 2500);
  };

  // ── PDF Styling Settings ───────────────────────────────────────────────────
  const [pdfPageMargins, setPdfPageMargins] = useState(() => localStorage.getItem('pdf_page_margins') || 'standard');
  const [pdfFontSize, setPdfFontSize] = useState(() => localStorage.getItem('pdf_font_size') || '11pt');
  const [pdfFontFamily, setPdfFontFamily] = useState(() => localStorage.getItem('pdf_font_family') || 'Computer Modern Serif');
  const [pdfTemplateStyle, setPdfTemplateStyle] = useState(() => localStorage.getItem('pdf_template_style') || 'classic_latex');
  const [pdfAvoidPageBreaks, setPdfAvoidPageBreaks] = useState(() => localStorage.getItem('pdf_avoid_page_breaks') !== 'false');
  const [pdfForcePrintColors, setPdfForcePrintColors] = useState(() => localStorage.getItem('pdf_force_print_colors') !== 'false');
  const [pdfSaved, setPdfSaved] = useState(false);

  const savePdfSettings = async () => {
    await updatePdfSettingsConfig({
      pdfPageMargins,
      pdfFontSize,
      pdfFontFamily,
      pdfTemplateStyle,
      pdfAvoidPageBreaks,
      pdfForcePrintColors
    });
    setPdfSaved(true);
    setTimeout(() => setPdfSaved(false), 2500);
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (newSchool.trim()) { addSchool(newSchool.trim()); setNewSchool(''); }
  };

  const saveApiKey = () => {
    localStorage.setItem('claudeApiKey', apiKey.trim());
    localStorage.setItem('claudeProxyUrl', proxyUrl.trim());
    setKeySaved(true);
    setTimeout(() => setKeySaved(false), 2500);
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1100px', margin: '0 auto' }}>
      
      <style>{`
        .settings-container {
          display: grid;
          grid-template-columns: 240px 1fr;
          gap: 2rem;
          align-items: start;
        }
        .settings-tabs {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          position: sticky;
          top: 2rem;
        }
        .settings-tab-btn {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          padding: 0.85rem 1.25rem;
          border-radius: 12px;
          border: 1px solid var(--border);
          cursor: pointer;
          background: var(--bg-glass);
          text-align: left;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          width: 100%;
          position: relative;
          overflow: hidden;
        }
        .settings-tab-btn:hover {
          background: var(--bg-hover);
          border-color: var(--border-hover);
          transform: translateX(4px);
        }
        .settings-tab-btn.active {
          background: linear-gradient(135deg, var(--violet-soft) 0%, rgba(99, 102, 241, 0.03) 100%);
          border-color: var(--violet);
          box-shadow: 0 4px 20px rgba(99, 102, 241, 0.08);
        }
        .settings-tab-btn::after {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 4px;
          background: var(--violet);
          border-radius: 0 4px 4px 0;
          opacity: 0;
          transform: scaleY(0.3);
          transition: all 0.25s ease;
        }
        .settings-tab-btn.active::after {
          opacity: 1;
          transform: scaleY(1);
          box-shadow: var(--shadow-glow-violet);
        }
        .settings-tab-icon {
          color: var(--text-muted);
          transition: transform 0.25s ease, color 0.25s ease;
        }
        .settings-tab-btn:hover .settings-tab-icon {
          transform: scale(1.1);
          color: var(--violet);
        }
        .settings-tab-btn.active .settings-tab-icon {
          color: var(--violet);
        }
        .settings-tab-title {
          font-weight: 700;
          font-size: 0.85rem;
          color: var(--text-muted);
          transition: color 0.25s ease;
        }
        .settings-tab-btn.active .settings-tab-title {
          color: var(--text-main);
        }
        .settings-tab-btn:hover .settings-tab-title {
          color: var(--text-main);
        }
        .settings-tab-desc {
          font-size: 0.68rem;
          color: var(--text-subtle);
          margin-top: 2px;
          transition: color 0.25s ease;
        }
        .settings-tab-btn.active .settings-tab-desc {
          color: var(--violet);
        }
        @media (max-width: 768px) {
          .settings-container {
            grid-template-columns: 1fr !important;
            gap: 1.25rem !important;
          }
          .settings-tabs {
            flex-direction: row !important;
            overflow-x: auto;
            padding-bottom: 0.5rem;
            position: static !important;
          }
          .settings-tabs .settings-tab-btn {
            flex-shrink: 0;
            width: auto !important;
            min-width: 170px;
          }
          .settings-tab-btn:hover {
            transform: translateY(-2px);
          }
          .settings-tab-btn::after {
            left: 0; right: 0; bottom: 0; top: auto;
            width: 100%; height: 3px;
            border-radius: 4px 4px 0 0;
            transform: scaleX(0.3);
          }
          .settings-tab-btn.active::after {
            transform: scaleX(1);
          }
        }
      `}</style>

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

      <div className="settings-container">
        {/* Left Tabs Column */}
        <div className="settings-tabs">
          {[
            { id: 'general', label: 'Général & Branding', icon: Sliders, desc: 'Identité PDF & Écoles' },
            { id: 'pdf', label: 'Design & Impression PDF', icon: FileText, desc: 'Marges, polices & sauts' },
            { id: 'flashcards', label: 'Méthode Flashcards', icon: Layers, desc: 'Animations & Révélation' },
            { id: 'apis', label: 'Clés API & IA', icon: KeyRound, desc: 'Claude, Gemini, FLUX.1' },
            { id: 'subscriptions', label: 'Baqat & Vouchers', icon: Crown, desc: 'Tarifs & Activation' },
          ].map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`settings-tab-btn ${isActive ? 'active' : ''}`}
              >
                <tab.icon size={18} className="settings-tab-icon" />
                <div>
                  <div className="settings-tab-title">{tab.label}</div>
                  <div className="settings-tab-desc">{tab.desc}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Content Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', minWidth: 0 }}>

        {/* ── PDF Page Layout Settings ── */}
        <div className="col-span-12 glass-panel" style={{ display: activeTab === 'pdf' ? 'block' : 'none' }}>
          <h3 style={{ marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={20} /> Paramètres de Mise en Page & Design PDF
          </h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.88rem' }}>
            Configurez l&apos;affichage de vos documents PDF générés (Sujets, Corrigés, E-Books) pour un rendu professionnel.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Margins & Font Size & Font Family Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', flexWrap: 'wrap' }}>
              
              {/* Page Margins */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Marges de page (Marges intérieures)
                </label>
                <select
                  value={pdfPageMargins}
                  onChange={e => setPdfPageMargins(e.target.value)}
                  className="input-control"
                  style={{ fontSize: '0.85rem' }}
                >
                  <option value="standard">Standard (Marge équilibrée - A4 classique)</option>
                  <option value="compact">Compacte (Marge étroite pour économiser des pages)</option>
                  <option value="wide">Large (Rendu très aéré de type livre d&apos;art)</option>
                </select>
              </div>

              {/* Font Size */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Taille de la police de base
                </label>
                <select
                  value={pdfFontSize}
                  onChange={e => setPdfFontSize(e.target.value)}
                  className="input-control"
                  style={{ fontSize: '0.85rem' }}
                >
                  <option value="10pt">Petit (10pt)</option>
                  <option value="11pt">Normal (11pt - recommandé)</option>
                  <option value="12pt">Grand (12pt)</option>
                </select>
              </div>

              {/* Font Family */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Police typographique
                </label>
                <select
                  value={pdfFontFamily}
                  onChange={e => setPdfFontFamily(e.target.value)}
                  className="input-control"
                  style={{ fontSize: '0.85rem' }}
                >
                  <option value="Computer Modern Serif">Computer Modern Serif (Scientifique & académique)</option>
                  <option value="STIX Two Text">STIX Two Text (Littéraire avec empattement)</option>
                  <option value="Times New Roman">Times New Roman (Classique d&apos;examen national)</option>
                  <option value="Inter">Inter (Moderne, épurée et sans empattement)</option>
                </select>
              </div>

              {/* Layout Template Style */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Modèle de mise en page (Template)
                </label>
                <select
                  value={pdfTemplateStyle}
                  onChange={e => setPdfTemplateStyle(e.target.value)}
                  className="input-control"
                  style={{ fontSize: '0.85rem' }}
                >
                  <option value="classic_latex">Classique LaTeX (Éléments structurés, sobres et académiques)</option>
                  <option value="modern_minimalist">Moderne épuré (Design frais, aéré avec touches de couleur)</option>
                  <option value="premium_royal">Royal Institutionnel (En-tête officiel, luxueux avec rubans)</option>
                  <option value="compact_eco">Économique & Compact (Sans page de garde, ultra compact pour impression)</option>
                </select>
              </div>

            </div>

            {/* Avoid page breaks inside cards */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.8rem 1rem', borderRadius: 12, background: 'var(--bg-glass)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <FileText size={18} style={{ color: 'var(--violet)' }} />
                <div>
                  <p style={{ fontWeight: 700, fontSize: '0.88rem', margin: 0 }}>Sauts de page intelligents</p>
                  <p style={{ fontSize: '0.73rem', color: 'var(--text-subtle)', margin: 0 }}>Éviter de couper les énoncés et options d&apos;une question sur deux pages différentes</p>
                </div>
              </div>
              <button
                onClick={() => setPdfAvoidPageBreaks(v => !v)}
                style={{
                  width: 48, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer',
                  background: pdfAvoidPageBreaks ? 'var(--violet)' : 'var(--bg-card)',
                  position: 'relative', transition: 'background 0.2s',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                }}
              >
                <div style={{
                  width: 20, height: 20, borderRadius: '50%', background: '#fff',
                  position: 'absolute', top: 3, transition: 'left 0.2s',
                  left: pdfAvoidPageBreaks ? 25 : 3,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                }} />
              </button>
            </div>

            {/* Preserve background colors */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.8rem 1rem', borderRadius: 12, background: 'var(--bg-glass)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Sparkles size={18} style={{ color: 'var(--emerald)' }} />
                <div>
                  <p style={{ fontWeight: 700, fontSize: '0.88rem', margin: 0 }}>Impression couleur & arrière-plans</p>
                  <p style={{ fontSize: '0.73rem', color: 'var(--text-subtle)', margin: 0 }}>Forcer la préservation des couleurs de fond, des badges et des bulles OMR lors de la génération</p>
                </div>
              </div>
              <button
                onClick={() => setPdfForcePrintColors(v => !v)}
                style={{
                  width: 48, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer',
                  background: pdfForcePrintColors ? 'var(--emerald)' : 'var(--bg-card)',
                  position: 'relative', transition: 'background 0.2s',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                }}
              >
                <div style={{
                  width: 20, height: 20, borderRadius: '50%', background: '#fff',
                  position: 'absolute', top: 3, transition: 'left 0.2s',
                  left: pdfForcePrintColors ? 25 : 3,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                }} />
              </button>
            </div>

          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
            <button
              onClick={savePdfSettings}
              className="btn"
              style={{
                padding: '0.75rem 2rem',
                background: pdfSaved ? 'linear-gradient(135deg,var(--emerald),#34d399)' : undefined,
                boxShadow: pdfSaved ? '0 4px 16px rgba(16,185,129,0.35)' : undefined,
                transition: 'all 0.3s'
              }}
            >
              {pdfSaved ? <><CheckCircle2 size={16} /> Enregistré !</> : 'Enregistrer le style PDF'}
            </button>
          </div>
        </div>

        {/* ── Flashcard Review Settings ── */}
        <div className="col-span-12 glass-panel" style={{ display: activeTab === 'flashcards' ? 'block' : 'none' }}>
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

            {/* Card Typography Configurations */}
            <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
              <p style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Sliders size={15} /> Personnalisation de la typographie des cartes
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                {/* Font Family */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-subtle)' }}>
                    Police typographique des cartes
                  </label>
                  <select
                    value={cardFontFamily}
                    onChange={e => setCardFontFamily(e.target.value)}
                    className="input-control"
                    style={{ fontSize: '0.85rem' }}
                  >
                    <option value="Computer Modern Serif">Computer Modern Serif (Scientifique)</option>
                    <option value="STIX Two Text">STIX Two Text (Littéraire Serif)</option>
                    <option value="Times New Roman">Times New Roman (Classique)</option>
                    <option value="Inter">Inter (Moderne Sans-Serif)</option>
                  </select>
                </div>

                {/* Font Size */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-subtle)' }}>
                    Taille de la police
                  </label>
                  <select
                    value={cardFontSize}
                    onChange={e => setCardFontSize(e.target.value)}
                    className="input-control"
                    style={{ fontSize: '0.85rem' }}
                  >
                    <option value="0.82rem">Petite (0.82rem)</option>
                    <option value="0.9rem">Compacte (0.9rem)</option>
                    <option value="1rem">Normale (1rem — défaut)</option>
                    <option value="1.08rem">Grande (1.08rem)</option>
                    <option value="1.18rem">Très grande (1.18rem)</option>
                  </select>
                </div>

                {/* Question Weight */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-subtle)' }}>
                    Épaisseur du texte des Questions
                  </label>
                  <select
                    value={cardQuestionWeight}
                    onChange={e => setCardQuestionWeight(e.target.value)}
                    className="input-control"
                    style={{ fontSize: '0.85rem' }}
                  >
                    <option value="400">Normal (400)</option>
                    <option value="500">Moyen (500)</option>
                    <option value="600">Demi-gras (600)</option>
                    <option value="700">Gras (700)</option>
                  </select>
                </div>

                {/* Options Weight */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-subtle)' }}>
                    Épaisseur du texte des Options
                  </label>
                  <select
                    value={cardOptionsWeight}
                    onChange={e => setCardOptionsWeight(e.target.value)}
                    className="input-control"
                    style={{ fontSize: '0.85rem' }}
                  >
                    <option value="400">Normal (400)</option>
                    <option value="500">Moyen (500)</option>
                    <option value="600">Demi-gras (600)</option>
                    <option value="700">Gras (700)</option>
                  </select>
                </div>

                {/* Astuce Weight */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-subtle)' }}>
                    Épaisseur du texte des Astuces / Solutions
                  </label>
                  <select
                    value={cardAstuceWeight}
                    onChange={e => setCardAstuceWeight(e.target.value)}
                    className="input-control"
                    style={{ fontSize: '0.85rem' }}
                  >
                    <option value="400">Normal (400)</option>
                    <option value="500">Moyen (500)</option>
                    <option value="600">Demi-gras (600)</option>
                    <option value="700">Gras (700)</option>
                  </select>
                </div>

              </div>
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
        <div className="col-span-12 glass-panel" style={{ display: activeTab === 'apis' ? 'block' : 'none' }}>
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

          <div style={{ marginTop: '1.25rem' }}>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              URL du Proxy Serveur (Optionnel - Pour la production)
            </label>
            <input
              type="text"
              className="input-control"
              placeholder="https://votre-proxy.workers.dev/api/v1/messages"
              value={proxyUrl}
              onChange={e => setProxyUrl(e.target.value)}
              style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
            />
            <p style={{ marginTop: '0.4rem', fontSize: '0.73rem', color: 'var(--text-muted)' }}>
              💡 Si configurée, les requêtes d'importation IA transiteront par ce serveur pour masquer votre clé API en production.
            </p>
          </div>

          {apiKey && (
            <p style={{ marginTop: '0.75rem', fontSize: '0.78rem', color: 'var(--emerald)' }}>
              ✓ Clé configurée — {apiKey.slice(0, 14)}...
            </p>
          )}
        </div>

        {/* ── Gemini API Key ── */}
        <div className="col-span-12 glass-panel" style={{ display: activeTab === 'apis' ? 'block' : 'none', borderColor: 'rgba(66,133,244,0.25)', background: 'linear-gradient(135deg, rgba(66,133,244,0.04) 0%, rgba(234,67,53,0.02) 100%)' }}>
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
        <div className="col-span-12 glass-panel" style={{ display: activeTab === 'apis' ? 'block' : 'none', borderColor: 'rgba(245,158,11,0.3)', background: 'linear-gradient(135deg, rgba(245,158,11,0.05) 0%, rgba(251,191,36,0.02) 100%)' }}>
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
        <div className="col-span-12 glass-panel" style={{ display: activeTab === 'apis' ? 'block' : 'none', borderColor: 'rgba(139,92,246,0.3)', background: 'linear-gradient(135deg, rgba(139,92,246,0.05) 0%, rgba(99,102,241,0.03) 100%)' }}>
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
        <div className="col-span-12 glass-panel" style={{ display: activeTab === 'general' ? 'block' : 'none' }}>
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

        {/* ── Subscription Plans Configuration ── */}
        <div className="col-span-12 glass-panel" style={{ display: activeTab === 'subscriptions' ? 'block' : 'none' }}>
          <h3 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Crown size={20} color="var(--warning)" /> Configuration des Offres d'Abonnement (Baqat)
          </h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            Gérez les offres d'abonnement disponibles pour les élèves, configurez leurs tarifs, durées et les écoles associées.
          </p>

          {/* List of existing plans */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2rem' }}>
            {plans.map(plan => {
              return (
                <div key={plan.id} style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  
                  {/* Name, Price & Expiration row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <input 
                        type="text" 
                        value={plan.name} 
                        onChange={e => updatePlan(plan.id, { name: e.target.value })}
                        style={{ background: 'transparent', border: 'none', borderBottom: '1px dashed var(--border)', color: 'var(--text-main)', fontSize: '1rem', fontWeight: 800, width: '100%', outline: 'none', paddingBottom: '2px' }}
                      />
                    </div>
                    
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(255,255,255,0.02)', padding: '0.3rem 0.6rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                        <input 
                          type="number" 
                          value={plan.price} 
                          onChange={e => updatePlan(plan.id, { price: parseFloat(e.target.value) || 0 })}
                          style={{ background: 'transparent', border: 'none', color: 'var(--emerald)', fontSize: '0.85rem', fontWeight: 700, width: '60px', outline: 'none', textAlign: 'right' }}
                        />
                        <span style={{ fontSize: '0.85rem', color: 'var(--emerald)', fontWeight: 700 }}>DH</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(255,255,255,0.02)', padding: '0.3rem 0.6rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                        <input 
                          type="number" 
                          value={plan.durationDays} 
                          onChange={e => updatePlan(plan.id, { durationDays: parseInt(e.target.value) || 365 })}
                          style={{ background: 'transparent', border: 'none', color: 'var(--violet)', fontSize: '0.85rem', fontWeight: 700, width: '50px', outline: 'none', textAlign: 'right' }}
                        />
                        <span style={{ fontSize: '0.85rem', color: 'var(--violet)', fontWeight: 700 }}>Jours</span>
                      </div>

                      <button 
                        onClick={() => removePlan(plan.id)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.35rem', borderRadius: '6px', display: 'flex' }}
                        title="Supprimer la baque"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Description & Recommended row */}
                  <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.4rem' }}>
                        Description de l'offre
                      </label>
                      <input 
                        type="text" 
                        className="input-control"
                        placeholder="Ex: Le pack complet pour la réussite."
                        value={plan.description || ''}
                        onChange={e => updatePlan(plan.id, { description: e.target.value })}
                        style={{ fontSize: '0.85rem', padding: '0.5rem 0.75rem' }}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.25rem' }}>
                      <input 
                        type="checkbox"
                        id={`recom-${plan.id}`}
                        checked={!!plan.isRecommended}
                        onChange={e => updatePlan(plan.id, { isRecommended: e.target.checked })}
                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                      <label htmlFor={`recom-${plan.id}`} style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--warning)', cursor: 'pointer' }}>
                        ✦ Recommandé
                      </label>
                    </div>
                  </div>

                  {/* Features Textarea */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.4rem' }}>
                      Fonctionnalités incluses (une par ligne) :
                    </label>
                    <textarea 
                      className="input-control"
                      placeholder="Ex: Accès à toutes les archives&#10;Astuces IA exclusives pour chaque QCM"
                      rows={3}
                      value={plan.features ? plan.features.join('\n') : ''}
                      onChange={e => updatePlan(plan.id, { features: e.target.value.split('\n').filter(Boolean) })}
                      style={{ fontSize: '0.85rem', padding: '0.5rem 0.75rem', fontFamily: 'inherit', resize: 'vertical' }}
                    />
                  </div>

                  {/* Allowed schools selector */}
                  <div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
                      Écoles et Facultés autorisées :
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {schools.map(school => {
                        const isAllowed = plan.allowedSchools.includes(school);
                        return (
                          <button
                            key={school}
                            type="button"
                            onClick={() => {
                              const updatedSchools = isAllowed
                                ? plan.allowedSchools.filter(s => s !== school)
                                : [...plan.allowedSchools, school];
                              updatePlan(plan.id, { allowedSchools: updatedSchools });
                            }}
                            style={{
                              padding: '0.25rem 0.6rem',
                              borderRadius: '6px',
                              border: `1px solid ${isAllowed ? 'rgba(99,102,241,0.4)' : 'var(--border)'}`,
                              background: isAllowed ? 'rgba(99,102,241,0.1)' : 'transparent',
                              color: isAllowed ? 'var(--violet)' : 'var(--text-muted)',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              transition: 'all 0.15s'
                            }}
                          >
                            {isAllowed ? '✓ ' : '+ '} {school}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>

          {/* Add Plan Form */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
            <h4 style={{ margin: '0 0 1rem 0', fontWeight: 800, fontSize: '0.95rem' }}>Ajouter une nouvelle offre</h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.4rem' }}>Nom de l'offre</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Pack Spécial ENSA & ENSAM" 
                    className="input-control"
                    value={newPlanName}
                    onChange={e => setNewPlanName(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.4rem' }}>Tarif (DH)</label>
                  <input 
                    type="number" 
                    placeholder="299" 
                    className="input-control"
                    value={newPlanPrice}
                    onChange={e => setNewPlanPrice(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.4rem' }}>Durée (Jours)</label>
                  <input 
                    type="number" 
                    placeholder="365" 
                    className="input-control"
                    value={newPlanDuration}
                    onChange={e => setNewPlanDuration(e.target.value)}
                  />
                </div>
              </div>

              {/* Description & Recommended row for Add Form */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', alignItems: 'center' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.4rem' }}>Description</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Le pack complet pour la réussite." 
                    className="input-control"
                    value={newPlanDescription}
                    onChange={e => setNewPlanDescription(e.target.value)}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.25rem' }}>
                  <input 
                    type="checkbox"
                    id="newPlanIsRecommended"
                    checked={newPlanIsRecommended}
                    onChange={e => setNewPlanIsRecommended(e.target.checked)}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <label htmlFor="newPlanIsRecommended" style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--warning)', cursor: 'pointer' }}>
                    ✦ Recommandé par défaut
                  </label>
                </div>
              </div>

              {/* Features List for Add Form */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.4rem' }}>
                  Fonctionnalités incluses (une par ligne) :
                </label>
                <textarea 
                  placeholder="Ex: Accès à toutes les archives (2010–2025)&#10;Astuces IA exclusives pour chaque QCM&#10;Simulateur de concours chronométré" 
                  className="input-control"
                  rows={3}
                  value={newPlanFeatures}
                  onChange={e => setNewPlanFeatures(e.target.value)}
                  style={{ fontFamily: 'inherit', resize: 'vertical' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.4rem' }}>
                  Autoriser l'accès aux écoles suivantes :
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {schools.map(school => {
                    const isSelected = newPlanSchools.includes(school);
                    return (
                      <button
                        key={school}
                        type="button"
                        onClick={() => {
                          const updated = isSelected
                            ? newPlanSchools.filter(s => s !== school)
                            : [...newPlanSchools, school];
                          setNewPlanSchools(updated);
                        }}
                        style={{
                          padding: '0.25rem 0.6rem',
                          borderRadius: '6px',
                          border: `1px solid ${isSelected ? 'rgba(16,185,129,0.4)' : 'var(--border)'}`,
                          background: isSelected ? 'rgba(16,185,129,0.1)' : 'transparent',
                          color: isSelected ? 'var(--emerald)' : 'var(--text-muted)',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                      >
                        {isSelected ? '✓ ' : '+ '} {school}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button 
                type="button" 
                onClick={() => {
                  if (newPlanName.trim()) {
                    const featuresArray = newPlanFeatures.split('\n').map(f => f.trim()).filter(Boolean);
                    addPlan(
                      newPlanName.trim(), 
                      newPlanPrice, 
                      newPlanDuration, 
                      newPlanSchools, 
                      newPlanDescription.trim(), 
                      newPlanIsRecommended, 
                      featuresArray
                    );
                    setNewPlanName('');
                    setNewPlanPrice('');
                    setNewPlanDuration('365');
                    setNewPlanSchools([]);
                    setNewPlanDescription('');
                    setNewPlanIsRecommended(false);
                    setNewPlanFeatures('');
                  }
                }}
                className="btn"
                style={{ width: 'fit-content', padding: '0.65rem 1.5rem', alignSelf: 'flex-end' }}
              >
                <Plus size={16} /> Ajouter l'offre d'abonnement
              </button>
            </div>

          </div>

        </div>

        {/* ── Schools ── */}
        <div className="col-span-12 glass-panel" style={{ display: activeTab === 'general' ? 'block' : 'none' }}>
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

        {/* ── Activation Codes (Vouchers) ── */}
        <div className="col-span-12 glass-panel" style={{ display: activeTab === 'subscriptions' ? 'block' : 'none' }}>
          <h3 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <KeyRound size={20} color="var(--violet)" /> Gestion des Codes d'Activation (Vouchers)
          </h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            Générez des codes uniques pour vos baquettes d'abonnement. Exportez-les en CSV pour les distribuer aux librairies ou étudiants.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
            {/* Generate form */}
            <div style={{ borderRight: '1px solid var(--border)', paddingRight: '2rem' }}>
              <h4 style={{ margin: '0 0 1rem 0', fontWeight: 800, fontSize: '0.95rem' }}>Générer de nouveaux codes</h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.4rem' }}>
                    Sélectionner l'offre associée
                  </label>
                  <select 
                    value={voucherPlanId} 
                    onChange={e => setVoucherPlanId(e.target.value)}
                    style={{ 
                      width: '100%', padding: '0.65rem 0.75rem', borderRadius: '10px', 
                      border: '1px solid var(--border)', background: 'var(--bg-glass)', 
                      color: 'var(--text-main)', fontSize: '0.85rem' 
                    }}
                  >
                    {plans.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.price} DH)</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.4rem' }}>
                      Quantité
                    </label>
                    <input 
                      type="number" 
                      min="1" 
                      max="100"
                      className="input-control"
                      value={voucherCount}
                      onChange={e => setVoucherCount(e.target.value)}
                      style={{ fontSize: '0.85rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.4rem' }}>
                      Nom du lot (Optionnel)
                    </label>
                    <input 
                      type="text" 
                      placeholder="Ex: Librairie Al-Amal"
                      className="input-control"
                      value={voucherBatchName}
                      onChange={e => setVoucherBatchName(e.target.value)}
                      style={{ fontSize: '0.85rem' }}
                    />
                  </div>
                </div>

                <button 
                  type="button"
                  onClick={() => {
                    if (voucherPlanId && voucherCount) {
                      generateActivationCodes(voucherPlanId, parseInt(voucherCount), voucherBatchName.trim());
                      setVoucherBatchName('');
                    }
                  }}
                  className="btn"
                  style={{ width: 'fit-content', padding: '0.65rem 1.5rem', alignSelf: 'flex-end', marginTop: '0.5rem' }}
                >
                  <Sparkles size={16} /> Générer les codes
                </button>
              </div>
            </div>

            {/* List and Actions */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ margin: 0, fontWeight: 800, fontSize: '0.95rem' }}>Codes Existants</h4>
                <button 
                  onClick={() => {
                    const header = "Code,Plan,Lot,Statut,Utilise Par,Date Utilisation,Date Creation\n";
                    const rows = activationCodes.map(c => {
                      const plan = plans.find(p => p.id === c.planId);
                      const statusStr = c.isUsed ? "Utilise" : "Actif";
                      const dateUsed = c.usedAt ? new Date(c.usedAt).toLocaleDateString('fr-FR') : "";
                      const dateCreated = c.createdDate ? new Date(c.createdDate).toLocaleDateString('fr-FR') : "";
                      return `"${c.code}","${plan?.name || 'Inconnu'}","${c.batchName}","${statusStr}","${c.usedBy || ''}","${dateUsed}","${dateCreated}"`;
                    }).join("\n");
                    
                    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.setAttribute("href", url);
                    link.setAttribute("download", `vouchers_lconq_${new Date().toISOString().split('T')[0]}.csv`);
                    link.style.visibility = 'hidden';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="btn-outline"
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Download size={13} /> Exporter CSV
                </button>
              </div>

              {/* Filters */}
              <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem' }}>
                {['all', 'active', 'used'].map(f => (
                  <button
                    key={f}
                    onClick={() => setVoucherFilter(f)}
                    style={{
                      padding: '0.25rem 0.6rem',
                      borderRadius: '6px',
                      border: '1px solid var(--border)',
                      background: voucherFilter === f ? 'rgba(99,102,241,0.1)' : 'transparent',
                      color: voucherFilter === f ? 'var(--violet)' : 'var(--text-muted)',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {f === 'all' ? 'Tous' : f === 'active' ? 'Actifs' : 'Utilisés'}
                  </button>
                ))}
              </div>

              {/* List */}
              <div style={{ maxHeight: '240px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '10px', background: 'rgba(255,255,255,0.01)' }}>
                {activationCodes
                  .filter(c => {
                    if (voucherFilter === 'active') return !c.isUsed;
                    if (voucherFilter === 'used') return c.isUsed;
                    return true;
                  })
                  .map(c => {
                    const plan = plans.find(p => p.id === c.planId);
                    return (
                      <div 
                        key={c.code} 
                        style={{ 
                          padding: '0.75rem 1rem', 
                          borderBottom: '1px solid var(--border)', 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          fontSize: '0.85rem'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span 
                              style={{ 
                                fontFamily: 'monospace', 
                                fontWeight: 800, 
                                color: copiedCode === c.code ? 'var(--emerald)' : 'var(--text-main)',
                                cursor: 'pointer' 
                              }}
                              onClick={() => {
                                navigator.clipboard.writeText(c.code);
                                setCopiedCode(c.code);
                                setTimeout(() => setCopiedCode(''), 1500);
                              }}
                              title="Cliquer pour copier"
                            >
                              {c.code}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>
                              ({plan?.name || 'Plan inconnu'})
                            </span>
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                            Lot: {c.batchName} · {new Date(c.createdDate).toLocaleDateString('fr-FR')}
                          </div>
                        </div>

                        <div>
                          {c.isUsed ? (
                            <span 
                              style={{ color: 'var(--danger)', fontSize: '0.72rem', fontWeight: 800 }}
                              title={`Utilisé par ${c.usedBy} le ${new Date(c.usedAt).toLocaleDateString('fr-FR')}`}
                            >
                              UTILISÉ
                            </span>
                          ) : (
                            <span style={{ color: 'var(--emerald)', fontSize: '0.72rem', fontWeight: 800 }}>
                              ACTIF
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                {activationCodes.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    Aucun code d'activation disponible
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
