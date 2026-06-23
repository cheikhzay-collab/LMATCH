import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Crown, CheckCircle2, Zap, AlertCircle, Key, CreditCard, 
  ChevronRight, X, ShieldCheck, HelpCircle 
} from 'lucide-react';
import { sanitizeInputString } from '../utils/security';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isMobile;
}

export default function SubscriptionPage() {
  const { user, plans, activateSubscription, redeemActivationCode, profPhone, upgradedPlan, setUpgradedPlan } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [voucherCode, setVoucherCode] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Payment simulator modal state
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('123');
  const [cardName, setCardName] = useState(user?.name || '');
  const [isProcessing, setIsProcessing] = useState(false);

  const activePlanId = user?.subscription?.planId;
  const isPremium = user?.tier === 'premium' && user?.subscription?.status === 'active';
  
  const currentPlan = plans.find(p => p.id === activePlanId);
  const daysLeft = user?.subscription?.endDate
    ? Math.ceil((new Date(user.subscription.endDate) - new Date()) / (1000 * 3600 * 24))
    : 0;

  const handleRedeem = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    const codeClean = sanitizeInputString(voucherCode.trim());
    if (!codeClean) return;

    try {
      const plan = await redeemActivationCode(codeClean);
      setUpgradedPlan(plan);
      setVoucherCode('');
    } catch (err) {
      setErrorMsg(err.message || "Erreur lors de la validation du code.");
    }
  };

  const handleSimulatePayment = (e) => {
    e.preventDefault();
    if (!selectedPlan) return;

    setIsProcessing(true);
    setErrorMsg('');
    setSuccessMsg('');

    // Simulate standard credit card processing lag
    setTimeout(async () => {
      try {
        await activateSubscription(user?.uid || user?.id, selectedPlan.id, selectedPlan.durationDays);
        setUpgradedPlan(selectedPlan);
        setSelectedPlan(null);
        setIsProcessing(false);
      } catch {
        setErrorMsg("Échec de la simulation de paiement.");
        setIsProcessing(false);
      }
    }, 1500);
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '3rem' }}>
      
      {/* ── Header ── */}
      <header style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: isMobile ? '1.5rem' : '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: '12px', background: 'linear-gradient(135deg, var(--violet), var(--emerald))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Crown size={22} color="#fff" />
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>Mon Abonnement</h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: 0 }}>Gérez vos accès Premium et débloquez la préparation aux grandes écoles.</p>
        </div>
      </header>

      {/* ── Status Banner ── */}
      <div style={{ marginBottom: '2rem' }}>
        {isPremium ? (
          <div className="glass-panel" style={{
            background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.15), rgba(15, 23, 42, 0.4))',
            border: '1.5px solid rgba(124, 58, 237, 0.4)',
            padding: isMobile ? '1.25rem' : '2rem',
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'stretch' : 'center',
            justifyContent: 'space-between',
            gap: '1.5rem',
            boxShadow: '0 15px 30px rgba(124, 58, 237, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ 
                width: 56, height: 56, borderRadius: '16px', 
                background: 'linear-gradient(135deg, var(--violet), #818cf8)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 20px rgba(124, 58, 237, 0.3)',
                flexShrink: 0
              }}>
                <Crown size={28} color="#fff" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0 }}>Abonnement Premium Actif ⚡</h2>
                  <span className="badge badge-pro" style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}>
                    {currentPlan?.name || "Premium"}
                  </span>
                </div>
                <p style={{ margin: '0.35rem 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  Expire le : <strong style={{ color: 'var(--text-main)' }}>{new Date(user.subscription.endDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
                  {' '}({daysLeft} jours restants)
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <button 
                onClick={() => navigate('/schools')} 
                className="btn"
                style={{ 
                  background: 'linear-gradient(135deg, var(--violet), #818cf8)', 
                  fontWeight: 700, 
                  width: isMobile ? '100%' : 'auto',
                  borderRadius: '10px'
                }}
              >
                Accéder aux examens
              </button>
              <button 
                onClick={() => setUpgradedPlan(currentPlan || plans[0])} 
                className="btn-outline"
                style={{ 
                  fontWeight: 700, 
                  width: isMobile ? '100%' : 'auto',
                  borderRadius: '10px',
                  borderColor: 'rgba(124, 58, 237, 0.4)',
                  color: 'var(--violet)'
                }}
              >
                🎉 Rejouer l'animation
              </button>
            </div>
          </div>
        ) : (
          <div className="glass-panel" style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            padding: isMobile ? '1.25rem' : '2rem',
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'stretch' : 'center',
            justifyContent: 'space-between',
            gap: '1.5rem',
            boxShadow: 'var(--shadow-card)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ 
                width: 56, height: 56, borderRadius: '16px', 
                background: 'rgba(255,255,255,0.05)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid var(--border)',
                flexShrink: 0
              }}>
                <Zap size={28} color="var(--text-muted)" />
              </div>
              <div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0 }}>Compte Freemium (Gratuit)</h2>
                <p style={{ margin: '0.35rem 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  Votre accès est restreint aux concours des 2 dernières années. Choisissez une offre ci-dessous pour tout débloquer.
                </p>
              </div>
            </div>
            <a 
              href="#offers" 
              className="btn-outline" 
              style={{ 
                textDecoration: 'none', 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                fontWeight: 700, 
                justifyContent: 'center', 
                width: isMobile ? '100%' : 'auto',
                borderRadius: '10px'
              }}
            >
              Voir les offres <ChevronRight size={16} />
            </a>
          </div>
        )}
      </div>

      {/* ── Success and Error messages ── */}
      {successMsg && (
        <div className="glass-panel" style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '1.25rem', borderRadius: '12px', color: 'var(--emerald)', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', animation: 'slideDown 0.3s ease' }}>
          <CheckCircle2 size={20} style={{ flexShrink: 0 }} />
          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="glass-panel" style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', padding: '1.25rem', borderRadius: '12px', color: 'var(--danger)', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', animation: 'slideDown 0.3s ease' }}>
          <AlertCircle size={20} style={{ flexShrink: 0 }} />
          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{errorMsg}</span>
        </div>
      )}

      <div className="dashboard-grid" style={{ marginBottom: '3rem' }}>
        {/* ── Left panel: Code Activation Form ── */}
        <div className="col-span-6 glass-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: isMobile ? '1.25rem' : '2rem', gap: '1.5rem' }}>
          <div>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 700 }}>
              <Key size={20} color="var(--violet)" /> Saisir un Code d'Activation
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Vous avez acheté une carte d'abonnement ou reçu un code auprès d'un tuteur ou d'une librairie partenaire ? Saisissez-le ici pour activer instantanément vos droits Premium.
            </p>
            
            <form onSubmit={handleRedeem} style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <input 
                type="text"
                placeholder="Ex: LCONQ-PREM-TEST-30D"
                value={voucherCode}
                onChange={e => setVoucherCode(e.target.value)}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  background: 'var(--bg-glass)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  color: 'white',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontFamily: 'monospace',
                  outline: 'none'
                }}
              />
              <button 
                type="submit" 
                className="btn"
                style={{ 
                  background: 'linear-gradient(135deg, var(--violet), #818cf8)', 
                  fontWeight: 700, 
                  whiteSpace: 'nowrap', 
                  minHeight: isMobile ? '48px' : 'auto',
                  borderRadius: '10px'
                }}
              >
                Activer le code
              </button>
            </form>
          </div>
          
          <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.5rem' }}>
              💡 Codes de test disponibles :
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontFamily: 'monospace', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--violet)', fontWeight: 700 }}>LCONQ-PREM-TEST-30D</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>30 jours</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '0.5rem' }}>
                <span style={{ color: 'var(--violet)', fontWeight: 700 }}>LCONQ-GLOB-TEST-365</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>365 jours</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right panel: Offline payment instructions ── */}
        <div className="col-span-6 glass-panel" style={{ padding: isMobile ? '1.25rem' : '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1.5rem' }}>
          <div>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 700 }}>
              <CreditCard size={20} color="var(--emerald)" /> Virement Bancaire ou Cash
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Vous préférez payer par virement (CIH / Attijariwafa) ou par cash via CashPlus ou Wafacash ?
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', background: 'rgba(255,255,255,0.01)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Banque :</span>
                <strong style={{ color: 'var(--text-main)' }}>CIH Bank (Maroc)</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', background: 'rgba(255,255,255,0.01)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-muted)' }}>RIB :</span>
                <strong style={{ color: 'var(--text-main)', fontFamily: 'monospace', fontSize: isMobile ? '0.78rem' : '0.85rem' }}>230 780 4567890123 0001 89</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', background: 'rgba(255,255,255,0.01)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Bénéficiaire :</span>
                <strong style={{ color: 'var(--text-main)' }}>L'CONQ SARL</strong>
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '12px', padding: '0.875rem', marginBottom: '0.5rem' }}>
            <ShieldCheck size={18} color="var(--emerald)" style={{ flexShrink: 0 }} />
            <span>
              Après votre virement, vous pouvez contacter directement le support WhatsApp au <strong style={{ color: 'var(--emerald)' }}>{profPhone || '+212 6 00 00 00 00'}</strong> pour envoyer votre reçu et recevoir immédiatement un code Voucher.
            </span>
          </div>

          {/* WhatsApp direct support action */}
          <a
            href={`https://wa.me/${(profPhone || '212600000000').replace(/[^0-9]/g, '')}?text=${encodeURIComponent("Bonjour Monsieur le Directeur, je viens d'effectuer un virement bancaire pour recharger mon abonnement sur l'application GIMA L'CONQ. Voici mon reçu.")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn"
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
              color: '#fff',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.6rem',
              padding: '0.85rem 1.5rem',
              borderRadius: '12px',
              boxShadow: '0 8px 20px rgba(37, 211, 102, 0.2)',
              textDecoration: 'none',
              fontSize: '0.95rem',
            }}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.625 1.451 5.403.002 9.803-4.394 9.806-9.799.002-2.597-1.01-5.038-2.85-6.88-1.84-1.84-4.283-2.85-6.882-2.852-5.41 0-9.81 4.402-9.813 9.807-.001 1.517.417 3.01 1.21 4.341L1.87 20.35l4.777-1.196zm12.383-6.425c-.27-.135-1.602-.79-1.85-.88-.25-.09-.432-.135-.612.135-.18.27-.7.88-.857 1.06-.157.18-.315.2-.585.065-.27-.135-1.14-.42-2.17-1.34-.8-.713-1.34-1.594-1.498-1.864-.157-.27-.017-.417.118-.552.122-.122.27-.315.405-.473.135-.157.18-.27.27-.45.09-.18.045-.337-.022-.473-.068-.135-.612-1.474-.838-2.02-.22-.53-.442-.457-.612-.466-.157-.008-.337-.01-.517-.01-.18 0-.473.067-.72.337-.247.27-.945.923-.945 2.25s.967 2.61 1.102 2.793c.135.18 1.902 2.904 4.607 4.07 2.705 1.167 2.705.778 3.2.73.495-.047 1.602-.656 1.83-1.29.227-.635.227-1.18.158-1.29-.068-.11-.248-.195-.518-.33z"/>
            </svg>
            Contacter le Directeur sur WhatsApp
          </a>
        </div>
      </div>

      {/* ── Offers section ── */}
      <section id="offers">
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.5rem' }}>Nos Offres Premium</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Choisissez l&apos;offre la plus adaptée à vos objectifs et passez Premium instantanément pour débloquer les examens.</p>
        </div>

        <div className="pricing-grid" style={{ alignItems: 'stretch' }}>
          
          {/* Freemium Card */}
          <div className="glass-panel" style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'space-between',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-card)',
            padding: isMobile ? '1.25rem' : '2rem'
          }}>
            <div>
              <h3 style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Freemium</h3>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '0.25rem', display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                0 <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 400 }}>Dh/mois</span>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.87rem', marginBottom: '1.5rem' }}>Accès de base pour découvrir la méthode.</p>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.625rem', marginBottom: '2rem', padding: 0 }}>
                {[
                  { ok: true, label: 'Annales des 2 dernières années' },
                  { ok: true, label: 'Correction basique' },
                  { ok: false, label: 'Astuces IA (Cheat codes)' },
                  { ok: false, label: 'Classement National' },
                ].map(({ ok, label }) => (
                  <li key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', fontSize: '0.9rem', color: ok ? 'var(--text-main)' : 'var(--text-subtle)', textDecoration: ok ? 'none' : 'line-through' }}>
                    {ok ? <CheckCircle2 size={16} color="var(--emerald)" style={{ flexShrink: 0 }} /> : <X size={12} color="var(--danger)" style={{ flexShrink: 0, marginLeft: 2 }} />}
                    {label}
                  </li>
                ))}
              </ul>
            </div>
            <button 
              disabled 
              className="btn-outline" 
              style={{ 
                width: '100%', 
                opacity: 0.5, 
                cursor: 'default', 
                justifyContent: 'center', 
                minHeight: isMobile ? '44px' : '38px', 
                borderRadius: '10px' 
              }}
            >
              Plan Actuel par Défaut
            </button>
          </div>

          {/* Dynamic Premium Plans from Settings */}
          {plans && plans.map((plan) => {
            const isRecommended = !!plan.isRecommended;
            const isCurrentlyActive = activePlanId === plan.id && isPremium;
            
            const formatPriceLabel = (price, days) => {
              if (days === 30 || days === 31) return 'Dh/mois';
              if (days === 365) return 'Dh/an';
              return `Dh / ${days} j`;
            };

            return (
              <div 
                key={plan.id}
                className="glass-panel" 
                style={{
                  border: isRecommended ? '1.5px solid rgba(124, 58, 237, 0.5)' : '1px solid var(--border)',
                  background: isRecommended 
                    ? 'linear-gradient(145deg, rgba(124, 58, 237, 0.1), rgba(15, 23, 42, 0.85))'
                    : 'var(--bg-card)',
                  boxShadow: isRecommended 
                    ? '0 15px 35px rgba(124, 58, 237, 0.2)'
                    : 'var(--shadow-card)',
                  position: 'relative', 
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transform: (isRecommended && !isMobile) ? 'scale(1.02)' : 'none',
                  zIndex: isRecommended ? 5 : 1,
                  padding: isMobile ? '1.25rem' : '2rem'
                }}
              >
                {isRecommended && (
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
                    background: 'linear-gradient(90deg, var(--violet), var(--emerald))',
                  }} />
                )}
                
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                    <h3 style={{ fontWeight: 800, margin: 0, color: isRecommended ? 'var(--violet)' : 'var(--text-main)' }}>
                      {plan.name}
                    </h3>
                    {isRecommended && (
                      <span className="badge badge-pro"><Zap size={9} fill="currentColor" /> RECOMMANDÉ</span>
                    )}
                  </div>
                  
                  <div style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '0.25rem', color: 'var(--text-main)', display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                    {plan.price} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 400 }}>{formatPriceLabel(plan.price, plan.durationDays)}</span>
                  </div>
                  
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.87rem', marginBottom: '1.5rem' }}>
                    {plan.description || "Le pack complet pour la réussite."}
                  </p>
                  
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem', padding: 0 }}>
                    {plan.features && plan.features.map(label => (
                      <li key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', fontSize: '0.9rem' }}>
                        <CheckCircle2 size={16} color="var(--emerald)" style={{ flexShrink: 0 }} />
                        <span>{label}</span>
                      </li>
                    ))}
                    
                    {plan.allowedSchools && plan.allowedSchools.length > 0 && (
                      <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', fontSize: '0.85rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.75rem', marginTop: '0.75rem' }}>
                        <CheckCircle2 size={16} color="var(--emerald)" style={{ flexShrink: 0, opacity: 0.7 }} />
                        <div>
                          <strong style={{ color: 'var(--text-main)' }}>Écoles incluses :</strong>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.4 }}>
                            {plan.allowedSchools.join(', ')}
                          </div>
                        </div>
                      </li>
                    )}
                  </ul>
                </div>
                
                {isCurrentlyActive ? (
                  <button 
                    disabled
                    className="btn" 
                    style={{ 
                      width: '100%', 
                      background: 'rgba(16, 185, 129, 0.1)', 
                      color: 'var(--emerald)', 
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      cursor: 'default',
                      fontWeight: 900,
                      justifyContent: 'center',
                      padding: isMobile ? '0.75rem' : '0.5rem 1.5rem',
                      borderRadius: '10px',
                      fontSize: '0.9rem',
                      minHeight: isMobile ? '44px' : '38px'
                    }}
                  >
                    ✓ Offre Active
                  </button>
                ) : (
                  <button 
                    onClick={() => setSelectedPlan(plan)}
                    className="btn" 
                    style={{ 
                      width: '100%', 
                      justifyContent: 'center', 
                      background: isRecommended ? 'linear-gradient(135deg, var(--violet), #818cf8)' : undefined, 
                      marginTop: 'auto',
                      gap: '0.5rem',
                      fontWeight: 900,
                      padding: isMobile ? '0.75rem' : '0.5rem 1.5rem',
                      borderRadius: '10px',
                      fontSize: '0.9rem',
                      minHeight: isMobile ? '44px' : '38px'
                    }}
                  >
                    <Zap size={14} fill={isRecommended ? "currentColor" : "none"} /> 
                    {plan.price > 0 ? "S'abonner maintenant" : "Choisir l'offre"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Direct Payment Simulator Modal ── */}
      {selectedPlan && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(2, 6, 23, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1.5rem',
          animation: 'fadeIn 0.2s ease'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '480px', width: '100%',
            padding: isMobile ? '1.25rem' : '2rem', position: 'relative',
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            maxHeight: '92vh', overflowY: 'auto'
          }}>
            {/* Close Button */}
            <button 
              onClick={() => setSelectedPlan(null)}
              style={{ position: 'absolute', right: '1.5rem', top: '1.5rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 800 }}>
              <CreditCard size={20} color="var(--violet)" /> Simulation de Paiement Direct
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Pour le pack <strong style={{ color: 'var(--text-main)' }}>{selectedPlan.name}</strong> ({selectedPlan.price} DH / {selectedPlan.durationDays}j).
            </p>

            <form onSubmit={handleSimulatePayment} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.4rem' }}>Nom sur la carte</label>
                <input 
                  type="text" 
                  className="input-control" 
                  value={cardName} 
                  onChange={e => setCardName(e.target.value)} 
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.4rem' }}>Numéro de carte</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="text" 
                    className="input-control" 
                    value={cardNumber} 
                    onChange={e => setCardNumber(e.target.value)} 
                    style={{ paddingLeft: '2.5rem', fontFamily: 'monospace' }}
                    required
                  />
                  <CreditCard size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.4rem' }}>Expiration</label>
                  <input 
                    type="text" 
                    placeholder="MM/AA"
                    className="input-control" 
                    value={cardExpiry} 
                    onChange={e => setCardExpiry(e.target.value)} 
                    style={{ textAlign: 'center', fontFamily: 'monospace' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.4rem' }}>CVC / Cryptogramme</label>
                  <input 
                    type="text" 
                    placeholder="123"
                    maxLength={3}
                    className="input-control" 
                    value={cardCvc} 
                    onChange={e => setCardCvc(e.target.value)} 
                    style={{ textAlign: 'center', fontFamily: 'monospace' }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', background: 'rgba(255,255,255,0.01)', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <HelpCircle size={14} style={{ flexShrink: 0 }} />
                <span>Ce paiement est fictif. Cliquer sur Valider simulera une transaction bancaire réussie et activera votre abonnement immédiatement.</span>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <button 
                  type="button" 
                  onClick={() => setSelectedPlan(null)} 
                  className="btn-outline" 
                  style={{ 
                    flex: 1, 
                    justifyContent: 'center', 
                    minHeight: isMobile ? '44px' : '38px', 
                    borderRadius: '10px' 
                  }}
                  disabled={isProcessing}
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="btn" 
                  style={{ 
                    flex: 2, 
                    justifyContent: 'center', 
                    background: 'linear-gradient(135deg, var(--violet), #818cf8)', 
                    fontWeight: 900, 
                    minHeight: isMobile ? '44px' : '38px', 
                    borderRadius: '10px' 
                  }}
                  disabled={isProcessing}
                >
                  {isProcessing ? "Paiement..." : `Payer ${selectedPlan.price} DH`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
