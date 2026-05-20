import React, { useState, useRef } from 'react';
import { renderWithMath } from '../utils/mathRenderer';
import { Lightbulb, CheckCircle2, XCircle, Frown, Meh, Smile, BrainCircuit, Zap, Clock } from 'lucide-react';

export default function Flashcard({ card, onNext }) {
  const [selectedOption, setSelectedOption] = useState(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isShowingBack, setIsShowingBack] = useState(false);
  const [astuceTab, setAstuceTab] = useState('rule');
  const [swipeClass, setSwipeClass] = useState('');

  // Drag-to-swipe states
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef(0);

  const handleOptionClick = (optionId) => {
    if (selectedOption) return; // Prevent multiple clicks
    setSelectedOption(optionId);
    setIsFlipped(true);
    // Switch contents midway through the 3D flip rotation (600ms total)
    setTimeout(() => {
      setIsShowingBack(true);
    }, 220);
  };

  const handleReveal = () => {
    if (selectedOption) return;
    setSelectedOption('skipped');
    setIsFlipped(true);
    setTimeout(() => {
      setIsShowingBack(true);
    }, 220);
  };

  const isCorrect = selectedOption === card.correct_answer;

  // renderWithMath and renderOptionText are now from '../utils/mathRenderer'
  const renderOptionText = (text) => renderWithMath(text);

  const handleEvaluation = (quality) => {
    const finalQuality = isCorrect && selectedOption !== 'skipped' ? quality : 0;
    const swipeDir = finalQuality === 0 ? 'swipe-left' : 'swipe-right';
    
    setSwipeClass(swipeDir);
    
    // Call the callback after swipe animation completes
    setTimeout(() => {
      onNext(card.id, finalQuality);
    }, 350);
  };

  // ── Drag Gestures handlers ──
  const handleMouseDown = (e) => {
    if (!isShowingBack) return; // Only allow drag-to-rate on the back/review side
    if (e.target.closest('button') || e.target.closest('a') || e.target.closest('img')) return;
    setIsDragging(true);
    dragStart.current = e.clientX;
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const diffX = e.clientX - dragStart.current;
    setDragX(diffX);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);

    if (dragX > 140) {
      handleEvaluation(5); // Swipe right -> Easy / Correct
    } else if (dragX < -140) {
      handleEvaluation(0); // Swipe left -> Hard / Wrong
    } else {
      setDragX(0); // Spring back
    }
  };

  const handleTouchStart = (e) => {
    if (!isShowingBack) return;
    if (e.target.closest('button') || e.target.closest('a') || e.target.closest('img')) return;
    setIsDragging(true);
    dragStart.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const diffX = e.touches[0].clientX - dragStart.current;
    setDragX(diffX);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    if (dragX > 140) {
      handleEvaluation(5);
    } else if (dragX < -140) {
      handleEvaluation(0);
    } else {
      setDragX(0);
    }
  };

  const cardStyle = {
    transform: isDragging 
      ? `translateX(${dragX}px) rotate(${dragX * 0.04}deg) ${isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'}`
      : `translateX(0px) rotate(0deg) ${isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'}`,
    transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s ease',
    cursor: isShowingBack ? (isDragging ? 'grabbing' : 'grab') : 'default'
  };

  return (
    <div 
      className="flashcard-wrapper flashcard-enter"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div 
        className={`flashcard-3d ${card.context ? 'has-context' : ''} ${isFlipped ? 'is-flipped' : ''} ${swipeClass}`}
        style={cardStyle}
      >
        {/* Swipe Rating Overlay Indicators */}
        {isShowingBack && dragX !== 0 && (
          <div style={{
            position: 'absolute',
            top: '2rem',
            left: dragX < 0 ? '2rem' : 'auto',
            right: dragX > 0 ? '2rem' : 'auto',
            zIndex: 100,
            background: dragX > 0 ? 'rgba(16, 185, 129, 0.95)' : 'rgba(239, 68, 68, 0.95)',
            color: '#fff',
            padding: '0.6rem 1.4rem',
            borderRadius: '2rem',
            fontWeight: 900,
            fontSize: '0.95rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            transform: dragX > 0 ? 'rotate(-8deg) rotateY(180deg)' : 'rotate(8deg) rotateY(180deg)', // Cancel out the mirrored card rotation
            opacity: Math.min(Math.abs(dragX) / 120, 1),
            pointerEvents: 'none',
            boxShadow: dragX > 0 ? 'var(--shadow-glow-emerald)' : '0 4px 15px rgba(239,68,68,0.4)',
            border: '2px solid #fff',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}>
            {dragX > 0 ? (
              <>
                <Smile size={18} />
                <span>Facile ✓</span>
              </>
            ) : (
              <>
                <Frown size={18} />
                <span>À Revoir ✗</span>
              </>
            )}
          </div>
        )}

        {/* FRONT SIDE */}
        {!isShowingBack ? (
          <div className="glass-card" style={{ 
            padding: 0, 
            display: 'flex', 
            flexDirection: card.context ? 'row' : 'column',
            overflow: 'hidden',
            minHeight: card.context ? '450px' : 'auto',
            alignItems: 'stretch'
          }}>
            {/* Left Context Pane (only if context exists) */}
            {card.context && (
              <div style={{ 
                flex: '0 0 45%', 
                background: 'linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)', 
                borderRight: '1px solid var(--border)',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center'
              }}>
                <div style={{ 
                  alignSelf: 'flex-start',
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem', 
                  marginBottom: '2rem', 
                  color: 'var(--emerald)', 
                  fontWeight: 900, 
                  textTransform: 'uppercase', 
                  fontSize: '0.7rem', 
                  letterSpacing: '0.15em',
                  background: 'rgba(16, 185, 129, 0.1)',
                  padding: '0.4rem 0.8rem',
                  borderRadius: '2rem'
                }}>
                  <Lightbulb size={14} />
                  Données / السياق
                </div>
                
                <div style={{ 
                  fontSize: '1.35rem', 
                  lineHeight: '1.8', 
                  color: 'var(--text-main)', 
                  width: '100%',
                  fontWeight: 500,
                  textShadow: '0 2px 10px rgba(0,0,0,0.2)'
                }}>
                  {renderWithMath(card.context)}
                </div>
              </div>
            )}

            {/* Right Pane (Question & Options) */}
            <div style={{ 
              flex: '1', 
              padding: '1.5rem', 
              display: 'flex', 
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div className="topic-badge" style={{ margin: 0, padding: '0.35rem 0.75rem', fontSize: '0.7rem', background: 'var(--violet-soft)', color: 'var(--violet)', fontWeight: 800 }}>
                  <BrainCircuit size={14} style={{ marginRight: '0.5rem' }} />
                  {card.topic || 'Analyse'}
                </div>
              </div>
              
              <div className="question-box" style={{ fontSize: '1.25rem', marginBottom: '1.25rem', border: 'none', padding: 0, background: 'transparent', lineHeight: '1.7', fontWeight: 400 }}>
                 {renderWithMath(card.question)}
              </div>

              <div className="options-grid" style={{ gap: '0.4rem', marginBottom: '1.25rem' }}>
                 {card.options.map((opt) => (
                   <button 
                     key={opt.id}
                     className="option-btn"
                     onClick={() => handleOptionClick(opt.id)}
                   >
                     <div className="option-letter">
                       {opt.id}
                     </div>
                     <div style={{ flex: 1 }}>
                       {renderOptionText(opt.text)}
                     </div>
                   </button>
                 ))}
              </div>

              <button 
                className="btn-outline" 
                onClick={handleReveal}
                style={{
                  width: '100%',
                  padding: '0.6rem 1rem',
                  borderRadius: '10px',
                  borderColor: 'var(--violet)',
                  color: 'var(--violet)',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  justifyContent: 'center',
                  marginTop: 'auto'
                }}
              >
                <Lightbulb size={15} />
                Révéler la réponse (Je ne sais pas)
              </button>
            </div>
          </div>
        ) : (
          /* BACK SIDE (Mirrored Y-axis rotation canceled out) */
          <div className="glass-card" style={{ 
            padding: 0, 
            display: 'flex', 
            flexDirection: card.context ? 'row' : 'column',
            overflow: 'hidden',
            minHeight: card.context ? '450px' : 'auto',
            alignItems: 'stretch',
            transform: 'rotateY(180deg)'
          }}>
            {/* Left Context Pane (Persisted for continuity) */}
            {card.context && (
              <div style={{ 
                flex: '0 0 45%', 
                background: 'linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)', 
                borderRight: '1px solid var(--border)',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center'
              }}>
                <div style={{ 
                  alignSelf: 'flex-start',
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem', 
                  marginBottom: '2rem', 
                  color: 'var(--emerald)', 
                  fontWeight: 900, 
                  textTransform: 'uppercase', 
                  fontSize: '0.7rem', 
                  letterSpacing: '0.15em',
                  background: 'rgba(16, 185, 129, 0.1)',
                  padding: '0.4rem 0.8rem',
                  borderRadius: '2rem'
                }}>
                  <Lightbulb size={14} />
                  Données / السياق
                </div>
                
                <div style={{ 
                  fontSize: '1.35rem', 
                  lineHeight: '1.8', 
                  color: 'var(--text-main)', 
                  width: '100%',
                  fontWeight: 500
                }}>
                  {renderWithMath(card.context)}
                </div>
              </div>
            )}

            {/* Right Pane (Evaluation & Explanation) */}
            <div style={{ 
              flex: '1', 
              padding: '1.5rem', 
              display: 'flex', 
              flexDirection: 'column',
              justifyContent: 'center',
              overflowY: 'auto'
            }}>
              {/* Correctness validation banner */}
              <div style={{ 
                marginBottom: '1rem',
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                fontSize: '0.9rem',
                fontWeight: 700,
                background: selectedOption === card.correct_answer 
                  ? 'rgba(16, 185, 129, 0.08)' 
                  : selectedOption === 'skipped'
                    ? 'rgba(124, 58, 237, 0.08)'
                    : 'rgba(239, 68, 68, 0.08)',
                border: '1px solid',
                borderColor: selectedOption === card.correct_answer 
                  ? 'var(--emerald)' 
                  : selectedOption === 'skipped'
                    ? 'var(--violet)'
                    : 'var(--danger)',
                color: selectedOption === card.correct_answer 
                  ? 'var(--emerald)' 
                  : selectedOption === 'skipped'
                    ? 'var(--violet)'
                    : 'var(--danger)',
                boxShadow: selectedOption === card.correct_answer 
                  ? 'var(--shadow-glow-emerald)' 
                  : 'none'
              }}>
                {selectedOption === card.correct_answer ? (
                  <>
                    <CheckCircle2 size={18} />
                    <span>Bravo ! C'est la bonne réponse ✨</span>
                  </>
                ) : selectedOption === 'skipped' ? (
                  <>
                    <Lightbulb size={18} />
                    <span>Réponse révélée (Réponse attendue : {card.correct_answer})</span>
                  </>
                ) : (
                  <>
                    <XCircle size={18} />
                    <span>Incorrect ! Réponse attendue : {card.correct_answer}</span>
                  </>
                )}
              </div>

              {/* Minimal question reference */}
              <div style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginBottom: '0.8rem', fontWeight: 500, lineHeight: 1.5 }}>
                {renderWithMath(card.question)}
              </div>

              {/* Disabled options list showing correct vs chosen answer */}
              <div className="options-grid" style={{ gap: '0.35rem', marginBottom: '0.8rem' }}>
                 {card.options.map((opt) => {
                   let btnClass = "option-btn";
                   if (opt.id === card.correct_answer) btnClass += " correct";
                   else if (opt.id === selectedOption) btnClass += " wrong";

                   return (
                     <button 
                       key={opt.id}
                       className={btnClass}
                       disabled
                     >
                       <div className="option-letter">
                         {opt.id}
                       </div>
                       <div style={{ flex: 1 }}>
                         {renderOptionText(opt.text)}
                       </div>
                       {opt.id === card.correct_answer && <CheckCircle2 size={16} color="#10b981" />}
                       {selectedOption === opt.id && opt.id !== card.correct_answer && <XCircle size={16} color="#f87171" />}
                     </button>
                   );
                 })}
              </div>

              {/* Astuce panel */}
              <div className="astuce-match-box" style={{ marginBottom: '1.25rem', marginTop: 0 }}>
                <div className="astuce-match-header">
                  <div className="astuce-match-title">
                    <div className="astuce-zap-icon">
                      <Zap size={14} fill="currentColor" />
                    </div>
                    <span>L'Astuce du Match</span>
                    <span style={{ opacity: 0.7 }}>⚡</span>
                  </div>

                  <div className="astuce-tabs">
                    <button
                      className={`astuce-tab ${astuceTab === 'rule' ? 'active' : ''}`}
                      onClick={() => setAstuceTab('rule')}
                    >
                      <BrainCircuit size={11} />
                      <span>Règle</span>
                    </button>
                    <button
                      className={`astuce-tab ${astuceTab === 'trick' ? 'active' : ''} ${!card.trick ? 'disabled' : ''}`}
                      onClick={() => card.trick && setAstuceTab('trick')}
                      title={!card.trick ? 'Bientôt disponible' : 'Astuce du temps'}
                    >
                      <Clock size={11} />
                      <span>Astuce</span>
                    </button>
                  </div>
                </div>

                <div className="astuce-match-content" key={astuceTab}>
                  {astuceTab === 'rule' ? (
                    <p style={{ margin: 0, lineHeight: '1.65', color: 'var(--text-main)', fontSize: '0.88rem' }}>
                      {renderWithMath(card.astuce)}
                    </p>
                  ) : (
                    <p style={{ margin: 0, lineHeight: '1.65', color: 'var(--text-main)', fontSize: '0.88rem', opacity: 0.6, fontStyle: 'italic' }}>
                      {card.trick ? renderWithMath(card.trick) : 'Astuce du temps — bientôt disponible ✨'}
                    </p>
                  )}
                </div>
              </div>

              {/* SRS Rating Actions (or drag instruction) */}
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                {selectedOption === 'skipped' || selectedOption !== card.correct_answer ? (
                  <button className="btn" style={{ width: '100%', padding: '0.75rem', fontSize: '0.9rem' }} onClick={() => handleEvaluation(0)}>
                    J'ai compris ✓
                  </button>
                ) : (
                  <>
                    <button className="eval-btn eval-hard" onClick={() => handleEvaluation(3)} style={{ flex: 1, padding: '0.6rem', fontSize: '0.85rem' }}>
                      <Frown size={16} /> <span>Dur</span>
                    </button>
                    <button className="eval-btn eval-medium" onClick={() => handleEvaluation(4)} style={{ flex: 1, padding: '0.6rem', fontSize: '0.85rem' }}>
                      <Meh size={16} /> <span>Moyen</span>
                    </button>
                    <button className="eval-btn eval-easy" onClick={() => handleEvaluation(5)} style={{ flex: 1, padding: '0.6rem', fontSize: '0.85rem' }}>
                      <Smile size={16} /> <span>Facile</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
