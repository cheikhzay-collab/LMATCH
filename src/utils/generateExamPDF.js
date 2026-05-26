import katex from 'katex';

/* ── Math renderer: LaTeX → HTML string ── */
const renderMath = (text) => {
  if (!text) return '';
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  
  // 1. Extract all math blocks
  const mathBlocks = [];
  const mathRegex = /(\$\$[\s\S]+?\$\$|\$[^\$\n]+?\$)/g;
  
  let placeholderIndex = 0;
  const textWithPlaceholders = text.replace(mathRegex, (match) => {
    const placeholder = `___MATH_BLOCK_PLACEHOLDER_${placeholderIndex}___`;
    mathBlocks.push({ placeholder, original: match });
    placeholderIndex++;
    return placeholder;
  });
  
  // 2. Escape HTML and render markdown on text containing placeholders
  let escapedText = esc(textWithPlaceholders);
  escapedText = escapedText.replace(/\*\*([\s\S]+?)\*\*/g, '<strong>$1</strong>');
  escapedText = escapedText.replace(/\*([\s\S]+?)\*/g, '<em>$1</em>');
  
  // 3. Restore and render KaTeX for each placeholder
  let finalHtml = escapedText;
  mathBlocks.forEach(({ placeholder, original }) => {
    let renderedMath = '';
    if (original.startsWith('$$') && original.endsWith('$$')) {
      try {
        renderedMath = katex.renderToString(original.slice(2, -2), { displayMode: true, throwOnError: false });
      } catch {
        renderedMath = `<code>${original}</code>`;
      }
    } else if (original.startsWith('$') && original.endsWith('$')) {
      try {
        renderedMath = katex.renderToString(original.slice(1, -1), { displayMode: false, throwOnError: false });
      } catch {
        renderedMath = `<code>${original}</code>`;
      }
    }
    finalHtml = finalHtml.replace(placeholder, () => renderedMath);
  });
  
  return finalHtml;
};

/* ── Group questions by subject ── */
const groupBySubject = (questions) => {
  const groups = {};
  questions.forEach(q => {
    const s = q.subject || q.topic || 'Général';
    if (!groups[s]) groups[s] = [];
    groups[s].push(q);
  });
  return groups;
};

/* ── Normalize option text ── */
const optText = (opt) => {
  const raw = typeof opt === 'string' ? opt : (opt?.text || '');
  return raw.replace(/^[A-E][).]\s*/i, '');
};

const LETTERS = ['A','B','C','D','E'];

const getThemeClass = (subj) => {
  const norm = (subj || '').toLowerCase().trim();
  if (norm.includes('math') || norm.includes('analyse') || norm.includes('alg') || norm.includes('géo')) return 'theme-math';
  if (norm.includes('phys')) return 'theme-physique';
  if (norm.includes('chim')) return 'theme-chimie';
  if (norm.includes('svt') || norm.includes('bio') || norm.includes('géol')) return 'theme-svt';
  if (norm.includes('fran') || norm.includes('lang') || norm.includes('ang') || norm.includes('arab')) return 'theme-francais';
  return 'theme-general';
};

const getOptionsLayoutClass = (options) => {
  if (!options || options.length === 0) return 'opts-1col';
  let maxLength = 0;
  options.forEach(opt => {
    const raw = typeof opt === 'string' ? opt : (opt?.text || '');
    const clean = raw.replace(/^[A-E][).]\s*/i, '');
    if (clean.length > maxLength) {
      maxLength = clean.length;
    }
  });

  if (maxLength < 15) {
    return options.length === 5 ? 'opts-5col' : 'opts-4col';
  } else if (maxLength < 40) {
    return 'opts-2col';
  } else {
    return 'opts-1col';
  }
};

/* ═══════════════════════════════════════════════
   1. SUJET BLANC — Exam Paper
   ═══════════════════════════════════════════════ */
export const generateSubjectHTML = (examTitle, school, year, questions, settings = {}) => {
  let profName = settings.profName || '';
  let profPhone = settings.profPhone || '';
  let profSite = settings.profSite || 'www.lconq.ma';
  const showCover = settings.showCover !== undefined ? settings.showCover : true;
  const showPageNumbers = settings.showPageNumbers !== undefined ? settings.showPageNumbers : true;
  const startPage = settings.startPage !== undefined ? settings.startPage : 1;
  const examId = settings.examId || 'PREVIEW';

  if (typeof window !== 'undefined' && window.localStorage) {
    if (!profName) profName = localStorage.getItem('profName') || '';
    if (!profPhone) profPhone = localStorage.getItem('profPhone') || '';
    if (!profSite) profSite = localStorage.getItem('profSite') || 'www.lconq.ma';
  }

  const siteUrl = profSite;
  const copyrightLine = profName
    ? `© ${new Date().getFullYear()} L'Conq × ${profName}. Tous droits réservés.`
    : `© ${new Date().getFullYear()} L'Conq. Tous droits réservés.`;

  // QR URLs:
  // Compact grid QR code:
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(`lconq://exam/${examTitle}`)}`;
  
  // Premium OMR sheet QR code JSON payload:
  const premiumQrPayload = JSON.stringify({
    examId: examId,
    examName: examTitle,
    school: school,
    studentId: 'anonymous',
    qCount: questions.length,
    generated: new Date().toISOString()
  });
  const premiumQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(premiumQrPayload)}`;

  const groups = groupBySubject(questions);

  /* Compact OMR Grid rows (4 options: A, B, C, D) */
  const cHalf = Math.ceil(questions.length / 2);
  const cCol1 = questions.slice(0, cHalf);
  const cCol2 = questions.slice(cHalf);
  const compactOmrRows = cCol1.map((q, i) => {
    const q2 = cCol2[i];
    const num1 = String(q.question_number || (i + 1)).padStart(2, '0');
    const num2 = q2 ? String(q2.question_number || (cHalf + i + 1)).padStart(2, '0') : '';
    const bubbles = '<td><div class="c-b"></div></td><td><div class="c-b"></div></td><td><div class="c-b"></div></td><td><div class="c-b"></div></td>';
    return `<tr>
      <td class="c-nn">${num1}</td>${bubbles}
      <td class="c-sep"></td>
      ${q2 ? `<td class="c-nn">${num2}</td>${bubbles}` : '<td colspan="5"></td>'}
    </tr>`;
  }).join('');

  /* Premium OMR Sheet rows (5 options: A, B, C, D, E) */
  const pCount = questions.length;
  const pHalf = Math.ceil(pCount / 2);
  const pOpts = ['A', 'B', 'C', 'D', 'E'];

  let premiumOmrHtml = '';
  
  // Left Column
  premiumOmrHtml += '<div class="omr-column col-1">';
  premiumOmrHtml += `
    <div class="omr-col-header">
      <span class="lbl-num">N°</span>
      ${pOpts.map((o, i) => `<span class="lbl-opt" style="left: ${20 + i * 9 - 2.9}mm;">${o}</span>`).join('')}
    </div>
  `;
  for (let i = 0; i < pHalf; i++) {
    const isAlt = i % 2 === 0 ? ' alt' : '';
    const qNum = String(i + 1).padStart(2, '0');
    const bubblesHtml = pOpts.map((o, oi) => {
      const cx = 20 + oi * 9 - 2.9;
      return `<div class="omr-bubble" style="left: ${cx}mm;">${o}</div>`;
    }).join('');
    premiumOmrHtml += `
      <div class="omr-row${isAlt}">
        <span class="row-num">${qNum}</span>
        ${bubblesHtml}
      </div>
    `;
  }
  premiumOmrHtml += '</div>';

  // Divider
  premiumOmrHtml += '<div class="omr-column-divider"></div>';

  // Right Column
  premiumOmrHtml += '<div class="omr-column col-2">';
  premiumOmrHtml += `
    <div class="omr-col-header">
      <span class="lbl-num">N°</span>
      ${pOpts.map((o, i) => `<span class="lbl-opt" style="left: ${20 + i * 9 - 2.9}mm;">${o}</span>`).join('')}
    </div>
  `;
  for (let i = pHalf; i < pCount; i++) {
    const isAlt = i % 2 === 0 ? ' alt' : '';
    const qNum = String(i + 1).padStart(2, '0');
    const bubblesHtml = pOpts.map((o, oi) => {
      const cx = 20 + oi * 9 - 2.9;
      return `<div class="omr-bubble" style="left: ${cx}mm;">${o}</div>`;
    }).join('');
    premiumOmrHtml += `
      <div class="omr-row${isAlt}">
        <span class="row-num">${qNum}</span>
        ${bubblesHtml}
      </div>
    `;
  }
  premiumOmrHtml += '</div>';

  const usedRows = Math.ceil(pCount / 2);
  const footerY = Math.max(96 + 7 + usedRows * 8.5 + 12, 258);

  const dateStr = new Date().toLocaleDateString('fr-MA');
  const examDuration = `${Math.ceil(questions.length * 1.5)} minutes`;

  const coverHtml = showCover ? `
<div class="cover">
  <div class="cover-frame">
    <div class="cover-logo">L'Conq</div>
    <div class="cover-subtitle">EXAMEN BLANC DE PRÉPARATION</div>
    <div class="cover-divider"></div>
    
    <div class="cover-header-group">
      <div class="cover-tag">Sujet Officiel</div>
      <div class="cover-topic">${examTitle}</div>
      <div class="cover-desc">${school} &nbsp;·&nbsp; Concours Blanc National</div>
    </div>
    
    <div class="cover-stats">
      <div class="cover-stat">
        <div class="num">${questions.length}</div>
        <div class="lbl">Questions</div>
      </div>
      <div class="cover-stat">
        <div class="num">2h00</div>
        <div class="lbl">Durée</div>
      </div>
      <div class="cover-stat">
        <div class="num">${year || '—'}</div>
        <div class="lbl">Année</div>
      </div>
    </div>
    
    <div class="cover-instructions">
      <h3>⚠️ INSTRUCTIONS AUX CANDIDATS :</h3>
      <ul>
        <li>Cette épreuve comporte <strong>${questions.length} questions</strong> à choix multiples.</li>
        <li>Chaque question comporte 5 options (A, B, C, D, E) ou 4 options (A, B, C, D) avec <strong>une seule réponse correcte</strong>.</li>
        <li>Remplissez la grille OMR située à la page suivante avec le plus grand soin.</li>
        <li>Aucune calculatrice n'est autorisée sauf mention contraire explicite.</li>
      </ul>
    </div>

    <div class="cover-prof">
      ${profName ? `Préparé par : <strong>${profName}</strong>${profPhone ? ' · ' + profPhone : ''}` : `<strong>${siteUrl}</strong>`}
    </div>
  </div>
</div>` : '';

  /* Questions HTML */
  const questionsHtml = Object.entries(groups).map(([subject, qs]) => {
    const themeClass = getThemeClass(subject);
    return `
    <div class="subj-section ${themeClass}">
      <div class="section-hdr">${subject.toUpperCase()}</div>
      ${qs.map((q, idx) => {
        const num = q.question_number || (idx + 1);
        const optionsHtml = (q.options || []).map((opt, oi) => {
          const letter = LETTERS[oi] || String(oi + 1);
          return `<div class="opt">
            <span class="opt-badge">${letter}</span>
            <span>${renderMath(optText(opt))}</span>
          </div>`;
        }).join('');

        return `<div class="qcard">
          <div class="card-hdr">
            <span class="qnum">Q${num}</span>
            <span class="src-tag">${subject.toUpperCase()}</span>
          </div>
          <div class="qtext">${renderMath(q.question || '')}</div>
          ${q.image ? `<div style="margin: 6px 0 8px 0; display: block; text-align: center;"><img src="${q.image}" style="max-height: 110px; max-width: 100%; display: inline-block; object-fit: contain;" /></div>` : ''}
          <div class="opts ${getOptionsLayoutClass(q.options)}">${optionsHtml}</div>
        </div>`;
      }).join('')}
    </div>`;
  }).join('');

  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
<title>${examTitle} — Sujet</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/dreampulse/computer-modern-web-font@master/fonts.css">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=STIX+Two+Text:ital,wght@0,400;0,600;0,700;1,400;1,600&display=swap" rel="stylesheet">
<style>
*{box-decoration-break:clone;-webkit-box-decoration-break:clone;box-sizing:border-box;margin:0;padding:0}
body{
  font-family:'Computer Modern Serif','STIX Two Text','Times New Roman',serif;
  color:#111;background:#fff;font-size:11pt;line-height:1.65;
  padding-bottom:1.2cm;
  print-color-adjust:exact;-webkit-print-color-adjust:exact;
  font-feature-settings:'liga' 1,'kern' 1;
}
@page{
  size:A4;
  margin:0.8cm 0 1.0cm 0;
  ${showPageNumbers ? `
  @bottom-left {
    content: "⚡ L'Conq   |   ${examTitle}   |   ${copyrightLine}";
    font-family: 'Inter', sans-serif;
    font-size: 7pt;
    font-weight: 500;
    color: #6b7280;
    margin-left: 1.3cm;
    margin-bottom: 0.35cm;
  }
  @bottom-right {
    content: "${profPhone ? profPhone + '   ·   ' : ''}${siteUrl}   |   Sujet Blanc   |   " counter(page) " / " counter(pages);
    font-family: 'Inter', sans-serif;
    font-size: 7pt;
    font-weight: 600;
    color: #4b5563;
    margin-right: 1.3cm;
    margin-bottom: 0.35cm;
  }
  ` : ''}
}
@page :first {
  @bottom-left { content: none; }
  @bottom-right { content: none; }
}
@page omr-page-layout {
  size: A4;
  margin: 0;
}
html{counter-reset:page ${startPage - 1}}

/* ── PRINT INSTRUCTION OVERLAY ── */
.print-hint{position:fixed;top:0;left:0;right:0;z-index:9999;background:linear-gradient(135deg,#1e3a8a,#0f172a);
  color:#fff;padding:0.9rem 1.5rem;display:flex;align-items:center;justify-content:space-between;
  font-size:9pt;gap:1rem;print-color-adjust:exact;font-family:'Inter',sans-serif}
.print-hint-msg{display:flex;align-items:center;gap:0.75rem}
.print-hint-icon{font-size:1.3rem;flex-shrink:0}
.print-hint-text strong{font-size:9.5pt;color:#93c5fd}
.print-hint-text span{color:rgba(255,255,255,0.7);font-size:8pt}
.hint-badge{background:#2563eb;color:#fff;font-size:7.5pt;font-weight:700;padding:3px 12px;border-radius:20px;
  white-space:nowrap;cursor:pointer;border:none;font-family:inherit;letter-spacing:.5px}
@media print{.print-hint{display:none!important}}

/* ── COVER PAGE ── */
.cover{
  box-sizing:border-box;
  width:100%;
  height:27.5cm;
  padding:1cm;
  page-break-after:always;
  print-color-adjust:exact;
  -webkit-print-color-adjust:exact;
  background:#fff;
  color:#0f172a;
}
.cover-frame{
  border:4px double #0f172a;
  padding:2cm 1.5cm;
  height:100%;
  display:flex;
  flex-direction:column;
  justify-content:space-between;
  align-items:center;
  box-sizing:border-box;
}
.cover-logo{
  font-family:'Computer Modern Serif','STIX Two Text',serif;
  font-size:2.2rem;
  font-weight:bold;
  letter-spacing:6px;
  text-transform:uppercase;
  margin-bottom:0.2rem;
  color:#0f172a;
}
.cover-subtitle{
  font-family:'Inter',sans-serif;
  font-size:0.8rem;
  font-weight:600;
  color:#475569;
  letter-spacing:3px;
  text-transform:uppercase;
  margin-bottom:1.5rem;
}
.cover-divider{
  width:120px;
  height:1.5px;
  background:#0f172a;
  margin:0 auto 2rem;
}
.cover-header-group{
  text-align:center;
}
.cover-tag{
  font-family:'Inter',sans-serif;
  font-size:0.75rem;
  font-weight:800;
  letter-spacing:3px;
  text-transform:uppercase;
  color:#475569;
  border:1px solid #cbd5e1;
  padding:4px 12px;
  border-radius:4px;
  display:inline-block;
  margin-bottom:1rem;
}
.cover-topic{
  font-family:'Computer Modern Serif','STIX Two Text',serif;
  font-size:2.4rem;
  font-weight:bold;
  line-height:1.25;
  margin:0.5rem 0 1rem;
  color:#0f172a;
}
.cover-desc{
  font-family:'Computer Modern Serif','STIX Two Text',serif;
  font-size:1rem;
  color:#475569;
  font-style:italic;
  margin-bottom:2rem;
}
.cover-stats{
  display:flex;
  gap:2.5rem;
  justify-content:center;
  margin:1rem 0;
  width:100%;
}
.cover-stat{
  border:1px solid #cbd5e1;
  border-radius:6px;
  padding:12px 24px;
  min-width:110px;
  text-align:center;
  background:#f8fafc;
}
.cover-stat .num{
  font-family:'Computer Modern Serif','STIX Two Text',serif;
  font-size:1.6rem;
  font-weight:bold;
  color:#0f172a;
}
.cover-stat .lbl{
  font-family:'Inter',sans-serif;
  font-size:0.7rem;
  color:#64748b;
  text-transform:uppercase;
  letter-spacing:1px;
  margin-top:0.2rem;
  font-weight:600;
}
.cover-instructions{
  text-align:left;
  background:#f8fafc;
  border:1.5px solid #cbd5e1;
  border-radius:8px;
  padding:1.5rem;
  width:100%;
  max-width:550px;
  margin:1rem auto;
  font-family:'Inter',sans-serif;
  font-size:9pt;
  line-height:1.6;
}
.cover-instructions h3{
  font-size:10pt;
  font-weight:bold;
  margin-bottom:0.75rem;
  color:#0f172a;
  letter-spacing:0.5px;
}
.cover-instructions ul{
  list-style-type:disc;
  padding-left:1.2rem;
}
.cover-instructions li{
  margin-bottom:0.5rem;
  color:#334155;
}
.cover-prof{
  font-family:'Computer Modern Serif','STIX Two Text',serif;
  margin-top:1.5rem;
  font-size:0.95rem;
  color:#334155;
  font-style:italic;
}
.cover-prof strong{
  color:#0f172a;
  font-style:normal;
}

/* ── STANDALONE PREMIUM OMR SHEET ── */
.omr-page {
  page: omr-page-layout;
  position: relative;
  width: 210mm;
  height: 297mm;
  box-sizing: border-box;
  background: #fff;
  page-break-after: always;
  break-inside: avoid;
  page-break-inside: avoid;
}
.omr-marker {
  position: absolute;
  width: 6mm;
  height: 6mm;
  box-sizing: border-box;
}
.omr-marker.tl {
  left: 14mm;
  top: 10mm;
  border-top: 0.6mm solid #7c3aed;
  border-left: 0.6mm solid #7c3aed;
}
.omr-marker.tl::after {
  content: '';
  position: absolute;
  left: 0.6mm;
  top: 0.6mm;
  width: 0.8mm;
  height: 0.8mm;
  background: #7c3aed;
  border-radius: 50%;
}
.omr-marker.tr {
  right: 14mm;
  top: 10mm;
  border-top: 0.6mm solid #7c3aed;
  border-right: 0.6mm solid #7c3aed;
}
.omr-marker.tr::after {
  content: '';
  position: absolute;
  right: 0.6mm;
  top: 0.6mm;
  width: 0.8mm;
  height: 0.8mm;
  background: #7c3aed;
  border-radius: 50%;
}
.omr-marker.bl {
  left: 14mm;
  bottom: 10mm;
  border-bottom: 0.6mm solid #7c3aed;
  border-left: 0.6mm solid #7c3aed;
}
.omr-marker.bl::after {
  content: '';
  position: absolute;
  left: 0.6mm;
  bottom: 0.6mm;
  width: 0.8mm;
  height: 0.8mm;
  background: #7c3aed;
  border-radius: 50%;
}
.omr-marker.br {
  right: 14mm;
  bottom: 10mm;
  border-bottom: 0.6mm solid #7c3aed;
  border-right: 0.6mm solid #7c3aed;
}
.omr-marker.br::after {
  content: '';
  position: absolute;
  right: 0.6mm;
  bottom: 0.6mm;
  width: 0.8mm;
  height: 0.8mm;
  background: #7c3aed;
  border-radius: 50%;
}

.omr-header {
  position: absolute;
  top: 12mm;
  left: 14mm;
  width: 182mm;
  height: 34mm;
  background: #1a1a2e;
  border-radius: 3mm;
  color: #fff;
  padding: 6mm;
}
.omr-header-logo {
  font-family: 'Inter', sans-serif;
  font-size: 20pt;
  font-weight: bold;
  line-height: 1;
  display: flex;
  align-items: center;
}
.omr-header-logo span {
  width: 2.4mm;
  height: 2.4mm;
  background: #f59e0b;
  border-radius: 50%;
  display: inline-block;
  margin-left: 1.5mm;
  margin-top: 1.5mm;
}
.omr-header-subtitle {
  font-family: 'Inter', sans-serif;
  font-size: 8.5pt;
  color: #bfc4d2;
  margin-top: 2mm;
  line-height: 1;
}
.omr-header-title {
  font-family: 'Inter', sans-serif;
  font-size: 10.5pt;
  font-weight: bold;
  color: #fff;
  margin-top: 4.5mm;
  max-width: 130mm;
  line-height: 1.3;
}
.omr-header-qr {
  position: absolute;
  right: 4mm;
  top: 4mm;
  width: 26mm;
  height: 26mm;
  background: #fff;
  border-radius: 1mm;
  padding: 1mm;
}
.omr-header-qr img {
  width: 100%;
  height: 100%;
  display: block;
}

.omr-card {
  position: absolute;
  top: 51mm;
  height: 14mm;
  background: #ffffff;
  border: 0.3mm solid #e2e8f0;
  border-radius: 2mm;
  font-family: 'Inter', sans-serif;
  padding: 1.5mm 3mm;
}
.omr-card-label {
  font-size: 7.5pt;
  font-weight: bold;
  color: #64748b;
  line-height: 1;
}
.omr-card-val {
  font-size: 9pt;
  font-weight: bold;
  color: #1f2937;
  margin-top: 1.5mm;
  line-height: 1;
}
.omr-card.score {
  background: #f0fdf4;
  border: 0.4mm solid #10a34a;
}
.omr-card.score .omr-card-label {
  color: #10a34a;
}
.omr-card.score .omr-card-val {
  color: #10a34a;
  font-size: 9.5pt;
}

.omr-instructions {
  position: absolute;
  left: 14mm;
  top: 69mm;
  width: 182mm;
  height: 10mm;
  background: #faf5ff;
  border-radius: 1.5mm;
  overflow: hidden;
  padding-left: 5mm;
  display: flex;
  flex-direction: column;
  justify-content: center;
  font-family: 'Inter', sans-serif;
}
.omr-instructions-bar {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 2.5mm;
  background: #7c3aed;
}
.omr-instructions-title {
  font-size: 7.5pt;
  font-weight: bold;
  color: #7c3aed;
  line-height: 1.2;
}
.omr-instructions-text {
  font-size: 7pt;
  color: #1f2937;
  line-height: 1.2;
  margin-top: 0.5mm;
}

.omr-legend {
  position: absolute;
  left: 14mm;
  top: 82mm;
  height: 10mm;
  display: flex;
  align-items: center;
  gap: 6mm;
  font-family: 'Inter', sans-serif;
}
.omr-legend-title {
  font-size: 7pt;
  font-weight: bold;
  color: #64748b;
  text-transform: uppercase;
}
.omr-legend-item {
  display: flex;
  align-items: center;
  gap: 2mm;
}
.omr-legend-bubble {
  width: 5.6mm;
  height: 5.6mm;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 5.5pt;
  font-weight: bold;
}
.omr-legend-bubble.ok {
  background: #1a1a2e;
  color: #fff;
}
.omr-legend-bubble.empty {
  border: 0.3mm solid #64748b;
  color: #64748b;
}
.omr-legend-label {
  font-size: 7pt;
  font-weight: bold;
}
.omr-legend-label.ok {
  color: #10a34a;
}
.omr-legend-label.empty {
  color: #64748b;
  font-weight: normal;
}

.omr-columns {
  position: absolute;
  left: 14mm;
  top: 96mm;
  width: 182mm;
  display: flex;
  font-family: 'Helvetica', sans-serif;
}
.omr-column-divider {
  position: absolute;
  left: 91mm;
  top: 0;
  bottom: 0;
  width: 0.3mm;
  background: #e2e8f0;
}
.omr-column {
  width: 89mm;
  position: relative;
}
.omr-column.col-2 {
  margin-left: 2mm;
}

.omr-col-header {
  height: 7mm;
  background: #7c3aed;
  border-radius: 1.5mm;
  position: relative;
  display: flex;
  align-items: center;
  color: #fff;
  font-weight: bold;
  font-size: 7.5pt;
  width: 89mm;
}
.omr-col-header .lbl-num {
  position: absolute;
  left: 3mm;
}
.omr-col-header .lbl-opt {
  position: absolute;
  width: 5.8mm;
  text-align: center;
  font-size: 7.5pt;
}

.omr-row {
  height: 8.5mm;
  position: relative;
  width: 89mm;
  border-bottom: 0.15mm solid #e2e8f0;
  display: flex;
  align-items: center;
}
.omr-row.alt {
  background: #f8f7ff;
}
.omr-row .row-num {
  position: absolute;
  left: 3mm;
  font-size: 8.5pt;
  font-weight: bold;
  color: #1a1a2e;
}
.omr-bubble {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 5.8mm;
  height: 5.8mm;
  border-radius: 50%;
  border: 0.35mm solid #64748b;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 6.2pt;
  font-weight: normal;
  color: #64748b;
}

.omr-footer {
  position: absolute;
  left: 14mm;
  width: 182mm;
  border-top: 0.5mm solid #e2e8f0;
  padding-top: 5.5mm;
  display: flex;
  justify-content: space-between;
  font-family: 'Inter', sans-serif;
}
.omr-footer-text {
  font-size: 7.5pt;
  color: #64748b;
  max-width: 120mm;
  line-height: 1.4;
}
.omr-footer-right {
  text-align: right;
}
.omr-footer-exam-id {
  font-size: 7pt;
  font-weight: bold;
  color: #1a1a2e;
}
.omr-footer-brand {
  font-size: 6pt;
  color: #64748b;
  margin-top: 1mm;
}

/* ── COMPACT OMR GRID STYLES (Isolés avec .c- prefix) ── */
.c-hdr {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: .3cm 0 .2cm 0;
  border-bottom: 2.5px solid #1a56db;
}
.c-logo {
  font-size: 18pt;
  font-weight: 900;
  color: #1a56db;
  font-family: 'Inter', sans-serif;
}
.c-logo span {
  color: #f59e0b;
}
.c-htitle {
  text-align: center;
  flex: 1;
  padding: 0 .5cm;
}
.c-htitle h1 {
  font-size: 11pt;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: .5px;
  font-family: 'Inter', sans-serif;
  color: #111;
}
.c-htitle p {
  font-size: 8pt;
  color: #555;
  margin-top: 2px;
  font-family: 'Inter', sans-serif;
}
.c-hright {
  font-size: 8pt;
  color: #555;
  text-align: right;
  line-height: 1.5;
  font-family: 'Inter', sans-serif;
}
.c-instruct {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 3px;
  padding: 5px 8px;
  margin: .2cm 0;
  font-size: 8pt;
  color: #444;
  font-family: 'Inter', sans-serif;
}
.c-omr-wrap {
  display: flex;
  gap: .6cm;
  align-items: flex-start;
  padding: .2cm 0;
  border-bottom: 2px dashed #ccc;
  margin-bottom: .4cm;
}
.c-qr-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
}
.c-qr-col img {
  width: 80px;
  height: 80px;
  border: 1px solid #ddd;
  padding: 2px;
  background: #fff;
}
.c-qr-col span {
  font-size: 6.5pt;
  color: #888;
  text-align: center;
  font-family: 'Inter', sans-serif;
  line-height: 1.2;
}
.c-omr-col {
  flex: 2;
}
.c-omr-title {
  font-size: 8.5pt;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #1a56db;
  margin-bottom: 4px;
  font-family: 'Inter', sans-serif;
}
.c-omr-table {
  border-collapse: collapse;
  font-size: 7.5pt;
  width: 100%;
}
.c-omr-table th {
  background: #1a56db;
  color: #fff;
  padding: 2px 4px;
  text-align: center;
  font-weight: bold;
}
.c-omr-table td {
  padding: 1.5px 4px;
  text-align: center;
  border: 1px solid #ddd;
}
.c-nn {
  font-weight: bold;
  background: #f8f9fa;
  font-size: 7pt;
  color: #1a56db;
}
.c-b {
  width: 11px;
  height: 11px;
  border: 1.2px solid #333;
  border-radius: 50%;
  margin: 0 auto;
}
.c-sep {
  width: 5px;
  background: #f0f0f0;
  border: none !important;
}
.c-stu-box {
  flex: 1.2;
  border: 1.5px solid #444;
  border-radius: 4px;
  padding: 6px 8px;
  background: #fff;
}
.c-stu-field {
  margin-bottom: 6px;
}
.c-stu-field label {
  font-size: 7pt;
  font-weight: bold;
  display: block;
  margin-bottom: 1px;
  color: #333;
  font-family: 'Inter', sans-serif;
}
.c-stu-line {
  border-bottom: 1px solid #444;
  height: 14px;
}

/* ── COLOR THEMES PER SUBJECT ── */
.theme-math {
  --primary: #2563eb;
  --dark: #1e3a8a;
  --bg: #eff6ff;
  --border: #bfdbfe;
  --text: #1e3a8a;
}
.theme-physique {
  --primary: #0d9488;
  --dark: #0f766e;
  --bg: #f0fdfa;
  --border: #99f6e4;
  --text: #115e59;
}
.theme-chimie {
  --primary: #7c3aed;
  --dark: #6d28d9;
  --bg: #f5f3ff;
  --border: #ddd6fe;
  --text: #5b21b6;
}
.theme-svt {
  --primary: #16a34a;
  --dark: #15803d;
  --bg: #f0fdf4;
  --border: #bbf7d0;
  --text: #166534;
}
.theme-francais {
  --primary: #ea580c;
  --dark: #c2410c;
  --bg: #fff7ed;
  --border: #fed7aa;
  --text: #9a3412;
}
.theme-general {
  --primary: #4f46e5;
  --dark: #4338ca;
  --bg: #eef2ff;
  --border: #c7d2fe;
  --text: #3730a3;
}

/* ── CONTENT ── */
.content{padding:0.5cm 1.3cm 0.3cm}
.section-hdr{
  font-family:'Computer Modern Serif','STIX Two Text',serif;
  font-size:13pt;
  font-weight:bold;
  letter-spacing:1px;
  text-transform:uppercase;
  color:#0f172a;
  text-align:center;
  border-top:1.5px solid #0f172a;
  border-bottom:1.5px solid #0f172a;
  padding:6px 0;
  margin:2.2rem 0 1.2rem 0;
  display:block;
  width:100%;
  print-color-adjust:exact;
  -webkit-print-color-adjust:exact;
}

.qcard{
  border:1px solid #e2e8f0;
  border-left:4px solid var(--primary,#cbd5e1);
  border-radius:10px;
  padding:16px 20px;
  margin-bottom:20px;
  background:#ffffff;
  box-shadow:0 1px 3px 0 rgba(0, 0, 0, 0.04),0 1px 2px 0 rgba(0, 0, 0, 0.02);
}
.card-hdr{
  display:flex;
  align-items:center;
  gap:12px;
  margin-bottom:12px;
  padding-bottom:8px;
  border-bottom:1px solid #f1f5f9;
  flex-wrap:wrap;
  break-inside:avoid;
  page-break-inside:avoid;
}
.qnum{
  font-family:'Inter',sans-serif;
  background:var(--primary,#4f46e5);
  color:#ffffff !important;
  font-size:8pt;
  font-weight:800;
  padding:3px 10px;
  border-radius:4px;
  letter-spacing:0.5px;
  text-transform:uppercase;
  print-color-adjust:exact;
  -webkit-print-color-adjust:exact;
}
.src-tag{
  font-family:'Inter',sans-serif;
  background:#f1f5f9;
  color:#475569;
  font-size:7pt;
  font-weight:700;
  padding:3px 9px;
  border-radius:4px;
  border:1px solid #cbd5e1;
  letter-spacing:0.5px;
  text-transform:uppercase;
  print-color-adjust:exact;
  -webkit-print-color-adjust:exact;
}
.qtext{
  font-family:'Computer Modern Serif','STIX Two Text','Times New Roman',serif;
  font-size:11.5pt;
  font-weight:500;
  line-height:1.65;
  color:#1e293b;
  margin-bottom:14px;
  break-inside:avoid;
  page-break-inside:avoid;
}
.opts{
  display:grid;
  gap:8px 24px;
  padding-left:0;
  margin-bottom:4px;
  break-inside:avoid;
  page-break-inside:avoid;
}
.opts-5col {
  grid-template-columns: repeat(5, 1fr);
}
.opts-4col {
  grid-template-columns: repeat(4, 1fr);
}
.opts-2col {
  grid-template-columns: repeat(2, 1fr);
}
.opts-1col {
  grid-template-columns: 1fr;
}
@media (max-width: 600px) {
  .opts-5col, .opts-4col, .opts-2col {
    grid-template-columns: 1fr;
  }
}
.opt{
  display:flex;
  align-items:center;
  gap:12px;
  font-size:10.5pt;
  color:#334155;
  padding:6px 12px;
  border-radius:8px;
  border:1px solid transparent;
}
.opt-badge{
  font-family:'Inter',sans-serif;
  font-weight:700;
  font-size:8.5pt;
  width:24px;
  height:24px;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  border-radius:50%;
  background:#ffffff;
  color:#64748b;
  border:1px solid #cbd5e1;
  flex-shrink:0;
}

@media print{
  .cover{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  ${!showCover ? '.cover{display:none!important}' : ''}
}
.katex{font-size:1.05em}.katex-display{margin:3px 0}
</style></head><body>

<!-- PRE-PRINT INSTRUCTION BANNER -->
<div class="print-hint" id="printHint">
  <div class="print-hint-msg">
    <span class="print-hint-icon">🖨️</span>
    <div class="print-hint-text">
      <strong>Pour un résultat professionnel :</strong><br>
      <span>Dans la boîte d'impression → <b>Plus de paramètres</b> → décochez <b>"En-têtes et pieds de page"</b></span>
    </div>
  </div>
  <button class="hint-badge" onclick="document.getElementById('printHint').style.display='none'">✕ Fermer</button>
</div>

${coverHtml}

<!-- STANDALONE PREMIUM OMR SHEET PAGE -->
<div class="omr-page">
  <!-- Crop marks / Corner markers -->
  <div class="omr-marker tl"></div>
  <div class="omr-marker tr"></div>
  <div class="omr-marker bl"></div>
  <div class="omr-marker br"></div>

  <!-- Navy Header Band -->
  <div class="omr-header">
    <div class="omr-header-logo">L'Conq<span></span></div>
    <div class="omr-header-subtitle">Feuille de réponses officielle · Correction par Intelligence Artificielle</div>
    <div class="omr-header-title">${school} — ${examTitle} ${year || ''}</div>
    <div class="omr-header-qr">
      <img src="${premiumQrUrl}" alt="QR Code"/>
    </div>
  </div>

  <!-- Info Cards -->
  <div class="omr-card" style="left: 14mm; width: 70mm;">
    <div class="omr-card-label">NOM &amp; PRÉNOM DU CANDIDAT</div>
    <div class="omr-card-val">___________________________</div>
  </div>
  <div class="omr-card" style="left: 86mm; width: 35mm;">
    <div class="omr-card-label">DATE DE PASSAGE</div>
    <div class="omr-card-val">${dateStr}</div>
  </div>
  <div class="omr-card" style="left: 123mm; width: 35mm;">
    <div class="omr-card-label">DURÉE</div>
    <div class="omr-card-val">${examDuration}</div>
  </div>
  <div class="omr-card score" style="left: 160mm; width: 36mm;">
    <div class="omr-card-label">SCORE FINAL</div>
    <div class="omr-card-val">____ / ${questions.length}</div>
  </div>

  <!-- Instructions Bar -->
  <div class="omr-instructions">
    <div class="omr-instructions-bar"></div>
    <div class="omr-instructions-title">INFORMATIONS &amp; CONSIGNES IMPORTANTES :</div>
    <div class="omr-instructions-text">· Noircissez complètement le cercle avec un stylo bleu ou noir. &nbsp;&nbsp;· En cas d'erreur, blanchissez proprement le cercle.</div>
  </div>

  <!-- Legend -->
  <div class="omr-legend">
    <span class="omr-legend-title">Exemples de Remplissage :</span>
    <div class="omr-legend-item">
      <div class="omr-legend-bubble ok">A</div>
      <span class="omr-legend-label ok">Correct</span>
    </div>
    <div class="omr-legend-item">
      <div class="omr-legend-bubble empty">B</div>
      <span class="omr-legend-label empty">Vide</span>
    </div>
  </div>

  <!-- OMR Columns -->
  <div class="omr-columns">
    ${premiumOmrHtml}
  </div>

  <!-- Footer -->
  <div class="omr-footer" style="top: ${footerY}mm;">
    <div class="omr-footer-text">Après avoir terminé, scannez cette feuille via l'application L'Conq pour obtenir une correction instantanée.</div>
    <div class="omr-footer-right">
      <div class="omr-footer-exam-id">EXAM ID: ${examId.slice(0, 8).toUpperCase()}</div>
      <div class="omr-footer-brand">lconq.ma · IA OMR Engine v2.0</div>
    </div>
  </div>
</div>

<!-- CONTENT -->
<div class="content">
  <!-- Compact OMR grid scanner at the top of the questions section -->
  <div class="c-hdr">
    <div class="c-logo">L'<span>Conq</span></div>
    <div class="c-htitle">
      <h1>${examTitle}</h1>
      <p>${school} &nbsp;·&nbsp; ${year || ''} &nbsp;·&nbsp; ${questions.length} Questions &nbsp;·&nbsp; Durée : 2h</p>
    </div>
    <div class="c-hright">Date : ___/___/______<br>Note : _____ / ${questions.length}</div>
  </div>
  <div class="c-instruct">⚠️ <b>Consignes :</b> Une seule réponse correcte par question. Noircissez la bulle correspondante dans la grille ci-dessous. Toute bulle non noircie ou noircie plusieurs fois = réponse incorrecte.</div>
  <div class="c-omr-wrap">
    <div class="c-qr-col">
      <img src="${qrUrl}" alt="QR"/>
      <span>Scanner avec<br>L'Conq App</span>
    </div>
    <div class="c-omr-col">
      <div class="c-omr-title">📋 Grille de Réponses OMR</div>
      <table class="c-omr-table">
        <thead>
          <tr>
            <th>N°</th><th>A</th><th>B</th><th>C</th><th>D</th>
            <th class="c-sep"></th>
            <th>N°</th><th>A</th><th>B</th><th>C</th><th>D</th>
          </tr>
        </thead>
        <tbody>${compactOmrRows}</tbody>
      </table>
    </div>
    <div class="c-stu-box">
      <div class="c-stu-field"><label>Nom &amp; Prénom</label><div class="c-stu-line"></div></div>
      <div class="c-stu-field"><label>CNE / Matricule</label><div class="c-stu-line"></div></div>
      <div class="c-stu-field"><label>Établissement</label><div class="c-stu-line"></div></div>
      <div class="c-stu-field"><label>Filière</label><div class="c-stu-line"></div></div>
    </div>
  </div>

  ${questionsHtml}
</div>

<script>
async function printWhenReady() {
  await document.fonts.ready;
  await new Promise(r => setTimeout(r, 1000));
  var hint = document.getElementById('printHint');
  if (hint) hint.style.display = 'none';
  window.print();
  if (hint) hint.style.display = 'flex';
}
printWhenReady();
</script>
</body></html>`;
};

/* ═══════════════════════════════════════════════
   2. GUIDE DES ASTUCES — Correction Book
   ═══════════════════════════════════════════════ */
export const generateCorrectionHTML = (examTitle, school, year, questions, settings = {}) => {
  let profName = settings.profName || '';
  let profPhone = settings.profPhone || '';
  let profSite = settings.profSite || 'www.lconq.ma';
  const showCover = settings.showCover !== undefined ? settings.showCover : true;
  const showPageNumbers = settings.showPageNumbers !== undefined ? settings.showPageNumbers : true;
  const startPage = settings.startPage !== undefined ? settings.startPage : 1;
  const showTricks = settings.showTricks !== undefined ? settings.showTricks : true;

  if (typeof window !== 'undefined' && window.localStorage) {
    if (!profName) profName = localStorage.getItem('profName') || '';
    if (!profPhone) profPhone = localStorage.getItem('profPhone') || '';
    if (!profSite) profSite = localStorage.getItem('profSite') || 'www.lconq.ma';
  }

  const siteUrl = profSite;
  const copyrightLine = profName
    ? `© ${new Date().getFullYear()} L'Conq × ${profName}. Tous droits réservés.`
    : `© ${new Date().getFullYear()} L'Conq. Tous droits réservés.`;

  const examId = settings.examId || 'PREVIEW';
  const dateStr = new Date().toLocaleDateString('fr-MA');
  const examDuration = `${Math.ceil(questions.length * 1.5)} minutes`;

  const premiumQrPayload = JSON.stringify({
    examId: examId,
    examName: examTitle,
    school: school,
    studentId: 'anonymous',
    qCount: questions.length,
    generated: new Date().toISOString()
  });
  const premiumQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(premiumQrPayload)}`;

  const pCount = questions.length;
  const pHalf = Math.ceil(pCount / 2);
  const pOpts = ['A', 'B', 'C', 'D', 'E'];

  let premiumOmrHtml = '';
  
  // Left Column
  premiumOmrHtml += '<div class="omr-column col-1">';
  premiumOmrHtml += `
    <div class="omr-col-header">
      <span class="lbl-num">N°</span>
      ${pOpts.map((o, i) => `<span class="lbl-opt" style="left: ${20 + i * 9 - 2.9}mm;">${o}</span>`).join('')}
    </div>
  `;
  for (let i = 0; i < pHalf; i++) {
    const isAlt = i % 2 === 0 ? ' alt' : '';
    const qNum = String(i + 1).padStart(2, '0');
    const correctLetter = questions[i]?.correct_answer || '';
    const bubblesHtml = pOpts.map((o, oi) => {
      const cx = 20 + oi * 9 - 2.9;
      const isCorrect = correctLetter === o;
      const isCorrectClass = isCorrect ? ' correct-bubble-filled' : '';
      return `<div class="omr-bubble${isCorrectClass}" style="left: ${cx}mm;">${o}</div>`;
    }).join('');
    premiumOmrHtml += `
      <div class="omr-row${isAlt}">
        <span class="row-num">${qNum}</span>
        ${bubblesHtml}
      </div>
    `;
  }
  premiumOmrHtml += '</div>';

  // Divider
  premiumOmrHtml += '<div class="omr-column-divider"></div>';

  // Right Column
  premiumOmrHtml += '<div class="omr-column col-2">';
  premiumOmrHtml += `
    <div class="omr-col-header">
      <span class="lbl-num">N°</span>
      ${pOpts.map((o, i) => `<span class="lbl-opt" style="left: ${20 + i * 9 - 2.9}mm;">${o}</span>`).join('')}
    </div>
  `;
  for (let i = pHalf; i < pCount; i++) {
    const isAlt = i % 2 === 0 ? ' alt' : '';
    const qNum = String(i + 1).padStart(2, '0');
    const correctLetter = questions[i]?.correct_answer || '';
    const bubblesHtml = pOpts.map((o, oi) => {
      const cx = 20 + oi * 9 - 2.9;
      const isCorrect = correctLetter === o;
      const isCorrectClass = isCorrect ? ' correct-bubble-filled' : '';
      return `<div class="omr-bubble${isCorrectClass}" style="left: ${cx}mm;">${o}</div>`;
    }).join('');
    premiumOmrHtml += `
      <div class="omr-row${isAlt}">
        <span class="row-num">${qNum}</span>
        ${bubblesHtml}
      </div>
    `;
  }
  premiumOmrHtml += '</div>';

  const usedRows = Math.ceil(pCount / 2);
  const footerY = Math.max(96 + 7 + usedRows * 8.5 + 12, 258);

  const coverHtml = showCover ? `
<div class="cover">
  <div class="cover-frame">
    <div class="cover-logo">L'Conq</div>
    <div class="cover-subtitle">EXAMEN BLANC — CORRIGÉ DÉTAILLÉ</div>
    <div class="cover-divider"></div>
    
    <div class="cover-header-group">
      <div class="cover-tag">Guide des Astuces</div>
      <div class="cover-topic">${examTitle}</div>
      <div class="cover-desc">${school} &nbsp;·&nbsp; Solutions Détaillées &amp; Raccourcis</div>
    </div>
    
    <div class="cover-stats">
      <div class="cover-stat">
        <div class="num">${questions.length}</div>
        <div class="lbl">Questions</div>
      </div>
      <div class="cover-stat">
        <div class="num">100%</div>
        <div class="lbl">Résolu</div>
      </div>
      <div class="cover-stat">
        <div class="num">${year || '—'}</div>
        <div class="lbl">Année</div>
      </div>
    </div>
    
    <div class="cover-instructions">
      <h3>📚 CONTENU DE CE GUIDE :</h3>
      <ul>
        <li>Correction rigoureuse de chaque QCM avec rappel des notions.</li>
        <li><strong>⭐ RÈGLES DE L'ART :</strong> Les techniques fondamentales et astuces de cours essentielles.</li>
        <li><strong>⚡ COUPS DE GRÂCE :</strong> Les raccourcis mathématiques et astuces d'élimination pour gagner du temps.</li>
      </ul>
    </div>

    <div class="cover-prof">
      ${profName ? `Rédigé par : <strong>${profName}</strong>${profPhone ? ' · ' + profPhone : ''}` : `<strong>${siteUrl}</strong>`}
    </div>
  </div>
</div>` : '';

  const cardsHtml = questions.map((q, i) => {
    const num = q.question_number || (i + 1);
    const subject = q.subject || q.topic || 'Général';
    const themeClass = getThemeClass(subject);
    
    const optionsHtml = (q.options || []).map((opt, oi) => {
      const letter = LETTERS[oi] || String(oi + 1);
      const isCorrect = q.correct_answer === letter;
      return `<div class="opt${isCorrect ? ' correct-opt' : ''}">
        <span class="opt-badge${isCorrect ? ' correct-badge' : ''}">${letter}</span>
        <span>${renderMath(optText(opt))}</span>
        ${isCorrect ? '<span class="correct-check">✓</span>' : ''}
      </div>`;
    }).join('');

    return `
    <div class="qcard ${themeClass}">
      <div class="card-hdr">
        <span class="qnum">Q${num}</span>
        <span class="src-tag">${subject.toUpperCase()}</span>
        <span class="ans-badge">Réponse : <b>${q.correct_answer || '?'}</b></span>
      </div>
      <div class="qtext">${renderMath(q.question)}</div>
      ${q.context ? `<div class="ctx-box">📋 ${renderMath(q.context)}</div>` : ''}
      ${q.image ? `<div style="margin: 6px 0 8px 0; display: block; text-align: center;"><img src="${q.image}" style="max-height: 110px; max-width: 100%; display: inline-block; object-fit: contain;" /></div>` : ''}
      <div class="opts ${getOptionsLayoutClass(q.options)}">${optionsHtml}</div>
      ${q.astuce ? `<div class="rule-box">
        <div class="rule-title">⭐ RÈGLE DE L'ART</div>
        <div class="rule-body">${renderMath(q.astuce)}</div>
      </div>` : ''}
      ${showTricks && q.trick ? `<div class="trick-box">
        <div class="trick-title">⚡ COUP DE GRÂCE</div>
        <div class="trick-body">${renderMath(q.trick)}</div>
      </div>` : ''}
    </div>`;
  }).join('');

  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
<title>${examTitle} — Corrigé</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/dreampulse/computer-modern-web-font@master/fonts.css">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=STIX+Two+Text:ital,wght@0,400;0,600;0,700;1,400;1,600&display=swap" rel="stylesheet">
<style>
*{box-decoration-break:clone;-webkit-box-decoration-break:clone;box-sizing:border-box;margin:0;padding:0}
body{
  font-family:'Computer Modern Serif','STIX Two Text','Times New Roman',serif;
  color:#111;background:#fff;font-size:11pt;line-height:1.65;
  padding-bottom:1.2cm;
  print-color-adjust:exact;-webkit-print-color-adjust:exact;
  font-feature-settings:'liga' 1,'kern' 1;
}
@page{
  size:A4;
  margin:0.8cm 0 1.0cm 0;
  ${showPageNumbers ? `
  @bottom-left {
    content: "⚡ L'Conq   |   ${examTitle}   |   ${copyrightLine}";
    font-family: 'Inter', sans-serif;
    font-size: 7pt;
    font-weight: 500;
    color: #6b7280;
    margin-left: 1.3cm;
    margin-bottom: 0.35cm;
  }
  @bottom-right {
    content: "${profPhone ? profPhone + '   ·   ' : ''}${siteUrl}   |   Corrigé & Astuces   |   " counter(page) " / " counter(pages);
    font-family: 'Inter', sans-serif;
    font-size: 7pt;
    font-weight: 600;
    color: #4b5563;
    margin-right: 1.3cm;
    margin-bottom: 0.35cm;
  }
  ` : ''}
}
@page :first {
  @bottom-left { content: none; }
  @bottom-right { content: none; }
}
@page omr-page-layout {
  size: A4;
  margin: 0;
}
html{counter-reset:page ${startPage - 1}}

/* ── PRINT INSTRUCTION OVERLAY ── */
.print-hint{position:fixed;top:0;left:0;right:0;z-index:9999;background:linear-gradient(135deg,#7c3aed,#16213e);
  color:#fff;padding:0.9rem 1.5rem;display:flex;align-items:center;justify-content:space-between;
  font-size:9pt;gap:1rem;print-color-adjust:exact;font-family:'Inter',sans-serif}
.print-hint-msg{display:flex;align-items:center;gap:0.75rem}
.print-hint-icon{font-size:1.3rem;flex-shrink:0}
.print-hint-text strong{font-size:9.5pt;color:#a78bfa}
.print-hint-text span{color:rgba(255,255,255,0.7);font-size:8pt}
.hint-badge{background:#7c3aed;color:#fff;font-size:7.5pt;font-weight:700;padding:3px 12px;border-radius:20px;
  white-space:nowrap;cursor:pointer;border:none;font-family:inherit;letter-spacing:.5px}
@media print{.print-hint{display:none!important}}

/* ── COVER PAGE ── */
.cover{
  box-sizing:border-box;
  width:100%;
  height:27.5cm;
  padding:1cm;
  page-break-after:always;
  print-color-adjust:exact;
  -webkit-print-color-adjust:exact;
  background:#fff;
  color:#0f172a;
}
.cover-frame{
  border:4px double #0f172a;
  padding:2cm 1.5cm;
  height:100%;
  display:flex;
  flex-direction:column;
  justify-content:space-between;
  align-items:center;
  box-sizing:border-box;
}
.cover-logo{
  font-family:'Computer Modern Serif','STIX Two Text',serif;
  font-size:2.2rem;
  font-weight:bold;
  letter-spacing:6px;
  text-transform:uppercase;
  margin-bottom:0.2rem;
  color:#0f172a;
}
.cover-subtitle{
  font-family:'Inter',sans-serif;
  font-size:0.8rem;
  font-weight:600;
  color:#475569;
  letter-spacing:3px;
  text-transform:uppercase;
  margin-bottom:1.5rem;
}
.cover-divider{
  width:120px;
  height:1.5px;
  background:#0f172a;
  margin:0 auto 2rem;
}
.cover-header-group{
  text-align:center;
}
.cover-tag{
  font-family:'Inter',sans-serif;
  font-size:0.75rem;
  font-weight:800;
  letter-spacing:3px;
  text-transform:uppercase;
  color:#475569;
  border:1px solid #cbd5e1;
  padding:4px 12px;
  border-radius:4px;
  display:inline-block;
  margin-bottom:1rem;
}
.cover-topic{
  font-family:'Computer Modern Serif','STIX Two Text',serif;
  font-size:2.4rem;
  font-weight:bold;
  line-height:1.25;
  margin:0.5rem 0 1rem;
  color:#0f172a;
}
.cover-desc{
  font-family:'Computer Modern Serif','STIX Two Text',serif;
  font-size:1rem;
  color:#475569;
  font-style:italic;
  margin-bottom:2rem;
}
.cover-stats{
  display:flex;
  gap:2.5rem;
  justify-content:center;
  margin:1rem 0;
  width:100%;
}
.cover-stat{
  border:1px solid #cbd5e1;
  border-radius:6px;
  padding:12px 24px;
  min-width:110px;
  text-align:center;
  background:#f8fafc;
}
.cover-stat .num{
  font-family:'Computer Modern Serif','STIX Two Text',serif;
  font-size:1.6rem;
  font-weight:bold;
  color:#0f172a;
}
.cover-stat .lbl{
  font-family:'Inter',sans-serif;
  font-size:0.7rem;
  color:#64748b;
  text-transform:uppercase;
  letter-spacing:1px;
  margin-top:0.2rem;
  font-weight:600;
}
.cover-instructions{
  text-align:left;
  background:#f8fafc;
  border:1.5px solid #cbd5e1;
  border-radius:8px;
  padding:1.5rem;
  width:100%;
  max-width:550px;
  margin:1rem auto;
  font-family:'Inter',sans-serif;
  font-size:9pt;
  line-height:1.6;
}
.cover-instructions h3{
  font-size:10pt;
  font-weight:bold;
  margin-bottom:0.75rem;
  color:#0f172a;
  letter-spacing:0.5px;
}
.cover-instructions ul{
  list-style-type:disc;
  padding-left:1.2rem;
}
.cover-instructions li{
  margin-bottom:0.5rem;
  color:#334155;
}
.cover-prof{
  font-family:'Computer Modern Serif','STIX Two Text',serif;
  margin-top:1.5rem;
  font-size:0.95rem;
  color:#334155;
  font-style:italic;
}
.cover-prof strong{
  color:#0f172a;
  font-style:normal;
}

/* ── STANDALONE PREMIUM OMR SHEET ── */
.omr-page {
  page: omr-page-layout;
  position: relative;
  width: 210mm;
  height: 297mm;
  box-sizing: border-box;
  background: #fff;
  page-break-after: always;
  break-inside: avoid;
  page-break-inside: avoid;
}
.omr-marker {
  position: absolute;
  width: 6mm;
  height: 6mm;
  box-sizing: border-box;
}
.omr-marker.tl {
  left: 14mm;
  top: 10mm;
  border-top: 0.6mm solid #7c3aed;
  border-left: 0.6mm solid #7c3aed;
}
.omr-marker.tl::after {
  content: '';
  position: absolute;
  left: 0.6mm;
  top: 0.6mm;
  width: 0.8mm;
  height: 0.8mm;
  background: #7c3aed;
  border-radius: 50%;
}
.omr-marker.tr {
  right: 14mm;
  top: 10mm;
  border-top: 0.6mm solid #7c3aed;
  border-right: 0.6mm solid #7c3aed;
}
.omr-marker.tr::after {
  content: '';
  position: absolute;
  right: 0.6mm;
  top: 0.6mm;
  width: 0.8mm;
  height: 0.8mm;
  background: #7c3aed;
  border-radius: 50%;
}
.omr-marker.bl {
  left: 14mm;
  bottom: 10mm;
  border-bottom: 0.6mm solid #7c3aed;
  border-left: 0.6mm solid #7c3aed;
}
.omr-marker.bl::after {
  content: '';
  position: absolute;
  left: 0.6mm;
  bottom: 0.6mm;
  width: 0.8mm;
  height: 0.8mm;
  background: #7c3aed;
  border-radius: 50%;
}
.omr-marker.br {
  right: 14mm;
  bottom: 10mm;
  border-bottom: 0.6mm solid #7c3aed;
  border-right: 0.6mm solid #7c3aed;
}
.omr-marker.br::after {
  content: '';
  position: absolute;
  right: 0.6mm;
  bottom: 0.6mm;
  width: 0.8mm;
  height: 0.8mm;
  background: #7c3aed;
  border-radius: 50%;
}

.omr-header {
  position: absolute;
  top: 12mm;
  left: 14mm;
  width: 182mm;
  height: 34mm;
  background: #1a1a2e;
  border-radius: 3mm;
  color: #fff;
  padding: 6mm;
}
.omr-header-logo {
  font-family: 'Inter', sans-serif;
  font-size: 20pt;
  font-weight: bold;
  line-height: 1;
  display: flex;
  align-items: center;
}
.omr-header-logo span {
  width: 2.4mm;
  height: 2.4mm;
  background: #f59e0b;
  border-radius: 50%;
  display: inline-block;
  margin-left: 1.5mm;
  margin-top: 1.5mm;
}
.omr-header-subtitle {
  font-family: 'Inter', sans-serif;
  font-size: 8.5pt;
  color: #bfc4d2;
  margin-top: 2mm;
  line-height: 1;
}
.omr-header-title {
  font-family: 'Inter', sans-serif;
  font-size: 10.5pt;
  font-weight: bold;
  color: #fff;
  margin-top: 4.5mm;
  max-width: 130mm;
  line-height: 1.3;
}
.omr-header-qr {
  position: absolute;
  right: 4mm;
  top: 4mm;
  width: 26mm;
  height: 26mm;
  background: #fff;
  border-radius: 1mm;
  padding: 1mm;
}
.omr-header-qr img {
  width: 100%;
  height: 100%;
  display: block;
}

.omr-card {
  position: absolute;
  top: 51mm;
  height: 14mm;
  background: #ffffff;
  border: 0.3mm solid #e2e8f0;
  border-radius: 2mm;
  font-family: 'Inter', sans-serif;
  padding: 1.5mm 3mm;
}
.omr-card-label {
  font-size: 7.5pt;
  font-weight: bold;
  color: #64748b;
  line-height: 1;
}
.omr-card-val {
  font-size: 9pt;
  font-weight: bold;
  color: #1f2937;
  margin-top: 1.5mm;
  line-height: 1;
}
.omr-card.score {
  background: #f0fdf4;
  border: 0.4mm solid #10a34a;
}
.omr-card.score .omr-card-label {
  color: #10a34a;
}
.omr-card.score .omr-card-val {
  color: #10a34a;
  font-size: 9.5pt;
}

.omr-instructions {
  position: absolute;
  left: 14mm;
  top: 69mm;
  width: 182mm;
  height: 10mm;
  background: #faf5ff;
  border-radius: 1.5mm;
  overflow: hidden;
  padding-left: 5mm;
  display: flex;
  flex-direction: column;
  justify-content: center;
  font-family: 'Inter', sans-serif;
}
.omr-instructions-bar {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 2.5mm;
  background: #7c3aed;
}
.omr-instructions-title {
  font-size: 7.5pt;
  font-weight: bold;
  color: #7c3aed;
  line-height: 1.2;
}
.omr-instructions-text {
  font-size: 7pt;
  color: #1f2937;
  line-height: 1.2;
  margin-top: 0.5mm;
}

.omr-legend {
  position: absolute;
  left: 14mm;
  top: 82mm;
  height: 10mm;
  display: flex;
  align-items: center;
  gap: 6mm;
  font-family: 'Inter', sans-serif;
}
.omr-legend-title {
  font-size: 7pt;
  font-weight: bold;
  color: #64748b;
  text-transform: uppercase;
}
.omr-legend-item {
  display: flex;
  align-items: center;
  gap: 2mm;
}
.omr-legend-bubble {
  width: 5.6mm;
  height: 5.6mm;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 5.5pt;
  font-weight: bold;
}
.omr-legend-bubble.ok {
  background: #1a1a2e;
  color: #fff;
}
.omr-legend-bubble.empty {
  border: 0.3mm solid #64748b;
  color: #64748b;
}
.omr-legend-label {
  font-size: 7pt;
  font-weight: bold;
}
.omr-legend-label.ok {
  color: #10a34a;
}
.omr-legend-label.empty {
  color: #64748b;
  font-weight: normal;
}

.omr-columns {
  position: absolute;
  left: 14mm;
  top: 96mm;
  width: 182mm;
  display: flex;
  font-family: 'Helvetica', sans-serif;
}
.omr-column-divider {
  position: absolute;
  left: 91mm;
  top: 0;
  bottom: 0;
  width: 0.3mm;
  background: #e2e8f0;
}
.omr-column {
  width: 89mm;
  position: relative;
}
.omr-column.col-2 {
  margin-left: 2mm;
}

.omr-col-header {
  height: 7mm;
  background: #7c3aed;
  border-radius: 1.5mm;
  position: relative;
  display: flex;
  align-items: center;
  color: #fff;
  font-weight: bold;
  font-size: 7.5pt;
  width: 89mm;
}
.omr-col-header .lbl-num {
  position: absolute;
  left: 3mm;
}
.omr-col-header .lbl-opt {
  position: absolute;
  width: 5.8mm;
  text-align: center;
  font-size: 7.5pt;
}

.omr-row {
  height: 8.5mm;
  position: relative;
  width: 89mm;
  border-bottom: 0.15mm solid #e2e8f0;
  display: flex;
  align-items: center;
}
.omr-row.alt {
  background: #f8f7ff;
}
.omr-row .row-num {
  position: absolute;
  left: 3mm;
  font-size: 8.5pt;
  font-weight: bold;
  color: #1a1a2e;
}
.omr-bubble {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 5.8mm;
  height: 5.8mm;
  border-radius: 50%;
  border: 0.35mm solid #64748b;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 6.2pt;
  font-weight: normal;
  color: #64748b;
}
.omr-bubble.correct-bubble-filled {
  background: #10a34a !important;
  color: #ffffff !important;
  border-color: #10a34a !important;
  font-weight: bold;
  print-color-adjust: exact;
  -webkit-print-color-adjust: exact;
}

.omr-footer {
  position: absolute;
  left: 14mm;
  width: 182mm;
  border-top: 0.5mm solid #e2e8f0;
  padding-top: 5.5mm;
  display: flex;
  justify-content: space-between;
  font-family: 'Inter', sans-serif;
}
.omr-footer-text {
  font-size: 7.5pt;
  color: #64748b;
  max-width: 120mm;
  line-height: 1.4;
}
.omr-footer-right {
  text-align: right;
}
.omr-footer-exam-id {
  font-size: 7pt;
  font-weight: bold;
  color: #1a1a2e;
}
.omr-footer-brand {
  font-size: 6pt;
  color: #64748b;
  margin-top: 1mm;
}

/* ── COLOR THEMES PER SUBJECT ── */
.theme-math {
  --primary: #2563eb;
  --dark: #1e3a8a;
  --bg: #eff6ff;
  --border: #bfdbfe;
  --text: #1e3a8a;
}
.theme-physique {
  --primary: #0d9488;
  --dark: #0f766e;
  --bg: #f0fdfa;
  --border: #99f6e4;
  --text: #115e59;
}
.theme-chimie {
  --primary: #7c3aed;
  --dark: #6d28d9;
  --bg: #f5f3ff;
  --border: #ddd6fe;
  --text: #5b21b6;
}
.theme-svt {
  --primary: #16a34a;
  --dark: #15803d;
  --bg: #f0fdf4;
  --border: #bbf7d0;
  --text: #166534;
}
.theme-francais {
  --primary: #ea580c;
  --dark: #c2410c;
  --bg: #fff7ed;
  --border: #fed7aa;
  --text: #9a3412;
}
.theme-general {
  --primary: #4f46e5;
  --dark: #4338ca;
  --bg: #eef2ff;
  --border: #c7d2fe;
  --text: #3730a3;
}

/* ── CONTENT ── */
.content{padding:0.5cm 1.3cm 0.3cm}
.section-hdr{
  font-family:'Computer Modern Serif','STIX Two Text',serif;
  font-size:13pt;
  font-weight:bold;
  letter-spacing:1px;
  text-transform:uppercase;
  color:#0f172a;
  text-align:center;
  border-top:1.5px solid #0f172a;
  border-bottom:1.5px solid #0f172a;
  padding:6px 0;
  margin:2.2rem 0 1.2rem 0;
  display:block;
  width:100%;
  print-color-adjust:exact;
  -webkit-print-color-adjust:exact;
}

.qcard{
  border:1px solid #e2e8f0;
  border-left:4px solid var(--primary,#cbd5e1);
  border-radius:10px;
  padding:16px 20px;
  margin-bottom:20px;
  background:#ffffff;
  box-shadow:0 1px 3px 0 rgba(0, 0, 0, 0.04),0 1px 2px 0 rgba(0, 0, 0, 0.02);
}
.card-hdr{
  display:flex;
  align-items:center;
  gap:12px;
  margin-bottom:12px;
  padding-bottom:8px;
  border-bottom:1px solid #f1f5f9;
  flex-wrap:wrap;
  break-inside:avoid;
  page-break-inside:avoid;
}
.qnum{
  font-family:'Inter',sans-serif;
  background:var(--primary,#4f46e5);
  color:#ffffff !important;
  font-size:8pt;
  font-weight:800;
  padding:3px 10px;
  border-radius:4px;
  letter-spacing:0.5px;
  text-transform:uppercase;
  print-color-adjust:exact;
  -webkit-print-color-adjust:exact;
}
.src-tag{
  font-family:'Inter',sans-serif;
  background:#f1f5f9;
  color:#475569;
  font-size:7pt;
  font-weight:700;
  padding:3px 9px;
  border-radius:4px;
  border:1px solid #cbd5e1;
  letter-spacing:0.5px;
  text-transform:uppercase;
  print-color-adjust:exact;
  -webkit-print-color-adjust:exact;
}
.ans-badge{
  font-family:'Inter',sans-serif;
  margin-left:auto;
  background:#f0fdf4;
  color:#16a34a;
  padding:3px 10px;
  border-radius:4px;
  font-size:8pt;
  font-weight:800;
  border:1px solid #bbf7d0;
  letter-spacing:0.5px;
  text-transform:uppercase;
  print-color-adjust:exact;
  -webkit-print-color-adjust:exact;
}
.qtext{
  font-family:'Computer Modern Serif','STIX Two Text','Times New Roman',serif;
  font-size:11.5pt;
  font-weight:500;
  line-height:1.65;
  color:#1e293b;
  margin-bottom:14px;
  break-inside:avoid;
  page-break-inside:avoid;
}
.opts{
  display:grid;
  gap:8px 24px;
  padding-left:0;
  margin-bottom:10px;
  break-inside:avoid;
  page-break-inside:avoid;
}
.opts-5col {
  grid-template-columns: repeat(5, 1fr);
}
.opts-4col {
  grid-template-columns: repeat(4, 1fr);
}
.opts-2col {
  grid-template-columns: repeat(2, 1fr);
}
.opts-1col {
  grid-template-columns: 1fr;
}
@media (max-width: 600px) {
  .opts-5col, .opts-4col, .opts-2col {
    grid-template-columns: 1fr;
  }
}
.opt{
  display:flex;
  align-items:center;
  gap:12px;
  font-size:10.5pt;
  color:#334155;
  padding:6px 12px;
  border-radius:8px;
  border:1px solid transparent;
}
.opt-badge{
  font-family:'Inter',sans-serif;
  font-weight:700;
  font-size:8.5pt;
  width:24px;
  height:24px;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  border-radius:50%;
  background:#ffffff;
  color:#64748b;
  border:1px solid #cbd5e1;
  flex-shrink:0;
}
.correct-opt{
  background:#f0fdf4!important;
  border:1px solid #bbf7d0!important;
  color:#15803d!important;
  font-weight:600;
  print-color-adjust:exact;
  -webkit-print-color-adjust:exact;
}
.correct-opt .opt-badge.correct-badge{
  font-family:'Inter',sans-serif;
  background:#10b981 !important;
  border-color:#10b981 !important;
  color:#ffffff !important;
  font-weight:bold;
  print-color-adjust:exact;
  -webkit-print-color-adjust:exact;
}
.correct-check{
  margin-left:auto;
  color:#10b981;
  font-weight:bold;
  font-size:9pt;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  background:rgba(16, 185, 129, 0.12);
  width:18px;
  height:18px;
  border-radius:50%;
  flex-shrink:0;
  print-color-adjust:exact;
  -webkit-print-color-adjust:exact;
}

.ctx-box{
  background:#f8fafc;
  border-left:3px solid #64748b;
  padding:6px 10px;
  font-size:9pt;
  margin-bottom:8px;
  border-radius:0 4px 4px 0;
  print-color-adjust:exact;
  -webkit-print-color-adjust:exact;
  font-family:'Computer Modern Serif','STIX Two Text',serif;
  break-inside:avoid;
  page-break-inside:avoid;
}

.rule-box{
  background:#fffbeb;
  border:1px solid #fde68a;
  border-left:4px solid #f59e0b;
  border-radius:4px;
  padding:8px 12px;
  margin-top:8px;
  print-color-adjust:exact;
  -webkit-print-color-adjust:exact;
  break-inside:avoid;
  page-break-inside:avoid;
}
.rule-title{
  font-family:'Inter',sans-serif;
  font-size:0.65rem;
  font-weight:800;
  letter-spacing:1.5px;
  color:#92400e;
  margin-bottom:4px;
  text-transform:uppercase;
}
.rule-body{
  font-family:'Computer Modern Serif','STIX Two Text',serif;
  font-size:9pt;
  line-height:1.55;
  color:#78350f;
}
.trick-box{
  background:#fdf4ff;
  border:1px solid #e9d5ff;
  border-left:4px solid #7c3aed;
  border-radius:4px;
  padding:8px 12px;
  margin-top:6px;
  print-color-adjust:exact;
  -webkit-print-color-adjust:exact;
  break-inside:avoid;
  page-break-inside:avoid;
}
.trick-title{
  font-family:'Inter',sans-serif;
  font-size:0.65rem;
  font-weight:800;
  letter-spacing:1.5px;
  color:#6b21a8;
  margin-bottom:4px;
  text-transform:uppercase;
}
.trick-body{
  font-family:'Computer Modern Serif','STIX Two Text',serif;
  font-size:9pt;
  line-height:1.55;
  color:#581c87;
}

@media print{
  .cover{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  ${!showCover ? '.cover{display:none!important}' : ''}
}
.katex{font-size:.95em}.katex-display{margin:4px 0}
</style></head><body>

<!-- PRE-PRINT INSTRUCTION BANNER -->
<div class="print-hint" id="printHint">
  <div class="print-hint-msg">
    <span class="print-hint-icon">🖨️</span>
    <div class="print-hint-text">
      <strong>Pour un résultat professionnel :</strong><br>
      <span>Dans la boîte d'impression → <b>Plus de paramètres</b> → décochez <b>"En-têtes et pieds de page"</b></span>
    </div>
  </div>
  <button class="hint-badge" onclick="document.getElementById('printHint').style.display='none'">✕ Fermer</button>
</div>

${coverHtml}

<!-- STANDALONE PREMIUM OMR SHEET PAGE (Correction Key) -->
<div class="omr-page">
  <!-- Crop marks / Corner markers -->
  <div class="omr-marker tl"></div>
  <div class="omr-marker tr"></div>
  <div class="omr-marker bl"></div>
  <div class="omr-marker br"></div>

  <!-- Navy Header Band -->
  <div class="omr-header">
    <div class="omr-header-logo">L'Conq<span></span></div>
    <div class="omr-header-subtitle">Grille de Réponses Officielle · Document de Correction de Référence</div>
    <div class="omr-header-title">${school} — ${examTitle} ${year || ''}</div>
    <div class="omr-header-qr">
      <img src="${premiumQrUrl}" alt="QR Code"/>
    </div>
  </div>

  <!-- Info Cards -->
  <div class="omr-card" style="left: 14mm; width: 70mm;">
    <div class="omr-card-label">RÉFÉRENCE DE CORRECTION</div>
    <div class="omr-card-val">CORRIGÉ OFFICIEL TYPE</div>
  </div>
  <div class="omr-card" style="left: 86mm; width: 35mm;">
    <div class="omr-card-label">DATE DE GENERATION</div>
    <div class="omr-card-val">${dateStr}</div>
  </div>
  <div class="omr-card" style="left: 123mm; width: 35mm;">
    <div class="omr-card-label">DURÉE</div>
    <div class="omr-card-val">${examDuration}</div>
  </div>
  <div class="omr-card score" style="left: 160mm; width: 36mm;">
    <div class="omr-card-label">SCORE CORRECTION</div>
    <div class="omr-card-val">${questions.length} / ${questions.length}</div>
  </div>

  <!-- Instructions Bar -->
  <div class="omr-instructions" style="background: #f0fdf4;">
    <div class="omr-instructions-bar" style="background: #10a34a;"></div>
    <div class="omr-instructions-title" style="color: #10a34a;">INFORMATIONS &amp; CONSIGNES IMPORTANTES :</div>
    <div class="omr-instructions-text">· Les cercles colorés en vert indiquent les réponses correctes pour chaque question.</div>
  </div>

  <!-- Legend -->
  <div class="omr-legend">
    <span class="omr-legend-title">Exemples de Remplissage :</span>
    <div class="omr-legend-item">
      <div class="omr-legend-bubble ok" style="background: #10a34a; border-color: #10a34a; color: #fff;">A</div>
      <span class="omr-legend-label ok" style="color: #10a34a;">Réponse Correcte</span>
    </div>
    <div class="omr-legend-item">
      <div class="omr-legend-bubble empty">B</div>
      <span class="omr-legend-label empty">Réponse Incorrecte</span>
    </div>
  </div>

  <!-- OMR Columns -->
  <div class="omr-columns">
    ${premiumOmrHtml}
  </div>

  <!-- Footer -->
  <div class="omr-footer" style="top: ${footerY}mm;">
    <div class="omr-footer-text">Ce document contient les réponses correctes officielles. Utilisez-le comme grille de validation de référence.</div>
    <div class="omr-footer-right">
      <div class="omr-footer-exam-id">EXAM ID: ${examId.slice(0, 8).toUpperCase()}</div>
      <div class="omr-footer-brand">lconq.ma · IA OMR Engine v2.0</div>
    </div>
  </div>
</div>

<!-- CONTENT -->
<div class="content">
  ${cardsHtml}
</div>

<script>
async function printWhenReady() {
  await document.fonts.ready;
  await new Promise(r => setTimeout(r, 1000));
  var hint = document.getElementById('printHint');
  if (hint) hint.style.display = 'none';
  window.print();
  if (hint) hint.style.display = 'flex';
}
printWhenReady();
</script>
</body></html>`;
};

/* ── Open generated HTML in a new print window ── */
export const openPrintWindow = (html) => {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const win  = window.open(url, '_blank', 'width=960,height=720,scrollbars=yes');
  if (!win) {
    URL.revokeObjectURL(url);
    alert('Veuillez autoriser les popups pour ce site.');
    return;
  }
  win.addEventListener('load', () => URL.revokeObjectURL(url), { once: true });
};

/* ═══════════════════════════════════════════════
   3. DOMAIN E-BOOK — "كتاب الحيل الموجهة"
   ═══════════════════════════════════════════════ */
export const generateEbookHTML = (topic, questionsWithSource, settings = {}) => {
  const {
    showCover = true,
    showTricks = true,
    showPageNumbers = true,
    startPage = 1,
    profName = '',
    profPhone = '',
    profSite = 'www.lconq.ma',
  } = settings;

  const total = questionsWithSource.length;
  const sources = [...new Set(questionsWithSource.map(q => q._source || 'Inconnu'))];
  const year = new Date().getFullYear();
  const siteUrl = profSite || 'www.lconq.ma';
  const copyrightLine = profName
    ? `© ${year} L'Conq × ${profName}. Tous droits réservés.`
    : `© ${year} L'Conq. Tous droits réservés.`;

  const LETTERS = ['A', 'B', 'C', 'D', 'E'];

  const cardsHtml = questionsWithSource.map((q, i) => {
    const optionsHtml = (q.options || []).map((opt, oi) => {
      const letter = LETTERS[oi] || String(oi + 1);
      const rawText = typeof opt === 'string' ? opt : (opt?.text || '');
      const text = rawText.replace(/^[A-E][).]\s*/i, '');
      const isCorrect = q.correct_answer === letter;
      return `<div class="opt${isCorrect ? ' correct-opt' : ''}">
        <span class="opt-badge${isCorrect ? ' correct-badge' : ''}">${letter}</span>
        <span>${renderMath(text)}</span>
        ${isCorrect ? '<span class="correct-check">✓</span>' : ''}
      </div>`;
    }).join('');

    const sourceTag = q._source ? `<span class="src-tag">${q._source.toUpperCase()}${q._year ? ' · ' + q._year : ''}</span>` : '';
    const themeClass = getThemeClass(q.subject || q.topic || 'Général');

    return `<div class="qcard ${themeClass}">
      <div class="card-hdr">
        <span class="qnum">Q${i + 1}</span>
        ${sourceTag}
        <span class="ans-badge">Réponse : ${q.correct_answer || '?'}</span>
      </div>
      <div class="qtext">${renderMath(q.question || '')}</div>
      ${q.image ? `<div style="margin: 6px 0 8px 0; display: block; text-align: center;"><img src="${q.image}" style="max-height: 110px; max-width: 100%; display: inline-block; object-fit: contain;" /></div>` : ''}
      <div class="opts ${getOptionsLayoutClass(q.options)}">${optionsHtml}</div>
      ${q.astuce ? `<div class="rule-box">
        <div class="rule-title">⭐ RÈGLE DE L'ART</div>
        <div class="rule-body">${renderMath(q.astuce)}</div>
      </div>` : ''}
      ${showTricks && q.trick ? `<div class="trick-box">
        <div class="trick-title">⚡ COUP DE GRÂCE</div>
        <div class="trick-body">${renderMath(q.trick)}</div>
      </div>` : ''}
    </div>`;
  }).join('');

  return `<!DOCTYPE html><html lang="fr"><head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>E-Book — ${topic}</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/dreampulse/computer-modern-web-font@master/fonts.css">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=STIX+Two+Text:ital,wght@0,400;0,600;0,700;1,400;1,600&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{
  font-family:'Computer Modern Serif','STIX Two Text','Times New Roman',serif;
  background:#fff;color:#111;
  font-size:11pt;line-height:1.65;
  padding-bottom:1.2cm;
  print-color-adjust:exact;-webkit-print-color-adjust:exact;
  font-feature-settings:'liga' 1,'kern' 1;}

@page{
  size:A4;
  margin:0.8cm 0 1.0cm 0;
  ${showPageNumbers ? `
  @bottom-left {
    content: "⚡ L'Conq   |   ${topic}   |   ${copyrightLine}";
    font-family: 'Inter', sans-serif;
    font-size: 7pt;
    font-weight: 500;
    color: #6b7280;
    margin-left: 1.3cm;
    margin-bottom: 0.35cm;
  }
  @bottom-right {
    content: "${profPhone ? profPhone + '   ·   ' : ''}${siteUrl}   |   " counter(page) " / " counter(pages);
    font-family: 'Inter', sans-serif;
    font-size: 7pt;
    font-weight: 600;
    color: #4b5563;
    margin-right: 1.3cm;
    margin-bottom: 0.35cm;
  }
  ` : ''}
}
@page :first {
  @bottom-left { content: none; }
  @bottom-right { content: none; }
}
html{counter-reset:page ${startPage - 1}}

.print-hint{position:fixed;top:0;left:0;right:0;z-index:9999;background:linear-gradient(135deg,#1a1a2e,#16213e);
  color:#fff;padding:0.9rem 1.5rem;display:flex;align-items:center;justify-content:space-between;
  font-size:9pt;gap:1rem;print-color-adjust:exact}
.print-hint-msg{display:flex;align-items:center;gap:0.75rem}
.print-hint-icon{font-size:1.3rem;flex-shrink:0}
.print-hint-text strong{font-size:9.5pt;color:#a78bfa}
.print-hint-text span{color:rgba(255,255,255,0.7);font-size:8pt}
.hint-badge{background:#7c3aed;color:#fff;font-size:7.5pt;font-weight:700;padding:3px 12px;border-radius:20px;
  white-space:nowrap;cursor:pointer;border:none;font-family:inherit;letter-spacing:.5px}
@media print{.print-hint{display:none!important}}

/* ── COVER PAGE ── */
.cover{
  box-sizing:border-box;
  width:100%;
  height:27.5cm;
  padding:1cm;
  page-break-after:always;
  print-color-adjust:exact;
  -webkit-print-color-adjust:exact;
  background:#fff;
  color:#0f172a;
}
.cover-frame{
  border:4px double #0f172a;
  padding:2cm 1.5cm;
  height:100%;
  display:flex;
  flex-direction:column;
  justify-content:space-between;
  align-items:center;
  box-sizing:border-box;
}
.cover-logo{
  font-family:'Computer Modern Serif','STIX Two Text',serif;
  font-size:2.2rem;
  font-weight:bold;
  letter-spacing:6px;
  text-transform:uppercase;
  margin-bottom:0.2rem;
  color:#0f172a;
}
.cover-subtitle{
  font-family:'Inter',sans-serif;
  font-size:0.8rem;
  font-weight:600;
  color:#475569;
  letter-spacing:3px;
  text-transform:uppercase;
  margin-bottom:1.5rem;
}
.cover-divider{
  width:120px;
  height:1.5px;
  background:#0f172a;
  margin:0 auto 2rem;
}
.cover-header-group{
  text-align:center;
}
.cover-tag{
  font-family:'Inter',sans-serif;
  font-size:0.75rem;
  font-weight:800;
  letter-spacing:3px;
  text-transform:uppercase;
  color:#475569;
  border:1px solid #cbd5e1;
  padding:4px 12px;
  border-radius:4px;
  display:inline-block;
  margin-bottom:1rem;
}
.cover-topic{
  font-family:'Computer Modern Serif','STIX Two Text',serif;
  font-size:2.4rem;
  font-weight:bold;
  line-height:1.25;
  margin:0.5rem 0 1rem;
  color:#0f172a;
}
.cover-desc{
  font-family:'Computer Modern Serif','STIX Two Text',serif;
  font-size:1rem;
  color:#475569;
  font-style:italic;
  margin-bottom:2rem;
}
.cover-stats{
  display:flex;
  gap:2.5rem;
  justify-content:center;
  margin:1rem 0;
  width:100%;
}
.cover-stat{
  border:1px solid #cbd5e1;
  border-radius:6px;
  padding:12px 24px;
  min-width:110px;
  text-align:center;
  background:#f8fafc;
}
.cover-stat .num{
  font-family:'Computer Modern Serif','STIX Two Text',serif;
  font-size:1.6rem;
  font-weight:bold;
  color:#0f172a;
}
.cover-stat .lbl{
  font-family:'Inter',sans-serif;
  font-size:0.7rem;
  color:#64748b;
  text-transform:uppercase;
  letter-spacing:1px;
  margin-top:0.2rem;
  font-weight:600;
}
.cover-sources{
  margin-top:1rem;
  padding:0.75rem 1.5rem;
  border:1px solid #cbd5e1;
  border-radius:6px;
  font-size:0.8rem;
  color:#334155;
  max-width:550px;
  width:100%;
  text-align:center;
  background:#f8fafc;
  font-family:'Inter',sans-serif;
}
.cover-sources strong{
  color:#0f172a;
}
.cover-prof{
  font-family:'Computer Modern Serif','STIX Two Text',serif;
  margin-top:1.5rem;
  font-size:0.95rem;
  color:#334155;
  font-style:italic;
}
.cover-prof strong{
  color:#0f172a;
  font-style:normal;
}

/* ── COLOR THEMES PER SUBJECT ── */
.theme-math {
  --primary: #2563eb;
  --dark: #1e3a8a;
  --bg: #eff6ff;
  --border: #bfdbfe;
  --text: #1e3a8a;
}
.theme-physique {
  --primary: #0d9488;
  --dark: #0f766e;
  --bg: #f0fdfa;
  --border: #99f6e4;
  --text: #115e59;
}
.theme-chimie {
  --primary: #7c3aed;
  --dark: #6d28d9;
  --bg: #f5f3ff;
  --border: #ddd6fe;
  --text: #5b21b6;
}
.theme-svt {
  --primary: #16a34a;
  --dark: #15803d;
  --bg: #f0fdf4;
  --border: #bbf7d0;
  --text: #166534;
}
.theme-francais {
  --primary: #ea580c;
  --dark: #c2410c;
  --bg: #fff7ed;
  --border: #fed7aa;
  --text: #9a3412;
}
.theme-general {
  --primary: #4f46e5;
  --dark: #4338ca;
  --bg: #eef2ff;
  --border: #c7d2fe;
  --text: #3730a3;
}

.content{padding:0.5cm 1.3cm 0.3cm}
.section-hdr{
  font-family:'Computer Modern Serif','STIX Two Text',serif;
  font-size:13pt;
  font-weight:bold;
  letter-spacing:1px;
  text-transform:uppercase;
  color:#0f172a;
  text-align:center;
  border-top:1.5px solid #0f172a;
  border-bottom:1.5px solid #0f172a;
  padding:6px 0;
  margin:2.2rem 0 1.2rem 0;
  display:block;
  width:100%;
  print-color-adjust:exact;
  -webkit-print-color-adjust:exact;
}

.qcard{
  border:1px solid #e2e8f0;
  border-left:4px solid var(--primary,#cbd5e1);
  border-radius:10px;
  padding:16px 20px;
  margin-bottom:20px;
  background:#ffffff;
  box-shadow:0 1px 3px 0 rgba(0, 0, 0, 0.04),0 1px 2px 0 rgba(0, 0, 0, 0.02);
}
.card-hdr{
  display:flex;
  align-items:center;
  gap:12px;
  margin-bottom:12px;
  padding-bottom:8px;
  border-bottom:1px solid #f1f5f9;
  flex-wrap:wrap;
  break-inside:avoid;
  page-break-inside:avoid;
}
.qnum{
  font-family:'Inter',sans-serif;
  background:var(--primary,#4f46e5);
  color:#ffffff !important;
  font-size:8pt;
  font-weight:800;
  padding:3px 10px;
  border-radius:4px;
  letter-spacing:0.5px;
  text-transform:uppercase;
  print-color-adjust:exact;
  -webkit-print-color-adjust:exact;
}
.src-tag{
  font-family:'Inter',sans-serif;
  background:#f1f5f9;
  color:#475569;
  font-size:7pt;
  font-weight:700;
  padding:3px 9px;
  border-radius:4px;
  border:1px solid #cbd5e1;
  letter-spacing:0.5px;
  text-transform:uppercase;
  print-color-adjust:exact;
  -webkit-print-color-adjust:exact;
}
.ans-badge{
  font-family:'Inter',sans-serif;
  margin-left:auto;
  background:#f0fdf4;
  color:#16a34a;
  padding:3px 10px;
  border-radius:4px;
  font-size:8pt;
  font-weight:800;
  border:1px solid #bbf7d0;
  letter-spacing:0.5px;
  text-transform:uppercase;
  print-color-adjust:exact;
  -webkit-print-color-adjust:exact;
}
.qtext{
  font-family:'Computer Modern Serif','STIX Two Text','Times New Roman',serif;
  font-size:11.5pt;
  font-weight:500;
  line-height:1.65;
  color:#1e293b;
  margin-bottom:14px;
  break-inside:avoid;
  page-break-inside:avoid;
}
.opts{
  display:grid;
  gap:8px 24px;
  padding-left:0;
  margin-bottom:10px;
  break-inside:avoid;
  page-break-inside:avoid;
}
.opts-5col {
  grid-template-columns: repeat(5, 1fr);
}
.opts-4col {
  grid-template-columns: repeat(4, 1fr);
}
.opts-2col {
  grid-template-columns: repeat(2, 1fr);
}
.opts-1col {
  grid-template-columns: 1fr;
}
@media (max-width: 600px) {
  .opts-5col, .opts-4col, .opts-2col {
    grid-template-columns: 1fr;
  }
}
.opt{
  display:flex;
  align-items:center;
  gap:12px;
  font-size:10.5pt;
  color:#334155;
  padding:6px 12px;
  border-radius:8px;
  border:1px solid transparent;
}
.opt-badge{
  font-family:'Inter',sans-serif;
  font-weight:700;
  font-size:8.5pt;
  width:24px;
  height:24px;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  border-radius:50%;
  background:#ffffff;
  color:#64748b;
  border:1px solid #cbd5e1;
  flex-shrink:0;
}
.correct-opt{
  background:#f0fdf4!important;
  border:1px solid #bbf7d0!important;
  color:#15803d!important;
  font-weight:600;
  print-color-adjust:exact;
  -webkit-print-color-adjust:exact;
}
.correct-opt .opt-badge.correct-badge{
  font-family:'Inter',sans-serif;
  background:#10b981 !important;
  border-color:#10b981 !important;
  color:#ffffff !important;
  font-weight:bold;
  print-color-adjust:exact;
  -webkit-print-color-adjust:exact;
}
.correct-check{
  margin-left:auto;
  color:#10b981;
  font-weight:bold;
  font-size:9pt;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  background:rgba(16, 185, 129, 0.12);
  width:18px;
  height:18px;
  border-radius:50%;
  flex-shrink:0;
  print-color-adjust:exact;
  -webkit-print-color-adjust:exact;
}

.ctx-box{
  background:#f8fafc;
  border-left:3px solid #64748b;
  padding:6px 10px;
  font-size:9pt;
  margin-bottom:8px;
  border-radius:0 4px 4px 0;
  print-color-adjust:exact;
  -webkit-print-color-adjust:exact;
  font-family:'Computer Modern Serif','STIX Two Text',serif;
  break-inside:avoid;
  page-break-inside:avoid;
}

.rule-box{
  background:#fffbeb;
  border:1px solid #fde68a;
  border-left:4px solid #f59e0b;
  border-radius:4px;
  padding:8px 12px;
  margin-top:8px;
  print-color-adjust:exact;
  -webkit-print-color-adjust:exact;
  break-inside:avoid;
  page-break-inside:avoid;
}
.rule-title{
  font-family:'Inter',sans-serif;
  font-size:0.65rem;
  font-weight:800;
  letter-spacing:1.5px;
  color:#92400e;
  margin-bottom:4px;
  text-transform:uppercase;
}
.rule-body{
  font-family:'Computer Modern Serif','STIX Two Text',serif;
  font-size:9pt;
  line-height:1.55;
  color:#78350f;
}
.trick-box{
  background:#fdf4ff;
  border:1px solid #e9d5ff;
  border-left:4px solid #7c3aed;
  border-radius:4px;
  padding:8px 12px;
  margin-top:6px;
  print-color-adjust:exact;
  -webkit-print-color-adjust:exact;
  break-inside:avoid;
  page-break-inside:avoid;
}
.trick-title{
  font-family:'Inter',sans-serif;
  font-size:0.65rem;
  font-weight:800;
  letter-spacing:1.5px;
  color:#6b21a8;
  margin-bottom:4px;
  text-transform:uppercase;
}
.trick-body{
  font-family:'Computer Modern Serif','STIX Two Text',serif;
  font-size:9pt;
  line-height:1.55;
  color:#581c87;
}

@media print{
  .cover{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  ${!showCover ? '.cover{display:none!important}' : ''}
}
.katex{font-size:1.05em}.katex-display{margin:4px 0}
</style>
</head><body>

<div class="print-hint" id="printHint">
  <div class="print-hint-msg">
    <span class="print-hint-icon">🖨️</span>
    <div class="print-hint-text">
      <strong>Pour un résultat professionnel :</strong><br>
      <span>Dans la boîte d'impression → <b>Plus de paramètres</b> → décochez <b>"En-têtes et pieds de page"</b></span>
    </div>
  </div>
  <button class="hint-badge" onclick="document.getElementById('printHint').style.display='none'">✕ Fermer</button>
</div>

${showCover ? `
<div class="cover">
  <div class="cover-frame">
    <div class="cover-logo">L'Conq</div>
    <div class="cover-subtitle">Guide de Maîtrise · Prépa Concours Maroc</div>
    <div class="cover-divider"></div>
    
    <div class="cover-header-group">
      <div class="cover-tag">Domaine</div>
      <div class="cover-topic">${topic}</div>
      <div class="cover-desc">Toutes les questions · Toutes les astuces · Toutes les techniques d'élimination rapide</div>
    </div>
    
    <div class="cover-stats">
      <div class="cover-stat">
        <div class="num">${total}</div>
        <div class="lbl">Questions</div>
      </div>
      <div class="cover-stat">
        <div class="num">${sources.length}</div>
        <div class="lbl">Concours</div>
      </div>
      <div class="cover-stat">
        <div class="num">100%</div>
        <div class="lbl">Corrigées</div>
      </div>
    </div>
    
    <div class="cover-sources">
      <strong>Sources :</strong> ${sources.join(' · ')}
    </div>

    <div class="cover-prof">
      ${profName ? `Préparé par : <strong>${profName}</strong>${profPhone ? ' · ' + profPhone : ''}` : `<strong>${siteUrl}</strong>`}
    </div>
  </div>
</div>` : ''}

<div class="content">
  <div class="section-hdr">📚 ${total} questions — ${topic}</div>
  ${cardsHtml}
</div>

<script>
async function printWhenReady() {
  await document.fonts.ready;
  await new Promise(r => setTimeout(r, 1000));
  var hint = document.getElementById('printHint');
  if (hint) hint.style.display = 'none';
  window.print();
  if (hint) hint.style.display = 'flex';
}
printWhenReady();
</script>
</body></html>`;
};

export const generateStudentReportHTML = (exam, score, corrected, settings = {}) => {
  const {
    profName = '',
    profPhone = '',
    profSite = 'www.lconq.ma',
  } = settings;

  const total = corrected.length;
  let correctCount = 0;
  let wrongCount = 0;
  let emptyCount = 0;
  
  corrected.forEach(row => {
    if (row.result === 'correct') correctCount++;
    else if (row.result === 'wrong') wrongCount++;
    else emptyCount++;
  });

  const successRate = total > 0 ? Math.round((correctCount / total) * 100) : 0;
  const grade20 = total > 0 ? ((score.pts / total) * 20) : 0;
  
  // Format Date
  const dateStr = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const half = Math.ceil(corrected.length / 2);
  const leftCol = corrected.slice(0, half);
  const rightCol = corrected.slice(half);

  const renderTable = (rows) => {
    return `
      <table class="report-table">
        <thead>
          <tr>
            <th style="width: 15%; text-align: center;">N°</th>
            <th style="width: 40%;">Sujet</th>
            <th style="width: 15%; text-align: center;">Rép.</th>
            <th style="width: 15%; text-align: center;">Corr.</th>
            <th style="width: 15%; text-align: center;">Statut</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(row => {
            let statusClass = 'status-empty';
            let statusText = 'Vide';
            if (row.result === 'correct') {
              statusClass = 'status-correct';
              statusText = 'Ok';
            } else if (row.result === 'wrong') {
              statusClass = 'status-wrong';
              statusText = 'Faux';
            }
            return `
              <tr>
                <td style="font-weight:bold; text-align:center; font-size: 8pt;">Q${row.q}</td>
                <td style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 110px; font-size: 8pt;">${row.topic}</td>
                <td style="text-align:center; font-weight:bold; font-size: 8.5pt; color:${row.result === 'correct' ? '#059669' : '#dc2626'}">${row.detected || '—'}</td>
                <td style="text-align:center; font-weight:bold; font-size: 8.5pt; color:#059669">${row.correct}</td>
                <td style="text-align:center;"><span class="status-badge ${statusClass}">${statusText}</span></td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  };

  const tablesHtml = corrected.length <= 15
    ? renderTable(corrected)
    : `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
        <div>${renderTable(leftCol)}</div>
        <div>${renderTable(rightCol)}</div>
      </div>
    `;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Rapport de Performance OMR - ${exam.name}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
html { font-size: 9.5pt; }
body {
  font-family: 'Plus Jakarta Sans', serif;
  margin: 0;
  padding: 0;
  background-color: #fff;
  color: #0f172a;
  line-height: 1.4;
}
.page {
  padding: 10mm 15mm;
  box-sizing: border-box;
  min-height: 297mm;
  max-height: 297mm;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.cover-frame {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 18px 22px;
  background-color: #f8fafc;
  margin-bottom: 12px;
}
.report-title {
  font-size: 18pt;
  font-weight: 800;
  text-align: center;
  margin: 0 0 4px 0;
  color: #0f172a;
  letter-spacing: -0.01em;
}
.report-subtitle {
  font-size: 9.5pt;
  text-align: center;
  color: #64748b;
  margin: 0 0 15px 0;
  font-weight: 500;
}
.score-box {
  display: flex;
  justify-content: center;
  align-items: center;
}
.score-circle {
  border: 3px double #4f46e5;
  border-radius: 50%;
  width: 90px;
  height: 90px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  background: #ffffff;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.08);
}
.score-val {
  font-size: 20pt;
  font-weight: 900;
  color: #4f46e5;
  line-height: 1;
}
.score-lbl {
  font-size: 7.5pt;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
  margin-top: 2px;
}
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-bottom: 10px;
}
.stat-card {
  border: 1px solid #e2e8f0;
  padding: 8px;
  text-align: center;
  border-radius: 8px;
  background: #ffffff;
}
.stat-num {
  font-size: 13pt;
  font-weight: 800;
  color: #0f172a;
}
.stat-lbl {
  font-size: 7pt;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
  margin-top: 1px;
}
.section-title {
  font-size: 11pt;
  font-weight: 800;
  border-bottom: 1.5px solid #0f172a;
  padding-bottom: 3px;
  margin: 15px 0 10px 0;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}
.report-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 10px;
}
.report-table th, .report-table td {
  border: 1px solid #e2e8f0;
  padding: 4px 8px;
  text-align: left;
  font-size: 8.5pt;
}
.report-table th {
  background-color: #f8fafc;
  font-weight: 700;
  color: #334155;
}
.status-badge {
  padding: 1.5px 5px;
  border-radius: 4px;
  font-size: 7pt;
  font-weight: 800;
  text-transform: uppercase;
  display: inline-block;
}
.status-correct { background-color: #d1fae5; color: #065f46; border: 1px solid #10b981; }
.status-wrong { background-color: #fee2e2; color: #991b1b; border: 1px solid #ef4444; }
.status-empty { background-color: #f1f5f9; color: #475569; border: 1px solid #94a3b8; }

.print-hint {
  background-color: #f0fdf4;
  border: 1px solid #bbf7d0;
  padding: 10px;
  border-radius: 6px;
  margin-bottom: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.print-hint-msg { display: flex; gap: 8px; align-items: center; }
.print-hint-icon { font-size: 16px; }
.print-hint-text { font-size: 8.5pt; color: #166534; }
.hint-badge {
  background: none;
  border: none;
  font-weight: bold;
  cursor: pointer;
  color: #166534;
}
.report-footer {
  text-align: center;
  font-size: 7.5pt;
  color: #94a3b8;
  border-top: 1px solid #e2e8f0;
  padding-top: 10px;
  margin-top: auto;
}

@media print {
  body { background-color: #fff; }
  .print-hint { display: none !important; }
}
</style>
</head>
<body>

<div class="page">
  <div>
    <div class="print-hint" id="printHint">
      <div class="print-hint-msg">
        <span class="print-hint-icon">🖨️</span>
        <div class="print-hint-text">
          <strong>Conseil d'impression :</strong> Décochez les en-têtes/pieds de page dans les options d'impression du navigateur.
        </div>
      </div>
      <button class="hint-badge" onclick="document.getElementById('printHint').style.display='none'">✕ Fermer</button>
    </div>

    <div class="cover-frame">
      <h1 class="report-title">RAPPORT DE PERFORMANCE</h1>
      <div class="report-subtitle">Analyse Personnalisée — Correction de Feuille OMR</div>
      
      <div style="display: grid; grid-template-columns: 1fr auto; gap: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 12px;">
        <div>
          <p style="margin: 0 0 4px 0; font-size: 9.5pt;"><strong>Examen :</strong> ${exam.name}</p>
          <p style="margin: 0 0 4px 0; font-size: 9.5pt;"><strong>Établissement / Concours :</strong> ${exam.school} (${exam.year})</p>
          <p style="margin: 0; font-size: 9.5pt;"><strong>Date de l'analyse :</strong> ${dateStr}</p>
        </div>
        <div class="score-box" style="margin: 0;">
          <div class="score-circle">
            <span class="score-val">${grade20.toFixed(2)}</span>
            <span class="score-lbl">Note / 20</span>
          </div>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-num">${total}</div>
          <div class="stat-lbl">Questions</div>
        </div>
        <div class="stat-card" style="border-color: #10b981;">
          <div class="stat-num" style="color: #10b981;">${correctCount}</div>
          <div class="stat-lbl">Correctes</div>
        </div>
        <div class="stat-card" style="border-color: #ef4444;">
          <div class="stat-num" style="color: #ef4444;">${wrongCount}</div>
          <div class="stat-lbl">Fausses</div>
        </div>
        <div class="stat-card" style="border-color: #f59e0b;">
          <div class="stat-num" style="color: #f59e0b;">${successRate}%</div>
          <div class="stat-lbl">Réussite</div>
        </div>
      </div>
    </div>

    <div class="section-title">📋 Synthèse des Réponses</div>
    ${tablesHtml}
  </div>

  <div class="report-footer">
    Généré automatiquement par L'Conq — Plateforme de Préparation aux Concours d'Excellence
    ${profSite ? `<br><strong>${profSite}</strong>` : ''}
  </div>
</div>

<script>
async function printWhenReady() {
  await document.fonts.ready;
  await new Promise(r => setTimeout(r, 600));
  var hint = document.getElementById('printHint');
  if (hint) hint.style.display = 'none';
  window.print();
  if (hint) hint.style.display = 'flex';
}
printWhenReady();
</script>
</body>
</html>`;
};
