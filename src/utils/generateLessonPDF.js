import katex from 'katex';

/* ── Math renderer: same tokenizer as generateExamPDF.js ── */
const KATEX_OPTIONS = {
  strict: 'ignore',
  throwOnError: false,
  trust: false,
};

const esc = (s) => {
  if (typeof s !== 'string') return String(s ?? '');
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
};

const LATEX_COMMAND_RE = /\\(?:lim|frac|dfrac|left|right|cdot|sqrt|sum|int|prod|infty|to|ln|log|exp|sin|cos|tan|arcsin|arccos|arctan|alpha|beta|gamma|delta|epsilon|zeta|eta|theta|iota|kappa|lambda|mu|nu|xi|pi|rho|sigma|tau|upsilon|phi|chi|psi|omega|Gamma|Delta|Theta|Lambda|Xi|Pi|Sigma|Upsilon|Phi|Psi|Omega|mathbb|mathcal|mathbf|mathrm|text|vec|hat|bar|tilde|overline|underline|widehat|widetilde|dot|ddot|pm|mp|times|div|cap|cup|in|notin|subset|supset|leq|geq|le|ge|neq|approx|equiv|sim|forall|exists|partial|nabla|rightarrow|leftarrow|Rightarrow|Leftarrow|Leftrightarrow|iff|implies|quad|qquad|ell|Re|Im|max|min|sup|inf|det|dim|ker|rank|mod|circ|bullet|star|oplus|otimes|begin|end)\b/;

function autoWrapLatex(text) {
  if (text.includes('$')) return text;
  if (/[\\^_{}]/.test(text) || LATEX_COMMAND_RE.test(text)) {
    return `$${text}$`;
  }
  return text;
}

function tokenizeMath(text) {
  const tokens = [];
  let i = 0;
  let buf = '';

  while (i < text.length) {
    if (text[i] === '$' && text[i + 1] === '$') {
      if (buf) { tokens.push({ type: 'text', content: buf }); buf = ''; }
      const start = i + 2;
      const end = text.indexOf('$$', start);
      if (end === -1) { buf += text.slice(i); i = text.length; }
      else { tokens.push({ type: 'block', content: text.slice(start, end) }); i = end + 2; }
      continue;
    }
    if (text[i] === '\\' && text[i + 1] === '$') { buf += '$'; i += 2; continue; }
    if (text[i] === '$') {
      let j = i + 1; let found = false;
      while (j < text.length) { if (text[j] === '\\') { j += 2; continue; } if (text[j] === '$') { found = true; break; } j++; }
      if (!found || j === i + 1) { buf += '$'; i++; }
      else { if (buf) { tokens.push({ type: 'text', content: buf }); buf = ''; } tokens.push({ type: 'inline', content: text.slice(i + 1, j) }); i = j + 1; }
      continue;
    }
    buf += text[i]; i++;
  }
  if (buf) tokens.push({ type: 'text', content: buf });
  return tokens;
}

const renderInlineKatex = (latex) => {
  try { return katex.renderToString(latex, { ...KATEX_OPTIONS, displayMode: false }); }
  catch { return `<span style="font-style:italic;opacity:0.75">${esc(latex)}</span>`; }
};

const renderBlockKatex = (latex) => {
  try { return katex.renderToString(latex, { ...KATEX_OPTIONS, displayMode: true }); }
  catch { return `<span style="font-style:italic;opacity:0.75;display:block">${esc(latex)}</span>`; }
};

const renderTextWithBold = (text) => {
  let html = esc(text);
  html = html.replace(/\*\*([\s\S]+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([\s\S]+?)\*/g, '<em>$1</em>');
  return html;
};

const renderLineContent = (text) => {
  const toParse = autoWrapLatex(text);
  const tokens = tokenizeMath(toParse);
  const html = tokens.map((tok) => {
    if (tok.type === 'block') return renderBlockKatex(tok.content);
    if (tok.type === 'inline') return renderInlineKatex(tok.content);
    return esc(tok.content);
  }).join('');
  return html
    .replace(/\*\*([\s\S]+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([\s\S]+?)\*/g, '<em>$1</em>');
};

const repairCorruptedLatex = (text) => {
  if (!text) return text;
  return text
    .replace(/(?<![a-zA-Z\\])ight\b/g, '\\right')
    .replace(/(?<!\\)right\b/g, '\\right')
    .replace(/(?<!\\)left\b/g, '\\left')
    .replace(/(?<!\\)frac\{/g, '\\frac{')
    .replace(/(?<!\\)dfrac\{/g, '\\dfrac{')
    .replace(/(?<![a-zA-Z\\])rac\{/g, '\\frac{');
};

const renderLine = (line) => {
  const cleaned = line.replace(/\t/g, ' ')
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/ {2,}/g, ' ')
    .trim();
  if (!cleaned) return '';

  // Bare LaTeX block: Line starts with \ and does not contain $
  if (cleaned.startsWith('\\') && !cleaned.includes('$')) {
    return renderBlockKatex(repairCorruptedLatex(cleaned));
  }

  // Markdown Headings: ### ## #
  if (/^###\s+/.test(cleaned)) {
    const text = cleaned.replace(/^###\s+/, '');
    return `<div style="font-weight:800;font-size:0.95rem;color:#005086;border-bottom:1px solid rgba(0,80,134,0.15);padding-bottom:0.25rem;margin:0.75rem 0 0.4rem">${renderLineContent(text)}</div>`;
  }
  if (/^##\s+/.test(cleaned)) {
    const text = cleaned.replace(/^##\s+/, '');
    return `<div style="font-weight:900;font-size:1.05rem;color:#005086;border-bottom:1.5px solid rgba(0,80,134,0.2);padding-bottom:0.3rem;margin:1rem 0 0.5rem">${renderLineContent(text)}</div>`;
  }
  if (/^#\s+/.test(cleaned)) {
    const text = cleaned.replace(/^#\s+/, '');
    return `<div style="font-weight:900;font-size:1.2rem;color:#005086;border-bottom:2px solid rgba(0,80,134,0.3);padding-bottom:0.4rem;margin:1rem 0 0.6rem">${renderLineContent(text)}</div>`;
  }

  // Response Block
  if (cleaned.toLowerCase().startsWith('**réponse') || cleaned.toLowerCase().startsWith('réponse') ||
      cleaned.toLowerCase().startsWith('**reponse') || cleaned.toLowerCase().startsWith('reponse')) {
    const contentText = cleaned.replace(/^(\*\*)?r[eé]ponse\s*:?\s*/i, '').replace(/\*\*$/, '');
    return `<span style="display:block;line-height:1.75"><strong>Réponse :</strong> ${renderLineContent(contentText)}</span>`;
  }

  // Attention Block
  if (cleaned.toLowerCase().startsWith('**attention') || cleaned.toLowerCase().startsWith('attention')) {
    const contentText = cleaned.replace(/^(\*\*)?attention\s*:?\s*/i, '').replace(/\*\*$/, '');
    return `<span style="display:block;line-height:1.75"><strong>Attention :</strong> ${renderLineContent(contentText)}</span>`;
  }

  // Step Block
  const stepRegex = /^(\*\*)?(Étape|Step|الخطوة)\s*(\d+)\s*(?:—|-|:)?\s*(.*)$/i;
  const stepMatch = cleaned.match(stepRegex);
  if (stepMatch) {
    const stepLabel = stepMatch[2];
    const stepNum = stepMatch[3];
    const stepText = stepMatch[4].replace(/\*\*$/, '');
    const formattedLabel = stepLabel.toLowerCase().includes('خطوة') ? `الخطوة ${stepNum}` : `${stepLabel} ${stepNum}`;
    return `<span style="display:block;line-height:1.75;margin-top:0.5rem"><strong>${formattedLabel} :</strong> ${stepText ? renderLineContent(stepText) : ''}</span>`;
  }

  return `<span style="display:block;line-height:1.75">${renderLineContent(cleaned)}</span>`;
};

const renderMath = (text) => {
  if (text === null || text === undefined) return '';
  const repaired = repairCorruptedLatex(String(text));
  if (!repaired.trim()) return '';

  // Image shorthand
  if (repaired.trim().startsWith('img:')) {
    const url = repaired.trim().slice(4).trim();
    return `<div style="text-align:center;margin:0.5rem 0"><img src="${url}" alt="" style="max-width:100%;max-height:200px;border-radius:8px;object-fit:contain" /></div>`;
  }

  // Normalize line endings & escaped \n → real newlines (outside math blocks only)
  let normalised = repaired.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  normalised = normalised.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g)
    .map((part, idx) => {
      if (idx % 2 === 1) return part; // inside math — leave as-is
      let p = part.replace(/\\n/g, '\n');
      // Force line break before Step / Response / Attention blocks
      if (idx > 0) p = p.replace(/^\s*(\*\*)?(étape|etape|step|الخطوة)\b/gi, '\n$1$2');
      p = p.replace(/(?<=[.!?$;:\-)\]}»*])\s+(\*\*)?(étape|etape|step|الخطوة)\b/gi, '\n$1$2');
      if (idx > 0) p = p.replace(/^\s*(\*\*)?(réponse|reponse|attention)\b/gi, '\n$1$2');
      p = p.replace(/(?<=[.!?$;:\-)\]}»*])\s+(\*\*)?(réponse|reponse|attention)\b/gi, '\n$1$2');
      return p;
    }).join('');

  const tokens = tokenizeMath(normalised);

  let lines = [[]];
  for (const tok of tokens) {
    if (tok.type === 'block') {
      if (lines[lines.length - 1].length > 0) {
        lines.push([]);
      }
      lines[lines.length - 1].push(tok);
      lines.push([]);
    } else if (tok.type === 'inline') {
      lines[lines.length - 1].push(tok);
    } else {
      const parts = tok.content.split('\n');
      for (let i = 0; i < parts.length; i++) {
        if (i > 0) {
          lines.push([]);
        }
        if (parts[i]) {
          lines[lines.length - 1].push({ type: 'text', content: parts[i] });
        }
      }
    }
  }

  let html = '';
  for (const lineTokens of lines) {
    if (lineTokens.length === 0) continue;

    if (lineTokens.length === 1 && lineTokens[0].type === 'block') {
      html += renderBlockKatex(lineTokens[0].content);
      continue;
    }

    const reconstructedLine = lineTokens.map(t => {
      if (t.type === 'inline') return `$${t.content}$`;
      if (t.type === 'block') return `$$${t.content}$$`;
      return t.content;
    }).join('');
    
    html += renderLine(reconstructedLine);
  }

  return html || '';
};


/* ── Parse exercise title helper ── */
const parseExerciseTitle = (title, fallbackIdx) => {
  if (!title) return { number: String(fallbackIdx + 1), label: '' };
  let clean = title.trim();
  const prefixMatch = clean.match(/^Exercice\s*(?:N?°|N)?\s*/i);
  if (prefixMatch) clean = clean.substring(prefixMatch[0].length).trim();
  const match = clean.match(/^([0-9a-zA-Z\s]+)(.*)$/);
  if (match) {
    const number = match[1].trim();
    let label = match[2].trim().replace(/^[:\-–—\s]+/, '').trim();
    return { number: number || String(fallbackIdx + 1), label };
  }
  return { number: clean || String(fallbackIdx + 1), label: '' };
};


/* ═══════════════════════════════════════════════════════════
   GENERATE LESSON / FICHE PDF HTML
   ═══════════════════════════════════════════════════════════ */
export const generateLessonHTML = (lesson) => {
  const { content } = lesson;
  const { header, sections } = content;

  const title = header?.fiche_title || lesson?.title || 'Fiche de Cours';
  const subject = header?.subject || '';
  const globalProfName = (typeof window !== 'undefined' && window.localStorage) ? localStorage.getItem('profName') || '' : '';
  const globalProfPhone = (typeof window !== 'undefined' && window.localStorage) ? localStorage.getItem('profPhone') || '' : '';
  const teacher = header?.teacher || globalProfName || '';
  const phone = header?.phone || globalProfPhone || '';
  const prepTitle = header?.prep_title || '';
  const schools = header?.schools || [];

  /* ── Build sections HTML ── */
  let sectionsHtml = '';
  let prevSectionHeader = null;

  sections?.forEach((sec, idx) => {
    const isTheory = sec.type === 'content';

    // Section header row
    if (sec.section_header && sec.section_header !== prevSectionHeader) {
      sectionsHtml += `
        <div class="section-header-row" ${idx > 0 ? 'style="margin-top:0.6rem"' : ''}>
          <div class="section-badge">${sec.section_number || '1'}</div>
          <div class="section-title-pill">${esc(sec.section_header)}</div>
        </div>`;
      prevSectionHeader = sec.section_header;
    }

    if (isTheory) {
      // Theory/content subsection
      let itemsHtml = '';
      sec.items?.forEach((item) => {
        if (item.type === 'highlight_box') {
          itemsHtml += `<div class="highlight-box">${renderMath(item.text)}</div>`;
        } else if (item.type === 'notation_grid') {
          let colsHtml = '';
          item.notation_columns?.forEach((col) => {
            let blocksHtml = '';
            col.math_blocks?.forEach((block) => {
              blocksHtml += `<div style="display:block;margin:0.2rem 0">${renderMath(block)}</div>`;
            });
            colsHtml += `<div class="notation-column">
              <strong style="font-size:0.9rem;color:#005086">${esc(col.title)}</strong>
              ${blocksHtml}
            </div>`;
          });
          itemsHtml += `<div class="notation-grid">${colsHtml}</div>`;
        } else if (item.type === 'table') {
          let headersHtml = '';
          item.table_data?.headers?.forEach(h => { headersHtml += `<th>${renderMath(h)}</th>`; });
          let rowsHtml = '';
          item.table_data?.rows?.forEach(row => {
            let cellsHtml = '';
            row.forEach(cell => { cellsHtml += `<td>${renderMath(cell)}</td>`; });
            rowsHtml += `<tr>${cellsHtml}</tr>`;
          });
          itemsHtml += `<div style="overflow-x:auto;width:100%;margin:0.5rem 0">
            <table class="sheet-table">
              <thead><tr>${headersHtml}</tr></thead>
              <tbody>${rowsHtml}</tbody>
            </table>
          </div>`;
        } else {
          // bullet or text
          const bulletDot = item.type === 'bullet' ? '<span class="bullet-dot">•</span>' : '';
          itemsHtml += `<div class="bullet-item">${bulletDot}<span style="flex:1">${renderMath(item.text)}</span></div>`;
        }
      });

      sectionsHtml += `
        <div class="subsection-card">
          <div class="subsection-header">
            <span>${esc(sec.title || '')}</span>
            ${sec.accent_text ? `<span class="accent-green">${esc(sec.accent_text)}</span>` : ''}
          </div>
          ${itemsHtml}
        </div>`;

    } else {
      // Exercise section
      const { number: exeNumber, label: exeLabel } = parseExerciseTitle(sec.title, idx);

      sectionsHtml += `
        <div class="exercise-wrapper">
          <div class="exercise-banner">
            <div class="exercise-pill">
              <span>Exercice N°</span>
              <span class="exercise-num">${esc(exeNumber)}</span>
            </div>
            ${exeLabel ? `<span class="exercise-label">${esc(exeLabel)}</span>` : ''}
          </div>
          <div class="exercise-body">${renderMath(sec.content)}</div>
          ${sec.solution ? `
          <div class="solution-block">
            <h4 class="solution-title">📖 Démonstration rédigée</h4>
            <div class="solution-content">${renderMath(sec.solution)}</div>
          </div>` : ''}
        </div>`;
    }
  });


  /* ── Full HTML document ── */
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>${esc(title)} — Fiche de Cours</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=STIX+Two+Text:ital,wght@0,400;0,600;0,700;1,400;1,600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/dreampulse/computer-modern-web-font@master/fonts.css">
<style>
/* ═══════════════════════════════════════
   BASE RESET & PAGE SETUP
   ═══════════════════════════════════════ */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

@page {
  size: A4 portrait;
  margin: 12mm 12mm 14mm 12mm;
  @bottom-center {
    content: "— " counter(page) " —";
    font-family: 'Computer Modern Serif', 'STIX Two Text', 'Times New Roman', serif;
    font-size: 8pt;
    color: #94a3b8;
  }
}

@page :first {
  @bottom-center { content: none; }
}

html {
  font-size: 11pt;
}

body {
  font-family: 'Computer Modern Serif', 'STIX Two Text', 'Times New Roman', serif;
  color: #1a202c;
  background: #ffffff;
  line-height: 1.7;
  print-color-adjust: exact;
  -webkit-print-color-adjust: exact;
  font-feature-settings: 'liga' 1, 'kern' 1;
}

/* ═══════════════════════════════════════
   PRINT HINT BAR (hidden on print)
   ═══════════════════════════════════════ */
.print-hint {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  background: linear-gradient(135deg, #0f172a, #1e293b);
  color: #fff;
  padding: 0.85rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 9.5pt;
  gap: 1rem;
  font-family: 'Inter', sans-serif;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
}
.print-hint-msg {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.print-hint-icon { font-size: 1.4rem; }
.print-hint-text strong { font-size: 10pt; color: #38bdf8; }
.print-hint-text span { color: rgba(255,255,255,0.7); font-size: 8.5pt; }
.hint-badge {
  background: #0284c7;
  color: #fff;
  font-size: 8.5pt;
  font-weight: 700;
  padding: 6px 18px;
  border-radius: 20px;
  white-space: nowrap;
  cursor: pointer;
  border: none;
  font-family: inherit;
  letter-spacing: 0.5px;
  transition: all 0.2s;
}
.hint-badge:hover { background: #0369a1; }

@media print {
  .print-hint { display: none !important; }
  body { padding-top: 0 !important; }
}

@media screen {
  body { padding-top: 52px; }
}

/* ═══════════════════════════════════════
   CONTENT WRAPPER (screen preview only)
   ═══════════════════════════════════════ */
@media screen {
  .page-content {
    max-width: 210mm;
    margin: 0 auto;
    padding: 12mm 12mm;
    background: #fff;
    min-height: 100vh;
    box-shadow: 0 0 40px rgba(0,0,0,0.08);
  }
}

/* ═══════════════════════════════════════
   HEADER (3-column grid)
   ═══════════════════════════════════════ */
.fiche-header {
  display: grid;
  grid-template-columns: 1fr 1.5fr 1fr;
  border-bottom: 2.5px solid #005086;
  padding-bottom: 0.4rem;
  margin-bottom: 0.6rem;
  align-items: center;
}
.fiche-header .left {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  font-size: 0.82rem;
  font-weight: 700;
  color: #1a202c;
}
.fiche-header .left .schools {
  color: #005086;
  font-weight: 800;
}
.fiche-header .center {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  align-items: center;
}
.fiche-header .center .subject-label {
  font-size: 0.72rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.fiche-header .center .fiche-title {
  font-weight: 900;
  font-size: 1.1rem;
  color: #b91c1c;
  text-decoration: underline;
  text-underline-offset: 3px;
}
.fiche-header .right {
  text-align: right;
  font-size: 0.82rem;
  font-weight: 700;
  color: #1a202c;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  align-items: flex-end;
}
.fiche-header .right .phone {
  color: #4b5563;
  font-weight: 600;
}

/* ═══════════════════════════════════════
   BANNER TITLE
   ═══════════════════════════════════════ */
.banner-title {
  background: #005086;
  color: #ffffff;
  border-radius: 20px;
  padding: 0.3rem 2rem;
  font-weight: 800;
  font-size: 1.2rem;
  display: inline-block;
  margin: 0 auto;
  text-align: center;
  letter-spacing: 0.02em;
}
.banner-wrapper {
  text-align: center;
  margin-bottom: 0.6rem;
}

/* ═══════════════════════════════════════
   SECTION HEADER ROW (numbering + title)
   ═══════════════════════════════════════ */
.section-header-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-bottom: 2px solid rgba(0,80,134,0.15);
  padding-bottom: 0.25rem;
  margin-bottom: 0.4rem;
  page-break-after: avoid;
}
.section-badge {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #005086;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  font-size: 0.85rem;
  flex-shrink: 0;
}
.section-title-pill {
  font-size: 1.05rem;
  font-weight: 800;
  color: #005086;
  border: 1.5px solid rgba(0,80,134,0.4);
  border-radius: 99px;
  padding: 0.2rem 1.1rem;
  display: inline-flex;
  background: rgba(0,80,134,0.03);
}

/* ═══════════════════════════════════════
   SUBSECTION CARD (theory blocks)
   ═══════════════════════════════════════ */
.subsection-card {
  border: 1.5px solid #005086;
  border-radius: 6px;
  padding: 0.6rem 0.8rem;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  margin-bottom: 0.4rem;
}
.subsection-header {
  font-size: 0.95rem;
  font-weight: 800;
  color: #1a202c;
  border-bottom: 1px dashed rgba(0,80,134,0.25);
  padding-bottom: 0.2rem;
  margin-bottom: 0.15rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}
.accent-green {
  color: #009688;
  font-weight: 800;
}

/* ═══════════════════════════════════════
   BULLET ITEMS
   ═══════════════════════════════════════ */
.bullet-item {
  display: flex;
  align-items: flex-start;
  gap: 0.35rem;
  line-height: 1.55;
  margin-bottom: 0.15rem;
}
.bullet-dot {
  color: #005086;
  font-size: 1.1rem;
  line-height: 1;
  margin-top: 0.15rem;
  flex-shrink: 0;
}

/* ═══════════════════════════════════════
   HIGHLIGHT BOX
   ═══════════════════════════════════════ */
.highlight-box {
  background: rgba(0,80,134,0.04);
  border: 1.5px solid #005086;
  border-radius: 5px;
  padding: 0.5rem 0.7rem;
  margin: 0.2rem 0;
  line-height: 1.6;
}

/* ═══════════════════════════════════════
   NOTATION GRID
   ═══════════════════════════════════════ */
.notation-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.6rem;
  margin: 0.2rem 0;
  padding: 0.4rem;
  background: #f8fafc;
  border: 1px solid rgba(0,80,134,0.1);
  border-radius: 5px;
}
.notation-column {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  border-left: 2px solid #005086;
  padding-left: 0.8rem;
}

/* ═══════════════════════════════════════
   TABLES
   ═══════════════════════════════════════ */
.sheet-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 0.4rem;
  border: 1.5px solid #005086;
  font-size: 0.92rem;
}
.sheet-table th,
.sheet-table td {
  border: 1px solid rgba(0,80,134,0.25);
  padding: 0.55rem 0.8rem;
  text-align: center;
  color: #1a202c;
}
.sheet-table th {
  background: rgba(0,80,134,0.06);
  font-weight: 800;
  color: #005086;
}

/* ═══════════════════════════════════════
   EXERCISES
   ═══════════════════════════════════════ */
.exercise-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  margin-bottom: 0.4rem;
}
.exercise-banner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}
.exercise-pill {
  background: #005086;
  color: #ffffff;
  padding: 0.3rem 1.1rem;
  border-radius: 99px;
  font-weight: 800;
  font-size: 0.85rem;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}
.exercise-num {
  background: #ffffff;
  color: #005086;
  min-width: 20px;
  height: 20px;
  border-radius: 10px;
  padding: 0 5px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.72rem;
  font-weight: 900;
  white-space: nowrap;
}
.exercise-label {
  font-weight: 800;
  font-size: 0.95rem;
  color: #1a202c;
}
.exercise-body {
  border-left: 4px solid #005086;
  background: rgba(0,80,134,0.02);
  border-top: 1px solid rgba(0,80,134,0.1);
  border-right: 1px solid rgba(0,80,134,0.1);
  border-bottom: 1px solid rgba(0,80,134,0.1);
  border-radius: 4px 6px 6px 4px;
  padding: 0.6rem 0.8rem;
  line-height: 1.6;
}

/* ═══════════════════════════════════════
   SOLUTION BLOCK
   ═══════════════════════════════════════ */
.solution-block {
  background: rgba(16,185,129,0.03);
  border: 1.5px solid rgba(16,185,129,0.2);
  border-radius: 6px;
  padding: 0.6rem 0.8rem;
  margin-top: 0.2rem;
}
.solution-title {
  color: #059669;
  font-weight: 800;
  font-size: 0.9rem;
  margin-bottom: 0.3rem;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}
.solution-content {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  font-size: 0.9rem;
  line-height: 1.6;
}

/* ═══════════════════════════════════════
   CALLOUTS (response / attention)
   ═══════════════════════════════════════ */
.mfc-callout-response {
  background: rgba(16,185,129,0.06);
  border-left: 4px solid #009688;
  padding: 0.5rem 0.8rem;
  border-radius: 0 6px 6px 0;
  margin: 0.3rem 0;
}
.mfc-callout-attention {
  background: rgba(245,158,11,0.06);
  border-left: 4px solid #d97706;
  padding: 0.5rem 0.8rem;
  border-radius: 0 6px 6px 0;
  margin: 0.3rem 0;
}

/* ═══════════════════════════════════════
   FOOTER
   ═══════════════════════════════════════ */
.fiche-footer {
  margin-top: 1rem;
  padding-top: 0.3rem;
  border-top: 1.5px solid #e2e8f0;
  text-align: center;
  font-size: 0.7rem;
  color: #94a3b8;
  font-family: 'Inter', sans-serif;
}

/* ═══════════════════════════════════════
   KATEX OVERRIDES
   ═══════════════════════════════════════ */
.katex { color: #1a202c !important; }
.katex .mord, .katex .mbin, .katex .mrel,
.katex .mopen, .katex .mclose, .katex .mpunct,
.katex .minner, .katex .mop { color: #1a202c !important; }

/* Display-mode KaTeX blocks need margin */
.katex-display {
  margin: 0.25rem 0 !important;
}

/* ═══════════════════════════════════════
   SECTIONS CONTAINER
   ═══════════════════════════════════════ */
.sections-container {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  width: 100%;
}

</style>
</head>
<body>

<!-- Print Hint Bar (visible on screen only) -->
<div class="print-hint" id="printHint">
  <div class="print-hint-msg">
    <span class="print-hint-icon">🖨️</span>
    <div class="print-hint-text">
      <strong>Fiche de Cours Prête</strong><br>
      <span>Appuyez sur <b>Ctrl+P</b> pour imprimer ou enregistrer en PDF. Choisissez "Enregistrer en PDF" comme destination.</span>
    </div>
  </div>
  <button class="hint-badge" onclick="printNow()">⚡ Imprimer</button>
</div>

<div class="page-content">
  <!-- HEADER -->
  <div class="fiche-header">
    <div class="left">
      <span>${esc(prepTitle)}</span>
      <span class="schools">${esc(schools.join(' - '))}</span>
    </div>
    <div class="center">
      <span class="subject-label">${esc(subject)}</span>
      <span class="fiche-title">${esc(title)}</span>
    </div>
    <div class="right">
      <span>${esc(teacher)}</span>
      ${phone ? `<span class="phone">${esc(phone)}</span>` : ''}
    </div>
  </div>

  <!-- BANNER -->
  <div class="banner-wrapper">
    <div class="banner-title">${esc(title)}</div>
  </div>

  <!-- SECTIONS -->
  <div class="sections-container">
    ${sectionsHtml}
  </div>

  <!-- FOOTER -->
  <div class="fiche-footer">
    © ${new Date().getFullYear()} L'CONQ — Plateforme de Préparation aux Concours d'Excellence
    ${teacher ? ` · Préparé par : <strong>${esc(teacher)}</strong>` : ''}
    ${phone ? ` · ${esc(phone)}` : ''}
  </div>
</div>

<script>
async function printNow() {
  await document.fonts.ready;
  await new Promise(r => setTimeout(r, 600));
  var hint = document.getElementById('printHint');
  if (hint) hint.style.display = 'none';
  window.print();
  if (hint) hint.style.display = 'flex';
}
// Auto-print when ready
printNow();
</script>
</body>
</html>`;
};


/* ── Open the lesson HTML in a new window ── */
export const openLessonPrintWindow = (lesson) => {
  const html = generateLessonHTML(lesson);
  const title = lesson?.content?.header?.fiche_title || lesson?.title || 'Fiche_de_cours';

  const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768;

  if (isMobile) {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return;
  }

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank', 'width=960,height=720,scrollbars=yes');
  if (!win) {
    URL.revokeObjectURL(url);
    alert('Veuillez autoriser les popups pour ce site.');
    return;
  }
  win.addEventListener('load', () => URL.revokeObjectURL(url), { once: true });
};
