import { useCurrentFrame, interpolate, spring } from "remotion";
import React from "react";
import katex from "katex";

// Helper to render inline/display math formulas using KaTeX
const renderWithMath = (text) => {
  if (!text) return "";
  const parts = text.split(/(\$\$[\s\S]+?\$\$|\$[\s\S]+?\$)/g);
  return parts.map((part, index) => {
    if (part.startsWith('$$') && part.endsWith('$$')) {
      const math = part.slice(2, -2);
      try {
        const html = katex.renderToString(math, { displayMode: true, throwOnError: false });
        return <div key={index} style={{ margin: '15px 0' }} dangerouslySetInnerHTML={{ __html: html }} />;
      } catch (err) {
        return <span key={index}>{part}</span>;
      }
    } else if (part.startsWith('$') && part.endsWith('$')) {
      const math = part.slice(1, -1);
      try {
        const html = katex.renderToString(math, { displayMode: false, throwOnError: false });
        return <span key={index} dangerouslySetInnerHTML={{ __html: html }} />;
      } catch (err) {
        return <span key={index}>{part}</span>;
      }
    }
    return <span key={index}>{part}</span>;
  });
};

export const TikTokVideo = ({ metadata, timeline }) => {
  const frame = useCurrentFrame();
  const time = frame / 30; // 30fps mapping

  const examName = metadata?.examName || "L'CONQ Concours";
  const subject = metadata?.subject || "Mathématiques";

  // Timeline segment extraction
  const qReveal = timeline?.find(t => t.segment.includes("Question Reveal")) || {};
  const optsReveal = timeline?.find(t => t.segment.includes("Options")) || {};
  const correctReveal = timeline?.find(t => t.segment.includes("Correct")) || {};
  const solutionReveal = timeline?.find(t => t.segment.includes("Solution")) || {};

  const questionText = qReveal?.assets?.text || "";
  const options = optsReveal?.assets?.options || [];
  const correctOption = correctReveal?.assets?.correctOption || "A";
  const astuceText = solutionReveal?.assets?.astuce || "";
  const solutionText = solutionReveal?.assets?.solution || "";

  // Animations helpers using Remotion spring
  const contentEntrance = spring({
    frame: frame,
    fps: 30,
    config: { damping: 15 }
  });

  return (
    <div style={{
      width: '100%',
      height: '100%',
      backgroundColor: '#09090B',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden',
      color: '#F8FAFC',
      fontFamily: 'Inter, -apple-system, sans-serif'
    }}>
      {/* Background gradients */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: time >= 23 
          ? 'radial-gradient(circle at center, rgba(245, 158, 11, 0.1) 0%, transparent 80%)'
          : time >= 16 
          ? 'radial-gradient(circle at center, rgba(16, 185, 129, 0.1) 0%, transparent 80%)'
          : 'radial-gradient(circle at center, rgba(139, 92, 246, 0.08) 0%, transparent 80%)',
        transition: 'background 0.5s ease',
        zIndex: 1
      }} />

      {/* Dark overlay vignette */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(to top, rgba(0,0,0,0.94) 0%, rgba(0,0,0,0.15) 35%, rgba(0,0,0,0.15) 65%, rgba(0,0,0,0.7) 100%)',
        zIndex: 2
      }} />

      {/* TikTok Top Progress Bar */}
      <div style={{ position: 'absolute', top: 12, left: 0, right: 0, height: 8, backgroundColor: 'rgba(255,255,255,0.12)', zIndex: 10 }}>
        <div style={{
          height: '100%',
          width: `${(time / 30) * 100}%`,
          background: 'linear-gradient(90deg, #EC4899, #8B5CF6, #10B981)'
        }} />
      </div>

      {/* TikTok Top Header: Suivre | Pour toi */}
      <div style={{
        position: 'absolute',
        top: 40,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        gap: '30px',
        fontSize: '32px',
        fontWeight: '800',
        color: 'rgba(255,255,255,0.6)',
        textShadow: '0 2px 6px rgba(0,0,0,0.8)',
        zIndex: 10
      }}>
        <span>Suivre</span>
        <span style={{ color: '#fff', borderBottom: '6px solid #fff', paddingBottom: 6, fontWeight: 950 }}>Pour toi</span>
      </div>

      {/* Search Icon */}
      <div style={{ position: 'absolute', top: 40, right: 54, fontSize: '36px', zIndex: 10 }}>
        🔍
      </div>

      {/* Floating stickers for Concours Badges */}
      <div style={{
        position: 'absolute',
        top: 130,
        left: 54,
        display: 'flex',
        gap: '15px',
        zIndex: 10,
        transform: `translateY(${Math.sin(frame / 12) * 5}px) rotate(${Math.sin(frame / 20) * 1.2}deg)`
      }}>
        <span style={{
          background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
          color: '#fff',
          fontWeight: 900,
          fontSize: '24px',
          padding: '8px 20px',
          borderRadius: '12px',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          boxShadow: '0 8px 24px rgba(139,92,246,0.3)',
          border: '1px solid rgba(255,255,255,0.2)'
        }}>
          🏫 {examName}
        </span>
        <span style={{
          background: 'rgba(31, 41, 55, 0.9)',
          color: '#F9FAFB',
          fontWeight: 800,
          fontSize: '24px',
          padding: '8px 20px',
          borderRadius: '12px',
          border: '1.5px solid rgba(255,255,255,0.15)',
          backdropFilter: 'blur(8px)'
        }}>
          📐 {subject}
        </span>
      </div>

      {/* Bottom Description Overlay */}
      <div style={{
        position: 'absolute',
        bottom: 50,
        left: 54,
        right: 210, // Safe zone to avoid vinyl disk
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        textShadow: '0 2px 6px rgba(0,0,0,0.95)'
      }}>
        <div style={{ fontSize: '34px', fontWeight: 900, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
          @lconq_concours
          <span style={{ width: 26, height: 26, borderRadius: '50%', backgroundColor: '#3B82F6', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 900 }}>✓</span>
        </div>
        <div style={{ fontSize: '28px', color: '#E2E8F0', fontWeight: 600, lineHeight: 1.45 }}>
          أجي تختبر راسك ف هاد السؤال! ⏱️🔥 دقيقة تكفيك؟ فكر فالحل ودوز شوف النتيجة! #{subject.toLowerCase()} #bac2026 #fsrs #maroc #enasa #medecine
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '24px', color: '#F8FAFC', opacity: 0.9 }}>
          <span>🎵</span>
          <span>Son original - L'Conq Studio Pro</span>
        </div>
      </div>

      {/* TikTok Sidebar Buttons */}
      <div style={{
        position: 'absolute',
        right: 40,
        bottom: 50,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '35px',
        zIndex: 10
      }}>
        {/* User profile picture */}
        <div style={{ position: 'relative', marginBottom: 10 }}>
          <div style={{ 
            width: 90, 
            height: 90, 
            borderRadius: '50%', 
            border: '3px solid #fff', 
            background: 'linear-gradient(135deg, #8B5CF6, #EC4899)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            fontSize: '48px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.4)'
          }}>
            🧠
          </div>
          <div style={{ 
            position: 'absolute', 
            bottom: -10, 
            left: '50%', 
            transform: 'translateX(-50%)', 
            width: 32, 
            height: 32, 
            borderRadius: '50%', 
            backgroundColor: '#EF4444', 
            color: '#fff', 
            fontSize: '22px', 
            fontWeight: 900, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            border: '2px solid #fff'
          }}>
            +
          </div>
        </div>

        {/* Likes */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontSize: '64px', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.8))' }}>❤️</span>
          <span style={{ fontSize: '24px', fontWeight: 900, color: '#fff', marginTop: 4 }}>18.4K</span>
        </div>

        {/* Comments */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontSize: '64px', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.8))' }}>💬</span>
          <span style={{ fontSize: '24px', fontWeight: 900, color: '#fff', marginTop: 4 }}>412</span>
        </div>

        {/* Bookmark */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontSize: '64px', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.8))' }}>⭐</span>
          <span style={{ fontSize: '24px', fontWeight: 900, color: '#fff', marginTop: 4 }}>11.5K</span>
        </div>

        {/* Share */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontSize: '64px', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.8))' }}>🔗</span>
          <span style={{ fontSize: '24px', fontWeight: 900, color: '#fff', marginTop: 4 }}>863</span>
        </div>

        {/* Music vinyl disk spinning */}
        <div style={{ 
          width: 76, 
          height: 76, 
          borderRadius: '50%', 
          background: 'radial-gradient(circle, #4B5563 30%, #09090B 70%)', 
          border: '4px solid rgba(255,255,255,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `rotate(${(frame * 3.5) % 360}deg)`,
          marginTop: 10,
          boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
        }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #EC4899, #8B5CF6)' }} />
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '0 240px 0 100px', // Safe paddings
        zIndex: 5
      }}>
        {/* ──────────────── SEGMENT 1: QUESTION REVEAL (0-5.9s) ──────────────── */}
        {time < 6 && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '40px',
            textAlign: 'center',
            transform: `scale(${contentEntrance})`,
            opacity: interpolate(time, [0, 0.4], [0, 1], { extrapolateRight: "clamp" })
          }}>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <span style={{
                fontSize: '30px',
                color: '#fff',
                background: 'linear-gradient(135deg, #EC4899, #8B5CF6)',
                padding: '12px 36px',
                borderRadius: '16px',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                boxShadow: '0 10px 30px rgba(139,92,246,0.4)',
                border: '1.5px solid rgba(255,255,255,0.3)'
              }}>
                ⚡ DEFI CHRONO 🇲🇦
              </span>
            </div>
            
            <div style={{
              background: 'rgba(15, 23, 42, 0.72)',
              border: '3px solid rgba(139, 92, 246, 0.5)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 35px rgba(139, 92, 246, 0.25)',
              borderRadius: '36px',
              padding: '50px',
              backdropFilter: 'blur(20px)'
            }}>
              <h1 style={{
                fontSize: '44px',
                fontWeight: 800,
                lineHeight: 1.55,
                color: '#FFFFFF',
                margin: 0,
                letterSpacing: '-0.01em'
              }}>
                {renderWithMath(questionText)}
              </h1>
            </div>
            
            <p style={{
              fontSize: '28px',
              color: '#A78BFA',
              fontWeight: 800,
              margin: 0,
              letterSpacing: '0.03em',
              opacity: interpolate(Math.sin(frame / 6), [-1, 1], [0.5, 1])
            }}>
              جاوب فقلبك قبل ما يسالي الوقت! ⏱️🧠
            </p>
          </div>
        )}

        {/* ──────────────── SEGMENT 2: OPTIONS & COUNTDOWN (6-15.9s) ──────────────── */}
        {time >= 6 && time < 16 && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '30px',
            opacity: interpolate(time, [6, 6.4], [0, 1], { extrapolateRight: "clamp" })
          }}>
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <span style={{ fontSize: '24px', color: '#FCD34D', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                ⏱️ الاختيارات المتوفرة
              </span>
              <h2 style={{
                fontSize: '32px',
                fontWeight: 800,
                color: 'rgba(255,255,255,0.85)',
                margin: 0,
                lineHeight: 1.4
              }}>
                {renderWithMath(questionText.length > 90 ? questionText.substring(0, 90) + '...' : questionText)}
              </h2>
            </div>

            {/* Countdown ring */}
            <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
              <div style={{
                width: 110,
                height: 110,
                borderRadius: '50%',
                border: '6px solid #8B5CF6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '44px',
                fontWeight: 900,
                color: '#8B5CF6',
                boxShadow: '0 0 30px rgba(139,92,246,0.4)',
                backgroundColor: '#09090B',
                transform: `scale(${interpolate(frame % 30, [0, 15, 30], [1, 1.05, 1])})`
              }}>
                {Math.max(0, 15 - Math.floor(time))}
              </div>
            </div>

            {/* Options list reveal */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {options.map((opt, idx) => {
                const optId = opt.id || ['A', 'B', 'C', 'D', 'E'][idx];
                const optText = opt.text || opt;

                // Staggered reveal per option
                const revealTime = 6.2 + idx * 1.3;
                const isRevealed = time >= revealTime;

                // Color mappings
                const colors = {
                  'A': { bg: 'rgba(139, 92, 246, 0.15)', text: '#A78BFA', border: '#8B5CF6' },
                  'B': { bg: 'rgba(236, 72, 153, 0.15)', text: '#F472B6', border: '#EC4899' },
                  'C': { bg: 'rgba(16, 185, 129, 0.15)', text: '#34D399', border: '#10B981' },
                  'D': { bg: 'rgba(59, 130, 246, 0.15)', text: '#60A5FA', border: '#3B82F6' },
                };
                const theme = colors[optId] || { bg: 'rgba(255,255,255,0.08)', text: '#fff', border: 'rgba(255,255,255,0.2)' };

                return (
                  <div key={optId} style={{
                    padding: '24px 30px',
                    background: 'rgba(15, 23, 42, 0.65)',
                    border: '3px solid rgba(255,255,255,0.08)',
                    borderRadius: '24px',
                    fontSize: '28px',
                    opacity: isRevealed ? 1 : 0,
                    transform: isRevealed ? 'translateY(0)' : 'translateY(25px)',
                    transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px',
                    fontWeight: 700,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
                  }}>
                    <span style={{
                      width: 50,
                      height: 50,
                      borderRadius: '50%',
                      backgroundColor: theme.bg,
                      border: `3px solid ${theme.border}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '24px',
                      fontWeight: 950,
                      color: theme.text,
                      flexShrink: 0
                    }}>
                      {optId}
                    </span>
                    <div style={{ flex: 1, overflowX: 'auto', color: '#F1F5F9' }}>
                      {renderWithMath(optText.replace(/^[A-E]\)\s*/, ''))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ──────────────── SEGMENT 3: CORRECT ANSWER PING (16-22.9s) ──────────────── */}
        {time >= 16 && time < 23 && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '40px',
            opacity: interpolate(time, [16, 16.4], [0, 1], { extrapolateRight: "clamp" })
          }}>
            <div style={{ textAlign: 'center' }}>
              <span style={{
                fontSize: '30px',
                color: '#fff',
                background: 'linear-gradient(135deg, #10B981, #059669)',
                padding: '12px 36px',
                borderRadius: '16px',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                boxShadow: '0 10px 30px rgba(16,185,129,0.4)',
                border: '1.5px solid rgba(255,255,255,0.3)'
              }}>
                ✅ الجواب الصحيح
              </span>
            </div>

            <div style={{
              padding: '60px',
              backgroundColor: 'rgba(16, 185, 129, 0.08)',
              border: '5px solid #10B981',
              borderRadius: '40px',
              textAlign: 'center',
              boxShadow: '0 25px 70px rgba(0,0,0,0.6), 0 0 50px rgba(16,185,129,0.35)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '24px',
              backdropFilter: 'blur(20px)',
              transform: `scale(${interpolate(frame % 30, [0, 15, 30], [1, 1.03, 1])})`
            }}>
              <span style={{ fontSize: '26px', fontWeight: 900, color: '#34D399', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Réponse Gagnante
              </span>
              <div style={{
                width: 140,
                height: 140,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #10B981, #059669)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '76px',
                fontWeight: 950,
                boxShadow: '0 12px 35px rgba(16,185,129,0.5)',
                textShadow: '0 4px 8px rgba(0,0,0,0.3)'
              }}>
                {correctOption}
              </div>
              <p style={{ margin: 0, fontSize: '32px', color: '#F8FAFC', fontWeight: 800 }}>
                جبتيها صحيحة؟ 🎉🇲🇦
              </p>
            </div>

            <p style={{
              textAlign: 'center',
              fontSize: '26px',
              color: '#94A3B8',
              fontWeight: 700,
              opacity: interpolate(Math.sin(frame / 8), [-1, 1], [0.6, 1])
            }}>
              هاك كيفاش تحسبها ف 10 ثواني... 💡
            </p>
          </div>
        )}

        {/* ──────────────── SEGMENT 4: SOLUTION & ASTUCE (23-30s) ──────────────── */}
        {time >= 23 && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '30px',
            opacity: interpolate(time, [23, 23.4], [0, 1], { extrapolateRight: "clamp" })
          }}>
            <div style={{ textAlign: 'center' }}>
              <span style={{
                fontSize: '30px',
                color: '#1e1b4b',
                background: 'linear-gradient(135deg, #FBBF24, #F59E0B)',
                padding: '12px 36px',
                borderRadius: '16px',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                boxShadow: '0 10px 30px rgba(245,158,11,0.4)',
                border: '1.5px solid rgba(255,255,255,0.4)'
              }}>
                💡 ASTUCE MAGIQUE
              </span>
            </div>

            {/* Trick Card */}
            <div style={{
              padding: '40px',
              backgroundColor: 'rgba(245, 158, 11, 0.05)',
              border: '4px dashed #F59E0B',
              borderRadius: '36px',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5), 0 0 35px rgba(245,158,11,0.15)'
            }}>
              <p style={{ margin: '0 0 15px 0', fontSize: '24px', color: '#FBBF24', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>⚡</span> فكرة ذكية :
              </p>
              <div style={{ fontSize: '28px', color: '#FFFFFF', lineHeight: 1.6, fontWeight: 800 }}>
                {renderWithMath(astuceText || "عوض بالقيم مباشرة باش تسالي دغيا.")}
              </div>
            </div>

            {/* Proof Box */}
            <div style={{
              padding: '30px',
              backgroundColor: 'rgba(255,255,255,0.03)',
              borderRadius: '24px',
              border: '2px solid rgba(255,255,255,0.08)'
            }}>
              <p style={{ margin: '0 0 10px 0', fontSize: '22px', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                التفسير الرياضي :
              </p>
              <div style={{ fontSize: '26px', color: '#E2E8F0', lineHeight: 1.5, fontWeight: 650 }}>
                {renderWithMath(solutionText || "تطبيق مباشر للمبرهنة.")}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
