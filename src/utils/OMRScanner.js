import jsQR from 'jsqr';

/**
 * Real OMR (Optical Mark Recognition) Scanner
 * Uses Canvas API to analyze bubble positions based on the EXACT
 * coordinates used by generateAnswerSheet.js (jsPDF layout).
 */

/**
 * Reads QR Code payload from the uploaded image file.
 * @param {File|Blob} imageFile 
 * @returns {Promise<Object|null>} Decoded QR payload containing { examId, studentId, qCount, ... } or null
 */
export function readQRCodeFromImage(imageFile) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(imageFile);
    const img = new Image();
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      // For fast and accurate QR reading, cap natural width at 1000px
      const scale = Math.min(1, 1000 / img.naturalWidth);
      canvas.width = Math.round(img.naturalWidth * scale);
      canvas.height = Math.round(img.naturalHeight * scale);
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imgData.data, imgData.width, imgData.height, {
        inversionAttempts: "dontInvert",
      });

      if (code) {
        try {
          const payload = JSON.parse(code.data);
          resolve(payload);
        } catch (e) {
          resolve(null);
        }
      } else {
        resolve(null);
      }
    };
    img.src = url;
  });
}

// ── Grid constants (must match generateAnswerSheet.js exactly) ────
const PAGE_W = 210;   // A4 mm
const PAGE_H = 297;
const MARGIN  = 14;
const GRID_TOP = 96;
const ROW_H   = 8.5;
const COL_W   = (PAGE_W - MARGIN * 2) / 2;  // 91 mm
const OPTS    = ['A', 'B', 'C', 'D', 'E'];

/** Get bubble centers in mm for question index (0-based) */
function getBubblesMM(qIdx, total) {
  const half   = Math.ceil(total / 2);
  const col    = qIdx < half ? 0 : 1;
  const rowIdx = col === 0 ? qIdx : qIdx - half;
  const xBase  = MARGIN + col * COL_W;
  const cy     = GRID_TOP + 7 + rowIdx * ROW_H + ROW_H / 2;
  return OPTS.map((opt, i) => ({
    opt,
    x: xBase + 20 + i * 9,
    y: cy,
  }));
}

/** Sample mean darkness (0–255) in a circular region */
function sampleCircle(data, cx, cy, r, W, H) {
  let sum = 0, n = 0;
  const ri = Math.ceil(r);
  for (let dy = -ri; dy <= ri; dy++) {
    for (let dx = -ri; dx <= ri; dx++) {
      if (dx * dx + dy * dy > r * r) continue;
      const px = Math.round(cx + dx);
      const py = Math.round(cy + dy);
      if (px < 0 || px >= W || py < 0 || py >= H) continue;
      const i = (py * W + px) * 4;
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      sum += 255 - gray;   // darkness: 255 = black ink, 0 = white paper
      n++;
    }
  }
  return n > 0 ? sum / n : 0;
}

/**
 * Adaptive Thresholding (Mean Local Thresholding) — in-place on ImageData.
 *
 * For each pixel, we compare it to the AVERAGE of its local neighborhood
 * (windowSize × windowSize). If it is darker than (localMean - C), it becomes
 * black (ink / mark), otherwise white (paper / background).
 *
 * This completely neutralizes:
 *  - Uneven phone camera lighting / shadows
 *  - Camera flash reflections and Moiré patterns
 *  - Yellow / warm paper tones
 *  - Dark desk borders around the sheet
 *
 * Uses an integral image (summed area table) for O(1) per-pixel box blur —
 * extremely fast even at 1500px width.
 *
 * @param {Uint8ClampedArray} data       Raw RGBA pixel buffer (mutated in-place)
 * @param {number}            W          Image width in pixels
 * @param {number}            H          Image height in pixels
 * @param {number}            windowSize Neighborhood radius (default 31px — ~5mm at 1200px)
 * @param {number}            C          Offset constant: pixels darker by C than mean become black (default 8)
 */
function adaptiveThreshold(data, W, H, windowSize = 31, C = 8) {
  const half = Math.floor(windowSize / 2);

  // ── Step 1: extract grayscale into a flat Float32Array ──────────
  const gray = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) {
    const p = i * 4;
    gray[i] = 0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2];
  }

  // ── Step 2: build integral image (summed area table) ────────────
  // integral[y][x] = sum of gray[0..y][0..x]
  const integral = new Float64Array((W + 1) * (H + 1));
  for (let y = 0; y < H; y++) {
    let rowSum = 0;
    for (let x = 0; x < W; x++) {
      rowSum += gray[y * W + x];
      integral[(y + 1) * (W + 1) + (x + 1)] =
        rowSum + integral[y * (W + 1) + (x + 1)];
    }
  }

  // ── Step 3: for each pixel, compute local mean via SAT & binarize ──
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      // Clamp neighborhood window to image bounds
      const x1 = Math.max(0, x - half);
      const y1 = Math.max(0, y - half);
      const x2 = Math.min(W - 1, x + half);
      const y2 = Math.min(H - 1, y + half);

      const count = (x2 - x1 + 1) * (y2 - y1 + 1);

      // SAT lookup: sum of rectangle [x1,y1]→[x2,y2]
      const areaSum =
        integral[(y2 + 1) * (W + 1) + (x2 + 1)]
        - integral[y1       * (W + 1) + (x2 + 1)]
        - integral[(y2 + 1) * (W + 1) + x1]
        + integral[y1       * (W + 1) + x1];

      const localMean = areaSum / count;
      const gv = gray[y * W + x];

      // Pixel is "ink" if it is darker than (localMean - C)
      const bw = gv < localMean - C ? 0 : 255;

      const p = (y * W + x) * 4;
      data[p] = data[p + 1] = data[p + 2] = bw;
      // alpha channel unchanged
    }
  }
}

/**
 * Main scanner function.
 * @param {File|Blob} imageFile
 * @param {number}    questionCount
 * @returns {Promise<Array<{q, answer, confidence, darknesses}>>}
 */
export function scanAnswerSheet(imageFile, questionCount) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(imageFile);
    const img = new Image();

    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image invalide')); };

    img.onload = () => {
      URL.revokeObjectURL(url);

      // Draw to canvas — 1500px is the sweet-spot: enough for sub-mm OMR
      // precision AND fast enough for jsQR and adaptive thresholding on mobile.
      const canvas = document.createElement('canvas');
      const scale = Math.min(1, 1500 / img.naturalWidth);
      canvas.width  = Math.round(img.naturalWidth  * scale);
      canvas.height = Math.round(img.naturalHeight * scale);
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const W = canvas.width;
      const H = canvas.height;

      // ── STEP 1: Detect QR Code on RAW pixels (before any filtering) ──
      // jsQR needs the original color/contrast — never run it after binarization.
      const code = jsQR(imgData.data, W, H, { inversionAttempts: 'dontInvert' });

      // ── STEP 2: Adaptive Thresholding for bubble detection ──────────
      // Window ~5 mm at 1500px (1500/210 ≈ 7.1 px/mm → 31px ≈ 4.4mm window)
      // C=8 means a pixel must be 8 gray-levels darker than its neighborhood to count as ink.
      adaptiveThreshold(imgData.data, W, H, 31, 8);

      // Bubble sample radius in pixels (scaled from mm)
      const bubbleRadiusPx = (2.6 / PAGE_W) * W;

      const results = [];

      for (let q = 0; q < questionCount; q++) {
        const bubbles = getBubblesMM(q, questionCount);
        const darknesses = {};

        for (const { opt, x, y } of bubbles) {
          const px = (x / PAGE_W) * W;
          const py = (y / PAGE_H) * H;
          darknesses[opt] = sampleCircle(imgData.data, px, py, bubbleRadiusPx, W, H);
        }

        // ── Decision Logic ──────────────────────────────────────────
        // Pick the darkest bubble
        let bestOpt = 'A', bestDark = -1;
        for (const [opt, dark] of Object.entries(darknesses)) {
          if (dark > bestDark) { bestDark = dark; bestOpt = opt; }
        }

        /**
         * After adaptive thresholding the image is binary (0 or 255 inverted).
         * An empty bubble border gives ~20-35 darkness (just the thin ring).
         * A filled bubble gives ~120-255 darkness (dense black fill).
         * Threshold at 45 remains valid and very reliable on the binarized image.
         */
        const EMPTY_THRESHOLD = 45;
        const isEmpty = bestDark < EMPTY_THRESHOLD;

        // Confidence: ratio of selected darkness vs sum of all
        const total = Object.values(darknesses).reduce((s, v) => s + v, 0) || 1;
        const secondBest = Object.entries(darknesses)
          .filter(([o]) => o !== bestOpt)
          .reduce((m, [, v]) => Math.max(m, v), 0);

        // Confidence 0–1: 1 = perfectly clear, lower = ambiguous
        const confidence = isEmpty
          ? 1
          : Math.min(1, (bestDark - secondBest) / (bestDark + 1));

        results.push({
          q:          q + 1,
          answer:     isEmpty ? null : bestOpt,
          confidence: Math.max(0, confidence),
          darknesses,
        });
      }

      resolve(results);
    };

    img.src = url;
  });
}
