import { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, Zap, ZapOff, Upload, RotateCw, AlertCircle, ShieldAlert } from 'lucide-react';
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
    return (
      <div style={{ textAlign: 'center', padding: '2rem 1rem', background: 'var(--bg-glass)', borderRadius: '1.25rem', border: '1px solid var(--border)' }}>
        <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--danger-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
          <ShieldAlert size={28} color="var(--danger)" />
        </div>
        <h4 style={{ fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-main)' }}>Caméra inaccessible</h4>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.5, maxWidth: 360, margin: '0 auto 1.25rem' }}>
          {errorMessage || "L'autorisation d'accès à la caméra a été refusée ou votre appareil ne dispose pas de caméra compatible."}
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button className="btn-outline" onClick={onCancel} style={{ fontSize: '0.82rem' }}>
            <Upload size={14} style={{ marginRight: '0.4rem' }} /> Sélectionner un fichier
          </button>
          <button className="btn" onClick={initCamera} style={{ fontSize: '0.82rem' }}>
            <RotateCw size={14} style={{ marginRight: '0.4rem' }} /> Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
      
      {/* Video Scanner Container */}
      <div style={{ 
        position: 'relative', 
        width: '100%', 
        paddingTop: '133.33%', // 3:4 aspect ratio
        background: '#000', 
        borderRadius: '1.25rem', 
        overflow: 'hidden',
        border: '1px solid var(--border)',
        boxShadow: 'inset 0 0 40px rgba(0,0,0,0.8)'
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

        {/* Dynamic scanning laser and corner overlay */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '2rem' }}>
          
        {/* Target Corners and A4 Cutout Mask */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
            <defs>
              <mask id="scanner-mask">
                {/* White keeps the pixel, black cuts it out */}
                <rect width="100" height="100" fill="white" />
                <rect x="8" y="8" width="84" height="84" rx="4" fill="black" />
              </mask>
            </defs>

            {/* Semi-transparent dark overlay mask */}
            <rect width="100" height="100" fill="rgba(2, 6, 23, 0.65)" mask="url(#scanner-mask)" />

            {/* Glowing guide outline */}
            {(() => {
              const statusDetected = scannerStatus === 'detected';
              const strokeColor = statusDetected ? 'var(--emerald)' : 'var(--violet)';
              const strokeWidth = statusDetected ? 1.0 : 0.6;
              const shadowColor = statusDetected ? 'rgba(16, 185, 129, 0.6)' : 'rgba(99, 102, 241, 0.4)';
              const cornerStrokeWidth = statusDetected ? 1.8 : 1.2;

              return (
                <g style={{ transition: 'all 0.3s ease' }}>
                  {/* Dashed outer boundary guide */}
                  <rect
                    x="8" y="8" width="84" height="84" rx="4"
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeDasharray={statusDetected ? 'none' : '3 2'}
                    style={{ filter: `drop-shadow(0 0 3px ${shadowColor})` }}
                  />

                  {/* 4 Thick Corner Anchors */}
                  <g stroke={strokeColor} strokeWidth={cornerStrokeWidth} fill="none" strokeLinecap="round">
                    {/* Top Left */}
                    <path d="M 16,8 L 8,8 L 8,16" />
                    {/* Top Right */}
                    <path d="M 84,8 L 92,8 L 92,16" />
                    {/* Bottom Left */}
                    <path d="M 16,92 L 8,92 L 8,84" />
                    {/* Bottom Right */}
                    <path d="M 84,92 L 92,92 L 92,84" />
                  </g>

                  {/* Anchor Targets (HUD Circles where OMR sheet corner anchors should align) */}
                  <g stroke={strokeColor} strokeWidth="0.4" fill="none" strokeDasharray="1.5 1" style={{ opacity: statusDetected ? 0.9 : 0.4, transition: 'all 0.3s' }}>
                    {/* Top Left Target */}
                    <circle cx="15" cy="15" r="3" />
                    <line x1="11" y1="15" x2="19" y2="15" />
                    <line x1="15" y1="11" x2="15" y2="19" />

                    {/* Top Right Target */}
                    <circle cx="85" cy="15" r="3" />
                    <line x1="81" y1="15" x2="89" y2="15" />
                    <line x1="85" y1="11" x2="85" y2="19" />

                    {/* Bottom Left Target */}
                    <circle cx="15" cy="85" r="3" />
                    <line x1="11" y1="85" x2="19" y2="85" />
                    <line x1="15" y1="81" x2="15" y2="89" />

                    {/* Bottom Right Target */}
                    <circle cx="85" cy="85" r="3" />
                    <line x1="81" y1="85" x2="89" y2="85" />
                    <line x1="85" y1="81" x2="85" y2="89" />
                  </g>
                </g>
              );
            })()}
          </svg>

          {/* Sweep Laser Animation (visible when searching) */}
          {scannerStatus === 'scanning' && (
            <div style={{
              position: 'absolute',
              left: '10%',
              right: '10%',
              height: '3px',
              background: 'linear-gradient(90deg, transparent, var(--violet), transparent)',
              boxShadow: '0 0 12px var(--violet)',
              animation: 'scanLaser 2.2s linear infinite'
            }} />
          )}

          {/* Live helper guidance text */}
          {scannerStatus === 'scanning' && (
            <div style={{
              position: 'absolute',
              bottom: '1.5rem',
              left: 0,
              right: 0,
              textAlign: 'center',
              pointerEvents: 'none',
              zIndex: 10
            }}>
              <span style={{
                background: 'rgba(15, 23, 42, 0.85)',
                color: 'var(--text-main)',
                fontSize: '0.78rem',
                fontWeight: 700,
                padding: '0.45rem 1.1rem',
                borderRadius: '99px',
                border: '1px solid var(--border)',
                backdropFilter: 'blur(8px)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}>
                <Camera size={13} className="text-violet" />
                Cadrez la feuille L&apos;Match dans les repères
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
              gap: '0.4rem',
              padding: '0.4rem 0.8rem',
              borderRadius: '2rem',
              backdropFilter: 'blur(10px)',
              background: scannerStatus === 'capturing' 
                ? 'rgba(0, 0, 0, 0.85)' 
                : scannerStatus === 'detected'
                ? 'rgba(16, 163, 74, 0.85)' 
                : 'rgba(26, 26, 46, 0.85)',
              border: `1px solid ${scannerStatus === 'detected' ? 'var(--emerald)' : 'var(--border)'}`,
              color: '#fff',
              fontSize: '0.75rem',
              fontWeight: 800,
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
            }}>
              {scannerStatus === 'initializing' && (
                <>
                  <span className="animate-pulse" style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }} />
                  Connexion caméra...
                </>
              )}
              {scannerStatus === 'scanning' && (
                <>
                  <span className="animate-pulse" style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--violet)' }} />
                  Cadrer le haut de la feuille (QR Code)
                </>
              )}
              {scannerStatus === 'detected' && (
                <>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />
                  QR Code trouvé ! Tenez stable...
                </>
              )}
              {scannerStatus === 'capturing' && (
                <>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
                  Capture en cours...
                </>
              )}
            </div>

            {/* Flashlight toggle */}
            {torchSupported && (
              <button
                onClick={toggleTorch}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  border: 'none',
                  background: torchOn ? 'var(--violet)' : 'rgba(26, 26, 46, 0.85)',
                  backdropFilter: 'blur(10px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#fff',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
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
            top: '15%',
            left: '10%',
            right: '10%',
            bottom: '15%',
            border: `2px dashed ${scannerStatus === 'detected' ? 'var(--emerald)' : 'rgba(255,255,255,0.25)'}`,
            borderRadius: '0.75rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'border-color 0.25s'
          }}>
            {tilt.supported ? (
              // Beautiful dynamic bubble level (Option 5)
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  position: 'relative',
                  width: 70,
                  height: 70,
                  borderRadius: '50%',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  background: 'rgba(0,0,0,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}>
                  {/* Fixed Target Ring */}
                  <div style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    border: '1px dashed rgba(255, 255, 255, 0.5)',
                    position: 'absolute'
                  }} />
                  {/* Center Dot */}
                  <div style={{
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.5)',
                    position: 'absolute'
                  }} />
                  {/* Floating Bubble */}
                  <div style={{
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    position: 'absolute',
                    transform: `translate(${Math.max(-25, Math.min(25, tilt.gamma * 2))}px, ${Math.max(-25, Math.min(25, tilt.beta * 2))}px)`,
                    background: Math.sqrt(tilt.beta * tilt.beta + tilt.gamma * tilt.gamma) < 6 
                      ? 'linear-gradient(135deg, #10b981, #059669)' // Glowing emerald
                      : 'linear-gradient(135deg, #f59e0b, #d97706)', // Warning amber
                    boxShadow: Math.sqrt(tilt.beta * tilt.beta + tilt.gamma * tilt.gamma) < 6 
                      ? '0 0 10px #10b981' 
                      : '0 0 8px #f59e0b',
                    transition: 'background 0.25s, box-shadow 0.25s'
                  }} />
                </div>
                <span style={{ 
                  color: Math.sqrt(tilt.beta * tilt.beta + tilt.gamma * tilt.gamma) < 6 ? '#10b981' : '#f59e0b',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  background: 'rgba(0,0,0,0.5)',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '1rem',
                  backdropFilter: 'blur(4px)'
                }}>
                  {Math.sqrt(tilt.beta * tilt.beta + tilt.gamma * tilt.gamma) < 6 ? 'Alignement correct' : 'Aplatissez le téléphone'}
                </span>
              </div>
            ) : (
              // Fallback center crosshair if tilt is not supported
              <>
                <div style={{ width: 14, height: 2, background: 'rgba(255,255,255,0.3)' }} />
                <div style={{ width: 2, height: 14, background: 'rgba(255,255,255,0.3)', position: 'absolute' }} />
              </>
            )}
          </div>

          {/* Low Light Warning Badge (Option 5) */}
          {lowLight && (
            <div style={{
              position: 'absolute',
              bottom: scannerStatus === 'detected' ? '2.5rem' : '1.25rem',
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
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#fff',
                fontSize: '0.8rem',
                fontWeight: 700,
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                animation: 'pulse 1.5s infinite'
              }}>
                <AlertCircle size={14} />
                💡 Éclairage faible — activez le flash ou déplacez-vous
              </div>
            </div>
          )}

          {/* Bottom Countdown Progress Bar */}
          {scannerStatus === 'detected' && (
            <div style={{ 
              position: 'absolute', 
              bottom: '1.25rem', 
              left: '1.5rem', 
              right: '1.5rem',
              height: 6,
              background: 'rgba(255, 255, 255, 0.15)',
              borderRadius: 3,
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
            }}>
              <div style={{
                width: `${stabilityProgress}%`,
                height: '100%',
                background: 'linear-gradient(90deg, var(--violet), var(--emerald))',
                borderRadius: 3,
                transition: 'width 0.05s ease-out'
              }} />
            </div>
          )}
        </div>
      </div>

      {/* Error / Feedback Message */}
      {errorMessage && (
        <div style={{ 
          padding: '0.6rem 0.875rem', 
          background: 'var(--danger-soft)', 
          border: '1px solid var(--danger)33', 
          borderRadius: '0.75rem', 
          color: 'var(--danger)', 
          fontSize: '0.78rem', 
          fontWeight: 700, 
          display: 'flex', 
          gap: '0.4rem', 
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
        padding: '0.5rem 1rem',
        background: 'var(--bg-glass)',
        borderRadius: '1.25rem',
        border: '1px solid var(--border)'
      }}>
        {/* Left: Torch Toggle */}
        <div style={{ width: 50, display: 'flex', justifyContent: 'center' }}>
          {torchSupported ? (
            <button
              onClick={toggleTorch}
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                border: '1px solid var(--border)',
                background: torchOn ? 'var(--violet)' : 'rgba(255, 255, 255, 0.05)',
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
              {torchOn ? <Zap size={16} /> : <ZapOff size={16} />}
            </button>
          ) : (
            <div style={{ width: 40 }} />
          )}
        </div>

        {/* Center: Large Shutter Capture Button */}
        <button 
          onClick={captureHighRes}
          disabled={scannerStatus === 'initializing' || scannerStatus === 'capturing'}
          style={{ 
            width: 68, 
            height: 68, 
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
          onMouseDown={e => e.currentTarget.style.transform = 'scale(0.92)'}
          onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.8)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'}
        >
          <div style={{
            width: 50,
            height: 50,
            borderRadius: '50%',
            background: scannerStatus === 'capturing' ? '#ef4444' : '#fff',
            boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
            transition: 'background-color 0.2s'
          }} />
        </button>

        {/* Right: Switch to Gallery Upload Button */}
        <div style={{ width: 50, display: 'flex', justifyContent: 'center' }}>
          <button 
            onClick={onCancel}
            style={{ 
              width: 40, 
              height: 40, 
              borderRadius: '50%', 
              border: '1px solid var(--border)',
              background: 'rgba(255, 255, 255, 0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; }}
            title="Importer une image"
          >
            <Upload size={16} />
          </button>
        </div>
      </div>

      {/* Inject local stylesheet styles dynamically */}
      <style>{`
        @keyframes scanLaser {
          0% { top: 10%; opacity: 0.2; }
          50% { top: 90%; opacity: 1; }
          100% { top: 10%; opacity: 0.2; }
        }
      `}</style>
    </div>
  );
}
