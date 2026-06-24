import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { 
  ArrowLeft, Download, Check, X, Eye, EyeOff, Edit,
  BookOpen, Calendar, User, Phone, CheckCircle, AlertCircle,
  Calculator, BookOpenCheck, Loader
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getLessonById } from '../services/lessonService';
import { renderWithMath } from '../utils/mathRenderer';
import { openLessonPrintWindow } from '../utils/generateLessonPDF';

const parseExerciseTitle = (title, fallbackIdx) => {
  if (!title) return { number: String(fallbackIdx + 1), label: '' };
  
  let clean = title.trim();
  
  // Remove "Exercice" prefix if any
  const prefixMatch = clean.match(/^Exercice\s*(?:N?°|N)?\s*/i);
  if (prefixMatch) {
    clean = clean.substring(prefixMatch[0].length).trim();
  }
  
  // Match number (alphanumeric/spaces) and the rest
  const match = clean.match(/^([0-9a-zA-Z\s]+)(.*)$/);
  if (match) {
    const number = match[1].trim();
    let label = match[2].trim();
    
    // Clean leading separators from the label (colons, dashes, etc.)
    label = label.replace(/^[:\-–—\s]+/, '').trim();
    
    return {
      number: number || String(fallbackIdx + 1),
      label: label
    };
  }
  
  return {
    number: clean || String(fallbackIdx + 1),
    label: ''
  };
};

export default function LessonViewerPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading, profName, profPhone, trackDownload } = useAuth();

  if (!authLoading && user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  
  // Ref to the printable content area
  const sheetRef = useRef(null);
  
  // Interactive UI Style Toggle: 'interactive' (Modern UI) or 'classic' (Worksheet Paper UI)
  const [uiStyle, setUiStyle] = useState('interactive');
  
  // Active Tab for Interactive Mode
  const [activeTab, setActiveTab] = useState('theory'); // 'theory' or 'exercises'
  
  // Solutions visibility states (section ID -> boolean)
  const [visibleSolutions, setVisibleSolutions] = useState({});
  
  // Interactive student answers states (sectionID-questionIdx -> string)
  const [studentAnswers, setStudentAnswers] = useState({});
  const [checkResults, setCheckResults] = useState({}); // key -> 'success' | 'error'

  useEffect(() => {
    const fetchLesson = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getLessonById(id);
        if (!data) {
          setError("Ce cours n'existe pas ou a été supprimé.");
        } else {
          setLesson(data);
          // Initialise solutions visibility
          const initialSols = {};
          data.content.sections?.forEach(sec => {
            if (sec.type === 'exercise') {
              initialSols[sec.id] = false;
            }
          });
          setVisibleSolutions(initialSols);
        }
      } catch (err) {
        console.error(err);
        setError("Erreur lors de la récupération de la fiche de cours.");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchLesson();
  }, [id]);

  const toggleSolution = (secId) => {
    setVisibleSolutions(prev => ({ ...prev, [secId]: !prev[secId] }));
  };

  const handleCheckAnswer = (secId, qIdx, expectedAnswer) => {
    const key = `${secId}-${qIdx}`;
    const userAns = (studentAnswers[key] || '').trim().toLowerCase();
    const expected = expectedAnswer.trim().toLowerCase();

    // Flexible checking: match exact or close matches (e.g. "oui" vs "yes", numbers)
    const isCorrect = userAns === expected;
    setCheckResults(prev => ({ ...prev, [key]: isCorrect ? 'success' : 'error' }));
  };

  /**
   * PDF Export: Opens a standalone, properly formatted HTML document
   * in a new window for clean print/save-as-PDF.
   */
  const handleExportPDF = () => {
    if (isExporting || !lesson) return;
    setIsExporting(true);
    try {
      if (typeof trackDownload === 'function') {
        trackDownload({ type: 'lesson', id: lesson.id, title: lesson.content?.header?.fiche_title || lesson.title || 'Fiche de Cours' });
      }
      openLessonPrintWindow(lesson);
    } catch (err) {
      console.error('[PDF Export] Error:', err);
      alert('Erreur lors de la génération du PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ width: 50, height: 50, borderRadius: '50%', border: '3px solid rgba(99,102,241,0.1)', borderTop: '3px solid var(--violet)', animation: 'spinViewer 1s linear infinite' }} />
        <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Chargement de la fiche de cours...</p>
        <style>{`
          @keyframes spinViewer {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: '2rem', textAlign: 'center' }}>
        <AlertCircle size={48} className="text-danger" style={{ marginBottom: '1rem' }} />
        <h2 style={{ color: 'var(--text-main)', fontWeight: 800 }}>Erreur de chargement</h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: '400px', marginBottom: '1.5rem' }}>{error || "Une erreur inconnue est survenue."}</p>
        <button onClick={() => navigate('/admin/lessons')} className="btn">Retour aux fiches</button>
      </div>
    );
  }

  const { content } = lesson;
  const { header, sections } = content;
  const theorySections = sections?.filter(s => s.type === 'content') || [];
  const exerciseSections = sections?.filter(s => s.type === 'exercise') || [];

  return (
    <div className={`lesson-viewer-container ${uiStyle === 'classic' ? 'classic-view-active' : ''}`} style={{
      minHeight: '100vh',
      padding: '1.5rem 0',
      maxWidth: '1200px',
      margin: '0 auto',
      position: 'relative'
    }}>
      <style>{`
        /* PDF Export Styling overrides to make fonts larger and reduce gaps */
        .exporting-pdf .sheet-body {
          padding: 1.5rem !important;
          gap: 1.2rem !important;
          font-size: 1.25rem !important; /* Larger font size */
        }
        
        .exporting-pdf .sheet-header-banner {
          font-size: 1.8rem !important;
          margin: 0 auto 1.2rem !important;
          padding: 0.5rem 2rem !important;
        }

        .exporting-pdf .subsection-card {
          padding: 1.2rem !important;
          gap: 0.8rem !important;
          border-radius: 8px !important;
        }

        .exporting-pdf .section-header-row {
          margin-top: 0.8rem !important;
          margin-bottom: 0.6rem !important;
          padding-bottom: 0.4rem !important;
        }

        .exporting-pdf .bullet-item {
          margin-bottom: 0.4rem !important;
          line-height: 1.5 !important;
        }

        .exporting-pdf .classic-highlight-box {
          padding: 0.8rem !important;
          margin: 0.3rem 0 !important;
        }

        .exporting-pdf .notation-grid {
          gap: 1rem !important;
          margin: 0.5rem 0 !important;
          padding: 0.5rem !important;
        }

        .exporting-pdf .notation-column {
          gap: 0.3rem !important;
          padding-left: 0.75rem !important;
        }

        .exporting-pdf .sheet-table {
          font-size: 1.1rem !important; /* Larger table font size */
          margin-top: 0.4rem !important;
        }

        .exporting-pdf .sheet-table th, .exporting-pdf .sheet-table td {
          padding: 0.6rem 0.8rem !important;
        }

        .exporting-pdf .exercise-wrapper {
          gap: 0.6rem !important;
        }

        .exporting-pdf .exercise-body-box {
          padding: 1rem !important;
          line-height: 1.6 !important;
        }

        .exporting-pdf .solution-block {
          padding: 1.2rem !important;
          margin-top: 0.5rem !important;
        }
        
        .exporting-pdf .katex {
          font-size: 1.15em !important; /* Larger KaTeX equations */
        }

        /* Loader spin animation */
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Styles scoped specifically for this page sheet */
        .sheet-container {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          display: flex;
          flex-direction: column;
          min-height: 80vh;
          box-shadow: var(--shadow-card);
          overflow: hidden;
          transition: all 0.3s ease;
        }
        
        .classic-view-active .sheet-container {
          background: #ffffff !important;
          border: 2px solid #005086 !important;
          border-radius: 12px !important;
          color: #1a202c !important;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08) !important;
        }

        /* Worksheet Body */
        .sheet-body {
          flex: 1;
          padding: 2.5rem;
          display: flex;
          flex-direction: column;
          gap: 2rem;
          overflow-y: auto;
          transition: all 0.3s ease;
        }
        
        .classic-view-active .sheet-body {
          background: #ffffff !important;
          color: #1a202c !important;
          font-family: 'Times New Roman', Times, serif !important;
        }

        /* Force all text to dark in classic mode */
        .classic-view-active *:not(.sheet-header-banner):not(.section-badge-circle):not(.exercise-pill):not(.section-title-pill):not(.accent-green-text):not(.solution-link-btn) {
          color: #1a202c !important;
        }
        /* Restore intentional colors */
        .classic-view-active .sheet-header-banner { color: #ffffff !important; }
        .classic-view-active .section-badge-circle { color: #ffffff !important; }
        .classic-view-active .exercise-pill { color: #ffffff !important; }
        .classic-view-active .section-title-pill { color: #005086 !important; }
        .classic-view-active .accent-green-text { color: #009688 !important; }
        .classic-view-active .solution-link-btn { color: #b91c1c !important; }

        /* Sheet top header */
        .sheet-header-banner {
          background: linear-gradient(135deg, #005086, #007cc6);
          border-radius: 99px;
          padding: 0.75rem 2.5rem;
          color: #ffffff;
          display: inline-flex;
          align-self: center;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 1.6rem;
          box-shadow: 0 4px 15px rgba(0, 80, 134, 0.2);
          letter-spacing: 0.02em;
          border: 2px solid rgba(255, 255, 255, 0.1);
        }
        
        .classic-view-active .sheet-header-banner {
          background: #005086 !important;
          border: none !important;
          box-shadow: none !important;
          border-radius: 20px !important;
          padding: 0.6rem 3rem !important;
        }

        /* Section badges */
        .section-badge-circle {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #005086;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          font-size: 0.95rem;
          flex-shrink: 0;
          box-shadow: 0 2px 5px rgba(0, 80, 134, 0.25);
        }
        
        .section-header-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          border-bottom: 2px solid rgba(0, 80, 134, 0.1);
          padding-bottom: 0.5rem;
          margin-bottom: 1rem;
        }
        
        .section-title-pill {
          font-size: 1.15rem;
          font-weight: 800;
          color: #005086;
          border: 1px solid rgba(0, 80, 134, 0.3);
          border-radius: 99px;
          padding: 0.25rem 1.25rem;
          display: inline-flex;
          background: rgba(0, 80, 134, 0.02);
        }
        
        .classic-view-active .section-title-pill {
          border: 1.5px solid #005086 !important;
          background: none !important;
          color: #005086 !important;
        }

        /* Subsection boxes */
        .subsection-card {
          border: 1.5px solid #005086;
          border-radius: 12px;
          padding: 1.5rem;
          background: rgba(0, 80, 134, 0.01);
          display: flex;
          flex-direction: column;
          gap: 1rem;
          transition: all 0.3s ease;
        }
        
        .classic-view-active .subsection-card {
          border: 1.5px solid #005086 !important;
          background: #ffffff !important;
          border-radius: 8px !important;
          box-shadow: none !important;
        }
        
        .subsection-header-inline {
          font-size: 1.05rem;
          font-weight: 800;
          color: #2d3748;
          border-bottom: 1px dashed rgba(0, 80, 134, 0.25);
          padding-bottom: 0.5rem;
          margin-bottom: 0.5rem;
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        
        .classic-view-active .subsection-header-inline {
          color: #1a202c !important;
        }
        
        .accent-green-text {
          color: #10B981;
          font-weight: 800;
        }
        
        .classic-view-active .accent-green-text {
          color: #009688 !important; /* Muted corporate green from the original print */
        }

        /* Classic style bullet points */
        .bullet-item {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          line-height: 1.6;
          margin-bottom: 0.5rem;
        }
        
        .bullet-dot {
          color: #005086;
          font-size: 1.2rem;
          line-height: 1;
          margin-top: -0.1rem;
        }

        /* Columns for Notations */
        .notation-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          margin: 0.75rem 0;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 8px;
        }
        
        .classic-view-active .notation-grid {
          background: #f8fafc !important;
          border: 1px solid rgba(0,80,134,0.1) !important;
        }
        
        @media (max-width: 640px) {
          .notation-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
        }
        
        .notation-column {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          border-left: 2px solid rgba(0, 80, 134, 0.15);
          padding-left: 1rem;
        }
        
        .classic-view-active .notation-column {
          border-left-color: #005086 !important;
        }

        /* Worksheet Math Table */
        .sheet-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 0.5rem;
          overflow: hidden;
          border-radius: 8px;
          border: 1px solid rgba(0, 80, 134, 0.2);
          font-size: 0.9rem;
        }
        
        .classic-view-active .sheet-table {
          border: 1.5px solid #1a202c !important;
        }
        
        .sheet-table th, .sheet-table td {
          border: 1px solid rgba(0, 80, 134, 0.2);
          padding: 0.75rem 1rem;
          text-align: center;
        }
        
        .classic-view-active .sheet-table th, 
        .classic-view-active .sheet-table td {
          border: 1.5px solid #1a202c !important;
          color: #1a202c !important;
        }
        
        .sheet-table th {
          background: rgba(0, 80, 134, 0.05);
          font-weight: 800;
          color: #005086;
        }
        
        .classic-view-active .sheet-table th {
          background: #f7fafc !important;
          color: #005086 !important;
        }

        /* Exercises design */
        .exercise-wrapper {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        
        .exercise-banner-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        
        .exercise-pill {
          background: #005086;
          color: #ffffff;
          padding: 0.35rem 1.25rem;
          border-radius: 99px;
          font-weight: 800;
          font-size: 0.9rem;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          box-shadow: 0 2px 4px rgba(0, 80, 134, 0.15);
        }
        
        .solution-link-btn {
          background: none;
          border: none;
          color: #b91c1c; /* Maroon/reddish */
          cursor: pointer;
          font-weight: 700;
          font-size: 0.85rem;
          display: flex;
          align-items: center;
          gap: 0.25rem;
          text-decoration: underline;
          transition: all 0.2s;
        }
        
        .solution-link-btn:hover {
          color: #ef4444;
          transform: translateX(2px);
        }
        
        .exercise-body-box {
          border-left: 4px solid #005086;
          background: rgba(0, 80, 134, 0.02);
          border-top: 1px solid rgba(0, 80, 134, 0.1);
          border-right: 1px solid rgba(0, 80, 134, 0.1);
          border-bottom: 1px solid rgba(0, 80, 134, 0.1);
          border-radius: 4px 8px 8px 4px;
          padding: 1.25rem;
          line-height: 1.7;
          transition: all 0.3s ease;
        }
        
        .classic-view-active .exercise-body-box {
          background: #ffffff !important;
          border: 1.5px solid #005086 !important;
          border-left: 5px solid #005086 !important;
          border-radius: 4px !important;
        }
        
        /* Interactive features */
        .interactive-form {
          margin-top: 1rem;
          padding: 1rem;
          background: var(--bg-glass);
          border: 1px dashed var(--border);
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        
        .classic-view-active .interactive-form {
          border: 1px dashed #cbd5e1 !important;
          background: #f8fafc !important;
        }

        /* ── Print / PDF Export styles ── */
        @media print {
          /* Page setup */
          @page {
            size: A4 portrait;
            margin: 15mm 12mm 15mm 12mm;
          }

          /* ── Override dark-mode CSS variables: target body directly ── */
          /* :root has same specificity as the dark theme :root so target body instead */
          html, body, body * {
            --text-main: #1a202c;
            --text-muted: #4a5568;
            --bg-card: #ffffff;
            --bg-glass: #f8fafc;
            --bg-base: #ffffff;
            --border: rgba(0,80,134,0.2);
            --violet: #4F46E5;
            --violet-soft: rgba(79,70,229,0.08);
            --emerald: #059669;
            --emerald-soft: rgba(5,150,105,0.08);
            --warning: #d97706;
            --danger: #dc2626;
            --shadow-card: none;
          }

          /* Root resets */
          html, body {
            background: #ffffff !important;
            color: #1a202c !important;
            font-family: 'Segoe UI', Arial, sans-serif !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Hide everything that should not print */
          .no-print,
          nav, aside,
          .interactive-form {
            display: none !important;
          }

          /* Show print-only header */
          .print-only-header {
            display: grid !important;
          }

          /* Always show solutions in print */
          .solution-block {
            display: block !important;
            margin-top: 0.75rem !important;
            break-inside: avoid !important;
          }

          /* Page container */
          .lesson-viewer-container {
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
          }

          /* Remove card box-shadow and border for print */
          .sheet-container {
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            background: #ffffff !important;
            color: #1a202c !important;
            overflow: visible !important;
            min-height: auto !important;
          }

          /* Sheet body — critical: remove overflow:auto so full content prints */
          .sheet-body {
            padding: 1rem 0 !important;
            background: #ffffff !important;
            color: #1a202c !important;
            gap: 1.25rem !important;
            overflow: visible !important;
            height: auto !important;
            max-height: none !important;
          }

          /* Force ALL text elements inside sheet-body to dark color */
          .sheet-body,
          .sheet-body span,
          .sheet-body div,
          .sheet-body p,
          .sheet-body li,
          .sheet-body h1,
          .sheet-body h2,
          .sheet-body h3,
          .sheet-body h4,
          .sheet-body strong,
          .sheet-body em {
            color: #1a202c !important;
          }

          /* Blue gradient banner - keep it */
          .sheet-header-banner {
            background: #005086 !important;
            color: #ffffff !important;
            border-radius: 20px !important;
            padding: 0.5rem 2.5rem !important;
            font-size: 1.25rem !important;
            box-shadow: none !important;
            border: none !important;
          }

          /* Section header row */
          .section-header-row {
            border-bottom: 2px solid rgba(0,80,134,0.15) !important;
          }

          /* Section number badge */
          .section-badge-circle {
            background: #005086 !important;
            color: #ffffff !important;
            box-shadow: none !important;
          }

          /* Section title pill */
          .section-title-pill {
            color: #005086 !important;
            border-color: rgba(0,80,134,0.4) !important;
            background: rgba(0,80,134,0.04) !important;
            font-size: 1rem !important;
          }

          /* Subsection card */
          .subsection-card {
            border: 1.5px solid #005086 !important;
            background: #ffffff !important;
            border-radius: 8px !important;
            color: #1a202c !important;
            break-inside: avoid !important;
          }

          /* Subsection inline header */
          .subsection-header-inline {
            color: #1a202c !important;
          }

          /* Green accent */
          .accent-green-text { color: #009688 !important; }

          /* Bullet items */
          .bullet-dot { color: #005086 !important; }

          /* Notation grid */
          .notation-grid {
            background: #f8fafc !important;
            border: 1px solid rgba(0,80,134,0.1) !important;
          }
          .notation-column {
            border-left-color: rgba(0,80,134,0.3) !important;
          }

          /* Tables */
          .sheet-table {
            border: 1.5px solid #005086 !important;
          }
          .sheet-table th, .sheet-table td {
            border: 1px solid rgba(0,80,134,0.25) !important;
            color: #1a202c !important;
          }
          .sheet-table th {
            background: rgba(0,80,134,0.06) !important;
            color: #005086 !important;
          }

          /* Exercises */
          .exercise-wrapper { break-inside: avoid !important; }
          .exercise-pill {
            background: #005086 !important;
            color: #ffffff !important;
          }
          .exercise-body-box {
            background: rgba(0,80,134,0.02) !important;
            border: 1px solid rgba(0,80,134,0.15) !important;
            border-left: 4px solid #005086 !important;
            color: #1a202c !important;
          }

          /* Solution block in print */
          .solution-block h4 { color: #059669 !important; }

          /* Classic highlight box */
          .classic-highlight-box {
            background: rgba(0,80,134,0.04) !important;
            border: 1.5px solid #005086 !important;
            color: #1a202c !important;
          }

          /* KaTeX math — always dark on white */
          .katex, .katex * { color: #1a202c !important; }

          /* Response/attention callouts */
          .mfc-callout-response {
            background: rgba(16,185,129,0.06) !important;
            border-left-color: #009688 !important;
          }
          .mfc-callout-attention {
            background: rgba(245,158,11,0.06) !important;
          }

          /* Markdown headings rendered by renderWithMath */
          .sheet-body div[style*='#005086'] { color: #005086 !important; }
        }
      `}</style>

      {/* ── Action Header (No Print) ── */}
      <div className="no-print" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <button 
          onClick={() => navigate('/admin/lessons')}
          className="btn-outline"
          style={{ 
            padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 800, 
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem' 
          }}
        >
          <ArrowLeft size={16} /> Retour aux fiches
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* View Mode Switcher */}
          <div className="glass-panel" style={{
            padding: '0.25rem',
            borderRadius: '99px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.1rem',
            margin: 0,
            border: '1px solid var(--border)'
          }}>
            <button 
              onClick={() => setUiStyle('interactive')}
              style={{
                background: uiStyle === 'interactive' ? 'var(--violet)' : 'transparent',
                color: uiStyle === 'interactive' ? '#ffffff' : 'var(--text-muted)',
                border: 'none',
                padding: '0.4rem 0.85rem',
                borderRadius: '99px',
                fontSize: '0.75rem',
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              🚀 Mode Interactif
            </button>
            <button 
              onClick={() => setUiStyle('classic')}
              style={{
                background: uiStyle === 'classic' ? '#005086' : 'transparent',
                color: uiStyle === 'classic' ? '#ffffff' : 'var(--text-muted)',
                border: 'none',
                padding: '0.4rem 0.85rem',
                borderRadius: '99px',
                fontSize: '0.75rem',
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              📄 Style Papier
            </button>
          </div>

          {/* PDF Download button */}
          <button 
            onClick={handleExportPDF}
            disabled={isExporting}
            className="btn"
            style={{
              padding: '0.5rem 1.1rem',
              fontSize: '0.85rem',
              fontWeight: 800,
              background: isExporting
                ? 'linear-gradient(135deg, #4a6a85, #5a8aab)'
                : 'linear-gradient(135deg, #005086, #007cc6)',
              opacity: isExporting ? 0.8 : 1,
              cursor: isExporting ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            {isExporting
              ? <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Génération...</>
              : <><Download size={16} /> Télécharger PDF</>}
          </button>

          {/* Edit button */}
          <button 
            onClick={() => navigate(`/admin/lessons/${id}/edit`)}
            className="btn-outline"
            style={{
              padding: '0.5rem 1.1rem',
              fontSize: '0.85rem',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              border: '1px solid var(--border)'
            }}
          >
            <Edit size={16} /> Modifier
          </button>
        </div>
      </div>

      {/* ── MAIN WORKsheet CONTAINER — ref used by html2canvas PDF export ── */}
      <div ref={sheetRef} className="sheet-container">
        
        {/* Print-only header row (3 columns) — hidden on screen, shows on print */}
        <header className="print-only-header" style={{
          display: 'none',
          gridTemplateColumns: '1fr 1.5fr 1fr',
          borderBottom: '2px solid #005086',
          marginBottom: '1.5rem',
          paddingBottom: '0.75rem',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem', fontSize: '0.75rem', color: '#1a202c', fontWeight: 700 }}>
            <span>{header.prep_title}</span>
            <span style={{ color: '#005086' }}>{header.schools?.join(' - ')}</span>
          </div>
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.15rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.7rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{header.subject}</span>
            <span style={{ fontWeight: 900, fontSize: '1rem', color: '#b91c1c', textDecoration: 'underline' }}>{header.fiche_title}</span>
          </div>
          <div style={{ textAlign: 'right', fontSize: '0.75rem', color: '#1a202c', fontWeight: 700, display: 'flex', flexDirection: 'column', gap: '0.1rem', alignItems: 'flex-end' }}>
            <span>{header.teacher || profName}</span>
            {(header.phone || profPhone) && <span style={{ color: '#4b5563' }}>{header.phone || profPhone}</span>}
          </div>
        </header>

        {/* Screen-only header: interactive mode top bar or classic paper header */}
        {uiStyle === 'classic' ? (
          <div className="paper-header" style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1.5fr 1fr',
            borderBottom: '2px solid #005086',
            textAlign: 'center',
            background: '#ffffff'
          }}>
            <div className="paper-header-cell" style={{ padding: '1rem', borderRight: '1.5px solid #005086', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '0.25rem', color: '#111827', fontSize: '0.8rem', fontWeight: 'bold' }}>
              <div>{header.prep_title}</div>
              <div style={{ color: '#005086' }}>{header.schools?.join(' - ')}</div>
            </div>
            <div className="paper-header-cell" style={{ padding: '1rem', borderRight: '1.5px solid #005086', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '0.25rem', color: '#111827' }}>
              <div style={{ fontSize: '0.9rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {header.subject}
              </div>
              <div className="paper-header-title" style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#005086' }}>
                <span className="paper-header-title-underline" style={{ color: '#b91c1c', textDecoration: 'underline', fontWeight: 900 }}>{header.fiche_title}</span>
              </div>
            </div>
            <div className="paper-header-cell" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '0.25rem', color: '#111827', fontSize: '0.8rem', fontWeight: 'bold' }}>
              <div>{header.teacher || profName}</div>
              {(header.phone || profPhone) && <div style={{ color: '#4b5563' }}>{header.phone || profPhone}</div>}
            </div>
          </div>
        ) : (
          <div className="no-print" style={{
            padding: '2rem 2.5rem 1rem',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div>
              <span style={{
                background: 'var(--violet-soft)',
                color: 'var(--violet)',
                padding: '0.2rem 0.65rem',
                borderRadius: '6px',
                fontSize: '0.72rem',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                display: 'inline-block',
                marginBottom: '0.5rem'
              }}>
                {header.subject}
              </span>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                {header.fiche_title}
              </h1>
            </div>
            
            {/* Meta badges */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {(header.teacher || profName) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'var(--bg-glass)', border: '1px solid var(--border)', padding: '0.3rem 0.75rem', borderRadius: '8px' }}>
                  <User size={14} />
                  <span>{header.teacher || profName}</span>
                </div>
              )}
              {(header.phone || profPhone) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'var(--bg-glass)', border: '1px solid var(--border)', padding: '0.3rem 0.75rem', borderRadius: '8px' }}>
                  <Phone size={14} />
                  <span>{header.phone || profPhone}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* WORKBOOK MAIN BODY */}
        <div className="sheet-body">
          {/* Centered blue banner title for both modes */}
          <div className="sheet-header-banner" style={{ margin: '0 auto 2rem', display: 'inline-flex' }}>
            {header.fiche_title || header.subject || "Fiche de Cours"}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
            {sections?.map((sec, idx) => {
              const isTheory = sec.type === 'content';
              const { number: exeNumber, label: exeLabel } = !isTheory 
                ? parseExerciseTitle(sec.title, idx)
                : { number: '', label: '' };
              
              // Decide whether to show section header row
              const prevSec = idx > 0 ? sections[idx - 1] : null;
              const showSectionHeader = sec.section_header && (!prevSec || prevSec.section_header !== sec.section_header);
              
              return (
                <div key={sec.id || idx} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
                  {showSectionHeader && (
                    <div className="section-header-row" style={{ marginTop: idx > 0 ? '1.5rem' : '0' }}>
                      <div className="section-badge-circle">{sec.section_number || '1'}</div>
                      <div className="section-title-pill">{sec.section_header}</div>
                    </div>
                  )}
                  
                  {isTheory ? (
                    <div className="subsection-card">
                      <div className="subsection-header-inline">
                        <span>{sec.title}</span>
                        {sec.accent_text && <span className="accent-green-text">{sec.accent_text}</span>}
                      </div>
                      
                      {sec.items?.map((item, itemIdx) => {
                        if (item.type === 'highlight_box') {
                          return (
                            <div key={itemIdx} className="classic-highlight-box">
                              {renderWithMath(item.text)}
                            </div>
                          );
                        }
                        if (item.type === 'notation_grid') {
                          return (
                            <div key={itemIdx} className="notation-grid">
                              {item.notation_columns?.map((col, colIdx) => (
                                <div key={colIdx} className="notation-column">
                                  <strong style={{ fontSize: '0.85rem', color: '#005086' }}>{col.title}</strong>
                                  {col.math_blocks?.map((block, bIdx) => (
                                    <div key={bIdx} style={{ display: 'block', margin: '0.5rem 0' }}>
                                      {renderWithMath(block)}
                                    </div>
                                  ))}
                                </div>
                              ))}
                            </div>
                          );
                        }
                        if (item.type === 'table') {
                          return (
                            <div key={itemIdx} style={{ overflowX: 'auto', width: '100%', margin: '0.5rem 0' }}>
                              <table className="sheet-table">
                                <thead>
                                  <tr>
                                    {item.table_data?.headers?.map((h, hIdx) => (
                                      <th key={hIdx}>{renderWithMath(h)}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {item.table_data?.rows?.map((row, rIdx) => (
                                    <tr key={rIdx}>
                                      {row.map((cell, cIdx) => (
                                        <td key={cIdx}>{renderWithMath(cell)}</td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          );
                        }
                        return (
                          <div key={itemIdx} className="bullet-item">
                            {item.type === 'bullet' && <span className="bullet-dot">•</span>}
                            <span style={{ flex: 1 }}>{renderWithMath(item.text)}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="exercise-wrapper">
                      <div className="exercise-banner-row">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                          <div className="exercise-pill">
                            <span>Exercice N°</span>
                            <span style={{ 
                              background: '#ffffff', color: '#005086', 
                              minWidth: '20px', height: '20px', borderRadius: '10px',
                              padding: '0 5px',
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '0.75rem', fontWeight: 900,
                              whiteSpace: 'nowrap'
                            }}>{exeNumber}</span>
                          </div>
                          {exeLabel && (
                            <span style={{ 
                              fontWeight: 800, 
                              fontSize: '1rem', 
                              color: 'var(--text-main)',
                              display: 'inline-flex',
                              alignItems: 'center'
                            }}>
                              {exeLabel}
                            </span>
                          )}
                        </div>

                        <button 
                          className="solution-link-btn no-print"
                          onClick={() => toggleSolution(sec.id)}
                        >
                          {visibleSolutions[sec.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                          {visibleSolutions[sec.id] ? 'Masquer la solution' : 'Afficher la solution rédigée'}
                        </button>
                      </div>

                      <div className="exercise-body-box">
                        {renderWithMath(sec.content)}
                      </div>

                      {/* Interactive student checks */}
                      {sec.interactive_answers?.length > 0 && (
                        <form 
                          onSubmit={(e) => {
                            e.preventDefault();
                            sec.interactive_answers.forEach(ans => {
                              handleCheckAnswer(sec.id, ans.question_idx, ans.expected_answer);
                            });
                          }}
                          className="interactive-form no-print"
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.85rem', color: '#005086' }}>
                            <Calculator size={16} /> Mode interactif : Calculez et valisez vos résultats
                          </div>
                          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            {sec.interactive_answers.map((ans, ansIdx) => {
                              const ansKey = `${sec.id}-${ans.question_idx}`;
                              return (
                                <div key={ansIdx} style={{ flex: 1, minWidth: '120px' }}>
                                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                                    {ans.label}
                                  </label>
                                  <input 
                                    type="text" 
                                    placeholder="Votre réponse"
                                    value={studentAnswers[ansKey] || ''} 
                                    onChange={(e) => setStudentAnswers(prev => ({ ...prev, [ansKey]: e.target.value }))}
                                    className="input-control" 
                                    style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem', width: '100%' }}
                                  />
                                </div>
                              );
                            })}
                          </div>
                          
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <button type="submit" className="btn" style={{ padding: '0.4rem 1rem', fontSize: '0.75rem', width: 'fit-content' }}>
                              Vérifier mes réponses
                            </button>

                            {sec.interactive_answers.every(ans => checkResults[`${sec.id}-${ans.question_idx}`] === 'success') && (
                              <span style={{ color: '#059669', fontSize: '0.8rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <Check size={16} strokeWidth={3} /> Réponses correctes !
                              </span>
                            )}
                            {sec.interactive_answers.some(ans => checkResults[`${sec.id}-${ans.question_idx}`] === 'error') && (
                              <span style={{ color: '#ef4444', fontSize: '0.8rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <X size={16} strokeWidth={3} /> Mauvaise réponse, réessayez.
                              </span>
                            )}
                          </div>
                        </form>
                      )}

                      {/* Solution block: always rendered, hidden by CSS, shown in print */}
                      <div
                        className="solution-block"
                        style={{
                          display: visibleSolutions[sec.id] ? 'block' : 'none',
                          marginTop: '0.5rem',
                          background: 'rgba(16, 185, 129, 0.02)',
                          border: '1px solid rgba(16, 185, 129, 0.15)',
                          borderRadius: '12px',
                          padding: '1.5rem'
                        }}
                      >
                        <h4 style={{ color: '#059669', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontSize: '1rem' }}>
                          <BookOpenCheck size={18} /> Démonstration rédigée
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
                          {renderWithMath(sec.solution)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
