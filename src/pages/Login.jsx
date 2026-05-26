import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { BrainCircuit, Eye, EyeOff, Zap, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const TEST_ACCOUNTS = [
  { label: 'Admin',        email: 'admin@lconq.ma',   role: 'admin', color: 'var(--violet)' },
  { label: 'Élève Premium', email: 'premium@lconq.ma', role: 'student', color: 'var(--emerald)' },
  { label: 'Élève Free',   email: 'free@lconq.ma',    role: 'student', color: 'var(--text-muted)' },
];

export default function Login() {
  const { pathname }                      = useLocation();
  const isRegisterRoute                   = pathname === '/register';
  const [isRegistering, setIsRegistering] = useState(isRegisterRoute);
  const [name, setName]                   = useState('');
  const [email, setEmail]                 = useState('');
  const [password, setPassword]           = useState('');
  const [showPwd, setShowPwd]             = useState(false);
  const [isLoading, setIsLoading]         = useState(false);
  const [errorMsg, setErrorMsg]           = useState('');

  const { login, register }               = useAuth();
  const navigate                          = useNavigate();

  // Sync state with location path changes
  React.useEffect(() => {
    setIsRegistering(pathname === '/register');
  }, [pathname]);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      if (isRegistering) {
        if (!name.trim()) {
          throw new Error('Veuillez saisir votre nom complet.');
        }
        await register(name.trim(), email, password);
        navigate('/dashboard');
      } else {
        await login(email, password);
        navigate(email === 'admin@lconq.ma' ? '/admin/dashboard' : '/dashboard');
      }
    } catch (err) {
      console.error('[Auth] Error:', err);
      // Clean up Supabase/Firebase native messages for friendly display
      let msg = err.message || 'Une erreur est survenue.';
      if (msg.includes('Invalid login credentials')) {
        msg = 'Identifiants invalides. Veuillez vérifier votre email et mot de passe.';
      } else if (msg.includes('User already registered') || msg.includes('already exists')) {
        msg = 'Cette adresse email est déjà enregistrée. Essayez de vous connecter.';
      } else if (msg.includes('Password should be at least')) {
        msg = 'Le mot de passe doit contenir au moins 6 caractères.';
      }
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const fillAccount = (acc) => {
    navigate('/login');
    setErrorMsg('');
    setEmail(acc.email);
    setPassword('password');
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      background: 'var(--bg-base)',
    }}>
      {/* Left — decorative panel (hidden on mobile) */}
      <div style={{
        flex: '0 0 40%', background: 'linear-gradient(145deg, var(--violet) 0%, #312e81 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '3rem', position: 'relative', overflow: 'hidden'
      }} className="login-left-panel">
        {/* Ambient blobs */}
        <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-40px', left: '-40px', width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', color: '#fff' }}>
          <div style={{ width: 64, height: 64, borderRadius: '18px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <BrainCircuit size={34} color="#fff" />
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '1rem', letterSpacing: '-0.03em' }}>L'Conq</h2>
          <p style={{ opacity: 0.75, fontSize: '1rem', lineHeight: 1.65, maxWidth: 260 }}>
            La plateforme de préparation aux concours propulsée par l'IA — Médecine, ENSA, ENSAM.
          </p>
          <div style={{ marginTop: '2.5rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {[
              'Algorithme Spaced Repetition (SRS)',
              'Astuces IA par question',
              'Classement national en temps réel',
            ].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', fontSize: '0.88rem', opacity: 0.85 }}>
                <Zap size={14} color="#34d399" /> {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — auth form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 2rem' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          {/* Back link */}
          <Link to="/" style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', marginBottom: '2rem', transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-main)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            ← Retour à l'accueil
          </Link>

          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.4rem', letterSpacing: '-0.02em' }}>
            {isRegistering ? 'Créer un compte' : 'Connexion'}
          </h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
            {isRegistering ? 'Rejoignez la plateforme et préparez vos concours.' : 'Accédez à votre espace de révision.'}
          </p>

          {/* Clean Tab Selector */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem' }}>
            <button
              type="button"
              onClick={() => { navigate('/login'); setErrorMsg(''); }}
              style={{
                flex: 1,
                padding: '0.75rem 0',
                background: 'none',
                border: 'none',
                borderBottom: !isRegistering ? '2px solid var(--violet)' : '2px solid transparent',
                color: !isRegistering ? 'var(--text-main)' : 'var(--text-muted)',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              Connexion
            </button>
            <button
              type="button"
              onClick={() => { navigate('/register'); setErrorMsg(''); }}
              style={{
                flex: 1,
                padding: '0.75rem 0',
                background: 'none',
                border: 'none',
                borderBottom: isRegistering ? '2px solid var(--violet)' : '2px solid transparent',
                color: isRegistering ? 'var(--text-main)' : 'var(--text-muted)',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              Inscription
            </button>
          </div>

          {/* Error Alert Display */}
          {errorMsg && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              padding: '0.875rem 1rem',
              borderRadius: '12px',
              color: 'var(--danger)',
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1.25rem'
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span style={{ fontWeight: 500 }}>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {isRegistering && (
              <div className="input-group">
                <label>Nom complet</label>
                <input
                  type="text"
                  className="input-control"
                  placeholder="Ex: Youssef Alaoui"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
            )}

            <div className="input-group">
              <label>Adresse email</label>
              <input
                type="email"
                className="input-control"
                placeholder="votre@email.ma"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="input-group">
              <label>Mot de passe</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPwd ? 'text' : 'password'}
                  className="input-control"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  style={{ paddingRight: '3rem', width: '100%' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(p => !p)}
                  disabled={isLoading}
                  style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-subtle)', cursor: 'pointer' }}
                >
                  {showPwd ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn"
              disabled={isLoading}
              style={{ width: '100%', justifyContent: 'center', padding: '0.875rem', fontSize: '1rem', background: 'linear-gradient(135deg, var(--violet), #818cf8)' }}
            >
              {isLoading ? 'Opération en cours...' : isRegistering ? "S'inscrire" : 'Se connecter'}
            </button>
          </form>

          {/* Test accounts - Only show in connection mode */}
          {!isRegistering && (
            <div style={{ marginTop: '2rem', padding: '1.25rem', background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
              <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.875rem' }}>
                Comptes de démonstration
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {TEST_ACCOUNTS.map(acc => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => fillAccount(acc)}
                    disabled={isLoading}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '0.625rem 0.875rem', background: 'var(--bg-card)',
                      border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
                      cursor: 'pointer', transition: 'all 0.15s', width: '100%'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.background = 'var(--bg-hover)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-card)'; }}
                  >
                    <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-main)' }}>{acc.label}</span>
                    <span style={{ fontSize: '0.78rem', color: acc.color, fontWeight: 500 }}>{acc.email}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
