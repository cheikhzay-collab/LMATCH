/**
 * MobileFlashcard.jsx — L'CONQ
 * 
 * Redesigned from scratch for mobile.
 * Design principles:
 *   1. Single focused column, no side-by-side
 *   2. Context is collapsible (doesn't compete with the question)
 *   3. Phase-based UX: Question → Review
 *   4. Math equations scroll horizontally, text wraps
 *   5. Sticky action zone at the bottom
 *   6. Swipe to rate (left=hard, right=easy)
 */

import React, { useState, useRef } from 'react';
import { renderWithMath } from '../utils/mathRenderer';
import {
  ChevronDown, ChevronUp,
  CheckCircle2, XCircle,
  Frown, Meh, Smile,
  BrainCircuit, Zap, Clock, Lightbulb,
} from 'lucide-react';

const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E'];

export default function MobileFlashcard({ card, onNext }) {
  /* ── State ── */
  const [selected,     setSelected]     = useState(null);   // option id chosen
  const [revealed,     setRevealed]     = useState(false);  // back side visible
  const [ctxOpen,      setCtxOpen]      = useState(false);  // context panel
  const [astuceTab,    setAstuceTab]    = useState('rule'); // 'rule' | 'trick'
  const [exitDir,      setExitDir]      = useState('');     // '' | 'left' | 'right'
  const [isFlipped,    setIsFlipped]    = useState(false);  // 3D flip rotation active

  // ── Card display settings ──
  const cardRevealMode  = localStorage.getItem('card_reveal_mode')    || 'flip';
  const cardFlipEnabled = localStorage.getItem('card_flip_animation') !== 'false';
  const cardSwipeEnabled = localStorage.getItem('card_swipe_gesture')  !== 'false';
  const cardFontFamily = localStorage.getItem('card_font_family') || 'Computer Modern Serif';
  const cardFontSize = localStorage.getItem('card_font_size') || '1rem';
  const cardQuestionWeight = localStorage.getItem('card_question_weight') || '400';
  const cardAstuceWeight = localStorage.getItem('card_astuce_weight') || '400';
  const cardOptionsWeight = localStorage.getItem('card_options_weight') || '500';

  const isFlipMode = cardRevealMode === 'flip' && cardFlipEnabled;
  const isInstantMode = cardRevealMode === 'instant';
  const swipeActive = cardSwipeEnabled && !isInstantMode;

  // Reset scroll container to top when card mounts (next card) or when tab changes
  React.useEffect(() => {
    const scrollContainer = document.querySelector('.study-scroll-container');
    if (scrollContainer) {
      scrollContainer.scrollTop = 0;
    }
  }, [astuceTab]);

  /* ── Derived ── */
  const isCorrect = selected && card.correct_answer
    && selected.toLowerCase() === card.correct_answer.toLowerCase();

  /* ── Swipe gesture ── */
  const touchStart = useRef({ x: 0, y: 0 });
  const axis       = useRef(null); // null | 'h' | 'v'
  const [swipeDX,  setSwipeDX]    = useState(0);
  const [swiping,  setSwiping]    = useState(false);

  const onTouchStart = (e) => {
    if (!revealed || !swipeActive) return;
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    axis.current = null;
    setSwiping(true);
  };

  const onTouchMove = (e) => {
    if (!swiping || !revealed || !swipeActive) return;
    const dx = e.touches[0].clientX - touchStart.current.x;
    const dy = e.touches[0].clientY - touchStart.current.y;
    if (axis.current === null) {
      axis.current = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v';
    }
    if (axis.current === 'h') {
      e.preventDefault();
      setSwipeDX(dx);
    }
  };

  const onTouchEnd = () => {
    if (!swiping || !swipeActive) return;
    setSwiping(false);
    if (axis.current === 'h') {
      if (swipeDX > 110) {
        triggerExit('right');
      } else if (swipeDX < -110) {
        triggerExit('left');
      } else {
        setSwipeDX(0);
      }
    } else {
      setSwipeDX(0);
    }
    axis.current = null;
  };

  /* ── Actions ── */
  const choose = (optId) => {
    if (selected) return;
    setSelected(optId);
    if (isFlipMode) {
      setIsFlipped(true);
      setTimeout(() => setRevealed(true), 220);
    } else {
      setRevealed(true);
    }
  };

  const reveal = () => {
    if (selected) return;
    setSelected('skipped');
    if (isFlipMode) {
      setIsFlipped(true);
      setTimeout(() => setRevealed(true), 220);
    } else {
      setRevealed(true);
    }
  };

  const triggerExit = (dir) => {
    const quality = dir === 'right' ? (isCorrect ? 5 : 0) : 0;
    setExitDir(dir);
    setTimeout(() => onNext(card.id, quality), 320);
  };

  const rate = (quality) => {
    const finalQ = isCorrect ? quality : 0;
    triggerExit(finalQ >= 4 ? 'right' : 'left');
  };

  /* ── Swipe overlay opacity ── */
  const swipeOpacity = Math.min(Math.abs(swipeDX) / 100, 1);
  const swipeRight   = swipeDX > 20;
  const swipeLeft    = swipeDX < -20;

  /* ── Card exit / flip style ── */
  const cardStyle = {
    transform: exitDir === 'right'
      ? `translateX(110vw) rotate(12deg) ${isFlipMode && isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'}`
      : exitDir === 'left'
        ? `translateX(-110vw) rotate(-12deg) ${isFlipMode && isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'}`
        : swiping
          ? `translateX(${swipeDX}px) rotate(${swipeDX * 0.03}deg) ${isFlipMode && isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'}`
          : `translateX(0px) rotate(0deg) ${isFlipMode && isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'}`,
    transition: (swiping && axis.current === 'h') ? 'none'
      : exitDir ? 'transform 0.32s cubic-bezier(0.4, 0, 0.6, 1), opacity 0.32s'
        : 'transform 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.35s ease',
    opacity: exitDir ? 0 : 1,
    transformStyle: isFlipMode ? 'preserve-3d' : 'flat',
    perspective: isFlipMode ? '1200px' : 'none',
    '--card-font-family': cardFontFamily === 'Inter' ? "'Inter', sans-serif" : cardFontFamily === 'STIX Two Text' ? "'STIX Two Text', serif" : cardFontFamily === 'Times New Roman' ? "'Times New Roman', serif" : "'Computer Modern Serif', Georgia, serif",
    '--card-font-size': cardFontSize,
    '--card-question-weight': cardQuestionWeight,
    '--card-astuce-weight': cardAstuceWeight,
    '--card-options-weight': cardOptionsWeight,
  };

  return (
    <div
      className="mfc-root"
      style={cardStyle}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* ── Swipe indicators ── */}
      {revealed && (
        <>
          {swipeRight && (
            <div className="mfc-swipe-indicator mfc-swipe-right" style={{ opacity: swipeOpacity }}>
              <Smile size={20} /> Facile
            </div>
          )}
          {swipeLeft && (
            <div className="mfc-swipe-indicator mfc-swipe-left" style={{ opacity: swipeOpacity }}>
              <Frown size={20} /> À revoir
            </div>
          )}
        </>
      )}

      {/* ══ PHASE 1: QUESTION ══════════════════════════════════════════ */}
      {!revealed ? (
        <div className="mfc-phase mfc-phase-question">

          {/* Topic badge */}
          <div className="mfc-topic">
            <BrainCircuit size={13} />
            {card.topic || 'Question'}
          </div>

          {/* Scrollable Content */}
          <div className="mfc-scrollable-content">
            {/* Context — collapsible */}
            {card.context && (
              <div className="mfc-context-wrap">
                <button
                  className={`mfc-context-toggle ${ctxOpen ? 'open' : ''}`}
                  onClick={() => setCtxOpen(v => !v)}
                >
                  <Lightbulb size={14} />
                  <span>Données</span>
                  {ctxOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                {ctxOpen && (
                  <div className="mfc-context-body">
                    {renderWithMath(card.context)}
                  </div>
                )}
              </div>
            )}

            {/* Question */}
            <div className="mfc-question">
              {renderWithMath(card.question)}
            </div>

            {/* Options */}
            <div className="mfc-options">
              {card.options.map((opt) => (
                <button
                  key={opt.id}
                  className="mfc-opt"
                  onClick={() => choose(opt.id)}
                >
                  <span className="mfc-opt-letter">{opt.id}</span>
                  <span className="mfc-opt-text">{renderWithMath(opt.text)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Reveal */}
          <button className="mfc-reveal-btn" onClick={reveal}>
            <Lightbulb size={15} />
            Je ne sais pas — Révéler
          </button>
        </div>

      ) : (
      /* ══ PHASE 2: REVIEW ═══════════════════════════════════════════ */
        <div 
          className="mfc-phase mfc-phase-review"
          style={{
            transform: isFlipMode ? 'rotateY(180deg)' : 'none',
            animation: cardRevealMode === 'fade' ? 'mfc-fade-in 0.35s ease forwards' : 'none'
          }}
        >

          {/* Result banner */}
          <div className={`mfc-result-banner ${isCorrect ? 'correct' : selected === 'skipped' ? 'skipped' : 'wrong'}`}>
            {isCorrect ? (
              <><CheckCircle2 size={18} /><span>Bonne réponse ✨</span></>
            ) : selected === 'skipped' ? (
              <><Lightbulb size={18} /><span>Réponse : <strong>{card.correct_answer}</strong></span></>
            ) : (
              <><XCircle size={18} /><span>Incorrect — Réponse : <strong>{card.correct_answer}</strong></span></>
            )}
          </div>

          {/* Scrollable Content */}
          <div className="mfc-scrollable-content">
            {/* Question compact */}
            <div className="mfc-question-ref">
              {renderWithMath(card.question)}
            </div>

            {/* Options with highlights */}
            <div className="mfc-options mfc-options-review">
              {card.options.map((opt) => {
                const isOptCorrect = opt.id?.toLowerCase() === card.correct_answer?.toLowerCase();
                const isOptSelected = opt.id?.toLowerCase() === selected?.toLowerCase();
                let cls = 'mfc-opt';
                if (isOptCorrect) cls += ' correct';
                else if (isOptSelected && !isOptCorrect) cls += ' wrong';
                return (
                  <div key={opt.id} className={cls}>
                    <span className="mfc-opt-letter">{opt.id}</span>
                    <span className="mfc-opt-text">{renderWithMath(opt.text)}</span>
                    {isOptCorrect && <CheckCircle2 size={16} className="mfc-opt-icon" />}
                    {isOptSelected && !isOptCorrect && <XCircle size={16} className="mfc-opt-icon" />}
                  </div>
                );
              })}
            </div>

            {/* ⚡ Astuce panel */}
            <div className="mfc-astuce">
              <div className="mfc-astuce-head">
                <div className="mfc-astuce-title">
                  <div className="mfc-astuce-icon"><Zap size={13} fill="currentColor" /></div>
                  L'Astuce
                  <span className="mfc-astuce-zap">⚡</span>
                </div>
                <div className="mfc-astuce-tabs">
                  <button
                    className={`mfc-atab ${astuceTab === 'rule' ? 'active' : ''}`}
                    onClick={() => setAstuceTab('rule')}
                  >
                    <BrainCircuit size={11} /> Règle
                  </button>
                  <button
                    className={`mfc-atab ${astuceTab === 'trick' ? 'active' : ''} ${!card.trick ? 'disabled' : ''}`}
                    onClick={() => card.trick && setAstuceTab('trick')}
                  >
                    <Clock size={11} /> Astuce
                  </button>
                </div>
              </div>
              <div className="mfc-astuce-body" key={astuceTab}>
                {astuceTab === 'rule'
                  ? (card.astuce ? renderWithMath(card.astuce) : <em style={{ opacity: 0.5 }}>Aucune explication disponible.</em>)
                  : (card.trick ? renderWithMath(card.trick) : <em style={{ opacity: 0.5 }}>Bientôt disponible ✨</em>)
                }
              </div>
            </div>
          </div>

          {/* ── Rating actions ── */}
          <div className="mfc-actions">
            {(selected === 'skipped' || !isCorrect) ? (
              <button className="mfc-action-primary" onClick={() => rate(0)}>
                J'ai compris ✓
              </button>
            ) : (
              <div className="mfc-rating-row">
                <button className="mfc-rate-btn hard" onClick={() => rate(3)}>
                  <Frown size={18} />
                  <span>Dur</span>
                </button>
                <button className="mfc-rate-btn medium" onClick={() => rate(4)}>
                  <Meh size={18} />
                  <span>Moyen</span>
                </button>
                <button className="mfc-rate-btn easy" onClick={() => rate(5)}>
                  <Smile size={18} />
                  <span>Facile</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
