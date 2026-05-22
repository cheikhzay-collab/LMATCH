// generate-icons.mjs
// Run: node generate-icons.mjs
// Generates PWA icons from the existing favicon.svg using pure SVG data URLs
// No external dependencies required - uses the @resvg/resvg-js if available,
// otherwise creates simple canvas-based icons

import { createCanvas } from 'canvas';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const iconsDir = path.join(__dirname, 'public', 'icons');

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// L'Conq brand colors
const BG_DARK  = '#0D1117';
const VIOLET   = '#5254F0';
const VIOLET2  = '#818cf8';

function drawIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const r = size * 0.12; // corner radius

  // Background — rounded rect
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(size - r, 0);
  ctx.quadraticCurveTo(size, 0, size, r);
  ctx.lineTo(size, size - r);
  ctx.quadraticCurveTo(size, size, size - r, size);
  ctx.lineTo(r, size);
  ctx.quadraticCurveTo(0, size, 0, size - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();

  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, '#0D1117');
  grad.addColorStop(1, '#161b28');
  ctx.fillStyle = grad;
  ctx.fill();

  // Draw the bolt/lightning shape (L'Conq logo simplified)
  const pad = size * 0.15;
  const w = size - pad * 2;
  const h = size - pad * 2;
  const cx = pad;
  const cy = pad;

  ctx.save();
  ctx.translate(cx, cy);

  // Glow effect
  ctx.shadowColor = VIOLET;
  ctx.shadowBlur = size * 0.15;

  const boltGrad = ctx.createLinearGradient(0, 0, w, h);
  boltGrad.addColorStop(0, VIOLET2);
  boltGrad.addColorStop(1, VIOLET);
  ctx.fillStyle = boltGrad;

  // Bolt shape scaled to w×h (matching the favicon SVG shape)
  const s = w / 48; // scale factor
  ctx.beginPath();
  // Path from SVG: simplified bolt
  ctx.moveTo(25.946 * s, 0);
  ctx.lineTo(39.827 * s, 0);
  ctx.lineTo(28.267 * s, 15.838 * s);
  ctx.lineTo(40.376 * s, 15.838 * s);
  ctx.lineTo(14.101 * s, h);
  ctx.lineTo(20.053 * s, 25.675 * s);
  ctx.lineTo(7.624 * s, 25.675 * s);
  ctx.closePath();
  ctx.fill();

  ctx.restore();

  return canvas.toBuffer('image/png');
}

for (const size of sizes) {
  const buffer = drawIcon(size);
  const outPath = path.join(iconsDir, `icon-${size}.png`);
  fs.writeFileSync(outPath, buffer);
  console.log(`✅ Generated: icon-${size}.png`);
}

console.log('\n🚀 All PWA icons generated in public/icons/');
