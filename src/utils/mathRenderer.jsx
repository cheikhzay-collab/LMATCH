/**
 * mathRenderer.jsx — Shared KaTeX rendering utility for L'Match
 *
 * Fixes:
 *  1. Auto-wrap regex now handles Unicode math chars (−, ∞, ≤, ≥, ×, ÷, etc.)
 *  2. Split regex uses [^$] instead of [^\\$] so backslashes inside $…$ work
 *  3. MathErrorBoundary shows graceful italic fallback instead of red KaTeX errors
 */

import React from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

/* ─── 1. Strip control characters ──────────────────────────────────────────── */
export const cleanControlChars = (text) => {
  if (typeof text !== 'string') return text;
  return text
    .replace(/\u0009/g, '\\t')   // Tab → \t
    .replace(/\u000c/g, '\\f')   // Form Feed → \f
    .replace(/\u000d/g, '\\r')   // Carriage Return → \r  (fixes broken \right in some CSVs)
    .replace(/\u0008/g, '\\b')   // Backspace → \b
    .replace(/\u000b/g, '\\v')   // Vertical Tab → \v
    .replace(/\u0000/g, '\\0')   // Null → \0
    .replace(/[\u200B-\u200D\uFEFF]/g, ''); // strip zero-width / invisible chars
};

/* ─── 2. Error boundary: graceful fallback instead of red error text ─────── */
export class MathErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      // Show raw LaTeX in italic rather than a jarring red error block
      return (
        <span style={{ fontStyle: 'italic', opacity: 0.8, color: 'inherit' }}>
          {this.props.math}
        </span>
      );
    }
    return this.props.children;
  }
}

/* ─── 3. Safe KaTeX wrappers (error-boundary aware) ────────────────────────── */
export function SafeInlineMath({ math }) {
  return (
    <MathErrorBoundary math={math}>
      <span className="notranslate" translate="no" style={{ display: 'inline-block' }}>
        <InlineMath math={math} />
      </span>
    </MathErrorBoundary>
  );
}

export function SafeBlockMath({ math }) {
  return (
    <MathErrorBoundary math={math}>
      <div className="notranslate" translate="no" style={{ display: 'block', margin: '1em 0' }}>
        <BlockMath math={math} />
      </div>
    </MathErrorBoundary>
  );
}

/* ─── 4. Auto-wrap regex ────────────────────────────────────────────────────
 *
 *  FIX: Extended character class now includes Unicode math symbols:
 *    \u2212 (−  MINUS SIGN)        – previously caused the wrap to split mid-expression
 *    \u221E (∞  INFINITY)
 *    \u2264 (≤  LESS-THAN OR EQUAL)
 *    \u2265 (≥  GREATER-THAN OR EQUAL)
 *    \u2260 (≠  NOT EQUAL)
 *    \u00D7 (×  MULTIPLICATION SIGN)
 *    \u00F7 (÷  DIVISION SIGN)
 *    \u00B2 ²  \u00B3 ³  \u00B9 ¹  (superscript digits)
 *
 *  Space-lookahead alternative also updated to accept − and ∞.
 */
const MATH_REGEX = /(\\(?:lim|frac|left|right|to|ln|log|sin|cos|tan|infty|pi|alpha|beta|theta|sum|int|vec|begin|end|sigma|mu|lambda|delta|epsilon|omega|phi|gamma|chi|psi|tau|eta|zeta|kappa|rho|xi|nu|mathbb|mathcal|mathbf|sqrt|le|ge|neq|approx|text|in|notin|cap|cup|times|div|circ|forall|exists|rightarrow|Leftrightarrow|Rightarrow|bar|overline|hat|tilde|cdot|pm|mp|dfrac|displaystyle|partial|nabla|max|min|sup|inf|\{|\})(?:[\\a-zA-Z0-9{}()\[\]_^\-+=\/*<>.,;!&|\u2212\u221E\u2264\u2265\u2260\u00D7\u00F7\u00B2\u00B3\u00B9]|(?:\s+(?=[\\0-9+\-*\/=<>_^{}()\[\]&|\u2212\u221E]))|(?:\s+\b[a-zA-Z]\b))+(?:[a-zA-Z0-9{}()\[\]_^\-+=\/*<>])?)/g;

/* ─── 5. Main render function ───────────────────────────────────────────────── */
export function renderWithMath(text) {
  if (!text) return null;
  const cleaned = cleanControlChars(String(text));

  // ── Image shorthand: "img:https://…" ──
  if (cleaned.startsWith('img:')) {
    const url = cleaned.replace('img:', '').trim();
    return (
      <div style={{ textAlign: 'center', margin: '1rem 0' }}>
        <img
          src={url}
          alt="Content"
          style={{
            maxWidth: '100%',
            maxHeight: '220px',
            borderRadius: '10px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
            cursor: 'zoom-in',
            objectFit: 'contain',
          }}
          onClick={(e) => { e.stopPropagation(); window.open(url, '_blank'); }}
        />
      </div>
    );
  }

  // ── Auto-wrap bare LaTeX commands (no $ delimiters in data) ──
  let textToParse = cleaned;
  if (!textToParse.includes('$') && textToParse.includes('\\')) {
    MATH_REGEX.lastIndex = 0; // reset stateful /g regex
    textToParse = textToParse.replace(MATH_REGEX, (match) => `$${match.trim()}$`);
  }

  // ── Split on $$…$$ and $…$ then render each math segment ──
  // FIX: use [^$] (not [^\\$]) so backslashes inside math blocks are allowed
  const parts = textToParse.split(/(\$\$[^$]+\$\$|\$[^$]+\$)/g);

  return parts.map((part, index) => {
    if (part.startsWith('$$') && part.endsWith('$$')) {
      return <SafeBlockMath key={index} math={part.slice(2, -2)} />;
    }
    if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
      return <SafeInlineMath key={index} math={part.slice(1, -1)} />;
    }
    return <span key={index}>{part}</span>;
  });
}
