import React from 'react';
import { 
  CheckCircle2, AlertTriangle, Zap, Award, BookOpen, 
  ArrowRight, RefreshCw, LayoutDashboard, Brain 
} from 'lucide-react';

export default function SessionSummary({ 
  sessionHistory, 
  examName, 
  onForceReview, 
  onBackToDashboard 
}) {
  const totalCards = sessionHistory.length;
  const masteredCards = sessionHistory.filter(h => h.quality >= 3).length;
  const revoirCards = totalCards - masteredCards;
  const xpGained = sessionHistory.reduce((sum, h) => sum + (h.quality >= 3 ? h.quality * 10 : 0), 0);

  // Group by topic to find strengths and weaknesses
  const topicStats = {};
  sessionHistory.forEach(h => {
    const topic = h.topic || 'Général';
    if (!topicStats[topic]) {
      topicStats[topic] = { correct: 0, total: 0 };
    }
    topicStats[topic].total += 1;
    if (h.quality >= 3) {
      topicStats[topic].correct += 1;
    }
  });

  const topicsArr = Object.entries(topicStats).map(([name, stats]) => ({
    name,
    pct: Math.round((stats.correct / stats.total) * 100),
    correct: stats.correct,
    total: stats.total
  }));

  const strengths = topicsArr.filter(t => t.pct >= 70).map(t => t.name);
  const weaknesses = topicsArr.filter(t => t.pct < 70).map(t => t.name);

  // Generate pedagogical recommendation based on the weakest topic or overall score
  let advice = "Continuez sur cette lancée ! Révisez régulièrement pour consolider vos acquis.";
  let priorityTopic = weaknesses.length > 0 ? weaknesses[0] : null;

  if (priorityTopic) {
    advice = `Concentrez-vous sur le thème "${priorityTopic}" lors de votre prochaine session. Relisez attentivement les astuces de correction, votre cerveau assimile mieux les concepts complexes après une pause de quelques heures.`;
  } else if (masteredCards === totalCards && totalCards > 0) {
    advice = "Session parfaite ! Votre mémoire à long terme commence à ancrer ces notions. L'algorithme SuperMemo ajustera les rappels à des intervalles plus longs.";
  } else if (masteredCards / totalCards < 0.5) {
    advice = "Session difficile. Nous vous conseillons de faire des sessions plus courtes (5-10 fiches) pour éviter la surcharge cognitive, et de privilégier les révisions en début de journée.";
  }

  // Next session time suggestion
  const nextSessionText = revoirCards > 0 
    ? "Dans 4 heures (recommandé pour consolider les erreurs)" 
    : "Demain matin (recommandé pour maintenir la courbe d'oubli)";

  return (
    <div className="animate-fade-in" style={{
      maxWidth: '650px',
      margin: '2rem auto',
      width: '100%',
      padding: '0 1rem'
    }}>
      <div className="glass-panel" style={{
        padding: '2.5rem',
        borderRadius: 'var(--radius-2xl)',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--border)',
        background: 'var(--bg-glass)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background glow effects */}
        <div style={{
          position: 'absolute',
          top: '-10%',
          right: '-10%',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
          zIndex: 0,
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-10%',
          left: '-10%',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)',
          zIndex: 0,
          pointerEvents: 'none'
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div style={{
              width: '72px',
              height: '72px',
              background: 'rgba(99, 102, 241, 0.1)',
              borderRadius: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
              border: '1px solid rgba(99, 102, 241, 0.2)'
            }}>
              <Brain size={36} color="var(--primary)" />
            </div>
            <h2 className="text-gradient" style={{ fontSize: '2.25rem', fontWeight: 900, marginBottom: '0.5rem' }}>
              Session Terminée !
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              Bilan de révision pour le module <strong>{examName}</strong>
            </p>
          </div>

          {/* Stats Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            {/* Mastered */}
            <div style={{
              background: 'rgba(16, 185, 129, 0.05)',
              border: '1px solid rgba(16, 185, 129, 0.15)',
              borderRadius: 'var(--radius-xl)',
              padding: '1.25rem 0.75rem',
              textAlign: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', color: 'var(--emerald)', marginBottom: '0.4rem' }}>
                <CheckCircle2 size={16} />
                <span style={{ fontSize: '1.5rem', fontWeight: 900 }}>{masteredCards}</span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Maîtrisées</p>
            </div>

            {/* Revoir */}
            <div style={{
              background: 'rgba(239, 68, 68, 0.05)',
              border: '1px solid rgba(239, 68, 68, 0.15)',
              borderRadius: 'var(--radius-xl)',
              padding: '1.25rem 0.75rem',
              textAlign: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', color: 'var(--danger)', marginBottom: '0.4rem' }}>
                <AlertTriangle size={16} />
                <span style={{ fontSize: '1.5rem', fontWeight: 900 }}>{revoirCards}</span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>À Revoir</p>
            </div>

            {/* XP Gained */}
            <div style={{
              background: 'rgba(245, 158, 11, 0.05)',
              border: '1px solid rgba(245, 158, 11, 0.15)',
              borderRadius: 'var(--radius-xl)',
              padding: '1.25rem 0.75rem',
              textAlign: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', color: 'var(--warning)', marginBottom: '0.4rem' }}>
                <Award size={16} />
                <span style={{ fontSize: '1.5rem', fontWeight: 900 }}>+{xpGained}</span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>XP Gagnés</p>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '1.75rem 0' }} />

          {/* Topics Strengths / Weaknesses */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.75rem' }}>
            {strengths.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <div style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  borderRadius: '50%',
                  padding: '0.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: '0.1rem'
                }}>
                  <Zap size={14} color="var(--emerald)" />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    Points forts aujourd'hui
                  </h4>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    {strengths.join(', ')}
                  </p>
                </div>
              </div>
            )}

            {weaknesses.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <div style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  borderRadius: '50%',
                  padding: '0.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: '0.1rem'
                }}>
                  <AlertTriangle size={14} color="var(--danger)" />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    À renforcer
                  </h4>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    {weaknesses.join(', ')}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Pedagogical Guidance */}
          <div style={{
            background: 'var(--violet-soft)',
            border: '1px solid var(--violet)33',
            borderRadius: 'var(--radius-xl)',
            padding: '1.25rem 1.5rem',
            marginBottom: '1.75rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.875rem'
          }}>
            <BookOpen size={20} color="var(--violet)" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
            <div>
              <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800, color: 'var(--violet)', marginBottom: '0.3rem' }}>
                Conseil pédagogique personnalisé
              </h4>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                {advice}
              </p>
            </div>
          </div>

          {/* Next Recommended Session */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)',
            padding: '1rem 1.25rem',
            marginBottom: '2.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'between',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
              <Zap size={18} color="var(--warning)" />
              <div>
                <h5 style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Prochaine session recommandée
                </h5>
                <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  {nextSessionText}
                </p>
              </div>
            </div>
          </div>

          {/* CTA Actions */}
          <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
            {onForceReview ? (
              <>
                <button 
                  className="btn" 
                  onClick={onForceReview} 
                  style={{ 
                    width: '100%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '0.5rem',
                    padding: '0.9rem'
                  }}
                >
                  <RefreshCw size={16} /> Continuer à réviser (10 fiches)
                </button>
                <button 
                  className="btn-outline" 
                  onClick={onBackToDashboard} 
                  style={{ 
                    width: '100%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '0.5rem',
                    borderColor: 'var(--border)',
                    color: 'var(--text-main)',
                    padding: '0.9rem'
                  }}
                >
                  <LayoutDashboard size={16} /> Retour au tableau de bord
                </button>
              </>
            ) : (
              <button 
                className="btn" 
                onClick={onBackToDashboard} 
                style={{ 
                  width: '100%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '0.5rem',
                  padding: '0.9rem'
                }}
              >
                <LayoutDashboard size={16} /> Retour au tableau de bord
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
