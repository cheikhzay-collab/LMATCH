import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Camera, Zap, ZapOff, Upload, RotateCw, AlertCircle, ShieldAlert, Loader2, ArrowLeft } from 'lucide-react';
import jsQR from 'jsqr';

// Helper to parse QR data with backward compatibility
function parseQRData(dataStr) {
  if (!dataStr) return null;
  const trimmed = dataStr.trim();
  if (trimmed.startsWith('LCQ:')) {
    return { examId: trimmed.slice(4) };
  }
  try {
    return JSON.parse(trimmed);
  } catch {
    if (trimmed.length >= 8 && /^[a-fA-F0-9-]+$/.test(trimmed)) {
      return { examId: trimmed };
    }
    return null;
  }
}

// Helper to binarize/enhance contrast for QR detection on live camera frames
function enhanceContrastData(imgData) {
  const data = imgData.data;
  const len = data.length;
  const output = new Uint8ClampedArray(len);
  
  let sum = 0;
  for (let i = 0; i < len; i += 4) {
    sum += (data[i] + data[i+1] + data[i+2]) / 3;
  }
  const avg = sum / (len / 4);
  const threshold = avg * 0.92;
  
  for (let i = 0; i < len; i += 4) {
    const val = (data[i] + data[i+1] + data[i+2]) / 3;
    const bin = val < threshold ? 0 : 255;
    output[i] = bin;
    output[i+1] = bin;
    output[i+2] = bin;
    output[i+3] = 255;
  }
  return output;
}

export default function SmartCameraScanner({ onCapture, onCancel, activeExam }) {
  const [hasPermission, setHasPermission] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [scannerStatus, setScannerStatus] = useState('initializing'); // 'initializing' | 'scanning' | 'detected' | 'capturing'
  const [stabilityProgress, setStabilityProgress] = useState(0); // 0 to 100
  const [tilt, setTilt] = useState({ beta: 0, gamma: 0, supported: false });
  const [lowLight, setLowLight] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768 || /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const animationFrameId = useRef(null);
  const stabilityCount = useRef(0);
  const isCapturing = useRef(false);

  const STABILITY_THRESHOLD = 15; // Number of frames QR must be detected consecutively

  // Synthesize shutter sound
  const playShutterSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const bufferSize = ctx.sampleRate * 0.1;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 1000;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start();

      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1500, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.15);
      oscGain.gain.setValueAtTime(0.3, ctx.currentTime);
      oscGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

      osc.connect(oscGain);
      oscGain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.16);
    } catch (e) {
      console.warn("Audio Context not supported or allowed yet", e);
    }
  }, []);

  // Haptic feedback
  const triggerHapticFeedback = useCallback(() => {
    if (navigator.vibrate) {
      navigator.vibrate([60, 40, 60]);
    }
  }, []);

  // Capture current frame at high resolution
  const captureHighRes = useCallback(() => {
    if (!videoRef.current || isCapturing.current) return;
    isCapturing.current = true;
    setScannerStatus('capturing');

    const video = videoRef.current;
    
    // Create a high-resolution canvas
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1920;
    canvas.height = video.videoHeight || 1080;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Play visual flash
    const flashEl = document.createElement('div');
    flashEl.style.position = 'fixed';
    flashEl.style.inset = 0;
    flashEl.style.backgroundColor = '#ffffff';
    flashEl.style.zIndex = 9999;
    flashEl.style.transition = 'opacity 0.2s ease-out';
    document.body.appendChild(flashEl);
    
    // Play sound and vibration
    playShutterSound();
    triggerHapticFeedback();

    setTimeout(() => {
      flashEl.style.opacity = '0';
      setTimeout(() => flashEl.remove(), 200);
    }, 50);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'omr-scan.jpg', { type: 'image/jpeg' });
        onCapture(file);
      } else {
        isCapturing.current = false;
        setScannerStatus('scanning');
      }
    }, 'image/jpeg', 0.92);
  }, [onCapture, playShutterSound, triggerHapticFeedback]);

  // Real-time analysis loop
  const startAnalysis = useCallback(() => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    // We analyze at a smaller, fixed resolution for maximum frame rate
    const analysisWidth = 480;
    const analysisHeight = 640; // 3:4 aspect ratio typical for mobile cameras
    canvas.width = analysisWidth;
    canvas.height = analysisHeight;

    const scanFrame = () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA && !isCapturing.current) {
        // Draw video frame to small canvas
        ctx.drawImage(video, 0, 0, analysisWidth, analysisHeight);
        
        // Extract pixel data for jsQR
        const imgData = ctx.getImageData(0, 0, analysisWidth, analysisHeight);

        // Option 5: Sample average frame brightness
        let brightnessSum = 0;
        const step = 8; // sample every 8th pixel
        let count = 0;
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4 * step) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          brightnessSum += (0.299 * r + 0.587 * g + 0.114 * b);
          count++;
        }
        const avgBrightness = count > 0 ? brightnessSum / count : 128;
        setLowLight(avgBrightness < 75);

        let code = jsQR(imgData.data, analysisWidth, analysisHeight, {
          inversionAttempts: "dontInvert",
        });

        // Fast contrast enhancement pre-processing fallback
        if (!code) {
          const enhanced = enhanceContrastData(imgData);
          code = jsQR(enhanced, analysisWidth, analysisHeight, {
            inversionAttempts: "dontInvert",
          });
        }

        if (code) {
          const payload = parseQRData(code.data);
          
          // Check if it's a valid exam QR code
          if (payload && payload.examId) {
            // Verify if correct exam paper (starts-with match for 8-char prefixes)
            const isMatch = activeExam 
              ? (payload.examId.length === 8 
                  ? activeExam.id.toLowerCase().startsWith(payload.examId.toLowerCase())
                  : activeExam.id === payload.examId)
              : true;

            if (activeExam && !isMatch) {
              // Wrong exam paper detected
              setScannerStatus('detected');
              setErrorMessage(`Attention : Ce QR Code correspond à un autre examen.`);
            } else {
              setErrorMessage('');
              stabilityCount.current += 1;
              
              const progress = Math.min(100, Math.round((stabilityCount.current / STABILITY_THRESHOLD) * 100));
              setStabilityProgress(progress);

              if (stabilityCount.current >= STABILITY_THRESHOLD) {
                // Stable QR code detected! Trigger auto-capture
                captureHighRes();
                return; // Stop the loop
              } else {
                setScannerStatus('detected');
              }
            }
          }
        } else {
          // Decrement stability counter slowly so a brief glitch doesn't reset it
          if (stabilityCount.current > 0) {
            stabilityCount.current -= 0.5;
            const progress = Math.min(100, Math.round((stabilityCount.current / STABILITY_THRESHOLD) * 100));
            setStabilityProgress(progress);
          } else {
            setScannerStatus('scanning');
          }
        }
      }
      
      if (!isCapturing.current) {
        animationFrameId.current = requestAnimationFrame(scanFrame);
      }
    };

    animationFrameId.current = requestAnimationFrame(scanFrame);
  }, [activeExam, captureHighRes]);

  // Initialize camera stream
  const initCamera = useCallback(async () => {
    setScannerStatus('initializing');
    setErrorMessage('');
    
    // Stop any existing stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }

    try {
      const constraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait for video load metadata to establish torch compatibility
        const track = stream.getVideoTracks()[0];
        if (track) {
          const caps = track.getCapabilities?.();
          setTorchSupported(!!(caps && caps.torch));
        }

        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().catch(err => {
            console.error("Video play failed", err);
          });
          setScannerStatus('scanning');
          startAnalysis();
        };
      }
      setHasPermission(true);
    } catch (err) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        console.warn("Camera access denied by user:", err);
        setErrorMessage("Accès à la caméra refusé. Veuillez autoriser la caméra dans les paramètres de votre navigateur.");
      } else {
        console.error("Camera access error:", err);
        setErrorMessage(`Impossible d'accéder à la caméra arrière: ${err.message}`);
      }
      setHasPermission(false);
      setScannerStatus('initializing');
    }
  }, [startAnalysis]);

  useEffect(() => {
    const timer = setTimeout(() => {
      initCamera();
    }, 0);

    // Option 5: Device Orientation listener
    const handleOrientation = (e) => {
      if (e.beta !== null && e.gamma !== null) {
        setTilt({ beta: e.beta, gamma: e.gamma, supported: true });
      }
    };

    window.addEventListener('deviceorientation', handleOrientation);

    return () => {
      clearTimeout(timer);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [initCamera]);

  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;
    try {
      const nextTorch = !torchOn;
      await track.applyConstraints({
        advanced: [{ torch: nextTorch }]
      });
      setTorchOn(nextTorch);
    } catch (err) {
      console.error("Torch toggle error:", err);
    }
  };

  if (hasPermission === false) {
    const errorCard = (
      <div style={isMobile ? {
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: '#09090b',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        color: '#fff',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      } : { 
        textAlign: 'center', 
        padding: '3rem 2rem', 
        background: 'rgba(24, 24, 27, 0.6)', 
        backdropFilter: 'blur(16px)',
        borderRadius: '1.5rem', 
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: 'var(--shadow-card)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.5rem'
      }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* Pulsing background rings */}
          <div className="pulse-ring-danger" style={{ 
            position: 'absolute', 
            width: '90px', 
            height: '90px', 
            borderRadius: '50%', 
            background: 'var(--danger-soft)',
            animation: 'pulseDangerRing 2s infinite'
          }} />
          <div style={{ 
            width: 64, 
            height: 64, 
            borderRadius: '50%', 
            background: 'var(--danger-soft)', 
            border: '1px solid rgba(239, 68, 68, 0.2)',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            zIndex: 1
          }}>
            <ShieldAlert size={28} color="var(--danger)" />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: '420px', textAlign: 'center', marginTop: '1rem' }}>
          <h4 style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.02em', color: isMobile ? '#fff' : 'var(--text-main)', margin: 0 }}>
            Accès caméra restreint
          </h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.6, margin: 0 }}>
            {errorMessage || "L'autorisation d'accès à la caméra a été refusée. Veuillez autoriser la caméra dans les paramètres de votre navigateur pour scanner votre copie."}
          </p>
        </div>

        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          gap: '0.75rem', 
          justifyContent: 'center',
          width: '100%',
          maxWidth: '320px',
          marginTop: '1.5rem'
        }}>
          <button 
            onClick={onCancel} 
            className="btn"
            style={{ 
              fontSize: '0.85rem', 
              fontWeight: 700,
              background: 'var(--btn-primary-bg)', 
              boxShadow: 'var(--btn-primary-shadow)',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem'
            }}
          >
            <Upload size={15} /> Importer un fichier
          </button>
          <button 
            className="btn-outline" 
            onClick={initCamera} 
            style={{ 
              fontSize: '0.85rem', 
              fontWeight: 700, 
              borderColor: 'var(--border)', 
              padding: '0.75rem 1.5rem',
              borderRadius: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              color: isMobile ? '#fff' : 'inherit'
            }}
          >
            <RotateCw size={15} /> Réessayer l'accès
          </button>
        </div>
      </div>
    );
    return isMobile ? createPortal(errorCard, document.body) : errorCard;
  }

  const renderMobileScanner = () => {
    return createPortal(
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: '#000',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        color: '#fff',
        overflow: 'hidden',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        {/* Video feed */}
        <video
          ref={videoRef}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 1
          }}
          playsInline
          muted
          autoPlay
        />

        {/* Central aspect-ratio locked A4 framing with box-shadow mask */}
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          zIndex: 2
        }}>
          {/* A4 cutout box */}
          <div style={{
            width: 'min(76vw, calc(62vh / 1.414))',
            aspectRatio: '1 / 1.414',
            position: 'relative',
            borderRadius: '12px',
            boxShadow: '0 0 0 9999px rgba(9, 9, 11, 0.72)',
            transition: 'all 0.3s ease',
            pointerEvents: 'none'
          }}>
            {/* Guide overlay borders inside cutout */}
            {(() => {
              const statusDetected = scannerStatus === 'detected';
              const strokeColor = statusDetected ? 'var(--emerald)' : 'var(--violet)';
              const strokeWidth = statusDetected ? 1.5 : 1.0;
              const shadowColor = statusDetected ? 'rgba(16, 185, 129, 0.6)' : 'rgba(113, 109, 242, 0.4)';

              return (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '12px',
                  border: `${strokeWidth}px ${statusDetected ? 'solid' : 'dashed'} ${strokeColor}`,
                  boxShadow: `0 0 15px ${shadowColor}, inset 0 0 15px ${shadowColor}`,
                  transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)'
                }}>
                  {/* Thick corners */}
                  {/* Top-Left */}
                  <div style={{ position: 'absolute', top: -2, left: -2, width: 20, height: 20, borderTop: `4px solid ${strokeColor}`, borderLeft: `4px solid ${strokeColor}`, borderTopLeftRadius: 10 }} />
                  {/* Top-Right */}
                  <div style={{ position: 'absolute', top: -2, right: -2, width: 20, height: 20, borderTop: `4px solid ${strokeColor}`, borderRight: `4px solid ${strokeColor}`, borderTopRightRadius: 10 }} />
                  {/* Bottom-Left */}
                  <div style={{ position: 'absolute', bottom: -2, left: -2, width: 20, height: 20, borderBottom: `4px solid ${strokeColor}`, borderLeft: `4px solid ${strokeColor}`, borderBottomLeftRadius: 10 }} />
                  {/* Bottom-Right */}
                  <div style={{ position: 'absolute', bottom: -2, right: -2, width: 20, height: 20, borderBottom: `4px solid ${strokeColor}`, borderRight: `4px solid ${strokeColor}`, borderBottomRightRadius: 10 }} />

                  {/* Corner Targets */}
                  <svg viewBox="0 0 100 141.4" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: statusDetected ? 0.95 : 0.45 }}>
                    <g stroke={strokeColor} strokeWidth="0.4" fill="none" strokeDasharray="1.5 1.5">
                      {/* Top Left Target */}
                      <circle cx="10" cy="10" r="3" />
                      <line x1="5" y1="10" x2="15" y2="10" />
                      <line x1="10" y1="5" x2="10" y2="15" />

                      {/* Top Right Target */}
                      <circle cx="90" cy="10" r="3" />
                      <line x1="85" y1="10" x2="95" y2="10" />
                      <line x1="90" y1="5" x2="90" y2="15" />

                      {/* Bottom Left Target */}
                      <circle cx="10" cy="131.4" r="3" />
                      <line x1="5" y1="131.4" x2="15" y2="131.4" />
                      <line x1="10" y1="126.4" x2="10" y2="136.4" />

                      {/* Bottom Right Target */}
                      <circle cx="90" cy="131.4" r="3" />
                      <line x1="85" y1="131.4" x2="95" y2="131.4" />
                      <line x1="90" y1="126.4" x2="90" y2="136.4" />
                    </g>
                  </svg>
                </div>
              );
            })()}

            {/* Sweep Laser (confines to this box on mobile!) */}
            {scannerStatus === 'scanning' && (
              <div style={{
                position: 'absolute',
                left: '2%',
                right: '2%',
                height: '2.5px',
                background: 'linear-gradient(90deg, transparent, var(--violet), transparent)',
                boxShadow: '0 0 16px var(--violet)',
                animation: 'mobileScanLaser 2.2s ease-in-out infinite',
                zIndex: 3
              }} />
            )}
          </div>
        </div>

        {/* Top Header bar */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.25rem 1rem',
          paddingTop: 'calc(env(safe-area-inset-top) + 0.8rem)',
          background: 'linear-gradient(to bottom, rgba(9, 9, 11, 0.95), rgba(9, 9, 11, 0) 100%)',
          zIndex: 10
        }}>
          {/* Back button */}
          <button
            onClick={onCancel}
            style={{
              width: 42,
              height: 42,
              borderRadius: '50%',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              background: 'rgba(24, 24, 27, 0.65)',
              backdropFilter: 'blur(12px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#fff',
              transition: 'all 0.25s'
            }}
          >
            <ArrowLeft size={20} />
          </button>

          {/* Status Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.5rem 1.1rem',
            borderRadius: '2rem',
            backdropFilter: 'blur(16px)',
            background: scannerStatus === 'capturing' 
              ? 'rgba(239, 68, 68, 0.92)' 
              : scannerStatus === 'detected'
              ? 'rgba(16, 185, 129, 0.92)' 
              : 'rgba(24, 24, 27, 0.75)',
            border: `1px solid ${
              scannerStatus === 'detected' 
                ? 'rgba(16, 185, 129, 0.4)' 
                : scannerStatus === 'capturing'
                ? 'rgba(239, 68, 68, 0.4)'
                : 'rgba(255, 255, 255, 0.12)'
            }`,
            color: '#fff',
            fontSize: '0.78rem',
            fontWeight: 800,
            letterSpacing: '0.01em',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)'
          }}>
            {scannerStatus === 'initializing' && (
              <>
                <span className="animate-pulse" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--warning)' }} />
                Initialisation caméra...
              </>
            )}
            {scannerStatus === 'scanning' && (
              <>
                <span className="animate-pulse" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--violet)' }} />
                Placer la feuille dans le cadre
              </>
            )}
            {scannerStatus === 'detected' && (
              <>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />
                Feuille détectée !
              </>
            )}
            {scannerStatus === 'capturing' && (
              <>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />
                Numérisation...
              </>
            )}
          </div>

          {/* Torch toggle */}
          {torchSupported ? (
            <button
              onClick={toggleTorch}
              style={{
                width: 42,
                height: 42,
                borderRadius: '50%',
                background: torchOn ? 'var(--violet)' : 'rgba(24, 24, 27, 0.65)',
                backdropFilter: 'blur(12px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#fff',
                transition: 'all 0.2s',
                boxShadow: torchOn ? '0 4px 14px var(--violet-glow)' : 'none',
                border: '1px solid rgba(255, 255, 255, 0.15)'
              }}
            >
              {torchOn ? <Zap size={18} /> : <ZapOff size={18} />}
            </button>
          ) : (
            <div style={{ width: 42 }} />
          )}
        </div>

        {/* Low light & Tilt Helpers */}
        <div style={{
          position: 'absolute',
          top: 'calc(env(safe-area-inset-top) + 4.5rem)',
          left: '1rem',
          right: '1rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.5rem',
          pointerEvents: 'none',
          zIndex: 8
        }}>
          {lowLight && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.45rem 0.9rem',
              borderRadius: '2rem',
              backdropFilter: 'blur(10px)',
              background: 'rgba(239, 68, 68, 0.85)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#fff',
              fontSize: '0.72rem',
              fontWeight: 800,
              boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
              animation: 'pulse 1.5s infinite'
            }}>
              <AlertCircle size={12} />
              💡 Luminosité faible — Activez le flash
            </div>
          )}
        </div>

        {/* Bottom Section */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '1.5rem 1.5rem calc(env(safe-area-inset-bottom) + 1.25rem)',
          background: 'linear-gradient(to top, rgba(9, 9, 11, 0.98), rgba(9, 9, 11, 0.4) 60%, rgba(9, 9, 11, 0) 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.25rem',
          zIndex: 10
        }}>
          {/* Orientation Level Helper */}
          {tilt.supported && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', pointerEvents: 'none' }}>
              <div style={{
                position: 'relative',
                width: 52,
                height: 52,
                borderRadius: '50%',
                border: '1.5px solid rgba(255, 255, 255, 0.25)',
                background: 'rgba(9, 9, 11, 0.65)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(0,0,0,0.4)'
              }}>
                <div style={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  border: '1px dashed rgba(255, 255, 255, 0.4)',
                  position: 'absolute'
                }} />
                <div style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  position: 'absolute',
                  transform: `translate(${Math.max(-20, Math.min(20, tilt.gamma * 2))}px, ${Math.max(-20, Math.min(20, tilt.beta * 2))}px)`,
                  background: Math.sqrt(tilt.beta * tilt.beta + tilt.gamma * tilt.gamma) < 5 
                    ? 'linear-gradient(135deg, #10b981, #059669)' 
                    : 'linear-gradient(135deg, #f59e0b, #d97706)',
                  boxShadow: Math.sqrt(tilt.beta * tilt.beta + tilt.gamma * tilt.gamma) < 5 
                    ? '0 0 10px #10b981' 
                    : '0 0 6px #f59e0b',
                  transition: 'background 0.2s, box-shadow 0.2s'
                }} />
              </div>
              <span style={{ 
                color: Math.sqrt(tilt.beta * tilt.beta + tilt.gamma * tilt.gamma) < 5 ? '#10b981' : '#f59e0b',
                fontSize: '0.65rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                background: 'rgba(9, 9, 11, 0.75)',
                padding: '0.2rem 0.65rem',
                borderRadius: '1rem'
              }}>
                {Math.sqrt(tilt.beta * tilt.beta + tilt.gamma * tilt.gamma) < 5 ? 'Téléphone à plat ✓' : 'Tenir bien à plat'}
              </span>
            </div>
          )}

          {/* Stability progress bar for QR lock */}
          {scannerStatus === 'detected' && (
            <div style={{ 
              width: '100%',
              maxWidth: '260px',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem'
            }}>
              <span style={{ 
                color: '#fff', 
                fontSize: '0.7rem', 
                fontWeight: 800, 
                textAlign: 'center',
                textShadow: '0 2px 4px rgba(0,0,0,0.6)',
                letterSpacing: '0.02em',
                animation: 'pulse 1s infinite'
              }}>
                Lecture stabilisée ({stabilityProgress}%)
              </span>
              <div style={{ 
                height: 4,
                background: 'rgba(255, 255, 255, 0.2)',
                borderRadius: 2,
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${stabilityProgress}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, var(--violet), var(--emerald))',
                  borderRadius: 2,
                  transition: 'width 0.05s ease-out',
                  boxShadow: '0 0 8px var(--emerald)'
                }} />
              </div>
            </div>
          )}

          {/* Main Controls row */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            maxWidth: '300px'
          }}>
            {/* Left slot: Gallery upload fallback */}
            <button 
              onClick={onCancel}
              style={{ 
                width: 46, 
                height: 46, 
                borderRadius: '50%', 
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(255, 255, 255, 0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#fff',
                transition: 'all 0.2s'
              }}
              title="Importer une image"
            >
              <Upload size={18} />
            </button>

            {/* Center: Large Shutter Button */}
            <button 
              onClick={captureHighRes}
              disabled={scannerStatus === 'initializing' || scannerStatus === 'capturing'}
              style={{ 
                width: 76, 
                height: 76, 
                borderRadius: '50%', 
                border: '4px solid rgba(255, 255, 255, 0.3)', 
                background: 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                padding: 0,
                transition: 'all 0.2s',
                outline: 'none'
              }}
            >
              <div style={{
                width: 58,
                height: 58,
                borderRadius: '50%',
                background: scannerStatus === 'capturing' ? '#ef4444' : '#fff',
                boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                transition: 'background-color 0.2s, transform 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {scannerStatus === 'capturing' && (
                  <Loader2 size={24} color="#fff" style={{ animation: 'spin 1s linear infinite' }} />
                )}
              </div>
            </button>

            {/* Right slot: Empty spacer */}
            <div style={{ width: 46 }} />
          </div>
        </div>

        {/* Global animations */}
        <style>{`
          @keyframes mobileScanLaser {
            0% { top: 4%; opacity: 0.15; }
            50% { top: 96%; opacity: 1; }
            100% { top: 4%; opacity: 0.15; }
          }
        `}</style>
      </div>,
      document.body
    );
  };

  if (isMobile) {
    return renderMobileScanner();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
      
      {/* Video Scanner Container */}
      <div style={{ 
        position: 'relative', 
        width: '100%', 
        paddingTop: '133.33%', // 3:4 aspect ratio
        background: '#0a0a0c', 
        borderRadius: '1.5rem', 
        overflow: 'hidden',
        border: '1px solid var(--border)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.4), inset 0 0 40px rgba(0,0,0,0.8)'
      }}>
        
        <video
          ref={videoRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
          playsInline
          muted
          autoPlay
        />

        {/* Target Corners and A4 Cutout Mask */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          
          <svg viewBox="0 0 100 133.3" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
            <defs>
              <mask id="scanner-mask">
                {/* White keeps the pixel, black cuts it out */}
                <rect width="100" height="133.3" fill="white" />
                {/* Rectangular A4 guide cutout (ratio 1:1.41) */}
                <rect x="10" y="10" width="80" height="113.3" rx="6" fill="black" />
              </mask>
            </defs>

            {/* Semi-transparent dark overlay mask */}
            <rect width="100" height="133.3" fill="rgba(9, 9, 11, 0.72)" mask="url(#scanner-mask)" />

            {/* Glowing guide outline */}
            {(() => {
              const statusDetected = scannerStatus === 'detected';
              const strokeColor = statusDetected ? 'var(--emerald)' : 'var(--violet)';
              const strokeWidth = statusDetected ? 0.8 : 0.5;
              const shadowColor = statusDetected ? 'rgba(16, 185, 129, 0.5)' : 'rgba(113, 109, 242, 0.3)';
              const cornerStrokeWidth = statusDetected ? 1.5 : 1.0;

              return (
                <g style={{ transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)' }}>
                  {/* Outer boundary guide */}
                  <rect
                    x="10" y="10" width="80" height="113.3" rx="6"
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeDasharray={statusDetected ? 'none' : '4 3'}
                    style={{ filter: `drop-shadow(0 0 4px ${shadowColor})` }}
                  />

                  {/* 4 Thick Corner Anchors */}
                  <g stroke={strokeColor} strokeWidth={cornerStrokeWidth} fill="none" strokeLinecap="round">
                    {/* Top Left */}
                    <path d="M 18,10 L 10,10 L 10,18" />
                    {/* Top Right */}
                    <path d="M 82,10 L 90,10 L 90,18" />
                    {/* Bottom Left */}
                    <path d="M 18,123.3 L 10,123.3 L 10,115.3" />
                    {/* Bottom Right */}
                    <path d="M 82,123.3 L 90,123.3 L 90,115.3" />
                  </g>

                  {/* Anchor Targets (HUD crosshairs for corner anchors) */}
                  <g stroke={strokeColor} strokeWidth="0.3" fill="none" strokeDasharray="1 1" style={{ opacity: statusDetected ? 0.9 : 0.3, transition: 'all 0.3s' }}>
                    {/* Top Left Target */}
                    <circle cx="16" cy="16" r="2.5" />
                    <line x1="12" y1="16" x2="20" y2="16" />
                    <line x1="16" y1="12" x2="16" y2="20" />

                    {/* Top Right Target */}
                    <circle cx="84" cy="16" r="2.5" />
                    <line x1="80" y1="16" x2="88" y2="16" />
                    <line x1="84" y1="12" x2="84" y2="20" />

                    {/* Bottom Left Target */}
                    <circle cx="16" cy="117.3" r="2.5" />
                    <line x1="12" y1="117.3" x2="20" y2="117.3" />
                    <line x1="16" y1="113.3" x2="16" y2="121.3" />

                    {/* Bottom Right Target */}
                    <circle cx="84" cy="117.3" r="2.5" />
                    <line x1="80" y1="117.3" x2="88" y2="117.3" />
                    <line x1="84" y1="113.3" x2="84" y2="121.3" />
                  </g>
                </g>
              );
            })()}
          </svg>

          {/* Sweep Laser Animation (visible when searching) */}
          {scannerStatus === 'scanning' && (
            <div style={{
              position: 'absolute',
              left: '12%',
              right: '12%',
              height: '2px',
              background: 'linear-gradient(90deg, transparent, var(--violet), transparent)',
              boxShadow: '0 0 14px var(--violet)',
              animation: 'scanLaserRect 2s ease-in-out infinite'
            }} />
          )}

          {/* Live helper guidance text */}
          {scannerStatus === 'scanning' && (
            <div style={{
              position: 'absolute',
              bottom: '1.25rem',
              left: 0,
              right: 0,
              textAlign: 'center',
              pointerEvents: 'none',
              zIndex: 10
            }}>
              <span style={{
                background: 'rgba(9, 9, 11, 0.88)',
                color: '#fff',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '0.45rem 1.1rem',
                borderRadius: '99px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(8px)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}>
                <Camera size={12} style={{ color: 'var(--violet)' }} />
                Aligner la grille OMR dans les repères
              </span>
            </div>
          )}
        </div>

        {/* Top Control Overlay */}
        <div style={{ 
          position: 'absolute', 
          top: '1rem', 
          left: '1rem', 
          right: '1rem', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          zIndex: 10
        }}>
          {/* Status Indicator Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.45rem 0.9rem',
            borderRadius: '2rem',
            backdropFilter: 'blur(12px)',
            background: scannerStatus === 'capturing' 
              ? 'rgba(239, 68, 68, 0.9)' 
              : scannerStatus === 'detected'
              ? 'rgba(16, 185, 129, 0.9)' 
              : 'rgba(24, 24, 27, 0.8)',
            border: `1px solid ${
              scannerStatus === 'detected' 
                ? 'rgba(16, 185, 129, 0.3)' 
                : scannerStatus === 'capturing'
                ? 'rgba(239, 68, 68, 0.3)'
                : 'rgba(255, 255, 255, 0.08)'
            }`,
            color: '#fff',
            fontSize: '0.72rem',
            fontWeight: 800,
            letterSpacing: '0.01em',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)'
          }}>
            {scannerStatus === 'initializing' && (
              <>
                <span className="animate-pulse" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--warning)' }} />
                Caméra...
              </>
            )}
            {scannerStatus === 'scanning' && (
              <>
                <span className="animate-pulse" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--violet)' }} />
                Recherche QR & repères...
              </>
            )}
            {scannerStatus === 'detected' && (
              <>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />
                Feuille L&apos;Match identifiée !
              </>
            )}
            {scannerStatus === 'capturing' && (
              <>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />
                Numérisation...
              </>
            )}
          </div>

          {/* Flashlight toggle */}
          {torchSupported && (
            <button
              onClick={toggleTorch}
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                border: 'none',
                background: torchOn ? 'var(--violet)' : 'rgba(24, 24, 27, 0.8)',
                backdropFilter: 'blur(12px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#fff',
                transition: 'all 0.2s',
                boxShadow: '0 4px 16px rgba(0,0,0,0.3)'
              }}
              title="Activer le flash"
            >
              {torchOn ? <Zap size={16} /> : <ZapOff size={16} />}
            </button>
          )}
        </div>

        {/* Central guidance rectangle */}
        <div style={{
          position: 'absolute',
          top: '10%',
          left: '10%',
          right: '10%',
          bottom: '10%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none'
        }}>
          {tilt.supported && (
            // Beautiful dynamic bubble level
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', pointerEvents: 'none' }}>
              <div style={{
                position: 'relative',
                width: 76,
                height: 76,
                borderRadius: '50%',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                background: 'rgba(9, 9, 11, 0.5)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
              }}>
                {/* Fixed Target Ring */}
                <div style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  border: '1.5px dashed rgba(255, 255, 255, 0.4)',
                  position: 'absolute'
                }} />
                {/* Center crosshair */}
                <div style={{ width: 6, height: 1.5, background: 'rgba(255, 255, 255, 0.4)', position: 'absolute' }} />
                <div style={{ width: 1.5, height: 6, background: 'rgba(255, 255, 255, 0.4)', position: 'absolute' }} />
                {/* Floating Bubble */}
                <div style={{
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  position: 'absolute',
                  transform: `translate(${Math.max(-28, Math.min(28, tilt.gamma * 2.5))}px, ${Math.max(-28, Math.min(28, tilt.beta * 2.5))}px)`,
                  background: Math.sqrt(tilt.beta * tilt.beta + tilt.gamma * tilt.gamma) < 5 
                    ? 'linear-gradient(135deg, #10b981, #059669)' // Glowing emerald
                    : 'linear-gradient(135deg, #f59e0b, #d97706)', // Warning amber
                  boxShadow: Math.sqrt(tilt.beta * tilt.beta + tilt.gamma * tilt.gamma) < 5 
                    ? '0 0 12px #10b981' 
                    : '0 0 8px #f59e0b',
                  transition: 'background 0.2s, box-shadow 0.2s'
                }} />
              </div>
              <span style={{ 
                color: Math.sqrt(tilt.beta * tilt.beta + tilt.gamma * tilt.gamma) < 5 ? '#10b981' : '#f59e0b',
                fontSize: '0.7rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                background: 'rgba(9, 9, 11, 0.8)',
                padding: '0.25rem 0.75rem',
                borderRadius: '1rem',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(4px)'
              }}>
                {Math.sqrt(tilt.beta * tilt.beta + tilt.gamma * tilt.gamma) < 5 ? 'Aplatissement correct' : 'Garder parallèle au sujet'}
              </span>
            </div>
          )}
        </div>

        {/* Low Light Warning Badge */}
        {lowLight && (
          <div style={{
            position: 'absolute',
            bottom: scannerStatus === 'detected' ? '2.5rem' : '1.5rem',
            left: '1.5rem',
            right: '1.5rem',
            textAlign: 'center',
            zIndex: 10,
            pointerEvents: 'none'
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 1rem',
              borderRadius: '2rem',
              backdropFilter: 'blur(10px)',
              background: 'rgba(239, 68, 68, 0.85)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#fff',
              fontSize: '0.75rem',
              fontWeight: 700,
              boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
              animation: 'pulse 1.5s infinite'
            }}>
              <AlertCircle size={13} />
              💡 Éclairage faible — Utilisez le flash
            </div>
          </div>
        )}

        {/* Bottom Countdown Progress Bar */}
        {scannerStatus === 'detected' && (
          <div style={{ 
            position: 'absolute', 
            bottom: '1.25rem', 
            left: '2rem', 
            right: '2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.4rem',
            zIndex: 15
          }}>
            <span style={{ 
              color: '#fff', 
              fontSize: '0.72rem', 
              fontWeight: 800, 
              textAlign: 'center',
              textShadow: '0 2px 4px rgba(0,0,0,0.6)',
              letterSpacing: '0.02em',
              animation: 'pulse 1s infinite'
            }}>
              Lecture stabilisée ({stabilityProgress}%)
            </span>
            <div style={{ 
              height: 5,
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: 3,
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
            }}>
              <div style={{
                width: `${stabilityProgress}%`,
                height: '100%',
                background: 'linear-gradient(90deg, var(--violet), var(--emerald))',
                borderRadius: 3,
                transition: 'width 0.05s ease-out',
                boxShadow: '0 0 10px var(--emerald)'
              }} />
            </div>
          </div>
        )}
      </div>

      {/* Error / Feedback Message */}
      {errorMessage && (
        <div style={{ 
          padding: '0.65rem 1rem', 
          background: 'var(--danger-soft)', 
          border: '1px solid rgba(239, 68, 68, 0.2)', 
          borderRadius: '0.875rem', 
          color: 'var(--danger)', 
          fontSize: '0.78rem', 
          fontWeight: 700, 
          display: 'flex', 
          gap: '0.5rem', 
          alignItems: 'center' 
        }}>
          <AlertCircle size={14} style={{ flexShrink: 0 }} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Premium Camera Shutter Control Bar */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        width: '100%',
        padding: '0.6rem 1.25rem',
        background: 'rgba(24, 24, 27, 0.5)',
        backdropFilter: 'blur(16px)',
        borderRadius: '1.5rem',
        border: '1px solid var(--border)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
      }}>
        {/* Left: Torch Toggle */}
        <div style={{ width: 44, display: 'flex', justifyContent: 'center' }}>
          {torchSupported ? (
            <button
              onClick={toggleTorch}
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                border: '1px solid var(--border)',
                background: torchOn ? 'var(--violet)' : 'rgba(255, 255, 255, 0.04)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#fff',
                transition: 'all 0.2s',
                boxShadow: torchOn ? '0 4px 14px var(--violet-glow)' : 'none'
              }}
              title="Activer le flash"
            >
              {torchOn ? <Zap size={15} /> : <ZapOff size={15} />}
            </button>
          ) : (
            <div style={{ width: 38 }} />
          )}
        </div>

        {/* Center: Large Shutter Capture Button */}
        <button 
          onClick={captureHighRes}
          disabled={scannerStatus === 'initializing' || scannerStatus === 'capturing'}
          style={{ 
            width: 72, 
            height: 72, 
            borderRadius: '50%', 
            border: '4px solid rgba(255, 255, 255, 0.2)', 
            background: 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: 0,
            transition: 'all 0.2s',
            outline: 'none'
          }}
          onMouseDown={e => e.currentTarget.style.transform = 'scale(0.92)'}
          onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.6)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'}
        >
          <div style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: scannerStatus === 'capturing' ? '#ef4444' : '#fff',
            boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
            transition: 'background-color 0.2s, transform 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {scannerStatus === 'capturing' && (
              <Loader2 size={20} color="#fff" style={{ animation: 'spin 1s linear infinite' }} />
            )}
          </div>
        </button>

        {/* Right: Switch to Gallery Upload Button */}
        <div style={{ width: 44, display: 'flex', justifyContent: 'center' }}>
          <button 
            onClick={onCancel}
            style={{ 
              width: 38, 
              height: 38, 
              borderRadius: '50%', 
              border: '1px solid var(--border)',
              background: 'rgba(255, 255, 255, 0.04)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'; }}
            title="Importer une image"
          >
            <Upload size={15} />
          </button>
        </div>
      </div>

      {/* Inject local stylesheet styles dynamically */}
      <style>{`
        @keyframes scanLaserRect {
          0% { top: 10%; opacity: 0.2; }
          50% { top: 90%; opacity: 1; }
          100% { top: 10%; opacity: 0.2; }
        }
        @keyframes pulseDangerRing {
          0% { transform: scale(0.9); opacity: 0.6; }
          50% { transform: scale(1.25); opacity: 0; }
          100% { transform: scale(0.9); opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
