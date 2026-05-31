const fs = require('fs');
const path = require('path');

const cssFile = path.join(__dirname, 'src/index.css');
const mobileCSS = `

/* ══════════════════════════════════════════════════════════════════════════
   📱  MOBILE NATIVE APP EXPERIENCE — L'Conq 2026
══════════════════════════════════════════════════════════════════════════ */

/* ── Mobile Hero Card ─────────────────────────────────────────────────── */
.mobile-hero-card {
  background: linear-gradient(135deg, var(--violet) 0%, #4f46e5 50%, #312e81 100%);
  border-radius: 28px;
  padding: 1.5rem;
  position: relative;
  overflow: hidden;
  box-shadow: 0 20px 50px rgba(113, 109, 242, 0.35);
  margin-bottom: 1.25rem;
}
.mobile-hero-card::before {
  content: '';
  position: absolute;
  top: -40px; right: -40px;
  width: 160px; height: 160px;
  background: rgba(255,255,255,0.07);
  border-radius: 50%;
}
.mobile-hero-card::after {
  content: '';
  position: absolute;
  bottom: -30px; left: -20px;
  width: 120px; height: 120px;
  background: rgba(255,255,255,0.04);
  border-radius: 50%;
}

/* ── Quick Actions ────────────────────────────────────────────────────── */
.mobile-quick-actions {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.65rem;
  margin-bottom: 1.25rem;
}
.mobile-qa-btn {
  display: flex; flex-direction: column; align-items: center;
  gap: 0.35rem; padding: 0.875rem 0.4rem;
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: 18px; cursor: pointer; font-family: inherit;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  -webkit-tap-highlight-color: transparent;
}
.mobile-qa-btn:active { transform: scale(0.93); background: var(--bg-hover); }
.mobile-qa-icon {
  width: 44px; height: 44px; border-radius: 13px;
  display: flex; align-items: center; justify-content: center;
}
.mobile-qa-label {
  font-size: 0.6rem; font-weight: 700; color: var(--text-muted);
  text-align: center; line-height: 1.25;
}

/* ── Section Header ───────────────────────────────────────────────────── */
.mobile-section-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 0.75rem;
}
.mobile-section-title { font-size: 1rem; font-weight: 800; color: var(--text-main); letter-spacing: -0.01em; }
.mobile-section-link {
  font-size: 0.78rem; font-weight: 700; color: var(--violet);
  background: none; border: none; cursor: pointer; font-family: inherit; padding: 0;
}

/* ── Horizontal Scroll Row ────────────────────────────────────────────── */
.mobile-scroll-row {
  display: flex; gap: 0.75rem;
  overflow-x: auto; padding-bottom: 0.5rem;
  -webkit-overflow-scrolling: touch; scrollbar-width: none;
  margin: 0 -1rem; padding-left: 1rem; padding-right: 1rem;
}
.mobile-scroll-row::-webkit-scrollbar { display: none; }

/* ── Exam Mini Card ───────────────────────────────────────────────────── */
.mobile-exam-mini-card {
  flex-shrink: 0; width: 172px;
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: 20px; padding: 1rem; cursor: pointer;
  transition: all 0.2s ease; -webkit-tap-highlight-color: transparent;
}
.mobile-exam-mini-card:active { transform: scale(0.96); background: var(--bg-hover); }

/* ── Stats 2-col ─────────────────────────────────────────────────────── */
.mobile-stats-row {
  display: grid; grid-template-columns: repeat(2, 1fr);
  gap: 0.65rem; margin-bottom: 1.25rem;
}
.mobile-stat-item {
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: 18px; padding: 1rem;
  display: flex; flex-direction: column; gap: 0.4rem;
}
.mobile-stat-value { font-size: 1.75rem; font-weight: 900; line-height: 1; color: var(--text-main); }
.mobile-stat-label { font-size: 0.68rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; }

/* ── School Card ─────────────────────────────────────────────────────── */
.mobile-school-card {
  display: flex; align-items: center; gap: 1rem;
  padding: 1.1rem 1.25rem;
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: 20px; cursor: pointer;
  transition: all 0.18s ease; -webkit-tap-highlight-color: transparent;
  margin-bottom: 0.65rem;
}
.mobile-school-card:active { transform: scale(0.98); background: var(--bg-hover); }
.mobile-school-icon {
  width: 50px; height: 50px; border-radius: 15px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}

/* ── Rank Row ────────────────────────────────────────────────────────── */
.mobile-rank-row {
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.875rem 1rem; border-radius: 16px;
  transition: background 0.15s; -webkit-tap-highlight-color: transparent;
  margin-bottom: 0.35rem;
}
.mobile-rank-row.is-me {
  background: linear-gradient(90deg, rgba(113,109,242,0.12) 0%, rgba(113,109,242,0.04) 100%);
  border: 1.5px solid rgba(113,109,242,0.25);
}

/* ── Plan Card ───────────────────────────────────────────────────────── */
.mobile-plan-card {
  background: var(--bg-card); border: 2px solid var(--border);
  border-radius: 24px; padding: 1.5rem; margin-bottom: 0.75rem;
  transition: all 0.2s ease; -webkit-tap-highlight-color: transparent;
  position: relative; overflow: hidden;
}
.mobile-plan-card.is-popular {
  border-color: var(--violet);
  background: linear-gradient(135deg, rgba(113,109,242,0.08) 0%, var(--bg-card) 100%);
  box-shadow: 0 8px 30px rgba(113,109,242,0.2);
}

/* ── Page titles ─────────────────────────────────────────────────────── */
.mob-page-greeting { font-size: 0.78rem; font-weight: 600; color: var(--text-muted); margin: 0 0 0.15rem; }
.mob-page-title { font-size: 1.55rem; font-weight: 900; letter-spacing: -0.025em; color: var(--text-main); line-height: 1.2; margin: 0; }

/* ── Badge on bottom nav ─────────────────────────────────────────────── */
.mob-nav-badge {
  position: absolute; top: 3px; right: 4px;
  min-width: 16px; height: 16px; border-radius: 99px;
  background: var(--danger); color: #fff;
  font-size: 0.58rem; font-weight: 900;
  display: flex; align-items: center; justify-content: center;
  padding: 0 3px; border: 1.5px solid var(--bg-base); line-height: 1;
  pointer-events: none;
}

/* ── Pill filters ────────────────────────────────────────────────────── */
.mob-filter-row {
  display: flex; gap: 0.5rem;
  overflow-x: auto; scrollbar-width: none;
  padding-bottom: 0.25rem; -webkit-overflow-scrolling: touch;
  margin-bottom: 1rem;
}
.mob-filter-row::-webkit-scrollbar { display: none; }
.mob-filter-pill {
  flex-shrink: 0; padding: 0.42rem 1rem; border-radius: 99px;
  font-size: 0.78rem; font-weight: 700;
  border: 1.5px solid var(--border); background: transparent;
  color: var(--text-muted); cursor: pointer; font-family: inherit;
  transition: all 0.18s; -webkit-tap-highlight-color: transparent;
  white-space: nowrap;
}
.mob-filter-pill.active {
  background: var(--violet); border-color: var(--violet); color: #fff;
  box-shadow: 0 4px 12px rgba(113,109,242,0.35);
}

/* ── Sticky CTA ──────────────────────────────────────────────────────── */
.mob-sticky-cta {
  position: sticky;
  bottom: calc(72px + env(safe-area-inset-bottom));
  z-index: 50; padding: 0.75rem 0;
  background: linear-gradient(to top, var(--bg-base) 60%, transparent 100%);
}

/* ── mob/desk show-hide ──────────────────────────────────────────────── */
.mob-only  { display: none;  }
.desk-only { display: block; }

@media (max-width: 768px) {
  .mob-only      { display: block; }
  .mob-only-flex { display: flex;  }
  .desk-only     { display: none;  }
  .glass-panel:hover { transform: none !important; box-shadow: var(--shadow-card) !important; }
}

/* ── input-control (shared) ──────────────────────────────────────────── */
.input-control {
  background: var(--bg-glass); border: 1px solid var(--border);
  border-radius: var(--radius-md); color: var(--text-main);
  font-family: inherit; font-size: 0.9rem;
  padding: 0.65rem 0.875rem; transition: border-color 0.2s;
  outline: none; width: 100%; box-sizing: border-box;
}
.input-control:focus { border-color: var(--violet); box-shadow: 0 0 0 3px var(--violet-glow); }
`;

fs.appendFileSync(cssFile, mobileCSS, 'utf8');
console.log('Mobile CSS appended successfully!');
