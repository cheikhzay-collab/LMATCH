/**
 * mathRenderer.jsx — L'Conq | KaTeX rendering utility (v4 — Direct KaTeX)
 *
 * ROOT CAUSE FIX:
 *   react-katex@3.1.0 does NOT support the `settings` prop — it ignores it
 *   completely. It always calls katex.renderToString with only:
 *     { displayMode, errorColor, throwOnError: !!renderError }
 *   This means strict:'ignore' was never applied → KaTeX kept using default
 *   strict:'warn' → console warnings for any impure LaTeX (e.g. \r accent).
 *
 * Solution: bypass react-katex entirely. Call katex.renderToString() directly
 *   with OUR settings. This guarantees strict:'ignore' + throwOnError:false.
 *
 * Pipeline: input → cleanControlChars → autoWrapLatex → tokenizeMath → renderKatex
 */

import React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

/* ─── 1. Master text sanitizer ──────────────────────────────────────────────
 *
 *  Strips ALL control characters that can break LaTeX rendering.
 *  NEVER replaces CR with the string "\r" — that creates the KaTeX
 *  ring-accent command \r which only works in text mode.
 */
export const cleanControlChars = (text) => {
  if (typeof text !== 'string') return String(text ?? '');
  return text
    .replace(/\r\n/g, ' ')          // Windows CRLF → space
    .replace(/[\r\n]/g, ' ')        // lone CR or LF → space
    .replace(/\t/g, ' ')            // Tab → space
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // other control chars → strip
    .replace(/[\u200B-\u200D\uFEFF]/g, '')              // zero-width / BOM → strip
    .replace(/ {2,}/g, ' ')         // collapse multiple spaces
    .trim();
};

/* ─── 2. KaTeX options — applied directly, no middleman ─────────────────────
 *
 *  strict: 'ignore'   → completely silences ALL KaTeX warnings/errors
 *  throwOnError: false → renders partial output on parse error (never throws)
 *  trust: false       → security: disallow \href, \url etc.
 */
const KATEX_OPTIONS = {
  strict: 'ignore',
  throwOnError: false,
  trust: false,
};

/* ─── 3. Core render functions — direct katex calls ─────────────────────────*/

function renderInlineKatex(latex) {
  try {
    return katex.renderToString(latex, { ...KATEX_OPTIONS, displayMode: false });
  } catch {
    // Fallback: show raw latex in italic
    return `<span style="font-style:italic;opacity:0.75">${escapeHtml(latex)}</span>`;
  }
}

function renderBlockKatex(latex) {
  try {
    return katex.renderToString(latex, { ...KATEX_OPTIONS, displayMode: true });
  } catch {
    return `<span style="font-style:italic;opacity:0.75;display:block">${escapeHtml(latex)}</span>`;
  }
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ─── 4. Safe KaTeX React components ────────────────────────────────────────
 *
 *  Uses dangerouslySetInnerHTML with KaTeX's own sanitized HTML output.
 *  KaTeX output is safe — it only produces math markup.
 */
export function SafeInlineMath({ math }) {
  const html = renderInlineKatex(math);
  return (
    <span
      className="notranslate"
      translate="no"
      style={{ display: 'inline-block' }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export function SafeBlockMath({ math }) {
  const html = renderBlockKatex(math);
  return (
    <div
      className="notranslate"
      translate="no"
      style={{ display: 'block', margin: '0.75em 0', overflowX: 'auto' }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/* ─── 5. Error boundary (kept as safety net) ─────────────────────────────── */
export class MathErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error) {
    void error; // silently swallow
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

/* ─── 6. Robust $…$ / $$…$$ tokenizer ───────────────────────────────────────
 *
 *  Hand-rolled character-by-character tokenizer. Handles:
 *    • $$…$$  (block math, highest priority)
 *    • $…$    (inline math)
 *    • \$     (escaped dollar — literal $)
 *    • $a$ + $b$  (adjacent math blocks)
 *    • Unclosed $ (treated as literal text)
 */
function tokenizeMath(text) {
  const tokens = [];
  let i = 0;
  let buf = '';

  while (i < text.length) {
    // ── Block math $$…$$
    if (text[i] === '$' && text[i + 1] === '$') {
      if (buf) { tokens.push({ type: 'text', content: buf }); buf = ''; }
      const start = i + 2;
      const end = text.indexOf('$$', start);
      if (end === -1) {
        buf += text.slice(i);
        i = text.length;
      } else {
        tokens.push({ type: 'block', content: text.slice(start, end) });
        i = end + 2;
      }
      continue;
    }

    // ── Escaped dollar \$ → literal $
    if (text[i] === '\\' && text[i + 1] === '$') {
      buf += '$';
      i += 2;
      continue;
    }

    // ── Inline math $…$
    if (text[i] === '$') {
      let j = i + 1;
      let found = false;
      while (j < text.length) {
        if (text[j] === '\\') { j += 2; continue; }
        if (text[j] === '$') { found = true; break; }
        j++;
      }
      if (!found || j === i + 1) {
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

/* ─── 7. Auto-wrap bare LaTeX (no $ delimiters) ─────────────────────────────
 *
 *  When a string has LaTeX commands but no $ signs, wraps it in $…$.
 */
const LATEX_COMMAND_RE = /\\(?:lim|frac|dfrac|left|right|cdot|sqrt|sum|int|prod|infty|to|ln|log|exp|sin|cos|tan|arcsin|arccos|arctan|alpha|beta|gamma|delta|epsilon|zeta|eta|theta|iota|kappa|lambda|mu|nu|xi|pi|rho|sigma|tau|upsilon|phi|chi|psi|omega|Gamma|Delta|Theta|Lambda|Xi|Pi|Sigma|Upsilon|Phi|Psi|Omega|mathbb|mathcal|mathbf|mathrm|text|vec|hat|bar|tilde|overline|underline|widehat|widetilde|dot|ddot|pm|mp|times|div|cap|cup|in|notin|subset|supset|leq|geq|le|ge|neq|approx|equiv|sim|forall|exists|partial|nabla|rightarrow|leftarrow|Rightarrow|Leftarrow|Leftrightarrow|iff|implies|quad|qquad|ell|Re|Im|max|min|sup|inf|det|dim|ker|rank|mod|circ|bullet|star|oplus|otimes|begin|end)\b/;

function autoWrapLatex(text) {
  if (text.includes('$') || !LATEX_COMMAND_RE.test(text)) return text;
  return `$${text}$`;
}

function renderTextWithBold(text) {
  if (!text.includes('**')) {
    return text;
  }
  const parts = text.split('**');
  return parts.map((part, idx) => {
    if (idx % 2 === 1) {
      return part ? <strong key={idx} style={{ fontWeight: 800 }}>{part}</strong> : null;
    }
    return part || null;
  });
}

/* ─── 8. Main render function ────────────────────────────────────────────────
 *
 *  Entry point for ALL text rendering in the app.
 *  Pipeline: input → clean → auto-wrap → tokenize → render
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

  if (tokens.length === 1 && tokens[0].type === 'text') {
    return <span>{renderTextWithBold(tokens[0].content)}</span>;
  }

  return tokens.map((tok, i) => {
    if (tok.type === 'block')  return <SafeBlockMath  key={i} math={tok.content} />;
    if (tok.type === 'inline') return <SafeInlineMath key={i} math={tok.content} />;
    return <span key={i}>{renderTextWithBold(tok.content)}</span>;
  });
}
