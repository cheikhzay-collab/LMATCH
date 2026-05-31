// src/services/videoService.js
// TikTok video script generation & Vercel/Lambda Remotion rendering pipeline

/**
 * Generates a Remotion-compatible JSON script for a given question.
 * Divides a 30-second timeline into high-fidelity visual/audio assets.
 * 
 * @param {Object} question - The database question object
 * @param {string} examName - The target exam name (e.g. Concours Médecine 2024)
 * @returns {Object} Remotion JSON schema
 */
export const generateRemotionScript = (question, examName = "L'CONQ Exam") => {
  if (!question) return null;

  // Format options array safely
  const formattedOptions = (question.options || []).map((opt, idx) => {
    const isStr = typeof opt === 'string';
    const optId = isStr ? ['A', 'B', 'C', 'D', 'E'][idx] : opt.id;
    const optText = isStr ? opt.replace(/^[A-E]\)\s*/, '') : (opt.text || '');
    return {
      id: optId,
      text: `${optId}) ${optText}`,
      revealAt: 6 + idx * 2 // staggered reveals between seconds 6 and 12
    };
  });

  return {
    videoConfig: {
      durationInSeconds: 30,
      fps: 30,
      dimensions: {
        width: 1080,
        height: 1920
      },
      brandTheme: {
        primaryColor: "#7C3AED", // Violet
        successColor: "#10B981", // Emerald
        backgroundColor: "#0F172A", // Dark Slate
        textMainColor: "#F8FAFC",
        textSubtleColor: "#94A3B8",
        fontFamily: "Inter, system-ui, sans-serif"
      }
    },
    metadata: {
      examName,
      subject: question.topic || question.subject || "Mathématiques",
      id: question.id
    },
    timeline: [
      {
        segment: "Question Reveal",
        timeRange: { start: 0, end: 5 },
        assets: {
          text: question.question || "",
          context: question.context || null,
          audioEffect: "whoosh-in-cinematic",
          visualStyle: {
            animation: "fade-in",
            fontSize: "46px",
            fontWeight: "800",
            color: "#F8FAFC",
            textAlign: "center"
          }
        }
      },
      {
        segment: "Options & Countdown",
        timeRange: { start: 6, end: 15 },
        assets: {
          options: formattedOptions,
          countdown: {
            type: "silent-visual-ring",
            duration: 9
          },
          audioEffect: "clock-ticking-subtle",
          visualStyle: {
            cardBackground: "rgba(30, 41, 59, 0.75)",
            fontSize: "40px",
            activeBorderColor: "#7C3AED"
          }
        }
      },
      {
        segment: "Correct Answer Ping",
        timeRange: { start: 16, end: 22 },
        assets: {
          correctOption: question.correct_answer || "A",
          audioEffect: "ping-success-bell",
          visualStyle: {
            glowColor: "#10B981",
            scale: 1.12,
            vibrate: true
          }
        }
      },
      {
        segment: "Step-by-Step Solution & Astuce",
        timeRange: { start: 23, end: 30 },
        assets: {
          solution: question.astuce || "Résolution classique",
          astuce: question.trick ? `⚡ ${question.trick}` : null,
          audioEffect: "laser-reveal-whoosh",
          visualStyle: {
            fontSize: "36px",
            textColor: "#10B981",
            astuceBackground: "#1E1B4B",
            astuceTextColor: "#FBBF24"
          }
        }
      }
    ]
  };
};

/**
 * Simulates calling Vercel/Lambda Remotion Serverless rendering endpoint
 * and saves the generated MP4 file path into mock local folder.
 * 
 * @param {Object} question - The database question object
 * @param {string} examName - Name of the exam
 * @returns {Promise<Object>} Promise resolving to video metadata
 */
export const renderTikTokVideo = async (question, examName) => {
  // Simulate network latency (2 seconds)
  await new Promise(resolve => setTimeout(resolve, 2000));

  const script = generateRemotionScript(question, examName);
  const videoId = `tiktok_${question.id || Math.random().toString(36).substr(2, 9)}`;
  const videoUrl = `/public/TikTok-Videos/${videoId}.mp4`;

  // Create a log in mock rendering console
  console.log(`[Remotion Serverless] Triggering render for video: ${videoId}`);
  console.log(`[Remotion Serverless] Config:`, script.videoConfig);

  return {
    success: true,
    videoId,
    videoUrl,
    title: script.metadata.subject,
    generatedAt: new Date().toISOString(),
    script
  };
};

/**
 * Helper to trigger native download of the generated JSON file
 * 
 * @param {string} filename - The target filename
 * @param {Object} data - The JSON payload object
 */
export const downloadJSON = (filename, data) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
