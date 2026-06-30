// src/utils/audio.js
// Synthesized sound effects using the Web Audio API.
// Avoids downloading audio files, ensuring instant load/rendering speed.

let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Plays a pleasant, ascending double chime for correct answers.
 */
export function playCorrectSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // First note: D5 (587.33 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    
    gain1.gain.setValueAtTime(0.08, now); // Low gain to be pleasant
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.12);

    // Second note: A5 (880.00 Hz) - slightly delayed and higher
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880.00, now + 0.07);
    
    gain2.gain.setValueAtTime(0.09, now + 0.07);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.07);
    osc2.stop(now + 0.25);
  } catch (err) {
    console.warn('[Audio] Failed to play correct sound:', err);
  }
}

/**
 * Plays a low, slide-down tone for incorrect answers.
 */
export function playIncorrectSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'triangle'; // Soft buzzy wave
    osc.frequency.setValueAtTime(220.00, now); // A3
    osc.frequency.linearRampToValueAtTime(146.83, now + 0.18); // Slide down to D3
    
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.22);
  } catch (err) {
    console.warn('[Audio] Failed to play incorrect sound:', err);
  }
}
