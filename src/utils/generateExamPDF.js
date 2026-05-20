import katex from 'katex';

/* ── Math renderer: LaTeX → HTML string ── */
const renderMath = (text) => {
  if (!text) return '';
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const parts = text.split(/(\$\$[\s\S]+?\$\$|\$[^\$\n]+?\$)/g);
  return parts.map(part => {
    if (part.startsWith('$$') && part.endsWith('$$')) {
      try { return katex.renderToString(part.slice(2, -2), { displayMode: true, throwOnError: false }); }
      catch { return `<code>${esc(part)}</code>`; }
    }
    if (part.startsWith('$') && part.endsWith('$')) {
      try { return katex.renderToString(part.slice(1, -1), { displayMode: false, throwOnError: false }); }
      catch { return `<code>${esc(part)}</code>`; }
    }
    return esc(part);
  }).join('');
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

/* ═══════════════════════════════════════════════
   1. SUJET BLANC — Exam Paper
   ═══════════════════════════════════════════════ */
export const generateSubjectHTML = (examTitle, school, year, questions) => {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(`lmatch://exam/${examTitle}`)}`;
  const groups = groupBySubject(questions);

  /* OMR Grid — split into 2 columns */
  const half = Math.ceil(questions.length / 2);
  const col1 = questions.slice(0, half);
  const col2 = questions.slice(half);
  const omrRows = col1.map((q, i) => {
    const q2 = col2[i];
    const num1 = String(q.question_number || (i + 1)).padStart(2, '0');
    const num2 = q2 ? String(q2.question_number || (half + i + 1)).padStart(2, '0') : '';
    const bubbles = '<td><div class="b"></div></td><td><div class="b"></div></td><td><div class="b"></div></td><td><div class="b"></div></td>';
    return `<tr>
      <td class="nn">${num1}</td>${bubbles}
      <td class="sep"></td>
      ${q2 ? `<td class="nn">${num2}</td>${bubbles}` : '<td colspan="5"></td>'}
    </tr>`;
  }).join('');

  /* Questions HTML */
  const questionsHtml = Object.entries(groups).map(([subject, qs]) => `
    <div class="subj-section">
      <div class="subj-hdr">${subject.toUpperCase()}</div>
      ${qs.map(q => {
        const num = q.question_number || '?';
        return `<div class="qblock">
          <div class="qtext"><span class="qn">Q${num}.</span> ${renderMath(q.question)}</div>
          ${q.image ? `<div style="margin: 6px 0 8px 0; display: block; text-align: center;"><img src="${q.image}" style="max-height: 110px; max-width: 100%; display: inline-block; object-fit: contain;" /></div>` : ''}
          <div class="opts">
            ${(q.options || []).map((opt, i) => {
              const letter = LETTERS[i];
              if (!letter) return '';
              return `<div class="opt"><span class="ol">${letter}.</span>${renderMath(optText(opt))}</div>`;
            }).join('')}
          </div>
        </div>`;
      }).join('')}
    </div>`).join('');

  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
<title>${examTitle} — Sujet</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/dreampulse/computer-modern-web-font@master/fonts.css">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=STIX+Two+Text:ital,wght@0,400;0,600;0,700;1,400;1,600&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Computer Modern Serif','STIX Two Text','Times New Roman',serif;color:#111;background:#fff;font-size:11pt;line-height:1.6;font-feature-settings:'liga' 1,'kern' 1}
.hdr{display:flex;align-items:center;justify-content:space-between;padding:.5cm 1.2cm .3cm;border-bottom:3px solid #1a56db}
.logo{font-size:20pt;font-weight:900;color:#1a56db}.logo span{color:#f59e0b}
.htitle{text-align:center;flex:1;padding:0 .8cm}
.htitle h1{font-size:12pt;font-weight:bold;text-transform:uppercase;letter-spacing:.5px}
.htitle p{font-size:8.5pt;color:#555;margin-top:3px}
.hright{font-size:8.5pt;color:#555;text-align:right;line-height:1.6}
.instruct{background:#f8f9fa;border:1px solid #dee2e6;border-radius:3px;padding:6px 10px;margin:.3cm 1.2cm;font-size:8.5pt;color:#444}
.omr-wrap{display:flex;gap:.8cm;align-items:flex-start;padding:.3cm 1.2cm;border-bottom:2px dashed #ccc;margin-bottom:.3cm}
.qr-col{display:flex;flex-direction:column;align-items:center;gap:4px}
.qr-col img{width:90px;height:90px;border:1px solid #ddd;padding:3px}
.qr-col span{font-size:7pt;color:#888;text-align:center}
.omr-col{flex:2}
.omr-title{font-size:8pt;font-weight:bold;text-transform:uppercase;letter-spacing:1px;color:#1a56db;margin-bottom:4px}
.omr-table{border-collapse:collapse;font-size:8pt;width:100%}
.omr-table th{background:#1a56db;color:#fff;padding:3px 5px;text-align:center}
.omr-table td{padding:2px 5px;text-align:center;border:1px solid #ddd}
.nn{font-weight:bold;background:#f8f9fa;font-size:7.5pt}
.b{width:12px;height:12px;border:1.5px solid #333;border-radius:50%;margin:0 auto}
.sep{width:6px;background:#f0f0f0;border:none!important}
.stu-box{flex:1;border:1.5px solid #444;border-radius:4px;padding:8px}
.stu-field{margin-bottom:8px}
.stu-field label{font-size:7.5pt;font-weight:bold;display:block;margin-bottom:1px}
.stu-line{border-bottom:1px solid #444;height:16px}
.main{padding:0 1.2cm}
.subj-section{margin-bottom:.5cm}
.subj-hdr{background:#1a56db;color:#fff;padding:4px 8px;font-size:8.5pt;font-weight:bold;letter-spacing:1.5px;border-radius:3px;margin-bottom:6px}
.qblock{border:1px solid #e0e0e0;border-radius:3px;padding:7px 9px;margin-bottom:5px;page-break-inside:avoid;break-inside:avoid}
.qtext{font-size:10pt;line-height:1.65;margin-bottom:5px}
.qn{font-weight:bold;color:#1a56db;margin-right:3px}
.opts{display:grid;grid-template-columns:1fr 1fr;gap:3px 14px;padding-left:10px}
.opt{display:flex;align-items:baseline;gap:5px;font-size:9.5pt;line-height:1.5}
.ol{font-weight:bold;color:#555;min-width:14px}
.foot{position:fixed;bottom:0;left:0;right:0;border-top:1px solid #ccc;padding:3px 1.2cm;display:flex;justify-content:space-between;font-size:7.5pt;color:#999}
@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}@page{margin:.8cm;size:A4}.foot{position:fixed}}
.katex{font-size:.95em}.katex-display{margin:3px 0}
</style></head><body>
<div class="hdr">
  <div class="logo">L'<span>Match</span></div>
  <div class="htitle"><h1>${examTitle}</h1><p>${school} &nbsp;·&nbsp; ${year} &nbsp;·&nbsp; ${questions.length} Questions &nbsp;·&nbsp; Durée : 2h</p></div>
  <div class="hright">Date : ___/___/______<br>Note : _____ / ${questions.length}</div>
</div>
<div class="instruct">⚠ <b>Consignes :</b> Une seule réponse correcte par question. Noircissez la bulle correspondante dans la grille ci-dessous. Toute bulle non noircie ou noircie plusieurs fois = réponse incorrecte.</div>
<div class="omr-wrap">
  <div class="qr-col">
    <img src="${qrUrl}" alt="QR"/>
    <span>Scanner avec<br>L'Match App</span>
  </div>
  <div class="omr-col">
    <div class="omr-title">🗂 Grille de Réponses OMR</div>
    <table class="omr-table">
      <thead><tr><th>N°</th><th>A</th><th>B</th><th>C</th><th>D</th><th class="sep"></th><th>N°</th><th>A</th><th>B</th><th>C</th><th>D</th></tr></thead>
      <tbody>${omrRows}</tbody>
    </table>
  </div>
  <div class="stu-box">
    <div class="stu-field"><label>Nom &amp; Prénom</label><div class="stu-line"></div></div>
    <div class="stu-field"><label>CNE / Matricule</label><div class="stu-line"></div></div>
    <div class="stu-field"><label>Établissement</label><div class="stu-line"></div></div>
    <div class="stu-field"><label>Filière</label><div class="stu-line"></div></div>
  </div>
</div>
<div class="main">${questionsHtml}</div>
<div class="foot">
  <span>L'Match — Plateforme de préparation aux concours 🎯</span>
  <span>${examTitle} · ${year} · Page <span class="page"></span></span>
</div>
<script>
async function printWhenReady() {
  await document.fonts.ready;
  await new Promise(r => setTimeout(r, 700));
  window.print();
}
printWhenReady();
</script>
</body></html>`;
};

/* ═══════════════════════════════════════════════
   2. GUIDE DES ASTUCES — Correction Book
   ═══════════════════════════════════════════════ */
export const generateCorrectionHTML = (examTitle, school, year, questions) => {
  const cardsHtml = questions.map((q, i) => {
    const num = q.question_number || (i + 1);
    const subject = q.subject || q.topic || 'Général';
    return `
    <div class="qcard">
      <div class="card-hdr">
        <span class="spill">${subject}</span>
        <span class="qlabel">QCM N°${num}</span>
        <span class="ans-badge">Réponse : <b>${q.correct_answer}</b></span>
      </div>
      <div class="qtext">${renderMath(q.question)}</div>
      ${q.context ? `<div class="ctx-box">📋 ${renderMath(q.context)}</div>` : ''}
      ${q.image ? `<div style="margin: 6px 0 8px 0; display: block; text-align: center;"><img src="${q.image}" style="max-height: 110px; max-width: 100%; display: inline-block; object-fit: contain;" /></div>` : ''}
      <div class="opts-row">
        ${(q.options || []).map((opt, idx) => {
          const letter = LETTERS[idx];
          if (!letter) return '';
          const isOk = letter === q.correct_answer;
          return `<div class="opt${isOk ? ' ok' : ''}"><span class="ol">${letter}.</span>${renderMath(optText(opt))}</div>`;
        }).join('')}
      </div>
      ${q.astuce ? `<div class="rule-box"><div class="box-hdr rule-hdr">⭐ RÈGLE DE L'ART</div><div class="box-body">${renderMath(q.astuce)}</div></div>` : ''}
      ${q.trick ? `<div class="trick-box"><div class="box-hdr trick-hdr">⚡ COUP DE GRÂCE</div><div class="box-body">${renderMath(q.trick)}</div></div>` : ''}
    </div>`;
  }).join('');

  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
<title>${examTitle} — Corrigé</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/dreampulse/computer-modern-web-font@master/fonts.css">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=STIX+Two+Text:ital,wght@0,400;0,600;0,700;1,400;1,600&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Computer Modern Serif','STIX Two Text','Times New Roman',serif;color:#111;background:#fff;font-size:11pt;padding:.8cm 1.2cm;line-height:1.65;font-feature-settings:'liga' 1,'kern' 1}
.hdr{display:flex;align-items:center;justify-content:space-between;padding-bottom:.4cm;border-bottom:3px solid #7c3aed;margin-bottom:.5cm}
.logo{font-size:20pt;font-weight:900;color:#7c3aed}.logo span{color:#f59e0b}
.htitle{text-align:center;flex:1}
.htitle h1{font-size:12pt;font-weight:bold;color:#7c3aed;text-transform:uppercase;letter-spacing:.8px}
.htitle p{font-size:8.5pt;color:#666;margin-top:3px}
.qcard{border:1px solid #e5e7eb;border-radius:5px;padding:10px;margin-bottom:12px;page-break-inside:avoid;break-inside:avoid}
.card-hdr{display:flex;align-items:center;gap:8px;margin-bottom:6px;padding-bottom:5px;border-bottom:1px solid #f3f4f6;break-inside:avoid;page-break-inside:avoid}
.spill{background:#ede9fe;color:#7c3aed;padding:2px 7px;border-radius:10px;font-size:7.5pt;font-weight:bold;text-transform:uppercase;letter-spacing:.5px;print-color-adjust:exact;-webkit-print-color-adjust:exact}
.qlabel{font-size:8.5pt;font-weight:bold;color:#444}
.ans-badge{margin-left:auto;background:#dcfce7;color:#16a34a;padding:2px 9px;border-radius:10px;font-size:8.5pt;font-weight:bold;print-color-adjust:exact;-webkit-print-color-adjust:exact;border:1.5px solid #16a34a}
.qtext{font-size:10pt;line-height:1.7;margin-bottom:7px}
.ctx-box{background:#f0fdf4;border-left:3px solid #22c55e;padding:5px 9px;font-size:9pt;margin-bottom:7px;border-radius:0 3px 3px 0;print-color-adjust:exact;-webkit-print-color-adjust:exact}
.opts-row{display:grid;grid-template-columns:1fr 1fr;gap:3px;margin-bottom:8px}
.opt{display:flex;align-items:baseline;gap:5px;font-size:9.5pt;padding:3px 6px;border-radius:3px;line-height:1.5;border:1px solid transparent}
.opt.ok{background:#dcfce7;font-weight:bold;border:1.5px solid #16a34a;color:#14532d;print-color-adjust:exact;-webkit-print-color-adjust:exact}
.opt.ok .ol::before{content:'✓ ';color:#16a34a;font-weight:900}
.ol{font-weight:bold;min-width:14px;color:#555}
.rule-box{background:#fdf6e3;border:1px solid #f59e0b;border-radius:3px;padding:7px 9px;margin-bottom:5px;print-color-adjust:exact;-webkit-print-color-adjust:exact}
.trick-box{background:#eff6ff;border:1px solid #6366f1;border-radius:3px;padding:7px 9px;print-color-adjust:exact;-webkit-print-color-adjust:exact}
.box-hdr{font-size:7.5pt;font-weight:bold;text-transform:uppercase;letter-spacing:.5px;margin-bottom:3px}
.rule-hdr{color:#b45309}.trick-hdr{color:#4338ca}
.box-body{font-size:10pt;line-height:1.65}
.foot{margin-top:.8cm;border-top:1px solid #e5e7eb;padding-top:5px;display:flex;justify-content:space-between;font-size:7.5pt;color:#aaa}
@media print{*{print-color-adjust:exact!important;-webkit-print-color-adjust:exact!important}@page{margin:.8cm;size:A4}}
.katex{font-size:.95em}.katex-display{margin:4px 0}
</style></head><body>
<div class="hdr">
  <div class="logo">L'<span>Match</span></div>
  <div class="htitle">
    <h1>📚 Guide des Astuces — Corrigé Détaillé</h1>
    <p>${examTitle} &nbsp;·&nbsp; ${school} &nbsp;·&nbsp; ${year} &nbsp;·&nbsp; ${questions.length} Questions</p>
  </div>
  <div></div>
</div>
${cardsHtml}
<div class="foot">
  <span>⚡ L'Match — L'Astuce du Match &nbsp;·&nbsp; Usage pédagogique</span>
  <span>${examTitle} · Corrigé · ${year}</span>
</div>
<script>
async function printWhenReady() {
  await document.fonts.ready;
  await new Promise(r => setTimeout(r, 700));
  window.print();
}
printWhenReady();
</script>
</body></html>`;
};

/* ── Open generated HTML in a new print window ── */
export const openPrintWindow = (html, title) => {
  // Use a Blob URL instead of about:blank so the browser never shows
  // "about:blank" in its default print header/footer.
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const win  = window.open(url, '_blank', 'width=960,height=720,scrollbars=yes');
  if (!win) {
    URL.revokeObjectURL(url);
    alert('Veuillez autoriser les popups pour ce site.');
    return;
  }
  // Revoke after the window has had time to load
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
    profSite = 'www.lmatch.ma',
  } = settings;

  const total = questionsWithSource.length;
  const sources = [...new Set(questionsWithSource.map(q => q._source || 'Inconnu'))];
  const year = new Date().getFullYear();
  const siteUrl = profSite || 'www.lmatch.ma';
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=72x72&data=${encodeURIComponent('https://' + siteUrl.replace(/^https?:\/\//, ''))}&color=1a1a2e&bgcolor=ffffff&format=svg&margin=2`;
  const copyrightLine = profName
    ? `© ${year} L'Match × ${profName}. Tous droits réservés.`
    : `© ${year} L'Match. Tous droits réservés.`;

  const LETTERS = ['A', 'B', 'C', 'D', 'E'];

  const cardsHtml = questionsWithSource.map((q, i) => {
    const optionsHtml = (q.options || []).map((opt, oi) => {
      const letter = LETTERS[oi] || String(oi + 1);
      const rawText = typeof opt === 'string' ? opt : (opt?.text || '');
      const text = rawText.replace(/^[A-E][).]\s*/i, '');
      const isCorrect = q.correct_answer === letter;
      return `<div class="opt${isCorrect ? ' correct-opt' : ''}">
        <span class="opt-badge${isCorrect ? ' correct-badge' : ''}">${letter}.${isCorrect ? ' ✓' : ''}</span>
        <span>${renderMath(text)}</span>
      </div>`;
    }).join('');

    const sourceTag = q._source ? `<span class="src-tag">📌 ${q._source}${q._year ? ' · ' + q._year : ''}</span>` : '';

    return `<div class="qcard">
      <div class="card-hdr">
        <span class="qnum">Q${i + 1}</span>
        ${sourceTag}
        <span class="ans-badge">Réponse : ${q.correct_answer || '?'}</span>
      </div>
      <div class="qtext">${renderMath(q.question || '')}</div>
      ${q.image ? `<div style="margin: 6px 0 8px 0; display: block; text-align: center;"><img src="${q.image}" style="max-height: 110px; max-width: 100%; display: inline-block; object-fit: contain;" /></div>` : ''}
      <div class="opts">${optionsHtml}</div>
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
  /* Reserve space at bottom so content never slides under the footer */
  padding-bottom:1.2cm;
  print-color-adjust:exact;-webkit-print-color-adjust:exact;
  font-feature-settings:'liga' 1,'kern' 1;}

/* ── PAGE SETUP ── */
/* Set left/right margin to 0 for perfect full-width layout.
   Set bottom margin to 0.9cm to remove all wasted white space.
   The footer is natively handled by @bottom-left and @bottom-right margin boxes. */
@page{
  size:A4;
  margin:0.8cm 0 1.0cm 0;
  ${showPageNumbers ? `
  @bottom-left {
    content: "⚡ L'Match   |   ${topic}   |   ${copyrightLine}";
    font-family: 'Inter', sans-serif;
    font-size: 6.5pt;
    font-weight: 500;
    color: #6b7280;
    margin-left: 1.3cm;
    margin-bottom: 0.35cm;
  }
  @bottom-right {
    content: "${profPhone ? profPhone + '   ·   ' : ''}${siteUrl}   |   " counter(page) " / " counter(pages);
    font-family: 'Inter', sans-serif;
    font-size: 6.5pt;
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

/* ── PRE-PRINT INSTRUCTION OVERLAY ── */
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
.cover{min-height:100vh;display:flex;flex-direction:column;justify-content:center;align-items:center;
  position:relative;z-index:10000;
  text-align:center;background:linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%);color:#fff;
  padding:3cm;page-break-after:always;print-color-adjust:exact;-webkit-print-color-adjust:exact}
.cover-logo{font-size:2.5rem;font-weight:900;background:linear-gradient(135deg,#7c3aed,#6366f1);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:0.5rem}
.cover-subtitle{font-size:0.9rem;color:rgba(255,255,255,0.55);letter-spacing:2px;text-transform:uppercase;margin-bottom:2.5rem}
.cover-divider{width:80px;height:3px;background:linear-gradient(90deg,#7c3aed,#6366f1);border-radius:2px;margin:1rem auto}
.cover-tag{font-size:0.75rem;font-weight:800;letter-spacing:3px;text-transform:uppercase;color:#a78bfa;margin-bottom:0.5rem}
.cover-topic{font-size:2.8rem;font-weight:900;line-height:1.2;margin:0.5rem 0 0.75rem;color:#fff}
.cover-desc{font-size:0.88rem;color:rgba(255,255,255,0.6);margin-bottom:2.5rem;max-width:380px}
.cover-stats{display:flex;gap:3rem;justify-content:center;margin:1.5rem 0}
.cover-stat .num{font-size:2rem;font-weight:900;color:#a78bfa}
.cover-stat .lbl{font-size:0.7rem;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:1px;margin-top:0.2rem}
.cover-sources{margin-top:1.5rem;padding:0.75rem 1.5rem;border:1px solid rgba(255,255,255,0.12);
  border-radius:10px;font-size:0.75rem;color:rgba(255,255,255,0.55);max-width:380px}
.cover-sources strong{color:rgba(255,255,255,0.85)}
.cover-prof{margin-top:2rem;font-size:0.8rem;color:rgba(255,255,255,0.45)}
.cover-prof strong{color:rgba(255,255,255,0.75)}

/* ── CONTENT ── */
.content{padding:0.5cm 1.3cm 0.3cm}
.section-hdr{font-size:0.68rem;font-weight:800;letter-spacing:2px;text-transform:uppercase;
  color:#7c3aed;border-bottom:2px solid #ede9fe;padding-bottom:0.35rem;margin:1rem 0 0.9rem}

.qcard{
  border:1px solid #e5e7eb;
  border-radius:6px;
  padding:9px 12px;
  margin-bottom:10px;
  box-decoration-break:clone;
  -webkit-box-decoration-break:clone;
  page-break-inside:avoid;
  break-inside:avoid;
}
.card-hdr{
  display:flex;align-items:center;gap:7px;
  margin-bottom:5px;padding-bottom:4px;
  border-bottom:1px solid #f1f5f9;flex-wrap:wrap;
  break-inside:avoid;page-break-inside:avoid;
}
.qnum{font-family:'Inter',sans-serif;background:#7c3aed;color:#fff;font-size:0.68rem;font-weight:800;padding:2px 8px;border-radius:20px;print-color-adjust:exact;-webkit-print-color-adjust:exact}
.src-tag{font-family:'Inter',sans-serif;background:#f0fdf4;color:#15803d;font-size:0.68rem;font-weight:700;padding:1px 7px;border-radius:8px;border:1px solid #bbf7d0;print-color-adjust:exact;-webkit-print-color-adjust:exact}
.ans-badge{font-family:'Inter',sans-serif;margin-left:auto;background:#dcfce7;color:#15803d;padding:2px 9px;border-radius:8px;
  font-size:0.75rem;font-weight:800;print-color-adjust:exact;-webkit-print-color-adjust:exact;border:1.5px solid #16a34a}
.qtext{
  font-size:9.5pt;line-height:1.55;margin-bottom:5px;
  break-inside:avoid;page-break-inside:avoid;
}
.opts{
  display:grid;grid-template-columns:1fr 1fr;gap:2px 16px;padding-left:6px;margin-bottom:5px;
  break-inside:avoid;page-break-inside:avoid;
}
.opt{
  display:flex;align-items:baseline;gap:8px;font-size:9pt;
  padding:3px 8px;border-radius:4px;border:1px solid transparent;
}
.opt-badge{
  font-family:'Inter',sans-serif;
  font-weight:800;font-size:0.7rem;
  min-width:20px;height:18px;
  display:inline-flex;align-items:center;justify-content:center;
  border-radius:10px;background:#f1f5f9;color:#64748b;
  border:1px solid #e2e8f0;
  flex-shrink:0;
  padding:0 4px;
}
.correct-opt{
  background:#f0fdf4!important;
  border:1px solid #bbf7d0!important;
  color:#15803d!important;
  font-weight:600;
  print-color-adjust:exact;-webkit-print-color-adjust:exact;
}
.correct-opt .opt-badge.correct-badge{
  font-family:'Inter',sans-serif;
  background:#dcfce7!important;
  border:1px solid #86efac!important;
  color:#16a34a!important;
  print-color-adjust:exact;-webkit-print-color-adjust:exact;
}
 
.rule-box{
  background:#fffbeb;border:1px solid #fde68a;border-left:4px solid #f59e0b;border-radius:4px;
  padding:6px 9px;margin-top:5px;print-color-adjust:exact;-webkit-print-color-adjust:exact;
  break-inside:avoid;page-break-inside:avoid;
}
.rule-title{font-family:'Inter',sans-serif;font-size:0.62rem;font-weight:800;letter-spacing:1.5px;color:#92400e;margin-bottom:3px;text-transform:uppercase}
.rule-body{font-size:8.5pt;line-height:1.5;color:#78350f}
.trick-box{
  background:#fdf4ff;border:1px solid #e9d5ff;border-left:4px solid #7c3aed;border-radius:4px;
  padding:6px 9px;margin-top:4px;print-color-adjust:exact;-webkit-print-color-adjust:exact;
  break-inside:avoid;page-break-inside:avoid;
}
.trick-title{font-family:'Inter',sans-serif;font-size:0.62rem;font-weight:800;letter-spacing:1.5px;color:#6b21a8;margin-bottom:3px;text-transform:uppercase}
.trick-body{font-size:8.5pt;line-height:1.5;color:#581c87}

@media print{
  .cover{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  ${!showCover ? '.cover{display:none!important}' : ''}
}
</style>
</head><body>

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

${showCover ? `<!-- COVER -->
<div class="cover">
  <div class="cover-logo">⚡ L'Match</div>
  <div class="cover-subtitle">Guide de Maîtrise · Prépa Concours Maroc</div>
  <div class="cover-divider"></div>
  <div class="cover-tag">Domaine</div>
  <div class="cover-topic">${topic}</div>
  <div class="cover-desc">Toutes les questions · Toutes as astuces · Toutes les techniques d'élimination rapide</div>
  <div class="cover-stats">
    <div class="cover-stat"><div class="num">${total}</div><div class="lbl">Questions</div></div>
    <div class="cover-stat"><div class="num">${sources.length}</div><div class="lbl">Concours</div></div>
    <div class="cover-stat"><div class="num">100%</div><div class="lbl">Corrigées</div></div>
  </div>
  <div class="cover-sources">
    <strong>Sources :</strong> ${sources.join(' · ')}
  </div>
  <div class="cover-prof">
    ${profName ? `Préparé par : <strong>${profName}</strong>${profPhone ? ' · ' + profPhone : ''}` : `<strong>${siteUrl}</strong>`}
  </div>
</div>` : ''}

<!-- CONTENT -->
<div class="content">
  <div class="section-hdr">📚 ${total} questions — ${topic}</div>
  ${cardsHtml}
</div>

<script>
async function printWhenReady() {
  await document.fonts.ready;
  await new Promise(r => setTimeout(r, 1000));
  // Hide hint banner during print
  var hint = document.getElementById('printHint');
  if (hint) hint.style.display = 'none';
  window.print();
  // Restore hint after print dialog closes
  if (hint) hint.style.display = 'flex';
}
printWhenReady();
</script>
</body></html>`;
};

