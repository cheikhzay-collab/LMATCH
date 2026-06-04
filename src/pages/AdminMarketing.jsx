import React, { useState, useCallback, useEffect } from 'react';
import {
  Megaphone, Sparkles, Download, Copy, CheckCircle2,
  AlertCircle, RefreshCw, ChevronRight, Wand2, Palette,
  BookOpen, Camera, Trophy, GraduationCap, Brain, Target, Zap,
  Upload, Video, Clapperboard, Play, Calendar, Pause, RotateCcw, Volume2, Clock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { generateRemotionScript, renderTikTokVideo, downloadJSON } from '../services/videoService';
import { renderWithMath } from '../utils/mathRenderer';

// ─── Platform Features ────────────────────────────────────────────────────────
const FEATURES = [
  {
    id: 'srs', emoji: '🧠', icon: Brain,
    label: 'Révision SRS Intelligente', color: '#6366F1', colorSoft: 'rgba(99,102,241,0.12)',
    hook: "Ne révise plus au hasard. L'algorithme te dit quoi réviser et quand.",
    features: ['Algorithme FSRS', 'Révision espacée', '3x plus vite', 'Suivi progression'],
    persona: 'a focused Moroccan university student sitting at a clean desk at night, holding an open textbook, soft warm lamp light illuminating their face, dark studious background, wearing casual modern clothes',
    appScreen: { title: 'Révision SRS', score: 87, items: ['FSRS Algorithm', 'Due: 12 cards', 'Streak: 14 days'] },
  },
  {
    id: 'ai-import', emoji: '✨', icon: Sparkles,
    label: 'Import PDF → QCM en 30s', color: '#7C3AED', colorSoft: 'rgba(124,58,237,0.12)',
    hook: '100 questions extraites de ton PDF en 30 secondes avec l\'IA.',
    features: ['Extraction IA', 'QCM auto', 'Prêt en 30s', 'Sujets concours'],
    persona: 'a Moroccan student looking amazed at their laptop screen, PDF documents and papers around them on a modern desk, blue and purple ambient lighting from the screen, dynamic pose of surprise and excitement',
    appScreen: { title: 'Import IA', score: 100, items: ['PDF analysé ✓', '47 QCM créés', 'Prêt en 28s'] },
  },
  {
    id: 'grandes-ecoles', emoji: '🎓', icon: GraduationCap,
    label: 'Grandes Écoles du Maroc', color: '#10B981', colorSoft: 'rgba(16,185,129,0.12)',
    hook: 'Médecine, ENSA, ENCG, INPT... Tous les concours réunis.',
    features: ['Faculté Médecine', 'ENSA Ingénieurs', 'ENCG Commerce', 'Classes Prépa'],
    persona: 'a confident young Moroccan student in a white medical coat with a stethoscope around their neck, standing in a bright university corridor, professional lighting, looking forward with determination',
    appScreen: { title: 'Grandes Écoles', score: 72, items: ['Médecine Rabat', 'Score: 72%', 'Rang: #1,204'] },
  },
  {
    id: 'scanner', emoji: '📷', icon: Camera,
    label: 'Scanner QCM Instantané', color: '#3B82F6', colorSoft: 'rgba(59,130,246,0.12)',
    hook: 'Scanne ta feuille QCM — résultats en 3 secondes.',
    features: ['Scan instantané', 'Correction auto', 'Analyse erreurs', 'Stats détaillées'],
    persona: 'a Moroccan student holding a smartphone over a printed multiple-choice exam sheet on a desk, scanning it, bright overhead light, modern minimalist study environment, hand close-up with phone',
    appScreen: { title: 'Scanner QCM', score: 68, items: ['Scanned: 40 réponses', 'Score: 68%', 'Erreurs: 13'] },
  },
  {
    id: 'classement', emoji: '🏆', icon: Trophy,
    label: 'Classement National', color: '#F59E0B', colorSoft: 'rgba(245,158,11,0.12)',
    hook: 'Où tu te situes parmi les 50 000 candidats au Maroc?',
    features: ['Rang national', 'Par matière', 'Par filière', 'Temps réel'],
    persona: 'a motivated young Moroccan student raising their fist in celebration in front of a blurred university building, golden hour sunlight, triumphant pose, wearing a backpack, energy and confidence',
    appScreen: { title: 'Classement', score: 91, items: ['Rang: #847 / 52K', 'Top 2% Maroc', 'Médecine: #312'] },
  },
  {
    id: 'mock-exam', emoji: '🎯', icon: Target,
    label: 'Examen Blanc Chronométré', color: '#EF4444', colorSoft: 'rgba(239,68,68,0.12)',
    hook: 'Conditions réelles du concours. Chrono, pression, performance.',
    features: ['Conditions réelles', 'Chrono officiel', 'Rapport détaillé', 'Recommandations IA'],
    persona: 'a serious Moroccan student sitting at an exam desk with pen and paper, intense focused expression, dramatic side lighting creating tension, official exam environment with blurred background',
    appScreen: { title: 'Examen Blanc', score: 74, items: ['Durée: 2h 00:00', 'Score: 74/100', 'Rang prédit: #890'] },
  },
  {
    id: 'ebooks', emoji: '📚', icon: BookOpen,
    label: 'E-Books & Cours PDF', color: '#14B8A6', colorSoft: 'rgba(20,184,166,0.12)',
    hook: 'Tous les cours de Terminale en PDF, organisés par matière.',
    features: ['Cours complets', 'PDF gratuits', 'Toutes matières', 'Mis à jour 2025'],
    persona: 'a relaxed Moroccan student on a comfortable couch reading on a tablet, surrounded by colorful textbooks and notes, warm cozy home lighting, peaceful study atmosphere, bright pleasant environment',
    appScreen: { title: 'Bibliothèque', score: 95, items: ['847 cours PDF', 'Maths: 124 docs', 'Téléchargés: 23'] },
  },
];

const FORMATS = [
  { id: 'square',    label: 'Post Carré',  w: 1080, h: 1080, icon: '⬛', ar: '1:1'  },
  { id: 'story',     label: 'Story 9:16',  w: 1080, h: 1920, icon: '📱', ar: '9:16' },
  { id: 'landscape', label: 'Bannière',    w: 1280, h: 640,  icon: '🖼️', ar: '16:9' },
];

const LANGUAGES = [
  { id: 'fr',        label: 'Français',      flag: '🇫🇷' },
  { id: 'ar',        label: 'Darija (عربية)', flag: '🇲🇦' },
  { id: 'bilingual', label: 'Bilingue',       flag: '🔤' },
];

const STYLES = [
  { id: 'dark-gold',    label: 'Dark Gold',     accent: '#F59E0B', accent2: '#FCD34D', bg: '#0A0700' },
  { id: 'dark-violet',  label: 'Dark Violet',   accent: '#8B5CF6', accent2: '#A78BFA', bg: '#050012' },
  { id: 'dark-emerald', label: 'Dark Emerald',  accent: '#10B981', accent2: '#34D399', bg: '#001A10' },
  { id: 'dark-blue',    label: 'Dark Blue',     accent: '#3B82F6', accent2: '#60A5FA', bg: '#000D1A' },
  { id: 'dark-red',     label: 'Dark Red',      accent: '#EF4444', accent2: '#F97316', bg: '#140000' },
  { id: 'dark-pink',    label: 'Dark Pink',     accent: '#EC4899', accent2: '#A855F7', bg: '#120010' },
];

const IMAGE_MODELS = [
  {
    id: 'huggingface', label: 'HuggingFace — FLUX.1 (Gratuit)',
    badge: 'Option Gratuite ✅', color: '#F59E0B',
    desc: 'FLUX.1-schnell via HuggingFace. Très réaliste et gratuit.',
    needsKey: 'hfApiKey',
  },
  {
    id: 'together',  label: 'Together AI — FLUX.1',
    badge: 'Premium ⚡', color: '#8B5CF6',
    desc: 'FLUX.1-schnell via Together API (Payant).',
    needsKey: 'togetherApiKey',
  },
  {
    id: 'imagen3',   label: 'Google Imagen 3',
    badge: 'Clé Gemini', color: '#4285F4',
    desc: 'Qualité photo-réaliste Google. Nécessite clé Gemini.',
    needsKey: 'geminiApiKey',
  },
  {
    id: 'upload',    label: 'Importer votre propre image de fond',
    badge: 'Sur-mesure 🎨', color: '#EC4899',
    desc: 'Téléchargez une image locale. L\'application ajoutera le texte et le mockup dessus.',
    needsKey: false,
  },
  {
    id: 'canvas',    label: 'Poster Studio (Générateur Local)',
    badge: 'Hors ligne 🔌', color: '#10B981',
    desc: 'Fond dégradé stylisé avec emoji géant. Sans API.',
    needsKey: false,
  },
];

// ─── Canvas Composite Poster ──────────────────────────────────────────────────
function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 3) {
  const words = text.split(' ');
  let line = '';
  let lineCount = 0;
  for (const word of words) {
    const testLine = line ? line + ' ' + word : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, y + lineCount * lineHeight);
      line = word;
      lineCount++;
      if (lineCount >= maxLines) break;
    } else {
      line = testLine;
    }
  }
  if (lineCount < maxLines && line) ctx.fillText(line, x, y + lineCount * lineHeight);
  return lineCount + 1;
}

function drawRoundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function createCompositeCanvas(bgB64, feature, format, style, text) {
  return new Promise((resolve) => {
    const W = format.w;
    const H = format.h;
    const isStory = H > W * 1.2;
    const isLandscape = W > H * 1.2;
    const accent = style.accent;
    const accent2 = style.accent2;

    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    const render = () => {
      // ── 1. Background (image or gradient fallback) ──────────────────────
      if (bgB64) {
        const img = new Image();
        img.onload = () => {
          // Draw and crop background to fill canvas
          const imgAr = img.width / img.height;
          const canAr = W / H;
          let sx = 0, sy = 0, sw = img.width, sh = img.height;
          if (imgAr > canAr) {
            sw = img.height * canAr;
            sx = (img.width - sw) / 2;
          } else {
            sh = img.width / canAr;
            sy = (img.height - sh) / 2;
          }
          ctx.drawImage(img, sx, sy, sw, sh, 0, 0, W, H);
          drawOverlay();
          resolve(canvas.toDataURL('image/png').split(',')[1]);
        };
        img.onerror = () => { drawFallbackBg(); drawOverlay(); resolve(canvas.toDataURL('image/png').split(',')[1]); };
        img.src = `data:image/png;base64,${bgB64}`;
      } else {
        drawFallbackBg();
        drawOverlay();
        resolve(canvas.toDataURL('image/png').split(',')[1]);
      }
    };

    const drawFallbackBg = () => {
      const grad = ctx.createLinearGradient(0, 0, W, H);
      grad.addColorStop(0, style.bg);
      grad.addColorStop(0.5, accent + '33');
      grad.addColorStop(1, style.bg);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    };

    const drawOverlay = () => {
      // ── 2. Dark gradient overlays for readability ───────────────────────
      // Top gradient
      const topGrad = ctx.createLinearGradient(0, 0, 0, H * 0.42);
      topGrad.addColorStop(0, 'rgba(0,0,0,0.88)');
      topGrad.addColorStop(0.7, 'rgba(0,0,0,0.4)');
      topGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = topGrad;
      ctx.fillRect(0, 0, W, H * 0.42);

      // Bottom gradient
      const botGrad = ctx.createLinearGradient(0, H * 0.55, 0, H);
      botGrad.addColorStop(0, 'rgba(0,0,0,0)');
      botGrad.addColorStop(0.4, 'rgba(0,0,0,0.75)');
      botGrad.addColorStop(1, 'rgba(0,0,0,0.97)');
      ctx.fillStyle = botGrad;
      ctx.fillRect(0, H * 0.55, W, H * 0.45);

      // ── 3. L'CONQ brand badge (top-left) ──────────────────────────────
      const badgePad = W * 0.045;
      const badgeH = H * 0.052;
      const brandTxt = "L'CONQ";
      ctx.save();
      ctx.font = `900 ${badgeH * 0.55}px Arial, sans-serif`;
      const brandW = ctx.measureText(brandTxt).width + badgePad * 1.6;
      const bgBrand = ctx.createLinearGradient(badgePad * 0.5, badgePad * 0.7, badgePad * 0.5 + brandW, badgePad * 0.7);
      bgBrand.addColorStop(0, accent);
      bgBrand.addColorStop(1, accent2);
      ctx.fillStyle = bgBrand;
      drawRoundRect(ctx, badgePad * 0.5, badgePad * 0.7, brandW, badgeH, badgeH / 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(brandTxt, badgePad * 0.5 + brandW / 2, badgePad * 0.7 + badgeH / 2);
      ctx.restore();

      // ── 4. Main hook text ───────────────────────────────────────────────
      const hook = text?.hook || feature.hook;
      const hookFontSize = isStory ? W * 0.072 : isLandscape ? W * 0.042 : W * 0.062;
      const hookY = isStory ? H * 0.075 : H * 0.068;
      const hookMaxW = isLandscape ? W * 0.48 : W * 0.88;

      ctx.save();
      ctx.font = `900 ${hookFontSize}px Arial, sans-serif`;
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.shadowColor = 'rgba(0,0,0,0.9)';
      ctx.shadowBlur = 18;
      const hookX = W * 0.055;
      const hookLines = wrapText(ctx, hook, hookX, hookY, hookMaxW, hookFontSize * 1.25, 3);
      ctx.restore();

      // Colored accent line under hook
      const accentLineY = hookY + hookLines * hookFontSize * 1.25 + hookFontSize * 0.3;
      const accentLineGrad = ctx.createLinearGradient(hookX, 0, hookX + hookMaxW * 0.55, 0);
      accentLineGrad.addColorStop(0, accent);
      accentLineGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = accentLineGrad;
      ctx.fillRect(hookX, accentLineY, hookMaxW * 0.55, H * 0.006);

      // Sub-text (body excerpt)
      if (text?.body && !isLandscape) {
        const bodyFontSize = hookFontSize * 0.52;
        const bodyY = accentLineY + H * 0.022;
        const bodyLines = text.body.split('\n').slice(0, 2).join(' ');
        ctx.save();
        ctx.font = `500 ${bodyFontSize}px Arial, sans-serif`;
        ctx.fillStyle = 'rgba(255,255,255,0.82)';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 12;
        wrapText(ctx, bodyLines, hookX, bodyY, hookMaxW, bodyFontSize * 1.4, 2);
        ctx.restore();
      }

      // ── 5. Phone mockup ─────────────────────────────────────────────────
      const phoneW = isStory ? W * 0.62 : isLandscape ? W * 0.3 : W * 0.5;
      const phoneH = phoneW * 1.95;
      const phoneX = isStory ? (W - phoneW) / 2 : isLandscape ? W * 0.66 : W * 0.47;
      const phoneY = isStory ? H * 0.35 : isLandscape ? H * 0.1 : H * 0.3;
      const pRad = phoneW * 0.09;

      ctx.save();
      // Phone glow
      ctx.shadowColor = accent;
      ctx.shadowBlur = phoneW * 0.18;
      // Phone body
      ctx.fillStyle = '#0A0A12';
      drawRoundRect(ctx, phoneX, phoneY, phoneW, phoneH, pRad);
      ctx.fill();
      ctx.shadowBlur = 0;
      // Phone border gradient
      const phoneBorderGrad = ctx.createLinearGradient(phoneX, phoneY, phoneX + phoneW, phoneY + phoneH);
      phoneBorderGrad.addColorStop(0, accent + 'cc');
      phoneBorderGrad.addColorStop(0.5, accent2 + '88');
      phoneBorderGrad.addColorStop(1, accent + '55');
      ctx.strokeStyle = phoneBorderGrad;
      ctx.lineWidth = phoneW * 0.022;
      drawRoundRect(ctx, phoneX, phoneY, phoneW, phoneH, pRad);
      ctx.stroke();
      ctx.restore();

      // Phone screen area
      const spad = phoneW * 0.055;
      const sx = phoneX + spad;
      const sy = phoneY + spad * 2;
      const sw = phoneW - spad * 2;
      const sh = phoneH - spad * 3.2;
      ctx.save();
      ctx.fillStyle = '#0D0D18';
      drawRoundRect(ctx, sx, sy, sw, sh, pRad * 0.65);
      ctx.fill();
      ctx.restore();

      // App header
      const appH = sh * 0.1;
      const appGrad = ctx.createLinearGradient(sx, sy, sx + sw, sy);
      appGrad.addColorStop(0, accent + 'ee');
      appGrad.addColorStop(1, accent2 + 'aa');
      ctx.save();
      ctx.fillStyle = appGrad;
      drawRoundRect(ctx, sx, sy, sw, appH, [pRad * 0.65, pRad * 0.65, 0, 0]);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = `800 ${sw * 0.14}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText("L'CONQ", sx + sw / 2, sy + appH / 2);
      ctx.restore();

      // Feature title on screen
      ctx.save();
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.font = `700 ${sw * 0.1}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(feature.appScreen.title, sx + sw / 2, sy + appH + sh * 0.03);
      ctx.restore();

      // Score gauge circle
      const cx2 = sx + sw / 2;
      const cy2 = sy + appH + sh * 0.29;
      const cr = sw * 0.21;
      const score = feature.appScreen.score / 100;
      // BG circle
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx2, cy2, cr, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = cr * 0.2;
      ctx.stroke();
      // Progress arc
      ctx.beginPath();
      ctx.arc(cx2, cy2, cr, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * score);
      const arcG = ctx.createLinearGradient(cx2 - cr, cy2, cx2 + cr, cy2);
      arcG.addColorStop(0, accent2);
      arcG.addColorStop(1, accent);
      ctx.strokeStyle = arcG;
      ctx.lineWidth = cr * 0.2;
      ctx.lineCap = 'round';
      ctx.shadowColor = accent;
      ctx.shadowBlur = cr * 0.2;
      ctx.stroke();
      // Score text
      ctx.fillStyle = '#fff';
      ctx.font = `900 ${cr * 0.65}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowBlur = 0;
      ctx.fillText(`${feature.appScreen.score}%`, cx2, cy2);
      ctx.restore();

      // App screen items list
      const items = feature.appScreen.items;
      const itemBaseY = sy + appH + sh * 0.54;
      const itemSpH = sh * 0.125;
      items.forEach((item, i) => {
        const iy = itemBaseY + i * itemSpH;
        // Item row bg
        ctx.save();
        ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0)';
        drawRoundRect(ctx, sx + sw * 0.04, iy - itemSpH * 0.38, sw * 0.92, itemSpH * 0.76, 4);
        ctx.fill();
        // Dot
        ctx.fillStyle = accent2;
        ctx.shadowColor = accent;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(sx + sw * 0.1, iy, sw * 0.025, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        // Text
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.font = `600 ${sw * 0.092}px Arial`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(item, sx + sw * 0.16, iy);
        ctx.restore();
      });

      // ── 6. Feature badges strip ─────────────────────────────────────────
      const badgesY = isStory ? H * 0.838 : H * 0.828;
      const nBadges = Math.min(feature.features.length, 3);
      const badgeStrW = W * (isLandscape ? 0.45 : 0.88);
      const bW = (badgeStrW - (nBadges - 1) * W * 0.018) / nBadges;
      const bH = H * (isStory ? 0.048 : 0.055);
      const bStartX = (W - badgeStrW) / 2;
      for (let i = 0; i < nBadges; i++) {
        const bx = bStartX + i * (bW + W * 0.018);
        ctx.save();
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.strokeStyle = accent + '55';
        ctx.lineWidth = 1;
        drawRoundRect(ctx, bx, badgesY, bW, bH, 8);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.font = `700 ${bH * 0.42}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const t = feature.features[i];
        ctx.fillText(t.length > 14 ? t.slice(0, 14) + '…' : t, bx + bW / 2, badgesY + bH / 2);
        ctx.restore();
      }

      // ── 7. CTA button ───────────────────────────────────────────────────
      const ctaW = W * (isLandscape ? 0.42 : 0.82);
      const ctaH = H * (isStory ? 0.055 : 0.065);
      const ctaX = (W - ctaW) / 2;
      const ctaY = H - ctaH - H * 0.025;
      const ctaGrad = ctx.createLinearGradient(ctaX, ctaY, ctaX + ctaW, ctaY);
      ctaGrad.addColorStop(0, accent);
      ctaGrad.addColorStop(1, accent2);
      ctx.save();
      ctx.shadowColor = accent;
      ctx.shadowBlur = ctaH * 0.6;
      ctx.fillStyle = ctaGrad;
      drawRoundRect(ctx, ctaX, ctaY, ctaW, ctaH, ctaH / 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#fff';
      ctx.font = `900 ${ctaH * 0.42}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`🚀 Rejoins L'CONQ — Gratuit`, ctaX + ctaW / 2, ctaY + ctaH / 2);
      ctx.restore();
    };

    render();
  });
}

// ─── Offline fallback canvas ──────────────────────────────────────────────────
function buildFallbackBgB64(feature, format, style) {
  return new Promise((resolve) => {
    const W = format.w, H = format.h;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, style.bg);
    g.addColorStop(0.5, style.accent + '44');
    g.addColorStop(1, style.bg);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const rg = ctx.createRadialGradient(W*.5, H*.4, 0, W*.5, H*.4, W*.55);
    rg.addColorStop(0, style.accent + '33'); rg.addColorStop(1, 'transparent');
    ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
    ctx.font = `${W * 0.22}px Arial`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(feature.emoji, W / 2, H * 0.42);
    resolve(canvas.toDataURL('image/png').split(',')[1]);
  });
}

// ─── Prompt helpers ───────────────────────────────────────────────────────────
const STYLE_LIGHTING = {
  'dark-gold':    'warm golden hour lighting, amber and gold tones, dramatic shadows',
  'dark-violet':  'cool purple and blue ambient lighting, neon violet glow, moody atmosphere',
  'dark-emerald': 'cool emerald green tones, fresh academic atmosphere, clean bright lighting',
  'dark-blue':    'cold professional blue lighting, corporate modern feel, sharp clarity',
  'dark-red':     'intense warm red and orange tones, energetic dramatic lighting',
  'dark-pink':    'soft pink and purple tones, modern youthful aesthetic, soft glow',
};

function buildClaudeTextPrompt(feature, format, lang) {
  const langInstr = lang.id === 'ar'
    ? 'Write ENTIRELY in Moroccan Darija Arabic (Arabic script, عربي). Youth slang, energetic.'
    : lang.id === 'bilingual'
    ? 'HOOK in Moroccan Darija Arabic (Arabic script), BODY and CTA in French.'
    : 'Write entirely in French. Modern, motivating, youth tone.';

  return `You are a viral social media copywriter for L'CONQ, Morocco's top Bac preparation app targeting competitive entrance exams.

Feature to promote: **${feature.label}**
Core message: "${feature.hook}"
Key benefits: ${feature.features.join(', ')}

${langInstr}

Respond EXACTLY in this format (no extra text):
HOOK: [Ultra punchy 6-10 word hook that grabs attention instantly]
BODY: [2-3 benefit-focused lines that explain why it matters]
CTA: [Strong 1-line call to action]
HASHTAGS: [12 relevant hashtags for Moroccan Bac students]`;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminMarketing() {
  const { exams } = useAuth();

  // Tab state
  const [activeTab, setActiveTab] = useState('poster');

  // Poster Studio state
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [selectedFormat,  setSelectedFormat]  = useState(FORMATS[0]);
  const [selectedLang,    setSelectedLang]    = useState(LANGUAGES[0]);
  const [selectedStyle,   setSelectedStyle]   = useState(STYLES[0]);
  const [selectedModel,   setSelectedModel]   = useState(() =>
    localStorage.getItem('togetherApiKey') ? 'together' : 'canvas'
  );

  // TikTok Reels Hub state
  const [selectedVideoExam, setSelectedVideoExam] = useState(null);
  const [selectedVideoQuestion, setSelectedVideoQuestion] = useState(null);
  const [previewScript, setPreviewScript] = useState(null);
  const [isRenderingVideo, setIsRenderingVideo] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [videoHistory, setVideoHistory] = useState([
    { id: 'vid-1', title: 'Analyse (Suites)', status: 'publié', time: 'Aujourd\'hui 10:15', url: '#' },
    { id: 'vid-2', title: 'Géométrie (Espace)', status: 'planifié', time: 'Demain 18:00', url: '#' }
  ]);

  // Live video preview simulator state
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);

  useEffect(() => {
    let interval = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setPlaybackTime(prev => {
          if (prev >= 30) {
            setIsPlaying(false);
            return 30;
          }
          return Math.min(30, prev + 0.1);
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  useEffect(() => {
    setIsPlaying(false);
    setPlaybackTime(0);
  }, [selectedVideoQuestion]);

  const [companionOnline, setCompanionOnline] = useState(false);
  const [isLocalRendering, setIsLocalRendering] = useState(false);

  useEffect(() => {
    const checkCompanion = async () => {
      try {
        const res = await fetch('http://localhost:5002/ping');
        const data = await res.json();
        if (data?.status === 'online') {
          setCompanionOnline(true);
        } else {
          setCompanionOnline(false);
        }
      } catch {
        setCompanionOnline(false);
      }
    };
    checkCompanion();
    const interval = setInterval(checkCompanion, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleLocalRender = async () => {
    if (!selectedVideoQuestion || !selectedVideoExam) return;
    setIsLocalRendering(true);
    try {
      const script = generateRemotionScript(selectedVideoQuestion, selectedVideoExam.name);
      const res = await fetch('http://localhost:5002/render', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(script)
      });
      if (!res.ok) {
        throw new Error(`Rendu local échoué (code HTTP ${res.status})`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lconq-tiktok-${selectedVideoQuestion.id || 'q'}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      alert("🎉 Le rendu local s'est terminé avec succès ! Votre fichier MP4 a été téléchargé.");
    } catch (err) {
      console.error(err);
      alert("Échec du rendu local. Assurez-vous d'avoir démarré le compagnon (start-all.bat ou node start-companion.js) et exécuté 'npm install' dans le dossier remotion-video-studio.");
    } finally {
      setIsLocalRendering(false);
    }
  };


  const handleSelectExamForVideo = (examId) => {
    const exam = exams.find(e => e.id === examId);
    setSelectedVideoExam(exam);
    if (exam && exam.questions && exam.questions.length > 0) {
      setSelectedVideoQuestion(exam.questions[0]);
    } else {
      setSelectedVideoQuestion(null);
    }
    setPreviewScript(null);
  };

  const handleGenerateScript = () => {
    if (!selectedVideoQuestion || !selectedVideoExam) return;
    const script = generateRemotionScript(selectedVideoQuestion, selectedVideoExam.name);
    setPreviewScript(script);
  };

  const handleDownloadScript = () => {
    if (!previewScript) return;
    downloadJSON(`tiktok_script_question_${selectedVideoQuestion.id || 'q'}.json`, previewScript);
  };

  const handleScheduleVideo = async () => {
    if (!selectedVideoQuestion || !selectedVideoExam) return;
    setIsRenderingVideo(true);
    try {
      const renderResult = await renderTikTokVideo(selectedVideoQuestion, selectedVideoExam.name);
      
      const newVideo = {
        id: renderResult.videoId,
        title: `${selectedVideoExam.school} (${selectedVideoQuestion.topic || 'QCM'})`,
        status: scheduledDate ? 'planifié' : 'publié',
        time: scheduledDate ? `${scheduledDate} ${scheduledTime || '12:00'}` : 'À l\'instant',
        url: renderResult.videoUrl
      };

      setVideoHistory(prev => [newVideo, ...prev]);
      alert(scheduledDate 
        ? `🎉 Le vidéo-cours a été généré et planifié pour publication le ${scheduledDate} à ${scheduledTime || '12:00'} !`
        : `🚀 Le vidéo-cours a été généré avec succès ! Le fichier MP4 est prêt pour publication.`
      );
      setPreviewScript(null);
      setScheduledDate('');
      setScheduledTime('');
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la génération de la vidéo.");
    } finally {
      setIsRenderingVideo(false);
    }
  };

  const [phase,           setPhase]           = useState(1);
  const [uploadedBg,      setUploadedBg]      = useState(null);
  const [generatedImage,  setGeneratedImage]  = useState(null);
  const [generatedText,   setGeneratedText]   = useState(null);
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [usedModel,       setUsedModel]       = useState('');
  const [error,           setError]           = useState('');
  const [progressMsg,     setProgressMsg]     = useState('');
  const [progressStep,    setProgressStep]    = useState(0);
  const [copied,          setCopied]          = useState(false);
  const [promptVisible,   setPromptVisible]   = useState(false);

  const claudeKey   = localStorage.getItem('claudeApiKey')   || '';
  const geminiKey   = localStorage.getItem('geminiApiKey')   || '';
  const togetherKey = localStorage.getItem('togetherApiKey') || '';
  const hfKey       = localStorage.getItem('hfApiKey')       || '';

  // ── Step 1: Claude writes the person/scene FLUX.1 prompt ──────────────────
  const generateScenePrompt = useCallback(async (feature, format, style) => {
    const orient = format.id === 'story'
      ? 'vertical 9:16 portrait mobile format'
      : format.id === 'landscape'
      ? 'horizontal 16:9 wide banner format'
      : 'square format centered composition';

    const basePrompt = `${feature.persona}. ${STYLE_LIGHTING[style.id]}. ${orient}. Photorealistic professional advertising photography, shallow depth of field, cinematic composition, magazine quality. Shot on Sony A7R, 85mm lens, studio professional lighting. 8K ultra high definition. No text, no logos, no watermarks.`;

    if (!claudeKey) return basePrompt;

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': claudeKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5',
          max_tokens: 380,
          system: `You are a professional advertising photographer and FLUX.1 prompt engineer. You write photorealistic prompts that produce stunning commercial portrait and scene photography for educational marketing campaigns. Your prompts always result in realistic human subjects in relevant educational contexts — never abstract shapes or geometric patterns.`,
          messages: [{
            role: 'user',
            content: `Write a FLUX.1 image prompt for this marketing poster background:

PLATFORM: L'CONQ — Morocco's top educational app for Bac students
FEATURE: "${feature.label}" — ${feature.hook}
SUBJECT/SCENE: ${feature.persona}
LIGHTING STYLE: ${STYLE_LIGHTING[style.id]}
FORMAT: ${orient}

The image will have text and UI overlaid on top later, so:
- The subject should occupy mostly the LEFT or CENTER of frame
- Keep RIGHT side slightly less busy (for phone mockup overlay)
- Subject should look authentic, Moroccan, aspirational
- Avoid busy backgrounds — use shallow depth of field to blur background

Write ONLY the prompt (4-5 sentences). No preamble.`
          }]
        })
      });
      if (!res.ok) return basePrompt;
      const data = await res.json();
      return (data?.content?.[0]?.text?.trim() || basePrompt) + ' No text overlays, no logos, no watermarks in the image itself.';
    } catch {
      return basePrompt;
    }
  }, [claudeKey]);

  // ── Step 2a: HuggingFace Inference FLUX.1 ─────────────────────────────────
  const tryHuggingFace = useCallback(async (prompt) => {
    if (!hfKey) throw new Error('Token HuggingFace manquant.');
    const res = await fetch(
      'https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${hfKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ inputs: prompt })
      }
    );
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`HuggingFace API error: HTTP ${res.status} ${errText}`);
    }
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }, [hfKey]);

  // ── Step 2: Together AI FLUX.1 ────────────────────────────────────────────
  const tryTogether = useCallback(async (prompt, format) => {
    if (!togetherKey) throw new Error('Clé Together AI manquante.');
    const NEGATIVE = 'text, words, letters, watermark, logo, ugly, blurry, distorted, low quality, cartoon, drawing, painting, anime, abstract, geometric shapes, crystals, polygons, duplicate faces, extra limbs, bad anatomy';
    const res = await fetch('https://api.together.xyz/v1/images/generations', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${togetherKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'black-forest-labs/FLUX.1-schnell',
        prompt,
        negative_prompt: NEGATIVE,
        width: Math.min(format.w, 1024),
        height: Math.min(format.h, 1024),
        steps: 8,
        n: 1,
        response_format: 'b64_json',
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Together AI HTTP ${res.status}`);
    }
    const data = await res.json();
    const b64 = data?.data?.[0]?.b64_json;
    if (b64) return b64;
    const url = data?.data?.[0]?.url;
    if (url) {
      const imgRes = await fetch(url);
      const blob = await imgRes.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }
    throw new Error('Aucune image dans la réponse Together AI.');
  }, [togetherKey]);

  // ── Step 2b: Google Imagen 3 ──────────────────────────────────────────────
  const tryImagen3 = useCallback(async (prompt, format) => {
    if (!geminiKey) throw new Error('Clé Gemini manquante.');
    const ar = format.id === 'story' ? '9:16' : format.id === 'landscape' ? '16:9' : '1:1';
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instances: [{ prompt }],
          parameters: { sampleCount: 1, aspectRatio: ar, safetyFilterLevel: 'block_only_high', personGeneration: 'allow_adult' }
        })
      }
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Imagen 3 HTTP ${res.status}`);
    }
    const data = await res.json();
    const b64 = data?.predictions?.[0]?.bytesBase64Encoded;
    if (!b64) throw new Error('Aucune image Imagen 3.');
    return b64;
  }, [geminiKey]);

  // ── Step 3: Claude marketing text ─────────────────────────────────────────
  const generateText = useCallback(async (feature, format, lang) => {
    if (!claudeKey) throw new Error('Clé Claude manquante → Paramètres.');
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': claudeKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5', max_tokens: 600,
        messages: [{ role: 'user', content: buildClaudeTextPrompt(feature, format, lang) }]
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`Claude: ${err?.error?.message || res.status}`);
    }
    const data = await res.json();
    const raw = data?.content?.[0]?.text || '';
    return {
      hook:     raw.match(/HOOK:\s*(.+)/)?.[1]?.trim()                            || feature.hook,
      body:     raw.match(/BODY:\s*([\s\S]+?)(?=CTA:|HASHTAGS:|$)/)?.[1]?.trim() || '',
      cta:      raw.match(/CTA:\s*(.+)/)?.[1]?.trim()                             || "Rejoins L'CONQ",
      hashtags: raw.match(/HASHTAGS:\s*(.+)/)?.[1]?.trim()                        || '',
    };
  }, [claudeKey]);

  // ── Main pipeline ─────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!selectedFeature)                             { setError('Sélectionnez une fonctionnalité.'); return; }
    if (!claudeKey)                                   { setError('Clé Claude requise → Paramètres.'); return; }
    if (selectedModel === 'together' && !togetherKey) { setError('Clé Together AI requise → Paramètres.'); return; }
    if (selectedModel === 'imagen3'  && !geminiKey)   { setError('Clé Gemini requise → Paramètres.'); return; }

    setError(''); setPhase(2); setGeneratedImage(null); setGeneratedText(null);
    setGeneratedPrompt(''); setUsedModel(''); setProgressStep(1); setPromptVisible(false);

    try {
      // ── STEP 1: Claude writes scene prompt ─────────────────────────────
      setProgressMsg('1/4 — 🧠 Claude analyse la fonctionnalité et rédige le prompt...');
      const scenePrompt = await generateScenePrompt(selectedFeature, selectedFormat, selectedStyle);
      setGeneratedPrompt(scenePrompt);
      setProgressStep(2);

      // ── STEP 2+3: Background image + text in parallel ──────────────────
      setProgressMsg('2/4 — ⚡ FLUX.1 génère la photo réaliste...');
      const [bgB64, textResult] = await Promise.all([
        (async () => {
          if (selectedModel === 'together') {
            const b64 = await tryTogether(scenePrompt, selectedFormat);
            setUsedModel('FLUX.1 + Canvas'); return b64;
          }
          if (selectedModel === 'imagen3') {
            const b64 = await tryImagen3(scenePrompt, selectedFormat);
            setUsedModel('Imagen 3 + Canvas'); return b64;
          }
          if (selectedModel === 'huggingface') {
            const b64 = await tryHuggingFace(scenePrompt);
            setUsedModel('FLUX.1 (HF) + Canvas'); return b64;
          }
          if (selectedModel === 'upload') {
            if (!uploadedBg) throw new Error("Veuillez d'abord importer une image de fond.");
            setUsedModel('Image Perso + Canvas'); return uploadedBg;
          }
          setUsedModel('Canvas Studio');
          return buildFallbackBgB64(selectedFeature, selectedFormat, selectedStyle);
        })(),
        (async () => {
          setProgressStep(3);
          return generateText(selectedFeature, selectedFormat, selectedLang);
        })(),
      ]);

      // ── STEP 4: Canvas composite (text + phone UI + badges + CTA) ──────
      setProgressStep(4);
      setProgressMsg('4/4 — 🎨 Composition du poster marketing (texte + UI + badges)...');
      const compositePoster = await createCompositeCanvas(
        bgB64, selectedFeature, selectedFormat, selectedStyle, textResult
      );

      setGeneratedImage(compositePoster);
      setGeneratedText(textResult);
      setPhase(3);
    } catch (e) {
      setError(e.message);
      setPhase(1);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const a = document.createElement('a');
    a.href = `data:image/png;base64,${generatedImage}`;
    a.download = `lconq-${selectedFeature?.id}-${selectedFormat.id}-${Date.now()}.png`;
    a.click();
  };

  const handleCopyText = () => {
    if (!generatedText) return;
    navigator.clipboard.writeText(
      [generatedText.hook, generatedText.body, generatedText.cta, generatedText.hashtags].filter(Boolean).join('\n\n')
    );
    setCopied(true); setTimeout(() => setCopied(false), 2500);
  };

  const canGenerate = selectedFeature && claudeKey
    && (selectedModel !== 'together' || togetherKey)
    && (selectedModel !== 'imagen3'  || geminiKey)
    && (selectedModel !== 'huggingface' || hfKey)
    && (selectedModel !== 'upload' || uploadedBg);

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div className="animate-fade-in" style={{ maxWidth: 1100, margin: '0 auto' }}>

      {/* Header */}
      <header style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '0.5rem' }}>
          <div style={{
            width: 46, height: 46, borderRadius: 14,
            background: 'linear-gradient(135deg, #EC4899, #8B5CF6, #10B981)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 28px rgba(139,92,246,0.35)'
          }}>
            <Megaphone size={22} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
              Studio Marketing IA
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0 }}>
              Claude rédige le prompt → FLUX.1 génère la photo réaliste → Canvas compose le poster complet
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.45rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
          {[
            { label: 'HuggingFace', active: !!hfKey,       color: '#F59E0B', note: hfKey       ? '✓ FLUX.1 (Gratuit) ⚡' : '⚠️ Non configuré' },
            { label: 'Together AI', active: !!togetherKey, color: '#8B5CF6', note: togetherKey ? '✓ FLUX.1' : '— Optionnel' },
            { label: 'Claude AI',   active: !!claudeKey,   color: '#6366F1', note: claudeKey   ? '✓ Prompt + Texte' : '⚠️ Requis' },
            { label: 'Imagen 3',    active: !!geminiKey,   color: '#4285F4', note: geminiKey   ? '✓ Actif' : '— Optionnel' },
          ].map(({ label, active, color, note }) => (
            <div key={label} style={{
              padding: '0.25rem 0.65rem', borderRadius: 99, fontSize: '0.73rem', fontWeight: 600,
              background: active ? `${color}18` : 'rgba(239,68,68,0.07)',
              border: `1px solid ${active ? color + '44' : 'rgba(239,68,68,0.2)'}`,
              color: active ? color : 'var(--danger)'
            }}>
              {label} — {note}
            </div>
          ))}
        </div>
      </header>

      {/* Tab Switcher */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        background: 'var(--bg-glass)',
        border: '1px solid var(--border)',
        padding: '0.3rem',
        borderRadius: '14px',
        marginBottom: '2rem',
        width: 'fit-content',
        backdropFilter: 'blur(12px)',
        position: 'relative',
        zIndex: 10
      }}>
        <button
          onClick={() => setActiveTab('poster')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.6rem 1.2rem',
            borderRadius: '10px',
            border: 'none',
            fontSize: '0.88rem',
            fontWeight: 800,
            cursor: 'pointer',
            background: activeTab === 'poster' ? 'linear-gradient(135deg, #EC4899, #8B5CF6)' : 'transparent',
            color: activeTab === 'poster' ? '#fff' : 'var(--text-muted)',
            transition: 'all 0.3s ease',
            boxShadow: activeTab === 'poster' ? '0 4px 15px rgba(139, 92, 246, 0.25)' : 'none'
          }}
        >
          <Palette size={16} />
          <span>Studio Poster (Images)</span>
        </button>
        <button
          onClick={() => setActiveTab('video')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.6rem 1.2rem',
            borderRadius: '10px',
            border: 'none',
            fontSize: '0.88rem',
            fontWeight: 800,
            cursor: 'pointer',
            background: activeTab === 'video' ? 'linear-gradient(135deg, #8B5CF6, #10B981)' : 'transparent',
            color: activeTab === 'video' ? '#fff' : 'var(--text-muted)',
            transition: 'all 0.3s ease',
            boxShadow: activeTab === 'video' ? '0 4px 15px rgba(16, 185, 129, 0.25)' : 'none'
          }}
        >
          <Clapperboard size={16} />
          <span>Studio TikTok Vidéo (Vidéos)</span>
        </button>
      </div>

      {activeTab === 'poster' && (
        <>
          {/* ── PHASE 3: Result ── */}
      {phase === 3 && generatedImage && (
        <div className="animate-fade-in">
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div style={{ flex: '0 0 auto', maxWidth: 440 }}>
              <div style={{ position: 'relative', borderRadius: 18, overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.6)', border: '1px solid var(--border)' }}>
                <img src={`data:image/png;base64,${generatedImage}`} alt="Poster marketing" style={{ width: '100%', display: 'block' }} />
                <div style={{
                  position: 'absolute', top: 10, right: 10, padding: '0.25rem 0.65rem', borderRadius: 99,
                  background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)',
                  color: '#fff', fontSize: '0.68rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem'
                }}>
                  <Zap size={10} style={{ color: '#F59E0B' }} /> {usedModel}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.875rem' }}>
                <button onClick={handleDownload} className="btn" style={{ flex: 1, background: 'linear-gradient(135deg,#8B5CF6,#EC4899)', boxShadow: '0 4px 20px rgba(139,92,246,0.4)' }}>
                  <Download size={16} /> Télécharger PNG
                </button>
                <button onClick={() => { setPhase(1); setGeneratedImage(null); setGeneratedText(null); setGeneratedPrompt(''); }}
                  style={{ padding: '0.7rem 1rem', borderRadius: 'var(--radius-lg)', background: 'var(--bg-glass)', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, fontSize: '0.86rem' }}>
                  <RefreshCw size={15} /> Refaire
                </button>
              </div>
            </div>

            <div style={{ flex: '1 1 280px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.875rem', borderRadius: 99, background: selectedFeature.colorSoft, border: `1px solid ${selectedFeature.color}33`, color: selectedFeature.color, fontWeight: 700, fontSize: '0.78rem', width: 'fit-content' }}>
                {selectedFeature.emoji} {selectedFeature.label}
              </div>

              {[
                { label: '🎯 HOOK',           val: generatedText?.hook,     color: '#F59E0B' },
                { label: '📝 CORPS DU TEXTE',  val: generatedText?.body,     color: 'var(--text-main)' },
                { label: '👉 CALL TO ACTION',  val: generatedText?.cta,      color: 'var(--violet)' },
                { label: '#️⃣ HASHTAGS',       val: generatedText?.hashtags, color: 'var(--emerald)', mono: true },
              ].map(({ label, val, color, mono }) => (
                <div key={label} style={{ padding: '0.75rem 1rem', borderRadius: 12, background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                  <p style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.3rem' }}>{label}</p>
                  <p style={{ margin: 0, color, fontWeight: mono ? 500 : 600, fontSize: mono ? '0.78rem' : '0.9rem', lineHeight: 1.6, fontFamily: mono ? 'monospace' : 'inherit' }}>
                    {val || <span style={{ opacity: 0.35, fontStyle: 'italic' }}>—</span>}
                  </p>
                </div>
              ))}

              <button onClick={handleCopyText} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem', borderRadius: 12, cursor: 'pointer', background: copied ? 'rgba(16,185,129,0.1)' : 'var(--bg-glass)', border: `1px solid ${copied ? 'rgba(16,185,129,0.35)' : 'var(--border)'}`, color: copied ? 'var(--emerald)' : 'var(--text-muted)', fontWeight: 700, fontSize: '0.86rem', transition: 'all 0.2s' }}>
                {copied ? <><CheckCircle2 size={15} /> Copié !</> : <><Copy size={15} /> Copier texte + hashtags</>}
              </button>

              {generatedPrompt && (
                <div>
                  <button onClick={() => setPromptVisible(v => !v)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem', padding: '0.45rem 0.75rem', borderRadius: 8, cursor: 'pointer', background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.18)', color: '#8B5CF6', fontWeight: 700, fontSize: '0.73rem', width: '100%' }}>
                    <span>🧠 Prompt Claude</span>
                    <span style={{ opacity: 0.6 }}>{promptVisible ? '▲' : '▼'}</span>
                  </button>
                  {promptVisible && (
                    <div style={{ marginTop: '0.35rem', padding: '0.7rem', borderRadius: 8, background: 'rgba(139,92,246,0.04)', border: '1px solid rgba(139,92,246,0.14)', fontSize: '0.73rem', color: 'var(--text-subtle)', lineHeight: 1.65, fontStyle: 'italic' }}>
                      {generatedPrompt}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── PHASE 2: Generating ── */}
      {phase === 2 && (
        <div className="animate-fade-in" style={{ textAlign: 'center', padding: '3.5rem 2rem' }}>
          <div style={{ width: 84, height: 84, borderRadius: '50%', margin: '0 auto 1.25rem', background: 'linear-gradient(135deg,#EC4899,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 50px rgba(139,92,246,0.4)', animation: 'spin 3s linear infinite' }}>
            <Wand2 size={36} color="#fff" />
          </div>
          <h2 style={{ marginBottom: '0.35rem' }}>Pipeline IA en cours...</h2>
          <p style={{ color: '#8B5CF6', marginBottom: '1.25rem', fontWeight: 700, fontSize: '0.97rem' }}>{progressMsg}</p>

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', maxWidth: 560, margin: '0 auto 1.5rem', gap: 0 }}>
            {[
              { step: 1, icon: '🧠', label: 'Claude rédige\nle prompt scène' },
              { step: 2, icon: '⚡', label: 'FLUX.1 génère\nla photo réaliste' },
              { step: 3, icon: '✍️', label: 'Claude rédige\nle texte marketing' },
              { step: 4, icon: '🎨', label: 'Canvas compose\nle poster final' },
            ].map(({ step, icon, label }, i) => {
              const done = progressStep > step, active = progressStep === step;
              return (
                <div key={step} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: '0.35rem' }}>
                    <div style={{ width: 42, height: 42, borderRadius: '50%', fontSize: '1.1rem', background: done ? 'var(--emerald)' : active ? '#8B5CF6' : 'var(--bg-glass)', border: `2px solid ${done ? 'var(--emerald)' : active ? '#8B5CF6' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: active ? '0 0 18px rgba(139,92,246,0.55)' : 'none', transition: 'all 0.4s' }}>
                      {done ? '✓' : icon}
                    </div>
                    <span style={{ fontSize: '0.62rem', lineHeight: 1.3, textAlign: 'center', color: done ? 'var(--emerald)' : active ? '#8B5CF6' : 'var(--text-subtle)', fontWeight: active || done ? 700 : 500, whiteSpace: 'pre-line' }}>{label}</span>
                  </div>
                  {i < 3 && <div style={{ width: 20, height: 2, flexShrink: 0, marginBottom: '1.6rem', background: done ? 'var(--emerald)' : 'var(--border)', transition: 'background 0.4s' }} />}
                </div>
              );
            })}
          </div>

          {generatedPrompt && (
            <div className="animate-fade-in" style={{ maxWidth: 520, margin: '0 auto', padding: '0.8rem 1rem', borderRadius: 12, background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)', textAlign: 'left' }}>
              <p style={{ fontSize: '0.65rem', fontWeight: 800, color: '#8B5CF6', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.35rem' }}>🧠 Prompt Claude généré</p>
              <p style={{ fontSize: '0.77rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0, fontStyle: 'italic' }}>
                &ldquo;{generatedPrompt.slice(0, 200)}{generatedPrompt.length > 200 ? '...' : ''}&rdquo;
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── PHASE 1: Setup ── */}
      {phase === 1 && (
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div style={{ flex: '1 1 480px' }}>

            {error && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.7rem', padding: '0.8rem 1rem', borderRadius: 12, marginBottom: '1rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--danger)', fontSize: '0.84rem' }}>
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} /><span>{error}</span>
              </div>
            )}

            {/* Step 1: Feature */}
            <div className="glass-panel" style={{ marginBottom: '1rem' }}>
              <h3 style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.92rem' }}>
                <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--violet)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem', fontWeight: 800 }}>1</span>
                Fonctionnalité à promouvoir
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))', gap: '0.45rem' }}>
                {FEATURES.map(f => {
                  const sel = selectedFeature?.id === f.id;
                  return (
                    <button key={f.id} onClick={() => setSelectedFeature(f)} style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', padding: '0.6rem 0.75rem', borderRadius: 10, cursor: 'pointer', background: sel ? f.colorSoft : 'var(--bg-glass)', border: `1.5px solid ${sel ? f.color : 'var(--border)'}`, color: sel ? f.color : 'var(--text-muted)', fontWeight: sel ? 700 : 500, fontSize: '0.79rem', transition: 'all 0.2s', textAlign: 'left', boxShadow: sel ? `0 4px 14px ${f.color}22` : 'none' }}>
                      <span style={{ fontSize: '1rem' }}>{f.emoji}</span>
                      <span style={{ lineHeight: 1.3 }}>{f.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Image model */}
            <div className="glass-panel" style={{ marginBottom: '1rem' }}>
              <h3 style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.92rem' }}>
                <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--violet)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem', fontWeight: 800 }}>2</span>
                Modèle IA — Génération de photo réaliste
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {IMAGE_MODELS.map(m => {
                  const active = selectedModel === m.id;
                  const missing = m.needsKey && !localStorage.getItem(m.needsKey);
                  return (
                    <button key={m.id} onClick={() => setSelectedModel(m.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.7rem 0.9rem', borderRadius: 11, cursor: 'pointer', background: active ? `${m.color}12` : 'var(--bg-glass)', border: `1.5px solid ${active ? m.color : 'var(--border)'}`, transition: 'all 0.2s', textAlign: 'left' }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, background: active ? m.color : 'var(--border)', boxShadow: active ? `0 0 8px ${m.color}` : 'none', transition: 'all 0.2s' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.12rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.86rem', color: active ? m.color : 'var(--text-main)' }}>{m.label}</span>
                          <span style={{ fontSize: '0.66rem', fontWeight: 600, padding: '0.1rem 0.4rem', borderRadius: 99, background: `${m.color}18`, color: m.color }}>{m.badge}</span>
                          {missing && <span style={{ fontSize: '0.65rem', color: 'var(--danger)', fontWeight: 600 }}>⚠️ Clé requise</span>}
                        </div>
                        <p style={{ margin: 0, fontSize: '0.73rem', color: 'var(--text-subtle)' }}>{m.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {selectedModel === 'upload' && (
                <div style={{ marginTop: '1rem', border: '2px dashed var(--border)', borderRadius: '0.75rem', padding: '1.25rem', textAlign: 'center', background: 'var(--bg-glass)', position: 'relative' }}>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={e => {
                      const file = e.target.files[0];
                      if (file) {
                        const r = new FileReader();
                        r.onload = () => setUploadedBg(r.result.split(',')[1]);
                        r.readAsDataURL(file);
                      }
                    }}
                    style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
                  />
                  <div style={{ color: 'var(--violet)', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <Upload size={16} /> {uploadedBg ? "Modifier l'image de fond" : "Importer une image de fond"}
                  </div>
                  {uploadedBg && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.72rem', color: 'var(--emerald)', fontWeight: 600 }}>
                      ✓ Image importée avec succès ! Prêt pour la composition.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Step 3: Format + Language */}
            <div className="glass-panel" style={{ marginBottom: '1rem' }}>
              <h3 style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.92rem' }}>
                <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--violet)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem', fontWeight: 800 }}>3</span>
                Format &amp; Langue du texte
              </h3>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 150px' }}>
                  <p style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.35rem' }}>Format</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    {FORMATS.map(f => (
                      <button key={f.id} onClick={() => setSelectedFormat(f)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', borderRadius: 8, cursor: 'pointer', background: selectedFormat.id === f.id ? 'rgba(99,102,241,0.1)' : 'var(--bg-glass)', border: `1px solid ${selectedFormat.id === f.id ? 'var(--violet)' : 'var(--border)'}`, color: selectedFormat.id === f.id ? 'var(--violet)' : 'var(--text-muted)', fontWeight: selectedFormat.id === f.id ? 700 : 500, fontSize: '0.78rem', transition: 'all 0.2s' }}>
                        <span>{f.icon} {f.label}</span>
                        <span style={{ fontSize: '0.68rem', opacity: 0.55 }}>{f.ar}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ flex: '1 1 130px' }}>
                  <p style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.35rem' }}>Langue</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    {LANGUAGES.map(l => (
                      <button key={l.id} onClick={() => setSelectedLang(l)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.75rem', borderRadius: 8, cursor: 'pointer', background: selectedLang.id === l.id ? 'rgba(99,102,241,0.1)' : 'var(--bg-glass)', border: `1px solid ${selectedLang.id === l.id ? 'var(--violet)' : 'var(--border)'}`, color: selectedLang.id === l.id ? 'var(--violet)' : 'var(--text-muted)', fontWeight: selectedLang.id === l.id ? 700 : 500, fontSize: '0.78rem', transition: 'all 0.2s' }}>
                        {l.flag} {l.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4: Style */}
            <div className="glass-panel" style={{ marginBottom: '1.2rem' }}>
              <h3 style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.92rem' }}>
                <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--violet)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem', fontWeight: 800 }}>4</span>
                Style &amp; palette de couleurs du poster
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' }}>
                {STYLES.map(s => (
                  <button key={s.id} onClick={() => setSelectedStyle(s)} style={{ padding: '0.6rem 0.5rem', borderRadius: 10, cursor: 'pointer', background: selectedStyle.id === s.id ? 'rgba(99,102,241,0.1)' : 'var(--bg-glass)', border: `1.5px solid ${selectedStyle.id === s.id ? 'var(--violet)' : 'var(--border)'}`, transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
                    <div style={{ display: 'flex', gap: '3px' }}>
                      {[s.bg, s.accent, s.accent2].map((c, i) => <div key={i} style={{ width: 13, height: 13, borderRadius: '50%', background: c, boxShadow: `0 2px 6px ${c}77` }} />)}
                    </div>
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, color: selectedStyle.id === s.id ? 'var(--violet)' : 'var(--text-muted)' }}>{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <button onClick={handleGenerate} disabled={!canGenerate} style={{ width: '100%', padding: '1.05rem', fontSize: '1rem', fontWeight: 800, borderRadius: 'var(--radius-lg)', border: 'none', cursor: canGenerate ? 'pointer' : 'not-allowed', background: canGenerate ? 'linear-gradient(135deg,#EC4899,#8B5CF6,#10B981)' : 'var(--bg-glass)', color: canGenerate ? '#fff' : 'var(--text-subtle)', boxShadow: canGenerate ? '0 10px 36px rgba(139,92,246,0.45)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.65rem', transition: 'all 0.3s', opacity: canGenerate ? 1 : 0.55 }}>
              <Wand2 size={20} />
              🧠 Claude → ⚡ FLUX.1 → 🎨 Poster Complet
              <ChevronRight size={16} />
            </button>
            {!claudeKey && (
              <p style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.76rem', color: 'var(--danger)' }}>
                ⚠️ Clé Claude requise →{' '}
                <a href="/admin/settings" style={{ color: 'var(--violet)', fontWeight: 700 }}>Paramètres</a>
              </p>
            )}
          </div>

          {/* Preview sidebar */}
          <div style={{ flex: '0 0 265px' }}>
            <div style={{ position: 'sticky', top: '2rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '1.3rem', boxShadow: 'var(--shadow-card)' }}>
              <h4 style={{ marginBottom: '0.75rem', fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                Aperçu du poster
              </h4>
              {selectedFeature ? (
                <div>
                  <div style={{ width: '100%', aspectRatio: selectedFormat.id === 'story' ? '9/16' : selectedFormat.id === 'landscape' ? '16/9' : '1/1', maxHeight: 200, borderRadius: 12, marginBottom: '0.75rem', background: `linear-gradient(135deg, ${selectedStyle.bg}, ${selectedStyle.accent}55, ${selectedStyle.accent2}33)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '0.4rem', border: `2px solid ${selectedStyle.accent}44`, overflow: 'hidden', boxShadow: `0 8px 24px ${selectedStyle.accent}33`, position: 'relative' }}>
                    {/* Mini poster preview */}
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '38%', background: 'linear-gradient(rgba(0,0,0,0.7), transparent)', display: 'flex', alignItems: 'center', padding: '0.4rem 0.6rem' }}>
                      <span style={{ fontSize: '0.5rem', fontWeight: 900, color: '#fff', background: selectedStyle.accent, padding: '0.15rem 0.4rem', borderRadius: 99 }}>L'CONQ</span>
                    </div>
                    <span style={{ fontSize: '2rem' }}>{selectedFeature.emoji}</span>
                    <span style={{ color: '#fff', fontWeight: 800, fontSize: '0.65rem', textAlign: 'center', padding: '0 0.5rem', textShadow: '0 2px 6px rgba(0,0,0,0.8)' }}>{selectedFeature.label}</span>
                    <div style={{ position: 'absolute', bottom: '10%', left: '50%', transform: 'translateX(-50%)', background: selectedStyle.accent, borderRadius: 99, padding: '0.2rem 0.6rem', fontSize: '0.48rem', fontWeight: 800, color: '#fff', whiteSpace: 'nowrap' }}>
                      🚀 Rejoins L'CONQ
                    </div>
                  </div>
                  {/* Pipeline steps */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.32rem', marginBottom: '0.75rem' }}>
                    {[
                      { icon: '🧠', t: 'Claude: prompt scène', c: '#6366F1' },
                      { icon: '⚡', t: 'FLUX.1: photo réaliste', c: '#8B5CF6' },
                      { icon: '✍️', t: 'Claude: texte marketing', c: '#EC4899' },
                      { icon: '🎨', t: 'Canvas: poster composé', c: '#10B981' },
                    ].map(({ icon, t, c }) => (
                      <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.35rem 0.55rem', borderRadius: 7, background: `${c}0c`, border: `1px solid ${c}1e` }}>
                        <span style={{ fontSize: '0.8rem' }}>{icon}</span>
                        <span style={{ fontSize: '0.68rem', color: c, fontWeight: 600 }}>{t}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {[['Modèle', IMAGE_MODELS.find(m => m.id === selectedModel)?.label], ['Format', `${selectedFormat.icon} ${selectedFormat.label}`], ['Langue', `${selectedLang.flag} ${selectedLang.label}`], ['Palette', selectedStyle.label]].map(([k, v]) => (
                      <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' }}>
                        <span style={{ color: 'var(--text-subtle)', fontWeight: 600 }}>{k}</span>
                        <span style={{ color: 'var(--text-muted)', textAlign: 'right', maxWidth: '58%' }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-subtle)' }}>
                  <Palette size={28} style={{ margin: '0 auto 0.5rem', opacity: 0.3 }} />
                  <p style={{ fontSize: '0.8rem' }}>Sélectionnez une fonctionnalité</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      </>)}

      {/* ── STUDIO TIKTOK VIDEO (Vidéos) ── */}
      {activeTab === 'video' && (
        <div className="animate-fade-in" style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          
          {/* Left Column: Video Configuration (QCM Selection & Actions) */}
          <div style={{ flex: '1 1 500px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* 1. Configuration Panel */}
            <div className="glass-panel" style={{ padding: '1.5rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)' }}>
                <Video size={18} className="text-emerald" />
                <span>1. Configurer le vidéo-cours</span>
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Sélectionner l'Examen</label>
                  <select 
                    className="input-control" 
                    style={{ width: '100%', fontSize: '0.8rem', padding: '0.55rem', borderRadius: '10px' }}
                    value={selectedVideoExam?.id || ''}
                    onChange={e => handleSelectExamForVideo(e.target.value)}
                  >
                    <option value="">-- Sélectionner --</option>
                    {exams.map(e => (
                      <option key={e.id} value={e.id}>{e.name} ({e.school})</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Sélectionner la Question</label>
                  <select 
                    className="input-control" 
                    style={{ width: '100%', fontSize: '0.8rem', padding: '0.55rem', borderRadius: '10px' }}
                    disabled={!selectedVideoExam || !selectedVideoExam.questions?.length}
                    value={selectedVideoQuestion?.id || ''}
                    onChange={e => {
                      const q = selectedVideoExam.questions.find(item => item.id === e.target.value);
                      setSelectedVideoQuestion(q);
                      setPreviewScript(null);
                    }}
                  >
                    {!selectedVideoExam && <option value="">Choisir un examen d'abord</option>}
                    {selectedVideoExam && selectedVideoExam.questions?.map((q, idx) => (
                      <option key={q.id || idx} value={q.id}>Q{idx + 1} : {q.topic || 'Général'} - {q.question?.substring(0, 40)}...</option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedVideoQuestion && (
                <div style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.68rem', color: 'var(--emerald)', background: 'var(--emerald-soft)', fontWeight: 800, padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                      Question Active
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)' }}>Réponse attendue : {selectedVideoQuestion.correct_answer}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', lineHeight: 1.4 }}>{renderWithMath(selectedVideoQuestion.question)}</p>
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                <button 
                  className="btn-outline"
                  disabled={!selectedVideoQuestion}
                  onClick={handleGenerateScript}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', padding: '0.55rem 1.1rem', borderRadius: '10px' }}
                >
                  <Sparkles size={14} /> Générer Script JSON
                </button>
                
                {companionOnline ? (
                  <button 
                    className="btn animate-pulse"
                    disabled={!selectedVideoQuestion || isLocalRendering}
                    onClick={handleLocalRender}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.4rem', 
                      fontSize: '0.8rem', 
                      padding: '0.55rem 1.1rem', 
                      borderRadius: '10px', 
                      background: 'linear-gradient(135deg, #10B981, #059669)',
                      boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
                      color: '#fff',
                      fontWeight: 800
                    }}
                  >
                    <Wand2 size={14} /> {isLocalRendering ? 'Génération MP4...' : 'Rendre MP4 Local (1-Clic)'}
                  </button>
                ) : (
                  <button 
                    className="btn-outline"
                    disabled={true}
                    title="Démarrez le compagnon (node start-companion.js) pour activer"
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.4rem', 
                      fontSize: '0.8rem', 
                      padding: '0.55rem 1.1rem', 
                      borderRadius: '10px',
                      opacity: 0.5,
                      cursor: 'not-allowed'
                    }}
                  >
                    <Wand2 size={14} /> Rendu Local (Compagnon Inactif)
                  </button>
                )}

                <button 
                  className="btn"
                  disabled={!selectedVideoQuestion || isRenderingVideo}
                  onClick={handleScheduleVideo}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', padding: '0.55rem 1.1rem', borderRadius: '10px', background: 'linear-gradient(135deg, var(--violet), var(--border))', color: 'var(--text-muted)' }}
                >
                  <Play size={14} /> Planifier (Cloud Mock)
                </button>
              </div>
            </div>

            {/* 2. Planification & Historique */}
            <div className="glass-panel" style={{ padding: '1.5rem 2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)' }}>
                <Calendar size={18} className="text-violet" />
                <span>2. Planification & Publication</span>
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Date de publication</label>
                  <input 
                    type="date" 
                    className="input-control" 
                    style={{ fontSize: '0.8rem', padding: '0.5rem', borderRadius: '8px' }} 
                    value={scheduledDate}
                    onChange={e => setScheduledDate(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Heure</label>
                  <input 
                    type="time" 
                    className="input-control" 
                    style={{ fontSize: '0.8rem', padding: '0.5rem', borderRadius: '8px' }} 
                    value={scheduledTime}
                    onChange={e => setScheduledTime(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)' }}>Historique du Pipeline de Rendu</h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto' }}>
                  {videoHistory.map(vid => (
                    <div key={vid.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.8rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '0.78rem' }}>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{vid.title}</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          <Clock size={10} />
                          {vid.time}
                        </div>
                      </div>
                      <span style={{ 
                        fontSize: '0.68rem', 
                        fontWeight: 800, 
                        padding: '0.2rem 0.5rem', 
                        borderRadius: '6px',
                        background: vid.status === 'publié' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                        color: vid.status === 'publié' ? 'var(--emerald)' : 'var(--warning)',
                        textTransform: 'uppercase'
                      }}>
                        {vid.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Video Preview (TikTok Simulator) */}
          <div style={{ flex: '0 0 350px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="glass-panel" style={{ padding: '1.25rem', position: 'relative' }}>
              <style>{`
                .tiktok-preview-phone .katex {
                  color: #F8FAFC !important;
                }
                .tiktok-preview-phone .katex-display {
                  margin: 0.3em 0 !important;
                }
                @keyframes spinDisk {
                  from { transform: rotate(0deg); }
                  to { transform: rotate(360deg); }
                }
                @keyframes heartbeat {
                  0%, 100% { transform: scale(1); }
                  50% { transform: scale(1.1); }
                }
                @keyframes textPulse {
                  0%, 100% { opacity: 0.9; }
                  50% { opacity: 0.45; }
                }
                @keyframes slideUpOption {
                  from { transform: translateY(15px); opacity: 0; }
                  to { transform: translateY(0); opacity: 1; }
                }
                @keyframes borderNeonGlow {
                  0%, 100% { border-color: rgba(139, 92, 246, 0.4); box-shadow: 0 0 15px rgba(139, 92, 246, 0.2); }
                  50% { border-color: rgba(139, 92, 246, 0.85); box-shadow: 0 0 25px rgba(139, 92, 246, 0.55); }
                }
                @keyframes borderCorrectNeon {
                  0%, 100% { border-color: rgba(16, 185, 129, 0.4); box-shadow: 0 0 15px rgba(16, 185, 129, 0.25); }
                  50% { border-color: rgba(16, 185, 129, 1); box-shadow: 0 0 30px rgba(16, 185, 129, 0.6); }
                }
                @keyframes borderAstuceNeon {
                  0%, 100% { border-color: rgba(245, 158, 11, 0.4); box-shadow: 0 0 15px rgba(245, 158, 11, 0.2); }
                  50% { border-color: rgba(245, 158, 11, 0.9); box-shadow: 0 0 25px rgba(245, 158, 11, 0.5); }
                }
                @keyframes stickerFloat {
                  0%, 100% { transform: translateY(0) rotate(-1deg); }
                  50% { transform: translateY(-4px) rotate(1deg); }
                }
                .tiktok-phone-container {
                  font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                }
                .option-row-card {
                  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .option-row-card:hover {
                  background: rgba(255, 255, 255, 0.07) !important;
                  border-color: rgba(255, 255, 255, 0.15) !important;
                }
              `}</style>
              
              <h4 style={{ margin: '0 0 0.85rem 0', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444', display: 'inline-block', animation: 'heartbeat 1.5s infinite' }} />
                <span>Simulateur TikTok Player (9:16)</span>
              </h4>
              
              {/* Vertical Phone Screen Mockup */}
              <div 
                className="tiktok-preview-phone tiktok-phone-container"
                style={{ 
                  width: '100%', 
                  aspectRatio: '9/16', 
                  borderRadius: '32px', 
                  background: '#09090B', /* Deep Obsidian background for TikTok look */
                  border: '5px solid #1E293B', 
                  overflow: 'hidden', 
                  position: 'relative',
                  boxShadow: '0 25px 65px rgba(0,0,0,0.7)',
                  display: 'flex',
                  flexDirection: 'column',
                  color: '#F8FAFC',
                  userSelect: 'none'
                }}
              >
                {/* TikTok Header Overlay: Suivre | Pour toi */}
                <div style={{ 
                  position: 'absolute', 
                  top: 14, 
                  left: 0, 
                  right: 0, 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  gap: '1.25rem', 
                  zIndex: 10, 
                  fontSize: '0.82rem', 
                  color: 'rgba(255,255,255,0.6)', 
                  fontWeight: 800,
                  textShadow: '0 2px 4px rgba(0,0,0,0.8)'
                }}>
                  <span style={{ cursor: 'pointer', color: 'rgba(255,255,255,0.5)' }}>Suivre</span>
                  <span style={{ cursor: 'pointer', color: '#fff', borderBottom: '2.5px solid #fff', paddingBottom: 3, fontWeight: 900 }}>Pour toi</span>
                </div>
 
                {/* TikTok Search Icon (top right visual mockup) */}
                <div style={{ position: 'absolute', top: 14, right: 18, zIndex: 10, color: 'rgba(255,255,255,0.9)', fontSize: '0.9rem', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                  🔍
                </div>
 
                {/* Moroccan School and Subject Floating Badges (top left) */}
                <div style={{ position: 'absolute', top: 48, left: 16, zIndex: 10, display: 'flex', gap: 6 }}>
                  <span style={{ 
                    fontSize: '0.62rem', 
                    background: 'linear-gradient(135deg, #8B5CF6, #EC4899)', 
                    color: '#fff', 
                    fontWeight: 900, 
                    padding: '0.22rem 0.65rem', 
                    borderRadius: '8px', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.05em',
                    boxShadow: '0 4px 12px rgba(139,92,246,0.4)',
                    animation: 'stickerFloat 4s ease-in-out infinite'
                  }}>
                    🏫 {selectedVideoExam?.school || "L'CONQ"}
                  </span>
                  <span style={{ 
                    fontSize: '0.62rem', 
                    background: 'rgba(31, 41, 55, 0.85)', 
                    color: '#F9FAFB', 
                    fontWeight: 800, 
                    padding: '0.22rem 0.6rem', 
                    borderRadius: '8px', 
                    border: '1px solid rgba(255,255,255,0.12)',
                    backdropFilter: 'blur(4px)',
                    animation: 'stickerFloat 4.5s ease-in-out infinite'
                  }}>
                    📐 {selectedVideoQuestion?.topic || "Maths"}
                  </span>
                </div>
 
                {/* TikTok Safe Progress Bar indicator (top of content) */}
                <div style={{ position: 'absolute', top: 3, left: 0, right: 0, height: 3, background: 'rgba(255,255,255,0.15)', zIndex: 11 }}>
                  <div style={{ 
                    height: '100%', 
                    width: `${(playbackTime / 30) * 100}%`, 
                    background: 'linear-gradient(90deg, #EC4899, #8B5CF6, #10B981)', 
                    transition: 'width 0.1s linear' 
                  }} />
                </div>
 
                {/* TikTok UI Description Overlay (bottom left) */}
                {selectedVideoQuestion && (
                  <div style={{ 
                    position: 'absolute', 
                    bottom: 18, 
                    left: 16, 
                    right: 68, /* Safe zone to avoid overlaying vinyl disk */
                    zIndex: 10, 
                    textAlign: 'left', 
                    pointerEvents: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}>
                    <p style={{ fontWeight: 900, fontSize: '0.85rem', margin: 0, color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      @lconq_concours <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#3B82F6', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.45rem', fontWeight: 900 }}>✓</span>
                    </p>
                    <p style={{ 
                      fontSize: '0.72rem', 
                      margin: 0, 
                      opacity: 0.95, 
                      lineHeight: 1.4, 
                      color: '#E2E8F0', 
                      textShadow: '0 2px 4px rgba(0,0,0,0.95)',
                      fontWeight: 600
                    }}>
                      أجي تختبر راسك ف هاد السؤال! ⏱️🔥 دقيقة تكفيك؟ فكر فالحل ودوز شوف النتيجة! #{selectedVideoQuestion.topic?.toLowerCase() || 'concours'} #bac2026 #fsrs #maroc #enasa #medecine
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: 0.85, fontSize: '0.68rem', marginTop: 3, color: '#F8FAFC', textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}>
                      <span>🎵</span>
                      <span style={{ overflow: 'hidden', whiteSpace: 'nowrap', width: 120 }}>Son original - L'CONQ Studio Pro</span>
                    </div>
                  </div>
                )}
 
                {/* TikTok Sidebar Action Buttons (likes, comments, share, save, rotating vinyl) */}
                {selectedVideoQuestion && (
                  <div style={{ 
                    position: 'absolute', 
                    right: 12, 
                    bottom: 18, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '0.9rem', 
                    alignItems: 'center', 
                    zIndex: 10 
                  }}>
                    {/* User profile picture */}
                    <div style={{ position: 'relative', marginBottom: 4 }}>
                      <div style={{ 
                        width: 36, 
                        height: 36, 
                        borderRadius: '50%', 
                        border: '1.5px solid #fff', 
                        background: 'linear-gradient(135deg, #8B5CF6, #EC4899)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        fontSize: '1.05rem',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
                      }}>
                        🧠
                      </div>
                      <div style={{ 
                        position: 'absolute', 
                        bottom: -4, 
                        left: '50%', 
                        transform: 'translateX(-50%)', 
                        width: 15, 
                        height: 15, 
                        borderRadius: '50%', 
                        background: '#EF4444', 
                        color: '#fff', 
                        fontSize: '0.75rem', 
                        fontWeight: 900, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        border: '1.5px solid #fff',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                      }}>
                        +
                      </div>
                    </div>
 
                    {/* Likes count */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
                      <span style={{ fontSize: '1.35rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.85))' }}>❤️</span>
                      <span style={{ fontSize: '0.62rem', fontWeight: 900, color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}>18.4K</span>
                    </div>
 
                    {/* Comments count */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
                      <span style={{ fontSize: '1.35rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.85))' }}>💬</span>
                      <span style={{ fontSize: '0.62rem', fontWeight: 900, color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}>412</span>
                    </div>
 
                    {/* Bookmark count */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
                      <span style={{ fontSize: '1.35rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.85))' }}>⭐</span>
                      <span style={{ fontSize: '0.62rem', fontWeight: 900, color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}>11.5K</span>
                    </div>
 
                    {/* Share count */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
                      <span style={{ fontSize: '1.35rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.85))' }}>🔗</span>
                      <span style={{ fontSize: '0.62rem', fontWeight: 900, color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}>863</span>
                    </div>
 
                    {/* Rotating Vinyl Disk */}
                    <div style={{ 
                      width: 28, 
                      height: 28, 
                      borderRadius: '50%', 
                      background: 'radial-gradient(circle, #4B5563 30%, #09090B 70%)', 
                      border: '2px solid rgba(255,255,255,0.8)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      animation: isPlaying ? 'spinDisk 3s linear infinite' : 'none',
                      marginTop: 4,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.5)'
                    }}>
                      <div style={{ width: 11, height: 11, borderRadius: '50%', background: 'linear-gradient(135deg, #EC4899, #8B5CF6)' }} />
                    </div>
                  </div>
                )}
 
                {/* Dark Vignette Background overlay for realistic video contrast */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.2) 35%, rgba(0,0,0,0.2) 65%, rgba(0,0,0,0.7) 100%)',
                  pointerEvents: 'none',
                  zIndex: 2
                }} />
 
                {/* Simulated Content Area (Vertically centered with TikTok safety paddings) */}
                {selectedVideoQuestion ? (
                  <div style={{ 
                    flex: 1, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    padding: '4.5rem 3.4rem 7.8rem 1.3rem', /* Safe padding zone to prevent overlays from covering text */
                    justifyContent: 'center', 
                    position: 'relative',
                    zIndex: 5
                  }}>
                    
                    {/* Dynamic Ambient Background glow matching the simulator states */}
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: playbackTime >= 23 
                        ? 'radial-gradient(circle at center, rgba(245, 158, 11, 0.12) 0%, transparent 75%)'
                        : playbackTime >= 16 
                        ? 'radial-gradient(circle at center, rgba(16, 185, 129, 0.12) 0%, transparent 75%)'
                        : 'radial-gradient(circle at center, rgba(139, 92, 246, 0.08) 0%, transparent 75%)',
                      pointerEvents: 'none',
                      transition: 'background 0.5s ease'
                    }} />
 
                    {/* ──────────────── TIMELINE SEGMENT 1: QUESTION REVEAL (0-5s) ──────────────── */}
                    {playbackTime < 6 && (
                      <div className="animate-fade-in" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                          <span style={{ 
                            fontSize: '0.75rem', 
                            color: '#fff', 
                            background: 'linear-gradient(135deg, #EC4899, #8B5CF6)', 
                            padding: '0.35rem 0.95rem', 
                            borderRadius: '10px', 
                            fontWeight: 900, 
                            textTransform: 'uppercase', 
                            letterSpacing: '0.08em',
                            boxShadow: '0 4px 20px rgba(139, 92, 246, 0.5)',
                            border: '1px solid rgba(255,255,255,0.2)'
                          }}>
                            ⚡ DEFI CHRONO 🇲🇦
                          </span>
                        </div>
                        <div style={{
                          background: 'rgba(15, 23, 42, 0.65)',
                          border: '1.5px solid rgba(255, 255, 255, 0.12)',
                          borderRadius: '24px',
                          padding: '1.4rem',
                          boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
                          backdropFilter: 'blur(20px)',
                          animation: 'borderNeonGlow 3s ease-in-out infinite'
                        }}>
                          <h3 style={{ 
                            fontSize: '1.15rem', 
                            fontWeight: 800, 
                            lineHeight: 1.52, 
                            color: '#FFFFFF',
                            margin: 0,
                            letterSpacing: '-0.015em',
                            textShadow: '0 2px 8px rgba(0,0,0,0.4)'
                          }}>
                            {renderWithMath(selectedVideoQuestion.question)}
                          </h3>
                        </div>
                        <p style={{ 
                          fontSize: '0.78rem', 
                          color: '#A78BFA', 
                          fontWeight: 800, 
                          margin: 0, 
                          letterSpacing: '0.02em',
                          textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                          animation: 'textPulse 1.5s infinite' 
                        }}>
                          جاوب فقلبك قبل ما يسالي الوقت! ⏱️🧠
                        </p>
                      </div>
                    )}
 
                    {/* ──────────────── TIMELINE SEGMENT 2: OPTIONS & COUNTDOWN (6-15s) ──────────────── */}
                    {playbackTime >= 6 && playbackTime < 16 && (
                      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem' }}>
                        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                          <span style={{ fontSize: '0.68rem', color: '#FCD34D', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}>
                            ⏱️ الاختيارات المتوفرة
                          </span>
                          <h4 style={{ 
                            fontSize: '0.85rem', 
                            fontWeight: 800, 
                            margin: 0, 
                            color: 'rgba(255,255,255,0.85)', 
                            lineHeight: 1.4,
                            textShadow: '0 1px 4px rgba(0,0,0,0.9)'
                          }}>
                            {renderWithMath((selectedVideoQuestion.question || '').substring(0, 75) + '...')}
                          </h4>
                        </div>
                        
                        {/* Countdown ring */}
                        <div style={{ display: 'flex', justifyContent: 'center', margin: '0.1rem 0' }}>
                          <div style={{
                            width: 52,
                            height: 52,
                            borderRadius: '50%',
                            border: '3px solid #8B5CF6',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.4rem',
                            fontWeight: 900,
                            color: '#8B5CF6',
                            boxShadow: '0 0 20px rgba(139,92,246,0.4)',
                            background: '#09090B',
                            animation: 'heartbeat 1s infinite'
                          }}>
                            <span style={{ margin: 'auto' }}>{Math.max(0, 15 - Math.floor(playbackTime))}</span>
                          </div>
                        </div>
 
                        {/* Staggered options reveal */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                          {(selectedVideoQuestion.options || []).map((opt, idx) => {
                            const isStr = typeof opt === 'string';
                            const optId = isStr ? ['A', 'B', 'C', 'D', 'E'][idx] : opt.id;
                            const optText = isStr ? opt.replace(/^[A-E]\)\s*/, '') : (opt.text || '');
                            
                            // Show options based on playback time (reveal one by one)
                            const revealTime = 6 + idx * 1.5;
                            const isRevealed = playbackTime >= revealTime;
                            
                            // Beautiful coloring for Option ID Pills
                            const optColors = {
                              'A': { bg: 'rgba(139, 92, 246, 0.15)', text: '#A78BFA', border: '#8B5CF6' },
                              'B': { bg: 'rgba(236, 72, 153, 0.15)', text: '#F472B6', border: '#EC4899' },
                              'C': { bg: 'rgba(16, 185, 129, 0.15)', text: '#34D399', border: '#10B981' },
                              'D': { bg: 'rgba(59, 130, 246, 0.15)', text: '#60A5FA', border: '#3B82F6' },
                            };
                            const theme = optColors[optId] || { bg: 'rgba(255,255,255,0.08)', text: '#fff', border: 'rgba(255,255,255,0.2)' };
 
                            return (
                              <div 
                                key={optId} 
                                className="option-row-card"
                                style={{
                                  padding: '0.65rem 0.85rem',
                                  background: 'rgba(15, 23, 42, 0.6)',
                                  border: '1.5px solid rgba(255,255,255,0.08)',
                                  borderRadius: '14px',
                                  fontSize: '0.78rem',
                                  opacity: isRevealed ? 1 : 0.05,
                                  transform: isRevealed ? 'translateY(0)' : 'translateY(8px)',
                                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '10px',
                                  fontWeight: 700,
                                  boxShadow: isRevealed ? '0 4px 12px rgba(0,0,0,0.2)' : 'none',
                                  animation: isRevealed ? 'slideUpOption 0.4s ease-out' : 'none'
                                }}
                              >
                                <span style={{ 
                                  width: 24, 
                                  height: 24, 
                                  borderRadius: '50%', 
                                  background: theme.bg,
                                  border: `1.5px solid ${theme.border}`,
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'center',
                                  fontSize: '0.75rem',
                                  fontWeight: 900,
                                  color: theme.text,
                                  flexShrink: 0
                                }}>
                                  {optId}
                                </span> 
                                <div style={{ flex: 1, overflowX: 'auto', color: '#F1F5F9' }}>
                                  {renderWithMath(optText)}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
 
                    {/* ──────────────── TIMELINE SEGMENT 3: CORRECT ANSWER PING (16-22s) ──────────────── */}
                    {playbackTime >= 16 && playbackTime < 23 && (
                      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
                        <div style={{ textAlign: 'center' }}>
                          <span style={{ 
                            fontSize: '0.75rem', 
                            color: '#fff', 
                            background: 'linear-gradient(135deg, #10B981, #059669)', 
                            padding: '0.35rem 0.95rem', 
                            borderRadius: '10px', 
                            fontWeight: 900, 
                            textTransform: 'uppercase', 
                            letterSpacing: '0.08em',
                            boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)',
                            border: '1px solid rgba(255,255,255,0.2)'
                          }}>
                            ✅ الجواب الصحيح
                          </span>
                        </div>
 
                        {/* Pulsing Correct Answer Card */}
                        <div style={{ 
                          padding: '1.8rem',
                          background: 'rgba(16, 185, 129, 0.08)',
                          border: '2.5px solid #10B981',
                          borderRadius: '24px',
                          textAlign: 'center',
                          boxShadow: '0 0 35px rgba(16,185,129,0.3)',
                          animation: 'borderCorrectNeon 2s infinite',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '0.65rem',
                          backdropFilter: 'blur(10px)'
                        }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: 900, color: '#34D399', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Réponse Gagnante</span>
                          <div style={{ 
                            width: 62, 
                            height: 62, 
                            borderRadius: '50%', 
                            background: 'linear-gradient(135deg, #10B981, #059669)', 
                            color: '#fff', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            fontSize: '2.4rem', 
                            fontWeight: 950,
                            boxShadow: '0 6px 20px rgba(16,185,129,0.5)',
                            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                          }}>
                            {selectedVideoQuestion.correct_answer}
                          </div>
                          <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.85rem', color: '#F1F5F9', fontWeight: 800 }}>
                            جبتيها صحيحة؟ 🎉🇲🇦
                          </p>
                        </div>
                        <p style={{ textAlign: 'center', fontSize: '0.74rem', color: '#94A3B8', fontWeight: 600, animation: 'textPulse 2s infinite' }}>
                          هاك كيفاش تحسبها ف 10 ثواني... 💡
                        </p>
                      </div>
                    )}
 
                    {/* ──────────────── TIMELINE SEGMENT 4: SOLUTION & ASTUCE (23-30s) ──────────────── */}
                    {playbackTime >= 23 && (
                      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem' }}>
                        <div style={{ textAlign: 'center' }}>
                          <span style={{ 
                            fontSize: '0.75rem', 
                            color: '#1e1b4b', 
                            background: 'linear-gradient(135deg, #FBBF24, #F59E0B)', 
                            padding: '0.35rem 0.95rem', 
                            borderRadius: '10px', 
                            fontWeight: 900, 
                            textTransform: 'uppercase', 
                            letterSpacing: '0.08em',
                            boxShadow: '0 4px 20px rgba(245, 158, 11, 0.4)',
                            border: '1px solid rgba(255,255,255,0.3)'
                          }}>
                            💡 ASTUCE MAGIQUE
                          </span>
                        </div>
 
                        {/* Gold-bordered neon Trick Box */}
                        <div style={{ 
                          padding: '1.25rem',
                          background: 'rgba(245, 158, 11, 0.05)',
                          border: '2px dashed #F59E0B',
                          borderRadius: '20px',
                          backdropFilter: 'blur(10px)',
                          boxShadow: '0 8px 30px rgba(245,158,11,0.15)',
                          animation: 'borderAstuceNeon 2.5s infinite'
                        }}>
                          <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', color: '#FBBF24', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span>⚡</span> فكرة ذكية :
                          </p>
                          <div style={{ margin: 0, fontSize: '0.8rem', color: '#FFFFFF', lineHeight: 1.55, fontWeight: 800 }}>
                            {renderWithMath(selectedVideoQuestion.trick || selectedVideoQuestion.astuce || "عوض بالقيم مباشرة باش تسالي دغيا.")}
                          </div>
                        </div>
 
                        {/* Explanatory notes */}
                        <div style={{ 
                          padding: '0.85rem', 
                          background: 'rgba(255,255,255,0.04)', 
                          borderRadius: '14px', 
                          border: '1px solid rgba(255,255,255,0.08)' 
                        }}>
                          <p style={{ margin: '0 0 0.3rem 0', fontSize: '0.68rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                            التفسير الرياضي :
                          </p>
                          <div style={{ margin: 0, fontSize: '0.74rem', color: '#E2E8F0', lineHeight: 1.48, fontWeight: 600 }}>
                            {renderWithMath(selectedVideoQuestion.astuce || "تطبيق مباشر للمبرهنة.")}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-subtle)', padding: '2rem', textAlign: 'center', gap: '0.65rem' }}>
                    <Clapperboard size={42} style={{ opacity: 0.3, color: '#8B5CF6', animation: 'heartbeat 3s infinite' }} />
                    <p style={{ fontSize: '0.85rem', fontWeight: 800, margin: 0, color: '#F1F5F9' }}>بانتظار اختيار السؤال 🇲🇦</p>
                    <p style={{ fontSize: '0.72rem', opacity: 0.75, margin: 0, lineHeight: 1.45 }}>اختر امتحان وسؤال من القائمة اليسرى لتشغيل محاكاة الفيديو التيكتوك الاحترافية.</p>
                  </div>
                )}
              </div>
 
              {/* Playback Controls Panel */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1.25rem' }}>
                {/* Timeline Progress Slider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <input 
                    type="range" 
                    min="0" 
                    max="30" 
                    step="0.1" 
                    disabled={!selectedVideoQuestion}
                    value={playbackTime} 
                    onChange={e => {
                      setPlaybackTime(parseFloat(e.target.value));
                      setIsPlaying(false);
                    }}
                    style={{ flex: 1, accentColor: '#8B5CF6', height: '4px', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, width: 34, textAlign: 'right', color: 'var(--text-main)' }}>{playbackTime.toFixed(1)}s</span>
                </div>
                
                {/* Control Buttons */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    disabled={!selectedVideoQuestion}
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="btn" 
                    style={{ 
                      flex: 1, 
                      background: isPlaying ? 'var(--warning)' : 'linear-gradient(135deg, #8B5CF6, #10B981)', 
                      padding: '0.6rem', 
                      fontSize: '0.82rem', 
                      borderRadius: '10px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      gap: '0.4rem',
                      fontWeight: 800,
                      boxShadow: '0 4px 15px rgba(139,92,246,0.2)'
                    }}
                  >
                    {isPlaying ? <><Pause size={14} /> Pause</> : <><Play size={14} /> Play Simulator</>}
                  </button>
                  <button 
                    disabled={!selectedVideoQuestion}
                    onClick={() => {
                      setPlaybackTime(0);
                      setIsPlaying(false);
                    }}
                    className="btn-outline" 
                    style={{ padding: '0.6rem 0.9rem', fontSize: '0.82rem', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <RotateCcw size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Direct Local Render Info Box */}
            <div className="glass-panel" style={{ 
              padding: '1rem', 
              background: 'rgba(59, 130, 246, 0.06)', 
              border: '1px solid rgba(59, 130, 246, 0.18)', 
              borderRadius: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              marginTop: '1rem'
            }}>
              <h5 style={{ margin: 0, fontSize: '0.8rem', fontWeight: 800, color: '#3B82F6', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ fontSize: '1rem' }}>💡</span>
                <span>توليد الفيديو محلياً (Local Render)</span>
              </h5>
              <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                لتفادي الضغط على السيرفر، يمكنك تحميل سيناريو السؤال وتوليده كفيديو MP4 مباشرة على جهازك مجاناً عبر خطوات بسيطة:
              </p>
              <ol style={{ margin: '0 0 0 1rem', padding: 0, fontSize: '0.7rem', color: 'var(--text-subtle)', lineHeight: 1.45, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <li>انقر على <strong>"Générer Script JSON"</strong> ثم <strong>"Télécharger JSON"</strong>.</li>
                <li>ضع الملف المحمل داخل المجلد <code>remotion-video-studio</code> باسم <code>question.json</code>.</li>
                <li>افتح Terminal في المجلد وشغّل: <code style={{ color: 'var(--violet)', fontWeight: 700 }}>npm run render:props</code></li>
              </ol>
              <a href="file:///d:/BUREAU%202027/Gima/remotion-video-studio/README.md" target="_blank" style={{ fontSize: '0.7rem', color: '#3B82F6', fontWeight: 700, textDecoration: 'underline', marginTop: '2px' }}>
                📖 فتح دليل الاستخدام الكامل (README.md)
              </a>
            </div>
          </div>


          {/* Remotion Script JSON Timeline Preview Panel */}
          {previewScript && (
            <div className="col-span-12 glass-panel animate-slide-up" style={{ padding: '1.5rem 2rem', display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>📄 Remotion Asset Script (JSON Timeline)</h4>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    className="btn-outline" 
                    onClick={handleDownloadScript}
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', borderRadius: '6px' }}
                  >
                    Télécharger JSON
                  </button>
                  <button 
                    className="btn-outline" 
                    onClick={() => setPreviewScript(null)}
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', borderRadius: '6px', border: 'none', background: 'var(--bg-hover)' }}
                  >
                    Masquer
                  </button>
                </div>
              </div>
              
              <pre style={{
                margin: 0,
                padding: '1rem',
                background: 'rgba(0,0,0,0.3)',
                borderRadius: '10px',
                border: '1px solid var(--border)',
                fontSize: '0.72rem',
                fontFamily: 'Fira Code, monospace',
                whiteSpace: 'pre-wrap',
                maxHeight: '300px',
                overflowY: 'auto'
              }}>
                {JSON.stringify(previewScript, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
