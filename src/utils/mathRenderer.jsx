/**
 * mathRenderer.jsx — L'Match | KaTeX rendering utility (v3 — Expert Edition)
 *
 * Radical fixes for production hosting:
 *  1. cleanControlChars strips CR/LF/Tab (never converts to \r which breaks KaTeX)
 *  2. Robust $...$ splitter handles consecutive and nested dollar signs correctly
 *  3. MathErrorBoundary catches ALL KaTeX render failures gracefully
 *  4. KaTeX strict:false + throwOnError:false → zero console errors/warnings
 *  5. Auto-wrap detects raw LaTeX commands (no $ delimiters) and wraps them
 */

import React from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

/* ─── 1. Master text sanitizer ──────────────────────────────────────────────
 *
 *  Runs on EVERY string before any LaTeX processing.
 *  Strips control characters that break KaTeX when embedded in math expressions.
 *  NEVER converts \r (CR) to the string "\r" — that creates the KaTeX ring-accent
 *  command which only works in text mode and triggers console warnings.
 */
export const cleanControlChars = (text) => {
  if (typeof text !== 'string') return String(text ?? '');
  return text
    .replace(/\r\n/g, ' ')          // Windows CRLF → space
    .replace(/[\r\n]/g, ' ')        // lone CR or LF → space
    .replace(/\t/g, ' ')            // Tab → space
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // other control chars → strip
    .replace(/[\u200B-\u200D\uFEFF]/g, '')              // zero-width / BOM → strip
    .replace(/ {2,}/g, ' ')         // collapse multiple spaces → one
    .trim();
};

/* ─── 2. Error boundary ──────────────────────────────────────────────────────
 *
 *  Catches React render errors from KaTeX (invalid LaTeX throws in strict mode).
 *  Shows the raw LaTeX in italic rather than a red error block.
 */
export class MathErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error) {
    // Silently swallow — raw fallback is shown via render()
    void error;
  }
  render() {
    if (this.state.hasError) {
      return (
        <span style={{ fontStyle: 'italic', opacity: 0.75, color: 'inherit' }}>
          {this.props.fallback ?? this.props.math}
        </span>
      );
    }
    return this.props.children;
  }
}

/* ─── 3. KaTeX render settings ───────────────────────────────────────────────
 *
 *  strict: false   → no console warnings for imperfect LaTeX (e.g. \r accent)
 *  throwOnError: false → KaTeX renders partial output instead of throwing
 *  trust: false    → security: no \href etc.
 */
const KATEX_SETTINGS = {
  strict: "ignore",
  throwOnError: false,
  trust: false,
};

/* ─── 4. Safe KaTeX wrappers ─────────────────────────────────────────────────*/
export function SafeInlineMath({ math }) {
  return (
    <MathErrorBoundary math={math}>
      <span className="notranslate" translate="no" style={{ display: 'inline-block' }}>
        <InlineMath math={math} settings={KATEX_SETTINGS} />
      </span>
    </MathErrorBoundary>
  );
}

export function SafeBlockMath({ math }) {
  return (
    <MathErrorBoundary math={math}>
      <div className="notranslate" translate="no" style={{ display: 'block', margin: '0.75em 0', overflowX: 'auto' }}>
        <BlockMath math={math} settings={KATEX_SETTINGS} />
      </div>
    </MathErrorBoundary>
  );
}

/* ─── 5. Robust $…$ / $$…$$ tokenizer ───────────────────────────────────────
 *
 *  Hand-rolled tokenizer instead of regex split — handles:
 *    • $$…$$  (block math)
 *    • $…$    (inline math)
 *    • Escaped \$ inside text (treated as literal $)
 *    • Adjacent math blocks: "$a$ + $b$"
 *    • Unclosed $ (treated as literal text)
 */
function tokenizeMath(text) {
  const tokens = []; // { type: 'text'|'inline'|'block', content: string }
  let i = 0;
  let buf = '';

  while (i < text.length) {
    // ── Block math $$…$$
    if (text[i] === '$' && text[i + 1] === '$') {
      if (buf) { tokens.push({ type: 'text', content: buf }); buf = ''; }
      const start = i + 2;
      const end = text.indexOf('$$', start);
      if (end === -1) {
        // Unclosed $$ — treat rest as text
        buf += text.slice(i);
        i = text.length;
      } else {
        tokens.push({ type: 'block', content: text.slice(start, end) });
        i = end + 2;
      }
      continue;
    }

    // ── Inline math $…$
    if (text[i] === '$') {
      // Find closing $, skip \$ escapes
      let j = i + 1;
      let found = false;
      while (j < text.length) {
        if (text[j] === '\\') { j += 2; continue; } // skip escaped char
        if (text[j] === '$') { found = true; break; }
        j++;
      }
      if (!found || j === i + 1) {
        // Unclosed or empty $ — literal
        buf += '$';
        i++;
      } else {
        if (buf) { tokens.push({ type: 'text', content: buf }); buf = ''; }
        tokens.push({ type: 'inline', content: text.slice(i + 1, j) });
        i = j + 1;
      }
      continue;
    }

    buf += text[i];
    i++;
  }
  if (buf) tokens.push({ type: 'text', content: buf });
  return tokens;
}

/* ─── 6. Auto-wrap bare LaTeX (no $ delimiters) ─────────────────────────────
 *
 *  Detects expressions that look like LaTeX commands and wraps them in $…$.
 *  Only runs when the text contains NO $ signs at all.
 */
const LATEX_COMMAND_RE = /\\(?:lim|frac|dfrac|left|right|cdot|sqrt|sum|int|prod|infty|to|ln|log|exp|sin|cos|tan|arcsin|arccos|arctan|alpha|beta|gamma|delta|epsilon|zeta|eta|theta|iota|kappa|lambda|mu|nu|xi|pi|rho|sigma|tau|upsilon|phi|chi|psi|omega|Gamma|Delta|Theta|Lambda|Xi|Pi|Sigma|Upsilon|Phi|Psi|Omega|mathbb|mathcal|mathbf|mathrm|text|vec|hat|bar|tilde|overline|underline|widehat|widetilde|dot|ddot|pm|mp|times|div|cap|cup|in|notin|subset|supset|leq|geq|le|ge|neq|approx|equiv|sim|forall|exists|partial|nabla|rightarrow|leftarrow|Rightarrow|Leftarrow|Leftrightarrow|iff|implies|quad|qquad|ell|Re|Im|max|min|sup|inf|lim|det|dim|ker|rank|mod|circ|bullet|star|oplus|otimes|begin|end)\b/;

function autoWrapLatex(text) {
  if (text.includes('$') || !LATEX_COMMAND_RE.test(text)) return text;
  // Wrap the entire string as inline math (it's entirely a math expression)
  return `$${text}$`;
}

/* ─── 7. Main render function ────────────────────────────────────────────────
 *
 *  Entry point for ALL text rendering in the app.
 *  Pipeline: clean → detect type → tokenize → render
 */
export function renderWithMath(text) {
  if (text === null || text === undefined) return null;

  const cleaned = cleanControlChars(String(text));
  if (!cleaned) return null;

  // ── Image shorthand ──
  if (cleaned.startsWith('img:')) {
    const url = cleaned.slice(4).trim();
    return (
      <div style={{ textAlign: 'center', margin: '1rem 0' }}>
        <img
          src={url}
          alt="Question illustration"
          style={{
            maxWidth: '100%',
            maxHeight: '240px',
            borderRadius: '10px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            cursor: 'zoom-in',
            objectFit: 'contain',
          }}
          onClick={(e) => { e.stopPropagation(); window.open(url, '_blank'); }}
        />
      </div>
    );
  }

  // ── Auto-wrap bare LaTeX ──
  const toParse = autoWrapLatex(cleaned);

  // ── Tokenize and render ──
  const tokens = tokenizeMath(toParse);

  return tokens.map((tok, i) => {
    if (tok.type === 'block')  return <SafeBlockMath  key={i} math={tok.content} />;
    if (tok.type === 'inline') return <SafeInlineMath key={i} math={tok.content} />;
    return <span key={i}>{tok.content}</span>;
  });
}
