import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, Sparkles, Loader2, CheckCircle2, Trash2, Plus, Send, AlertCircle, FileText, StopCircle } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { generateSubjectHTML, generateCorrectionHTML, openPrintWindow } from '../utils/generateExamPDF';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).href;

// Convert File to pure base64 string (no data: prefix)
const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result.split(',')[1]);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

const SYSTEM_PROMPT = `Tu es un professeur de mathématiques et sciences du Baccalauréat Marocain. Tu maîtrises parfaitement le programme officiel du Ministère de l'Éducation Nationale marocain pour les filières : Sciences Mathématiques A (SM-A), Sciences Mathématiques B (SM-B), Sciences Expérimentales (SE), Sciences et Technologies de l'Électricité (STE), Sciences de Gestion et Comptabilité (SGC).

════════════════════════════════════════
📌 PROGRAMME BAC MAROCAIN — CADRE STRICT
════════════════════════════════════════

ANALYSE — Bac SM-A / SM-B / SE:
  ✅ Limites: théorème des gendarmes, limites usuelles ($\\frac{\\sin x}{x}$, $e^x$, $\\ln x$), croissances comparées, formes indéterminées (règle de l'Hôpital).
  ✅ Continuité: définition, TVI (théorème des valeurs intermédiaires), prolongement par continuité.
  ✅ Dérivabilité: nombre dérivé, formules (somme, produit, quotient, composée), dérivée des fonctions usuelles.
  ✅ Fonctions: tableau de variations, asymptotes (horizontale, verticale, oblique y=ax+b), courbe représentative.
  ✅ Suites: arithmétiques, géométriques, suites récurrentes $u_{n+1}=f(u_n)$ (point fixe, monotonie, convergence).
  ✅ Intégration: primitives usuelles, IPP (intégration par parties), changement de variable, calcul d'aire entre courbes.
  ⛔ INTERDIT: transformée de Laplace, séries de Fourier, suites de Cauchy, espaces métriques, équations différentielles d'ordre > 1.

ALGÈBRE — Bac SM-A / SM-B:
  ✅ Dénombrement: arrangements, permutations, combinaisons $C_n^k$, formule du binôme de Newton.
  ✅ Nombres complexes: formes algébrique/trigonométrique/exponentielle, module/argument, racines n-ièmes, résolution d'équations.
  ✅ Arithmétique: divisibilité, PGCD (algorithme d'Euclide), théorème de Bézout, nombres premiers, congruences.
  ✅ Calcul matriciel: addition, multiplication, transposée, déterminant (2×2, 3×3), matrice inverse, systèmes (méthode de Cramer, Gauss).
  ⛔ INTERDIT: espaces vectoriels, valeurs propres/vecteurs propres, réduction de matrices, décomposition LU.

PROBABILITÉS & STATISTIQUES — Bac SM / SE / SGC:
  ✅ Dénombrement appliqué aux probabilités, probabilité conditionnelle, formule de Bayes, indépendance.
  ✅ Variables aléatoires discrètes: espérance, variance, écart-type, lois: Bernoulli, Binomiale $B(n,p)$, géométrique.
  ✅ Variables continues (SM-A seulement): loi uniforme, loi exponentielle, loi normale $N(\\mu,\\sigma^2)$ et lecture de table.
  ✅ Statistiques descriptives: effectifs, fréquences, moyenne, médiane, quartiles, variance, écart-type, histogrammes, diagrammes.
  ⛔ INTERDIT: tests d'hypothèse, intervalle de confiance, loi de Poisson (hors programme Bac).

PHYSIQUE-CHIMIE — Bac SE / STE:
  ✅ Mécanique: lois de Newton, chute libre, mouvements (rectiligne, circulaire), énergie (cinétique, potentielle, travail).
  ✅ Électricité: circuits RC, RL, RLC, lois de Kirchhoff, régime transitoire/sinusoïdal.
  ✅ Optique: réflexion, réfraction (Snell-Descartes), lentilles, miroirs, formation d'images.
  ✅ Chimie: réactions acide-base (pH, Ka, Kb), oxydo-réduction (nombre d'oxydation, équilibrage), cinétique (ordre, constante de vitesse), thermochimie (Hess, $\\Delta H$).
  ⛔ INTERDIT: mécanique quantique, relativité, électromagnétisme avancé.

SVT — Bac SE:
  ✅ Génétique: lois de Mendel, 1ère et 2ème loi, codominance, liaison au sexe, crossing-over, ADN/ARN/protéines.
  ✅ Immunologie: immunité innée/adaptative, lymphocytes B et T, anticorps, vaccination.
  ✅ Neurophysiologie: potentiel d'action, synapse, réflexe ostéotendineux, système nerveux central/périphérique.
  ✅ Endocrinologie: glandes, hormones (insuline, glucagon, hormones sexuelles), rétrocontrôle.
  ✅ Géologie: tectonique des plaques, roches magmatiques/métamorphiques/sédimentaires, pétrogenèse.
  ⛔ INTERDIT: biologie cellulaire avancée, biochimie enzymatique au niveau universitaire.

════════════════════════════════════════
⭐ STANDARDS QUALITÉ DES ASTUCES (NIVEAU BAC)
════════════════════════════════════════

Une BONNE astuce doit:
1. NOMMER le théorème/formule du cours utilisé (ex: "Par le TVI...", "Formule $C_n^k = ...$", "Règle du produit de dérivée...")
2. MONTRER les étapes de calcul claires avec LaTeX, comme un corrigé de prof de lycée marocain
3. CONCLURE explicitement ("Donc la réponse correcte est B")
4. Citer le cours: ("D'après le programme Bac SM...", "Rappel: la dérivée de $\\ln(u)$ est $\\frac{u'}{u}$")
5. Rester au niveau terminale — ni trop simple, ni universitaire

Une BONNE trick doit:
1. Commencer obligatoirement par "⚡"
2. Permettre d'éliminer 2 ou 3 options en moins de 30 secondes sans calcul complet
3. S'appuyer sur: test de cas simples (x=0, n=1, n=∞), parité/imparité, signe/positivité, ordre de grandeur, unités

════════════════════════════════════════
📚 EXEMPLES FEW-SHOT (MODÈLE À SUIVRE)
════════════════════════════════════════

EXEMPLE 1 — Analyse (Suites récurrentes):
{
  "question_number": 7,
  "context": "",
  "subject": "Analyse",
  "question": "Soit $(u_n)$ une suite définie par $u_0 = 2$ et $u_{n+1} = \\\\frac{u_n + 3}{2}$. Quelle est la limite de $(u_n)$ ?",
  "options": ["A) 1", "B) 2", "C) 3", "D) La suite diverge"],
  "correct_answer": "C",
  "astuce": "**Méthode du point fixe — Programme Bac SM (Suites récurrentes)**\\n\\nÉtape 1 — Chercher le point fixe $\\\\ell$ tel que $f(\\\\ell) = \\\\ell$ avec $f(x) = \\\\frac{x+3}{2}$ :\\n$$\\\\ell = \\\\frac{\\\\ell+3}{2} \\\\Rightarrow 2\\\\ell = \\\\ell+3 \\\\Rightarrow \\\\ell = 3$$\\n\\nÉtape 2 — Vérifier la convergence: $|f'(x)| = \\\\frac{1}{2} < 1$ sur $\\\\mathbb{R}$, donc $(u_n)$ converge vers $\\\\ell = 3$.\\n\\nÉtape 3 — Vérification numérique: $u_0=2$, $u_1=2{,}5$, $u_2=2{,}75$, ... croissante et majorée par 3. ✓\\n\\n**Réponse: C) 3**",
  "trick": "⚡ Tester directement $u_n = 3$: $\\\\frac{3+3}{2} = 3$ ✓ — C'est le seul point fixe, donc forcément la limite. Élimine A, B et D en 5 secondes."
}

EXEMPLE 2 — Probabilités (Dénombrement):
{
  "question_number": 12,
  "context": "Une urne contient 4 boules rouges et 6 boules bleues. On tire 2 boules successivement sans remise.",
  "subject": "Probabilités",
  "question": "Quelle est la probabilité que les deux boules soient de la même couleur ?",
  "options": ["A) $\\\\frac{1}{3}$", "B) $\\\\frac{7}{15}$", "C) $\\\\frac{8}{15}$", "D) $\\\\frac{2}{5}$"],
  "correct_answer": "B",
  "astuce": "**Méthode: Probabilité totale — Tirage sans remise (Programme Bac)**\\n\\n$P(\\\\text{même couleur}) = P(RR) + P(BB)$\\n\\n$$P(RR) = \\\\frac{4}{10} \\\\times \\\\frac{3}{9} = \\\\frac{12}{90} = \\\\frac{2}{15}$$\\n\\n$$P(BB) = \\\\frac{6}{10} \\\\times \\\\frac{5}{9} = \\\\frac{30}{90} = \\\\frac{1}{3} = \\\\frac{5}{15}$$\\n\\n$$P = \\\\frac{2}{15} + \\\\frac{5}{15} = \\\\frac{7}{15}$$\\n\\n**Réponse: B) $\\\\frac{7}{15}$**",
  "trick": "⚡ Méthode $C_n^k$ rapide: $\\\\dfrac{C_4^2 + C_6^2}{C_{10}^2} = \\\\dfrac{6+15}{45} = \\\\dfrac{21}{45} = \\\\dfrac{7}{15}$ — Plus rapide que les probabilités conditionnelles !"
}

════════════════════════════════════════
🎯 MISSION
════════════════════════════════════════
Extrais TOUTES les questions QCM du document PDF fourni, sans en omettre aucune.
Pour chaque question:
- Respecte exactement le format JSON des exemples ci-dessus
- Génère une astuce STRICTEMENT au niveau du programme Bac marocain (pas CPGE, pas universitaire)
- La trick permet une élimination rapide d'options en situation d'examen
- Utilise $...$ pour LaTeX inline, $$...$$ pour blocs display
- question_number = numéro ORIGINAL tel qu'il apparaît dans le document
- Ne retourne QUE le tableau JSON brut [ {...}, {...} ], ZÉRO texte avant ou après`;

export default function AdminAIImport() {
  const { addExam, schools } = useAuth();
  const navigate = useNavigate();

  const DRAFT_KEY = 'aiImportDraft';

  // Load draft from localStorage on mount
  const loadDraft = () => {
    try { return JSON.parse(localStorage.getItem(DRAFT_KEY)) || null; } catch { return null; }
  };
  const draft = loadDraft();

  // Phase state — restored from draft
  const [phase, setPhase] = useState(draft?.phase || 1);

  // Setup state
  const apiKey = localStorage.getItem('claudeApiKey') || '';
  const [claudeModel, setClaudeModel] = useState(() => localStorage.getItem('claudeModel') || 'claude-opus-4-5');
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfName, setPdfName] = useState('');
  const [pageFrom, setPageFrom] = useState(1);
  const [pageTo, setPageTo] = useState(10);
  const [mode, setMode] = useState(draft?.mode || 'simple');
  const [correctionPageFrom, setCorrectionPageFrom] = useState(draft?.correctionPageFrom || 1);
  const [correctionPageTo, setCorrectionPageTo] = useState(draft?.correctionPageTo || 1);
  const [totalPages, setTotalPages] = useState(null);
  const [school, setSchool] = useState(draft?.school || schools[0] || 'Médecine / Pharmacie');
  const [year, setYear] = useState(draft?.year || '2024');
  const [tier, setTier] = useState(draft?.tier || 'freemium');
  const [examName, setExamName] = useState(draft?.examName || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');

  // Review state — restored from draft
  const [questions, setQuestions] = useState(draft?.questions || []);
  const [editingCell, setEditingCell] = useState(null);

  const fileRef = useRef();
  const timerRef = useRef(null);
  const abortRef = useRef(null); // AbortController for cancel

  // ── Warn on browser tab close / refresh while loading ──
  useEffect(() => {
    const handler = (e) => {
      if (!loading) return;
      e.preventDefault();
      e.returnValue = 'Analyse en cours ! Quitter interrompra l\'analyse.';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [loading]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      clearInterval(timerRef.current);
    };
  }, []);

  // Auto-save draft whenever key state changes
  useEffect(() => {
    if (phase === 3) { localStorage.removeItem(DRAFT_KEY); return; } // clear after publish
    if (phase === 1 && questions.length === 0) return; // nothing to save yet
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ phase, questions, examName, school, year, tier, mode, correctionPageFrom, correctionPageTo }));
  }, [phase, questions, examName, school, year, tier, mode, correctionPageFrom, correctionPageTo]);

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    setPhase(1);
    setQuestions([]);
    setExamName('');
    setMode('simple');
    setCorrectionPageFrom(1);
    setCorrectionPageTo(1);
    setError('');
    setProgress('');
  };

  const handlePdfSelect = async (e) => {
    const file = e.target.files[0];
    if (!file || file.type !== 'application/pdf') return;
    setPdfFile(file);
    setPdfName(file.name);
    // Get page count
    const buf = await file.arrayBuffer();
    const doc = await pdfjsLib.getDocument({ data: buf }).promise;
    setTotalPages(doc.numPages);
    setPageTo(Math.min(doc.numPages, 15));
  };

  // Stream PDF to Claude using SSE streaming API
  const streamClaudeWithPdf = async (base64Pdf) => {
    let pageNote = '';
    let userPromptText = '';

    if (mode === 'with_correction') {
      pageNote = `IMPORTANT : Le fichier PDF fourni contient à la fois les questions de l'examen et la correction officielle/grille de réponses.
- Les questions QCM à extraire se trouvent sur les pages ${pageFrom} à ${pageTo}.
- La grille de réponses correctes ou les pages de correction se trouvent sur les pages ${correctionPageFrom} à ${correctionPageTo}.

Tu dois :
1. Parcourir les questions se trouvant sur les pages ${pageFrom} à ${pageTo}.
2. Pour chaque question, trouver la réponse officielle correspondante sur les pages de correction/grille de réponses se trouvant sur les pages ${correctionPageFrom} à ${correctionPageTo}. Ne résous pas la question toi-même si elle est présente dans le corrigé, extrait strictement la réponse indiquée dans la grille ou le texte de correction (A, B, C, D ou E).
3. Remplir le champ "correct_answer" avec la lettre correspondante de la grille de correction.
4. Remplir le champ "astuce" en résumant l'explication/justification du corrigé officiel de la question pour aider l'élève à comprendre.
`;
      userPromptText = `${pageNote}\n\nExtrais toutes les questions en associant les réponses du corrigé et retourne le JSON demandé.`;
    } else {
      pageNote = totalPages && (pageFrom > 1 || pageTo < totalPages)
        ? `Concentre-toi uniquement sur les pages ${pageFrom} à ${pageTo} du document (ignore les autres).\n`
        : '';
      userPromptText = `${pageNote}Extrais TOUTES les questions QCM de ce document et retourne le JSON demandé.`;
    }

    // Create fresh AbortController for this request
    abortRef.current = new AbortController();
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      signal: abortRef.current.signal,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: claudeModel,
        max_tokens: 16000,
        stream: true,
        system: SYSTEM_PROMPT,
        messages: [{
          role: 'user',
          content: [
            { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64Pdf } },
            { type: 'text', text: userPromptText }
          ]
        }]
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = err?.error?.message || err?.message || JSON.stringify(err);
      throw new Error(`Erreur ${res.status}: ${msg}`);
    }

    // Read the SSE stream
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let accumulated = '';
    let charCount = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      // Parse SSE lines
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') break;
        try {
          const evt = JSON.parse(data);
          if (evt.type === 'content_block_delta' && evt.delta?.type === 'text_delta') {
            accumulated += evt.delta.text;
            charCount = accumulated.length;
            // Update progress with live stats
            const qCount = (accumulated.match(/"question_number"/g) || []).length;
            setProgress(`⚡ Réception en cours... ${qCount > 0 ? `${qCount} questions détectées` : ''} (${(charCount/1000).toFixed(1)}k caractères)`);
          }
        } catch { /* skip malformed SSE lines */ }
      }
    }

    // ── Robust multi-strategy JSON parser ──────────────────────────────
    const jsonMatch = accumulated.match(/\[[\s\S]*/);
    if (!jsonMatch) throw new Error('Aucune donnée JSON trouvée dans la réponse de Claude.');
    const rawJson = jsonMatch[0];

    // Preprocess LaTeX backslashes to avoid JavaScript string escape corruption (like \to -> tab, \frac -> form feed, \right -> carriage return)
    const sanitizeLatexJson = (str) => {
      if (!str) return str;
      let result = '';
      let i = 0;
      while (i < str.length) {
        if (str[i] === '\\') {
          const next = str[i + 1];
          if (next === '"') {
            result += '\\"';
            i += 2;
          } else if (next === '\\') {
            result += '\\\\';
            i += 2;
          } else if (next === 'n') {
            result += '\\n';
            i += 2;
          } else {
            result += '\\\\';
            i += 1;
          }
        } else {
          result += str[i];
          i += 1;
        }
      }
      return result;
    };

    const cleanJson = sanitizeLatexJson(rawJson);

    // Strategy 1: direct parse
    try { return JSON.parse(cleanJson); } catch { /* try next */ }

    // Strategy 2: truncation repair (remove incomplete last object)
    const repairTruncated = (str) => {
      const last = str.lastIndexOf('}');
      if (last === -1) throw new Error('JSON incomplet: aucun objet complet.');
      return str.slice(0, last + 1).replace(/,\s*$/, '') + ']';
    };
    try { return JSON.parse(repairTruncated(cleanJson)); } catch { /* try next */ }

    // Strategy 3: brace-tracking object-by-object extraction
    // Correctly handles LaTeX { } and quotes inside strings
    const extractObjects = (text) => {
      const results = [];
      let i = 0, depth = 0, objStart = -1;
      let inStr = false, esc = false;
      while (i < text.length) {
        const c = text[i];
        if (esc) { esc = false; }
        else if (c === '\\' && inStr) { esc = true; }
        else if (c === '"') { inStr = !inStr; }
        else if (!inStr) {
          if (c === '{') { if (depth++ === 0) objStart = i; }
          else if (c === '}') {
            if (--depth === 0 && objStart !== -1) {
              try { results.push(JSON.parse(text.slice(objStart, i + 1))); } catch { /* skip malformed */ }
              objStart = -1;
            }
          }
        }
        i++;
      }
      return results;
    };
    const extracted = extractObjects(cleanJson);
    if (extracted.length > 0) return extracted;

    // Strategy 4: sanitize control chars then re-parse
    const sanitized = cleanJson
      .replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, '') // strip control chars except \n
      .replace(/\n/g, '\\n')
      .replace(/,\s*([\]}])/g, '$1');
    try { return JSON.parse(sanitized); } catch { /* give up */ }
    try { return JSON.parse(repairTruncated(sanitized)); } catch { /* give up */ }

    throw new Error(`Erreur de parsing: réponse reçue (${rawJson.length} car.) mais JSON invalide. Réessayez.`);
  };

  const handleAnalyze = async () => {
    if (!apiKey) { setError('Clé API Claude manquante. Configurez-la dans Paramètres.'); return; }
    if (!apiKey.startsWith('sk-ant-')) {
      setError('⚠️ Clé invalide: doit commencer par "sk-ant-". Obtenez-la sur console.anthropic.com.');
      return;
    }
    if (!pdfFile) { setError('Veuillez sélectionner un PDF.'); return; }
    setError('');
    setLoading(true);

    // Start elapsed timer
    let elapsed = 0;
    timerRef.current = setInterval(() => {
      elapsed++;
      setProgress(prev => {
        // Only update timer part if we're still in initial phase
        if (prev.includes('Encodage') || prev.includes('Envoi')) {
          return `${prev.split('(')[0].trim()} (${elapsed}s)`;
        }
        return prev;
      });
    }, 1000);

    try {
      setProgress('Encodage du PDF...');
      const base64Pdf = await fileToBase64(pdfFile);

      setProgress('Envoi du PDF à Claude AI...');
      const parsed = await streamClaudeWithPdf(base64Pdf);

      clearInterval(timerRef.current);
      setProgress(`✓ Analyse terminée — ${parsed.length} questions extraites`);

      parsed.sort((a, b) => (a.question_number || 999) - (b.question_number || 999));

      const qs = parsed.map((q, i) => ({
        id: Math.random().toString(36).substr(2, 9),
        question_number: q.question_number || (i + 1),
        context: q.context || '',
        subject: q.subject || 'Général',
        question: q.question || '',
        options: Array.isArray(q.options) ? q.options : [],
        correct_answer: q.correct_answer || 'A',
        astuce: q.astuce || '',
        trick: q.trick || ''
      }));

      setQuestions(qs);
      setPhase(2);
    } catch (e) {
      clearInterval(timerRef.current);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };



  const updateQuestion = (idx, field, value) => {
    setQuestions(qs => qs.map((q, i) => i === idx ? { ...q, [field]: value } : q));
  };

  const deleteQuestion = (idx) => {
    setQuestions(qs => qs.filter((_, i) => i !== idx));
  };

  const addEmptyQuestion = () => {
    const nextNum = questions.length > 0 ? Math.max(...questions.map(q => q.question_number || 0)) + 1 : 1;
    setQuestions(qs => [...qs, {
      id: Math.random().toString(36).substr(2, 9),
      question_number: nextNum,
      context: '', subject: 'Général',
      question: '', options: ['A) ', 'B) ', 'C) ', 'D) '],
      correct_answer: 'A', astuce: '', trick: ''
    }]);
  };

  const handlePublish = () => {
    if (!examName.trim()) { setError('Entrez un titre pour cet examen.'); return; }
    const formatted = questions.map(q => ({
      id: q.id,
      question_number: q.question_number,
      topic: q.subject,
      context: q.context || null,
      question: q.question,
      options: q.options.map((opt, i) => {
        const letter = ['A','B','C','D','E'][i] || String.fromCharCode(65 + i);
        const text = opt.replace(/^[A-E]\)\s*/, '');
        return { id: letter, text };
      }),
      correct_answer: q.correct_answer,
      astuce: q.astuce,
      trick: q.trick || null
    }));
    addExam(examName, school, year, tier, formatted, null);
    setPhase(3);
  };

  if (phase === 3) return (
    <div className="animate-fade-in" style={{ maxWidth: 600, margin: '4rem auto', textAlign: 'center' }}>
      <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg,var(--emerald),#34d399)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', boxShadow: '0 0 40px rgba(16,185,129,0.4)' }}>
        <CheckCircle2 size={40} color="#fff" />
      </div>
      <h1 style={{ marginBottom: '0.5rem' }}>Examen Publié ! 🚀</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>{questions.length} questions ajoutées à la bibliothèque.</p>
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <button className="btn" onClick={() => { setPhase(1); setPdfFile(null); setPdfName(''); setQuestions([]); setExamName(''); }}>
          <Plus size={18} /> Nouveau Import
        </button>
        <button className="btn" style={{ background: 'var(--bg-glass)', color: 'var(--text-main)' }} onClick={() => navigate('/admin/exams')}>
          Voir la bibliothèque
        </button>
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in" style={{ maxWidth: 960, margin: '0 auto' }}>
      {/* ── Page Header ── */}
      <header style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
              <div style={{ width: 40, height: 40, borderRadius: '12px', background: 'linear-gradient(135deg, var(--violet), var(--emerald))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={22} color="#fff" />
              </div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>Générateur de Contenu IA</h1>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: 0 }}>PDF → Analyse IA → Révision → Publication en 1 clic</p>
          </div>
        </div>

        {/* Phase indicator */}
        <div style={{ display: 'flex', gap: '0', marginTop: '1.5rem' }}>
          {[['1','Analyse PDF'],['2','Révision'],['3','Publication']].map(([n,label], i) => (
            <div key={n} style={{ flex: 1, textAlign: 'center', position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.6rem 1rem', borderRadius: i === 0 ? '10px 0 0 10px' : i === 2 ? '0 10px 10px 0' : 0, background: phase === i+1 ? 'linear-gradient(135deg,#7c3aed,#6366f1)' : phase > i+1 ? 'rgba(16,185,129,0.2)' : 'var(--bg-glass)', border: '1px solid', borderColor: phase === i+1 ? '#7c3aed' : phase > i+1 ? 'var(--emerald)' : 'var(--border)', transition: 'all 0.3s' }}>
                <span style={{ fontWeight: 900, fontSize: '0.85rem', color: phase === i+1 ? '#fff' : phase > i+1 ? 'var(--emerald)' : 'var(--text-muted)' }}>{phase > i+1 ? '✓' : n}</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: phase === i+1 ? '#fff' : 'var(--text-muted)', display: window.innerWidth < 500 ? 'none' : 'inline' }}>{label}</span>
              </div>
            </div>
          ))}
        </div>
      </header>

      {/* ── PHASE 1: Setup ── */}
      {phase === 1 && (
        <div className="glass-panel animate-fade-in" style={{ padding: '2rem' }}>

          {/* Draft recovery banner */}
          {questions.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', padding: '1rem 1.25rem', borderRadius: 12, background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.25)', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontSize: '1.2rem' }}>💾</span>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem', color: 'var(--violet)' }}>Session sauvegardée</p>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>{questions.length} questions prêtes pour révision{examName ? ` — "${examName}"` : ''}</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => setPhase(2)} style={{ padding: '0.5rem 1rem', borderRadius: 8, background: 'linear-gradient(135deg,#7c3aed,#6366f1)', border: 'none', color: '#fff', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>
                  Reprendre la révision →
                </button>
                <button onClick={clearDraft} style={{ padding: '0.5rem 0.75rem', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--danger)', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}>
                  Effacer
                </button>
              </div>
            </div>
          )}

          {!apiKey && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 1.25rem', borderRadius: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', marginBottom: '1.5rem' }}>
              <AlertCircle size={20} color="var(--danger)" />
              <div>
                <p style={{ margin: 0, fontWeight: 700, color: 'var(--danger)', fontSize: '0.9rem' }}>Clé API Claude manquante</p>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Allez dans <strong>Paramètres</strong> pour configurer votre clé Anthropic.</p>
              </div>
            </div>
          )}

          {/* PDF Upload */}
          <div className="input-group" style={{ marginBottom: '1.5rem' }}>
            <label>Fichier PDF (Sujet de concours)</label>
            <label className="upload-zone" style={{ cursor: 'pointer', minHeight: 160 }} onClick={() => fileRef.current?.click()}>
              <input ref={fileRef} type="file" accept=".pdf" onChange={handlePdfSelect} style={{ display: 'none' }} />
              {!pdfFile ? (
                <>
                  <UploadCloud size={36} style={{ marginBottom: '0.75rem', color: 'var(--violet)' }} />
                  <p style={{ fontWeight: 700 }}>Cliquez pour choisir un PDF</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sujets de concours, annales, examens...</p>
                </>
              ) : (
                <div className="text-violet">
                  <CheckCircle2 size={36} style={{ margin: '0 auto 0.5rem' }} />
                  <p style={{ fontWeight: 800 }}>{pdfName}</p>
                  {totalPages && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{totalPages} pages détectées</p>}
                </div>
              )}
            </label>
          </div>

          {/* Mode Selector */}
          {totalPages && (
            <div className="input-group" style={{ marginBottom: '1.5rem' }}>
              <label>Mode d'extraction</label>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
                <button
                  type="button"
                  onClick={() => setMode('simple')}
                  style={{
                    flex: 1,
                    padding: '0.6rem 1rem',
                    borderRadius: '10px',
                    border: '1px solid',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    borderColor: mode === 'simple' ? 'var(--violet)' : 'var(--border)',
                    background: mode === 'simple' ? 'rgba(124,58,237,0.12)' : 'var(--bg-glass)',
                    color: mode === 'simple' ? 'var(--violet)' : 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <span>🧠</span>
                  Mode Simple (L'IA résout)
                </button>
                <button
                  type="button"
                  onClick={() => setMode('with_correction')}
                  style={{
                    flex: 1,
                    padding: '0.6rem 1rem',
                    borderRadius: '10px',
                    border: '1px solid',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    borderColor: mode === 'with_correction' ? 'var(--emerald)' : 'var(--border)',
                    background: mode === 'with_correction' ? 'rgba(16,185,129,0.12)' : 'var(--bg-glass)',
                    color: mode === 'with_correction' ? 'var(--emerald)' : 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <span>🎯</span>
                  Avec Grille/Corrigé (Depuis le fichier)
                </button>
              </div>
            </div>
          )}

          {/* Page range */}
          {totalPages && (
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 300px', display: 'flex', gap: '1rem' }}>
                <div className="input-group" style={{ flex: 1 }}>
                  <label>Pages questions (Début)</label>
                  <input type="number" className="input-control" min={1} max={totalPages} value={pageFrom} onChange={e => setPageFrom(+e.target.value)} />
                </div>
                <div className="input-group" style={{ flex: 1 }}>
                  <label>Pages questions (Fin)</label>
                  <input type="number" className="input-control" min={1} max={totalPages} value={pageTo} onChange={e => setPageTo(+e.target.value)} />
                </div>
              </div>
              
              {mode === 'with_correction' ? (
                <div style={{ flex: '1 1 300px', display: 'flex', gap: '1rem' }}>
                  <div className="input-group" style={{ flex: 1 }}>
                    <label style={{ color: 'var(--emerald)', fontWeight: 700 }}>Pages corrigé (Début)</label>
                    <input type="number" className="input-control" style={{ borderColor: 'rgba(16,185,129,0.4)' }} min={1} max={totalPages} value={correctionPageFrom} onChange={e => setCorrectionPageFrom(+e.target.value)} />
                  </div>
                  <div className="input-group" style={{ flex: 1 }}>
                    <label style={{ color: 'var(--emerald)', fontWeight: 700 }}>Pages corrigé (Fin)</label>
                    <input type="number" className="input-control" style={{ borderColor: 'rgba(16,185,129,0.4)' }} min={1} max={totalPages} value={correctionPageTo} onChange={e => setCorrectionPageTo(+e.target.value)} />
                  </div>
                </div>
              ) : (
                <div style={{ flex: 2, minWidth: '250px', padding: '0.5rem 1rem', borderRadius: 10, background: 'var(--bg-glass)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', fontSize: '0.82rem', color: 'var(--text-muted)', gap: '0.4rem' }}>
                  💡 Sélectionnez uniquement les pages des questions pour réduire le coût API.
                </div>
              )}
            </div>
          )}

          {/* Exam metadata */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="input-group">
              <label>École cible</label>
              <select className="input-control" value={school} onChange={e => setSchool(e.target.value)}>
                {schools.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label>Année</label>
              <select className="input-control" value={year} onChange={e => setYear(e.target.value)}>
                {['2025','2024','2023','2022','2021','2020','Anciennes'].map(y => <option key={y}>{y}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label>Accès</label>
              <select className="input-control" value={tier} onChange={e => setTier(e.target.value)}>
                <option value="freemium">Gratuit</option>
                <option value="premium">Premium</option>
              </select>
            </div>
          </div>

          {/* Model selector */}
          <div className="input-group" style={{ marginBottom: '1.5rem' }}>
            <label>Modèle Claude <span style={{fontWeight:400, color:'var(--text-muted)'}}>— ID exact de l'API</span></label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
              {['claude-opus-4-5','claude-sonnet-4-5','claude-haiku-4-5','claude-3-5-sonnet-20241022','claude-3-haiku-20240307'].map(m => (
                <button key={m} type="button"
                  onClick={() => { setClaudeModel(m); localStorage.setItem('claudeModel', m); }}
                  style={{ padding: '0.3rem 0.65rem', borderRadius: 8, border: '1px solid', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                    borderColor: claudeModel === m ? 'var(--violet)' : 'var(--border)',
                    background: claudeModel === m ? 'rgba(124,58,237,0.15)' : 'var(--bg-glass)',
                    color: claudeModel === m ? 'var(--violet)' : 'var(--text-muted)'
                  }}>{m}</button>
              ))}
            </div>
            <input
              type="text"
              className="input-control"
              value={claudeModel}
              onChange={e => { setClaudeModel(e.target.value); localStorage.setItem('claudeModel', e.target.value); }}
              placeholder="ex: claude-opus-4-5"
              style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
            />
            <p style={{ marginTop: '0.4rem', fontSize: '0.73rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              💡 Vérifiez les IDs disponibles sur{' '}
              <a href="https://console.anthropic.com" target="_blank" rel="noreferrer" className="text-violet">console.anthropic.com</a>{' '}
              → Models. La clé API doit venir de <strong>console.anthropic.com</strong> (≠ claude.ai).
            </p>
          </div>

          <div className="input-group" style={{ marginBottom: '1.5rem' }}>
            <label>Titre de l'examen (affiché aux élèves)</label>
            <input type="text" className="input-control" placeholder="Ex: Concours Médecine Oujda 2024" value={examName} onChange={e => setExamName(e.target.value)} />
          </div>

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.9rem 1.1rem', borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', marginBottom: '1.5rem', color: 'var(--danger)', fontSize: '0.85rem' }}>
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {loading ? (
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'stretch' }}>
              <button
                className="btn"
                disabled
                style={{ flex: 1, padding: '1.1rem', fontSize: '1rem', justifyContent: 'center', background: 'linear-gradient(135deg,#7c3aed,#6366f1)', boxShadow: '0 8px 24px rgba(124,58,237,0.35)', opacity: 0.85 }}
              >
                <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> {progress || 'Traitement...'}
              </button>
              <button
                onClick={() => { abortRef.current?.abort(); clearInterval(timerRef.current); setLoading(false); setProgress(''); setError('Analyse annulée.'); }}
                style={{ padding: '0 1.1rem', borderRadius: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--danger)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                title="Arrêter l'analyse"
              >
                <StopCircle size={18} /> Arrêter
              </button>
            </div>
          ) : (
            <button
              className="btn"
              onClick={handleAnalyze}
              disabled={!pdfFile || !apiKey}
              style={{ width: '100%', padding: '1.1rem', fontSize: '1rem', justifyContent: 'center', background: 'linear-gradient(135deg,#7c3aed,#6366f1)', boxShadow: '0 8px 24px rgba(124,58,237,0.35)' }}
            >
              <Sparkles size={20} /> Analyser avec Claude AI ✨
            </button>
          )}
        </div>
      )}

      {/* ── PHASE 2: Review Grid ── */}
      {phase === 2 && (
        <div className="animate-fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h2 style={{ margin: 0 }}>👀 Révision — {questions.length} questions extraites</h2>
              <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Cliquez sur une cellule pour modifier. Vérifiez les réponses correctes.</p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={addEmptyQuestion} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1rem', borderRadius: 10, background: 'var(--bg-glass)', border: '1px solid var(--border)', color: 'var(--text-main)', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
                <Plus size={16} /> Ajouter
              </button>
              <button onClick={() => setPhase(1)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1rem', borderRadius: 10, background: 'var(--bg-glass)', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem' }}>
                ← Retour
              </button>
            </div>
          </div>

          {error && (
            <div style={{ padding: '0.8rem 1rem', borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', marginBottom: '1rem', color: 'var(--danger)', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}

          {/* Editable table */}
          <div style={{ borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden', background: 'var(--bg-card)', marginBottom: '1.5rem' }}>
            <div style={{ overflowX: 'auto', maxHeight: '60vh', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 2, background: 'var(--bg-card)' }}>
                  <tr style={{ borderBottom: '2px solid var(--border)' }}>
                    {['N°', 'Sujet', 'Question', 'Options (A→D)', 'Rép.', 'Astuce', ''].map((h, i) => (
                      <th key={i} style={{ padding: '0.875rem 0.75rem', textAlign: 'left', fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {questions.map((q, idx) => (
                    <tr key={q.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }} onMouseEnter={e => e.currentTarget.style.background='rgba(124,58,237,0.04)'} onMouseLeave={e => e.currentTarget.style.background=''}>
                      <td style={{ padding: '0.5rem', minWidth: 52 }}>
                        <input
                          type="number" min={1}
                          value={q.question_number}
                          onChange={e => updateQuestion(idx, 'question_number', +e.target.value)}
                          style={{ width: 48, background: 'linear-gradient(135deg,rgba(124,58,237,0.15),rgba(99,102,241,0.1))', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 8, padding: '0.3rem 0.4rem', color: 'var(--violet)', fontWeight: 900, fontSize: '0.9rem', textAlign: 'center' }}
                        />
                      </td>
                      <td style={{ padding: '0.5rem' }}>
                        <input value={q.subject} onChange={e => updateQuestion(idx, 'subject', e.target.value)}
                          style={{ width: '100%', minWidth: 90, background: 'var(--bg-glass)', border: '1px solid transparent', borderRadius: 6, padding: '0.3rem 0.5rem', color: 'var(--text-main)', fontSize: '0.78rem', fontWeight: 600 }}
                          onFocus={e => e.target.style.borderColor='var(--violet)'} onBlur={e => e.target.style.borderColor='transparent'} />
                      </td>
                      <td style={{ padding: '0.5rem', minWidth: 220 }}>
                        <textarea value={q.question} onChange={e => updateQuestion(idx, 'question', e.target.value)} rows={2}
                          style={{ width: '100%', background: 'var(--bg-glass)', border: '1px solid transparent', borderRadius: 6, padding: '0.3rem 0.5rem', color: 'var(--text-main)', fontSize: '0.78rem', resize: 'vertical', fontFamily: 'inherit' }}
                          onFocus={e => e.target.style.borderColor='var(--violet)'} onBlur={e => e.target.style.borderColor='transparent'} />
                      </td>
                      <td style={{ padding: '0.5rem', minWidth: 200 }}>
                        {(q.options || []).map((opt, oi) => (
                          <input key={oi} value={opt} onChange={e => {
                            const newOpts = [...q.options]; newOpts[oi] = e.target.value; updateQuestion(idx, 'options', newOpts);
                          }}
                            style={{ display: 'block', width: '100%', marginBottom: 2, background: 'var(--bg-glass)', border: '1px solid transparent', borderRadius: 6, padding: '0.25rem 0.5rem', color: 'var(--text-main)', fontSize: '0.75rem' }}
                            onFocus={e => e.target.style.borderColor='var(--violet)'} onBlur={e => e.target.style.borderColor='transparent'} />
                        ))}
                      </td>
                      <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                        <select value={q.correct_answer} onChange={e => updateQuestion(idx, 'correct_answer', e.target.value)}
                          style={{ background: 'linear-gradient(135deg,rgba(16,185,129,0.15),rgba(16,185,129,0.08))', border: '1px solid var(--emerald)', borderRadius: 8, padding: '0.3rem 0.5rem', color: 'var(--emerald)', fontWeight: 900, fontSize: '0.9rem', cursor: 'pointer' }}>
                          {['A','B','C','D'].map(l => <option key={l}>{l}</option>)}
                        </select>
                      </td>
                      <td style={{ padding: '0.5rem', minWidth: 180 }}>
                        <textarea value={q.astuce} onChange={e => updateQuestion(idx, 'astuce', e.target.value)} rows={2}
                          style={{ width: '100%', background: 'var(--bg-glass)', border: '1px solid transparent', borderRadius: 6, padding: '0.3rem 0.5rem', color: 'var(--text-main)', fontSize: '0.75rem', resize: 'vertical', fontFamily: 'inherit' }}
                          onFocus={e => e.target.style.borderColor='var(--violet)'} onBlur={e => e.target.style.borderColor='transparent'} />
                      </td>
                      <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                        <button onClick={() => deleteQuestion(idx)} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', color: 'var(--danger)', borderRadius: 8, padding: '0.4rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Publish bar */}
          <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 2, minWidth: 200 }}>
              <input type="text" className="input-control" placeholder="Titre de l'examen (ex: Concours Médecine Fès 2024)" value={examName} onChange={e => { setExamName(e.target.value); setError(''); }} style={{ fontSize: '0.95rem', fontWeight: 600 }} />
            </div>
            {/* PDF buttons */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => openPrintWindow(generateSubjectHTML(examName || 'Examen', school, year, questions), 'sujet')}
                disabled={!examName.trim()}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.75rem 1rem', borderRadius: 10, background: 'rgba(30,86,219,0.12)', border: '1px solid rgba(30,86,219,0.3)', color: '#1a56db', fontWeight: 700, fontSize: '0.83rem', cursor: 'pointer', whiteSpace: 'nowrap' }}
                title="Télécharger le sujet blanc (impression)"
              >
                <FileText size={16} /> Sujet PDF
              </button>
              <button
                onClick={() => openPrintWindow(generateCorrectionHTML(examName || 'Examen', school, year, questions), 'corrigé')}
                disabled={!examName.trim()}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.75rem 1rem', borderRadius: 10, background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.3)', color: 'var(--violet)', fontWeight: 700, fontSize: '0.83rem', cursor: 'pointer', whiteSpace: 'nowrap' }}
                title="Télécharger le corrigé détaillé"
              >
                <FileText size={16} /> Corrigé PDF
              </button>
            </div>
            <button
              className="btn"
              onClick={handlePublish}
              style={{ flex: 1, minWidth: 180, padding: '0.9rem 1.5rem', justifyContent: 'center', background: 'linear-gradient(135deg,var(--emerald),#34d399)', boxShadow: '0 8px 24px rgba(16,185,129,0.35)', fontSize: '0.95rem' }}
            >
              <Send size={18} /> Valider et Publier 🚀
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
