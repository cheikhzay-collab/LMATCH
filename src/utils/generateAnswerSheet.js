import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

/**
 * Generates a printable answer sheet PDF for an exam.
 * @param {Object} exam   - { id, name, school, year, questions }
 * @param {Object} user   - { name, email }
 */
export async function generateAnswerSheet(exam, user) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const W = 210, H = 297;
  const margin = 14;

  // ── Premium Royal Palette ────────────────────────────────────────
  const navy      = [26, 26, 46];      // Royal Deep Navy #1a1a2e
  const violet    = [124, 58, 237];    // L'CONQ Purple #7c3aed
  const emerald   = [16, 163, 74];     // Emerald Green #10a34a
  const softBg    = [248, 247, 255];   // Light pastel purple-blue #f8f7ff
  const borderCol = [226, 232, 240];   // Light Gray Border #e2e8f0
  const charcoal  = [31, 41, 55];      // Dark Text #1f2937
  const mid       = [100, 116, 139];   // Secondary Slate #64748b

  // ── High-Tech Solid Anchor Squares for Robust Computer Vision ──
  const drawSolidAnchorSquare = (x, y) => {
    doc.setFillColor(0, 0, 0);
    doc.rect(x, y, 7, 7, 'F');
  };

  drawSolidAnchorSquare(8, 8);               // Top-Left
  drawSolidAnchorSquare(W - 8 - 7, 8);       // Top-Right
  drawSolidAnchorSquare(8, H - 8 - 7);       // Bottom-Left
  drawSolidAnchorSquare(W - 8 - 7, H - 8 - 7); // Bottom-Right

  // ── QR Code Payload ──────────────────────────────────────────────
  const payload = JSON.stringify({
    examId:    exam.id,
    examName:  exam.name,
    school:    exam.school,
    studentId: user?.email || 'anonymous',
    qCount:    exam.questions.length,
    generated: new Date().toISOString(),
  });

  const qrDataUrl = await QRCode.toDataURL(payload, {
    width: 180, margin: 1,
    color: { dark: '#1A1A2E', light: '#FFFFFF' },
  });

  // ── Header Band ──────────────────────────────────────────────────
  const headerMargin = 16;
  doc.setFillColor(...navy);
  doc.roundedRect(headerMargin, 16, W - headerMargin * 2, 30, 3, 3, 'F');

  // Platform Logo
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text("L'CONQ", headerMargin + 6, 26);

  // Logo gold dot
  doc.setFillColor(245, 158, 11); // Gold #f59e0b
  doc.circle(headerMargin + 30, 22.5, 1.2, 'F');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(191, 196, 210);
  doc.text('Feuille de réponses officielle · Correction par Intelligence Artificielle', headerMargin + 6, 32);

  // Exam name
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  const examLabel = `${exam.school} — ${exam.name} ${exam.year || ''}`.trim();
  doc.text(examLabel, headerMargin + 6, 41, { maxWidth: 130 });

  // QR Code Image in Header
  doc.addImage(qrDataUrl, 'PNG', W - headerMargin - 28, 19, 24, 24);

  // ── Student Info Cards (Rounded border panels) ───────────────────
  const drawCard = (x, y, w, h, title, val) => {
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...borderCol);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, w, h, 2, 2, 'FD');

    // Title label
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...mid);
    doc.text(title, x + 3, y + 5);

    // Value
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...charcoal);
    doc.text(val, x + 3, y + 10.5);
  };

  const cardY = 51;
  const cardH = 14;

  drawCard(margin, cardY, 70, cardH, 'NOM & PRÉNOM DU CANDIDAT', user?.name || '___________________________');
  drawCard(86, cardY, 35, cardH, 'DATE DE PASSAGE', new Date().toLocaleDateString('fr-MA'));
  drawCard(123, cardY, 35, cardH, 'DURÉE', `${Math.ceil(exam.questions.length * 1.5)} minutes`);

  // Score Card highlighted in soft green emerald border
  const scoreCardX = 160;
  doc.setFillColor(240, 253, 244); // light green #f0fdf4
  doc.setDrawColor(...emerald);
  doc.setLineWidth(0.4);
  doc.roundedRect(scoreCardX, cardY, 36, cardH, 2, 2, 'FD');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...emerald);
  doc.text('SCORE FINAL', scoreCardX + 3.5, cardY + 5);

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...emerald);
  doc.text(`____  /  ${exam.questions.length}`, scoreCardX + 3.5, cardY + 10.5);

  // ── Instructions Panel with Purple Accent Bar ────────────────────
  const instY = 69;
  const instH = 10;
  doc.setFillColor(250, 245, 255); // light purple background #faf5ff
  doc.roundedRect(margin, instY, W - margin * 2, instH, 1.5, 1.5, 'F');

  // Purple Left Accent Bar
  doc.setFillColor(...violet);
  doc.rect(margin, instY, 2.5, instH, 'F');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...violet);
  doc.text('INFORMATIONS & CONSIGNES IMPORTANTES :', margin + 5, instY + 4);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...charcoal);
  doc.text('· Noircissez complètement le cercle avec un stylo bleu ou noir.  · En cas d\'erreur, blanchissez proprement le cercle.', margin + 5, instY + 7.5);

  // ── Legend Section ───────────────────────────────────────────────
  const opts = ['A', 'B', 'C', 'D', 'E'];
  const legendY = 82;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...mid);
  doc.text('EXEMPLES DE REMPLISSAGE :', margin, legendY + 3);

  // Example: Filled (Correct)
  const cxOk = margin + 45;
  doc.setFillColor(...navy);
  doc.circle(cxOk, legendY + 2, 2.8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(5.5);
  doc.setFont('helvetica', 'bold');
  doc.text('A', cxOk - 1.2, legendY + 3.9);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...emerald);
  doc.text('Correct', cxOk + 4, legendY + 3);

  // Example: Empty (Unselected)
  const cxNo = margin + 70;
  doc.setDrawColor(...mid);
  doc.setLineWidth(0.3);
  doc.circle(cxNo, legendY + 2, 2.8, 'S');
  doc.setTextColor(...mid);
  doc.setFontSize(5.5);
  doc.setFont('helvetica', 'normal');
  doc.text('B', cxNo - 1.2, legendY + 3.9);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mid);
  doc.text('Vide', cxNo + 4, legendY + 3);

  // ── OMR Grid Section ─────────────────────────────────────────────
  const questions = exam.questions;
  const Q = questions.length;
  const cols = 2;          // Two columns side by side
  const rowH = 8.5;        // height per question row (keeps scanner aligned)
  const colW = (W - margin * 2) / cols;
  const gridTop = 96;

  // Draw Grid Column Headers
  for (let col = 0; col < cols; col++) {
    const xBase = margin + col * colW;
    // Header background (Royal Purple)
    doc.setFillColor(...violet);
    doc.roundedRect(xBase, gridTop, colW - 2, 7, 1.5, 1.5, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text('N°', xBase + 3, gridTop + 4.8);
    
    opts.forEach((o, i) => {
      doc.text(o, xBase + 18 + i * 9, gridTop + 4.8);
    });
  }

  // Draw central divider line to perfectly separate the two columns
  const half = Math.ceil(Q / cols);
  const totalGridH = 7 + half * rowH;
  doc.setDrawColor(...borderCol);
  doc.setLineWidth(0.3);
  doc.line(W / 2, gridTop, W / 2, gridTop + totalGridH);

  // Draw Question Rows
  for (let q = 0; q < Q; q++) {
    const col    = q < half ? 0 : 1;
    const rowIdx = col === 0 ? q : q - half;
    const xBase  = margin + col * colW;
    const y      = gridTop + 7 + rowIdx * rowH;

    // Draw Timing Track (2mm x 2mm solid black square) in side margins
    doc.setFillColor(0, 0, 0);
    doc.rect(col === 0 ? 8 : 200, y + rowH / 2 - 1, 2, 2, 'F');

    // Alternating row background (Soft premium lavender #f8f7ff)
    if (rowIdx % 2 === 0) {
      doc.setFillColor(...softBg);
      doc.rect(xBase, y, colW - 2, rowH, 'F');
    }

    // Row bottom borders for excellent geometric scanner reading
    doc.setDrawColor(...borderCol);
    doc.setLineWidth(0.15);
    doc.line(xBase, y + rowH, xBase + colW - 2, y + rowH);

    // Question number
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...navy);
    doc.text(String(q + 1).padStart(2, '0'), xBase + 3, y + rowH / 2 + 1);

    // Answer bubbles (keeping the EXACT coordinates for the OMR scanner)
    opts.forEach((o, i) => {
      const cx = xBase + 20 + i * 9;
      const cy = y + rowH / 2;
      
      // Beautiful crisp circular bubble borders
      doc.setDrawColor(...mid);
      doc.setLineWidth(0.35);
      doc.circle(cx, cy, 2.9, 'S');

      // Centered letter in bubble
      doc.setFontSize(6.2);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...mid);
      doc.text(o, cx - 1.3, cy + 1.1);
    });
  }

  // ── Footer ───────────────────────────────────────────────────────
  const usedRows = Math.ceil(Q / 2);
  const footerY  = Math.max(gridTop + 7 + usedRows * rowH + 12, 258);

  doc.setDrawColor(...borderCol);
  doc.setLineWidth(0.5);
  doc.line(margin, footerY, W - margin, footerY);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mid);
  doc.text("Après avoir terminé, scannez cette feuille via l'application L'CONQ pour obtenir une correction instantanée.", margin, footerY + 5.5, { maxWidth: W - margin * 2 - 25 });

  // Unique Exam ID Watermark (High-end styling)
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...navy);
  doc.text(`EXAM ID: ${exam.id.slice(0, 8).toUpperCase()}`, W - margin, footerY + 5.5, { align: 'right' });

  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mid);
  doc.text('lconq.ma · IA OMR Engine v2.0', W - margin, footerY + 8.5, { align: 'right' });

  // ── Save/Download ────────────────────────────────────────────────
  const filename = `feuille-reponses-${exam.school.replace(/\s+/g,'-')}-${exam.year || ''}-${exam.id.slice(0,6)}.pdf`;
  doc.save(filename);
}
