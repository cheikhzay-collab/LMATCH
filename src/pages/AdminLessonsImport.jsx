import { useState, useRef, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  UploadCloud, Sparkles, Loader2, CheckCircle2, 
  Trash2, Plus, ArrowLeft, AlertCircle, Save 
} from 'lucide-react';
import { addLesson } from '../services/lessonService';
import { SafeInlineMath } from '../utils/mathRenderer';

// Attempt to repair a truncated JSON string by closing all open structures
const repairTruncatedJson = (str) => {
  if (!str) return str;
  let s = str.trim();
  // Remove trailing comma before closing
  s = s.replace(/,\s*$/, '');
  // Count open braces and brackets
  const stack = [];
  let inString = false;
  let escaped = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (escaped) { escaped = false; continue; }
    if (c === '\\' && inString) { escaped = true; continue; }
    if (c === '"') { inString = !inString; continue; }
    if (!inString) {
      if (c === '{') stack.push('}');
      else if (c === '[') stack.push(']');
      else if (c === '}' || c === ']') stack.pop();
    }
  }
  // If we're inside an unclosed string, close it first
  if (inString) s += '"';
  // Close all open structures in reverse order
  while (stack.length > 0) s += stack.pop();
  return s;
};

// Preprocess LaTeX backslashes to avoid JavaScript string escape issues
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
        // Check if it's a LaTeX command starting with \n
        const rest = str.slice(i + 2, i + 12);
        if (/^(u|eq|eg|earrow|abla|onumber|ewline)([^a-zA-Z]|$)/.test(rest)) {
          result += '\\\\';
          i += 1;
        } else {
          result += '\\n';
          i += 2;
        }
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

// Escape literal newlines inside JSON string values to prevent JSON.parse syntax errors
const escapeLiteralNewlinesInJson = (str) => {
  let inString = false;
  let escaped = false;
  let result = '';
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (escaped) {
      result += char;
      escaped = false;
      continue;
    }
    if (char === '\\') {
      result += char;
      escaped = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      result += char;
      continue;
    }
    if (inString && (char === '\n' || char === '\r')) {
      if (char === '\n') {
        result += '\\n';
      }
      continue;
    }
    result += char;
  }
  return result;
};

// Extract JSON object/array from a string that may contain markdown fences or leading text
const extractJsonFromText = (str) => {
  if (!str) return str;
  // Strip markdown code fences
  let s = str.trim();
  s = s.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  // Find the first { or [ that starts a JSON structure
  const firstBrace = s.indexOf('{');
  const firstBracket = s.indexOf('[');
  let start = -1;
  if (firstBrace === -1 && firstBracket === -1) return s;
  if (firstBrace === -1) start = firstBracket;
  else if (firstBracket === -1) start = firstBrace;
  else start = Math.min(firstBrace, firstBracket);
  // Find the matching closing character
  const openChar = s[start];
  const closeChar = openChar === '{' ? '}' : ']';
  let depth = 0;
  let inString = false;
  let escaped = false;
  let end = -1;
  for (let i = start; i < s.length; i++) {
    const c = s[i];
    if (escaped) { escaped = false; continue; }
    if (c === '\\' && inString) { escaped = true; continue; }
    if (c === '"') { inString = !inString; continue; }
    if (!inString) {
      if (c === openChar) depth++;
      else if (c === closeChar) {
        depth--;
        if (depth === 0) { end = i; break; }
      }
    }
  }
  if (end !== -1) return s.slice(start, end + 1);
  // No complete JSON found — return from start to end (will need repair)
  return s.slice(start);
};

// Convert file to base64 string
const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result.split(',')[1]);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

const SYSTEM_PROMPT = `Tu es un Professeur Agrégé de mathématiques et physique, spécialiste du Baccalauréat Marocain (Sciences Mathématiques A/B, PC, SVT) et des Concours post-bac Marocains (ENSA, APESA, FMP, UM6P, etc.).
Tu analyses des fiches de cours, résumés, ou fiches de TD fournies en PDF ou image.
Ton but est de faire une extraction d'une fidélité absolue et intégrale de tout le contenu théorique (définitions, théorèmes, notations, formules) et de tous les exercices avec leurs solutions ultra-détaillées sous forme d'un objet JSON structuré.

CRITÈRES ET EXIGENCES DU BACCALAURÉAT MAROCAIN (CONSIGNES DE L'INSPECTEUR ET DE L'ENSEIGNANT MAROCAIN) :
1. TERMINOLOGIE ET NOTATIONS OFFICIELLES :
   - Respecte scrupuleusement la notation et le formalisme en vigueur dans les manuels officiels marocains (notamment "Al Moufid" ou "Fi Rihab").
   - Utilise les notations standard de l'inspection marocaine : ensembles de nombres (ex: $\\mathbb{R}^*$, $\\mathbb{R}_+$), intervalles de définitions clairs, et domaines d'études explicites.
   - Les limites doivent utiliser la notation réglementaire marocaine (ex: $\\lim_{x \\to 0^+}$ ou $\\lim_{\\substack{x \\to 0 \\\\ x > 0}}$) et toutes les justifications doivent s'appuyer sur les limites usuelles du programme.
   - Évite les abus d'écriture non tolérés par les commissions de correction du Baccalauréat National.
2. LIMITATION ET CONTEXTE DU PROGRAMME DE MATHS DU BAC MAROCAIN :
   - Les résolutions et démonstrations doivent rester STRICTEMENT dans les limites des outils pédagogiques autorisés au Bac Marocain.
   - Les développements limités (DL) et la formule de Taylor-Young sont STRICTEMENT HORS-PROGRAMME au Baccalauréat marocain ; il est formellement INTERDIT de les utiliser dans les démonstrations et solutions des fiches de cours. À la place, utilise les limites usuelles de référence, la factorisation par le terme prépondérant, le taux d'accroissement (dérivabilité), ou les encadrements (théorème des gendarmes).
   - Privilégie les démonstrations par encadrement, les limites de référence, la continuité, le théorème des valeurs intermédiaires (TVI), et les formules de dérivation autorisées.
3. RATIONNEL ET DÉTAILS PÉDAGOGIQUES (Qualité de rédaction) :
   - Rédige les démonstrations dans un français parfait (style BIOF marocain) avec toutes les étapes de calcul intermédiaires pour aider l'élève à reproduire la démarche lors de l'examen national.
   - Justifie chaque transition de calcul (ex: "car $\\lim_{x \\to 0} \\frac{e^x-1}{x} = 1$").

Voici le schéma JSON strict que tu dois retourner :
{
  "header": {
    "prep_title": "Titre général de préparation (ex: Préparation aux concours)",
    "schools": ["Liste des écoles cibles mentionnées, ex: ENSA, UM6P"],
    "subject": "Matière ou Chapitre global (ex: Algèbre, Analyse, Physique)",
    "fiche_title": "Titre précis de la fiche (ex: Fiche 01 : Arithmétique)",
    "teacher": "Nom du professeur si présent",
    "phone": "Numéro de téléphone si présent"
  },
  "sections": [
    {
      "id": "Chaîne unique, ex: sec-1",
      "title": "Titre de la sous-section (ex: Généralités sur les suites)",
      "type": "content",
      "section_number": "Index ou N° de section (ex: 1)",
      "section_header": "Nom de la section globale (ex: Résumé : Suites Numériques). Remplis-le uniquement sur le premier bloc de cette section, laisse-le vide pour les blocs suivants de la même section.",
      "accent_text": "Optionnel: Sous-titre vert d'accent (ex: Définitions-Notations-Vocabulaire)",
      "items": [
        {
          "type": "text", // "text", "bullet", "highlight_box", "notation_grid", "table"
          "text": "Contenu textuel si type 'text', 'bullet' ou 'highlight_box'. Rédige les formules mathématiques en LaTeX complet délimité par $ pour les formules en ligne, et $$ pour les formules en bloc (ex: $u_n = u_p + (n-p)r$).",
          "notation_columns": [ // Requis uniquement pour type "notation_grid"
            {
              "title": "Titre de la colonne (ex: • Notation fonctionnelle)",
              "math_blocks": ["Blocs de formules LaTeX, ex: u : E \\rightarrow \\mathbb{R}", "n \\mapsto u(n)"]
            }
          ],
          "table_data": { // Requis uniquement pour type "table"
            "headers": ["En-têtes de colonnes, ex: Concept", "une suite arithmétique", "une suite géométrique"],
            "rows": [
              ["Définition", "(\\forall n \\ge n_0) : U_{n+1} = U_n + r", "(\\forall n \\ge n_0) : U_{n+1} = qU_n"],
              ["Terme général", "(\\forall n \\ge n_0) : U_n = U_p + (n-p)r", "(\\forall n \\ge n_0) : U_n = U_p \\times q^{n-p}"]
            ]
          }
        }
      ]
    },
    {
      "id": "Chaîne unique, ex: ex-1",
      "title": "Titre de l'exercice (ex: Exercice N° 1)",
      "type": "exercise",
      "section_number": "Index ou N° de section (ex: 2)",
      "section_header": "Nom de la section globale (ex: Problème)",
      "content": "Texte complet de l'énoncé de l'exercice avec LaTeX pour les formules.",
      "solution": "Solution rédigée étape par étape de manière très claire, rigoureuse et extrêmement détaillée avec LaTeX.",
      "interactive_answers": [
        {
          "question_idx": 1,
          "label": "Libellé de la question interactive (ex: u_1 =)",
          "expected_answer": "La réponse exacte attendue, simple (ex: 3 ou 7/3)"
        }
      ]
    }
  ]
}

Exigences d'extraction intégrale :
1. ABSOLUMENT TOUT EXTRAIRE : Ne résume JAMAIS, n'omets aucun détail, formule, notation ou exemple du document. Si le document contient des tableaux comparatifs, extrais-les avec le type 'table'. Si le document contient des notations en colonnes, extrais-les avec le type 'notation_grid'.
2. LATEX PARFAIT : Utilise LaTeX délimité par $ pour toutes les formules mathématiques en ligne, et $$ pour les formules complexes en bloc. Veille à ce que les backslashes de LaTeX (ex: \\frac, \\lim, \\mathbb{N}) soient correctement doublés dans les chaînes JSON (ex: "\\\\frac{a}{b}").
3. SOLUTIONS DÉTAILLÉES : Résous chaque exercice de manière exhaustive en fournissant toutes les étapes de calcul et de démonstration mathématique.
4. QUESTIONS INTERACTIVES : Pour chaque exercice, crée au moins un champ interactif dans "interactive_answers" permettant à l'élève de saisir sa réponse (ex: la valeur calculée d'un terme).
5. FORMAT STRICT : Retourne uniquement le JSON brut. Pas de balise de code markdown (\`\`\`json ... \`\`\`), pas de texte d'introduction ni de conclusion.
`;

export default function AdminLessonsImport() {
  const { schools, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  if (!authLoading && user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const fileInputRef = useRef();

  // Setup state
  const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem('geminiApiKey') || '');
  const [geminiModel, setGeminiModel] = useState(() => localStorage.getItem('geminiModel') || 'gemini-3.5-flash');
  
  const [uploadFile, setUploadFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);

  // Form State for editing the parsed result
  const [phase, setPhase] = useState(1); // 1 = Upload & Parse, 2 = Review & Edit
  const [ficheTitle, setFicheTitle] = useState('');
  const [subject, setSubject] = useState('Algèbre');
  const [chapterNumber, setChapterNumber] = useState('');
  const [teacher, setTeacher] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedSchools, setSelectedSchools] = useState([]);
  const [sections, setSections] = useState([]);
  const [prepTitle, setPrepTitle] = useState('Préparation aux concours');

  // Load API key from settings if updated
  useEffect(() => {
    const sync = () => {
      setGeminiKey(localStorage.getItem('geminiApiKey') || '');
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadFile(file);
    setFileName(file.name);
    setError('');
  };

  const handleAnalyze = async () => {
    if (!geminiKey) {
      setError('Clé API Gemini manquante. Veuillez la configurer dans les Paramètres.');
      return;
    }
    if (!uploadFile) {
      setError('Veuillez sélectionner un fichier PDF ou une image.');
      return;
    }

    setLoading(true);
    setError('');
    setProgress('Préparation du fichier...');
    setProgressPercent(5);

    let progressInterval = setInterval(() => {
      setProgressPercent(prev => {
        if (prev < 30) {
          setProgress('Lecture et encodage du document...');
          return prev + 5;
        } else if (prev < 65) {
          setProgress('Envoi à Gemini AI & traitement des images...');
          return prev + 3;
        } else if (prev < 92) {
          setProgress('Génération de la fiche structurée LaTeX...');
          return prev + 1;
        }
        return prev;
      });
    }, 800);

    try {
      const base64Data = await fileToBase64(uploadFile);
      setProgress('Envoi du fichier à Gemini AI...');

      const modelToUse = geminiModel || 'gemini-3.5-flash';
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelToUse}:generateContent?key=${geminiKey}`;
      
      const payload = {
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType: uploadFile.type,
                  data: base64Data
                }
              },
              {
                text: "Transcris et extrais l'intégralité absolue de ce document. Analyse chaque paragraphe, formule et exercice. Ne résume rien, ne laisse aucun élément de côté, et génère le JSON complet selon le schéma exigé."
              }
            ]
          }
        ],
        systemInstruction: {
          parts: [{ text: SYSTEM_PROMPT }]
        },
        generationConfig: {
          responseMimeType: "application/json",
          maxOutputTokens: 65536,
          temperature: 0.1
        }
      };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message || `Erreur HTTP ${res.status}`);
      }

      const data = await res.json();
      const candidate = data?.candidates?.[0];
      const rawText = candidate?.content?.parts?.[0]?.text;
      const finishReason = candidate?.finishReason;

      if (!rawText) {
        throw new Error("L'API Gemini n'a retourné aucun contenu.");
      }

      // Warn if truncated due to token limit
      if (finishReason === 'MAX_TOKENS') {
        console.warn('[Gemini] Response was truncated (MAX_TOKENS). Attempting JSON repair...');
        setProgress('Réponse tronquée — réparation du JSON en cours...');
      }

      let parsed;
      // Try 1: Extract JSON block + direct parse
      try {
        const extracted = extractJsonFromText(rawText);
        parsed = JSON.parse(extracted);
      } catch (firstErr) {
        console.warn('[JSON Parse] Step 1 failed, trying repair...', firstErr.message);
        // Try 2: Extract + escape newlines + parse
        try {
          const extracted = extractJsonFromText(rawText);
          const escaped = escapeLiteralNewlinesInJson(extracted);
          parsed = JSON.parse(escaped);
        } catch (secondErr) {
          // Try 3: Extract + repair truncated structure + parse
          try {
            const extracted = extractJsonFromText(rawText);
            const escaped = escapeLiteralNewlinesInJson(extracted);
            const repaired = repairTruncatedJson(escaped);
            parsed = JSON.parse(repaired);
            if (finishReason === 'MAX_TOKENS') {
              setProgress('⚠️ Contenu partiel récupéré — le document était trop long.');
            }
          } catch (thirdErr) {
            // Try 4: Full sanitize pipeline
            try {
              const sanitized = sanitizeLatexJson(rawText.trim());
              const escaped = escapeLiteralNewlinesInJson(sanitized);
              const repaired = repairTruncatedJson(escaped);
              parsed = JSON.parse(repaired);
            } catch (fourthErr) {
              console.error('[JSON Parse] All strategies failed.', { firstErr, secondErr, thirdErr, fourthErr });
              console.error('[Raw response preview]:', rawText.slice(0, 500));
              throw new Error(
                `Impossible de lire la réponse JSON de Gemini.\n` +
                `Erreur : ${firstErr.message}\n\n` +
                `💡 Solutions :\n` +
                `• Essayez Gemini 1.5 Pro (plus stable pour les longs documents)\n` +
                `• Découpez le document en sections plus courtes\n` +
                `• Vérifiez votre clé API Gemini dans les Paramètres`
              );
            }
          }
        }
      }

      console.log('[Gemini Extraction Response]:', parsed);

      // Populate form state
      setFicheTitle(parsed.header.fiche_title || '');
      setSubject(parsed.header.subject || 'Algèbre');
      setPrepTitle(parsed.header.prep_title || 'Préparation aux concours');
      setTeacher(parsed.header.teacher || '');
      setPhone(parsed.header.phone || '');
      setSelectedSchools(parsed.header.schools || []);
      setSections(parsed.sections || []);
      
      // Auto-extract chapter number from title (e.g. "Fiche 01" -> "01")
      const numMatch = (parsed.header.fiche_title || '').match(/Fiche\s*(\d+)/i);
      if (numMatch) setChapterNumber(numMatch[1]);

      clearInterval(progressInterval);
      setProgressPercent(100);
      setProgress('Analyse terminée !');
      
      setTimeout(() => {
        setPhase(2);
        setLoading(false);
      }, 500);
    } catch (e) {
      clearInterval(progressInterval);
      setProgressPercent(0);
      setLoading(false);
      console.error(e);
      setError(`Erreur lors de l'extraction : ${e.message}`);
    }
  };

  // State modifiers
  const handleAddSection = (type) => {
    const newId = `sec-${Date.now()}`;
    const newSec = type === 'content' 
      ? { id: newId, title: 'Nouvelle Section', type: 'content', section_number: '', section_header: '', accent_text: '', items: [{ type: 'text', text: '' }] }
      : { id: newId, title: 'Nouvel Exercice', type: 'exercise', section_number: '', section_header: '', content: '', solution: '', interactive_answers: [] };
    setSections([...sections, newSec]);
  };

  const handleRemoveSection = (index) => {
    setSections(sections.filter((_, i) => i !== index));
  };

  const handleUpdateSection = (index, field, value) => {
    setSections(sections.map((sec, i) => i === index ? { ...sec, [field]: value } : sec));
  };

  const handleAddItemToContentSection = (secIndex) => {
    setSections(sections.map((sec, i) => {
      if (i === secIndex) {
        return {
          ...sec,
          items: [...(sec.items || []), { type: 'text', text: '' }]
        };
      }
      return sec;
    }));
  };

  const handleRemoveItemFromContentSection = (secIndex, itemIndex) => {
    setSections(sections.map((sec, i) => {
      if (i === secIndex) {
        return {
          ...sec,
          items: sec.items.filter((_, idx) => idx !== itemIndex)
        };
      }
      return sec;
    }));
  };

  const handleUpdateContentItem = (secIndex, itemIndex, field, value) => {
    setSections(sections.map((sec, i) => {
      if (i === secIndex) {
        const newItems = sec.items.map((item, idx) => {
          if (idx === itemIndex) {
            return { ...item, [field]: value };
          }
          return item;
        });
        return { ...sec, items: newItems };
      }
      return sec;
    }));
  };

  const handleAddInteractiveAnswer = (secIndex) => {
    setSections(sections.map((sec, i) => {
      if (i === secIndex) {
        const nextIdx = (sec.interactive_answers?.length || 0) + 1;
        return {
          ...sec,
          interactive_answers: [...(sec.interactive_answers || []), { question_idx: nextIdx, label: '', expected_answer: '' }]
        };
      }
      return sec;
    }));
  };

  const handleRemoveInteractiveAnswer = (secIndex, ansIndex) => {
    setSections(sections.map((sec, i) => {
      if (i === secIndex) {
        return {
          ...sec,
          interactive_answers: sec.interactive_answers.filter((_, idx) => idx !== ansIndex)
        };
      }
      return sec;
    }));
  };

  const handleUpdateInteractiveAnswer = (secIndex, ansIndex, field, value) => {
    setSections(sections.map((sec, i) => {
      if (i === secIndex) {
        const newAns = sec.interactive_answers.map((ans, idx) => {
          if (idx === ansIndex) {
            return { ...ans, [field]: value };
          }
          return ans;
        });
        return { ...sec, interactive_answers: newAns };
      }
      return sec;
    }));
  };

  const handleSaveLesson = async () => {
    if (!ficheTitle.trim() || !subject.trim()) {
      setError('Le titre et la matière sont obligatoires.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const lessonData = {
        title: ficheTitle,
        subject,
        chapterNumber,
        teacher,
        phone,
        schools: selectedSchools,
        content: {
          header: {
            prep_title: prepTitle,
            schools: selectedSchools,
            subject,
            fiche_title: ficheTitle,
            teacher,
            phone
          },
          sections
        },
        isActive: true
      };

      await addLesson(lessonData);
      navigate('/admin/lessons');
    } catch (e) {
      console.error(e);
      setError(`Erreur d'enregistrement : ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleSchool = (sch) => {
    if (selectedSchools.includes(sch)) {
      setSelectedSchools(selectedSchools.filter(s => s !== sch));
    } else {
      setSelectedSchools([...selectedSchools, sch]);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '3rem' }}>
      
      {/* ── Header ── */}
      <header style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button onClick={() => navigate('/admin/lessons')} className="btn-outline" style={{ padding: '0.5rem 0.75rem' }}>
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={24} className="text-violet" />
            Générateur de Fiches de Cours IA
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
            Importez des résumés de cours au format PDF ou Image et laissez l'IA créer des fiches interactives LaTeX.
          </p>
        </div>
      </header>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid var(--danger)', borderRadius: '12px', padding: '1rem', color: 'var(--danger)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <AlertCircle size={20} />
          <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem' }}>{error}</p>
        </div>
      )}

      {/* ── PHASE 1: Upload and Parse ── */}
      {phase === 1 && (
        <div className="glass-panel" style={{ padding: '3rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="input-group">
            <label>Modèle de traitement IA</label>
            <select 
              className="input-control" 
              value={geminiModel} 
              onChange={e => setGeminiModel(e.target.value)}
              style={{ maxWidth: '280px' }}
            >
              <option value="gemini-3.5-flash">Gemini 3.5 Flash (Recommandé)</option>
              <option value="gemini-1.5-flash">Gemini 1.5 Flash (Rapide)</option>
              <option value="gemini-1.5-pro">Gemini 1.5 Pro (Haute précision)</option>
              <option value="gemini-2.0-flash-exp">Gemini 2.0 Flash (Expérimental)</option>
            </select>
          </div>

          <div className="input-group">
            <label>Sélectionnez la fiche de cours (PDF ou Image)</label>
            <label className="upload-zone" style={{ minHeight: '220px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <input 
                type="file" 
                ref={fileInputRef} 
                accept="application/pdf, image/*" 
                onChange={handleFileSelect} 
                style={{ display: 'none' }} 
              />
              {!uploadFile ? (
                <>
                  <UploadCloud size={48} className="text-violet" style={{ marginBottom: '1rem' }} />
                  <p style={{ fontWeight: 800, fontSize: '1rem', margin: '0 0 0.25rem 0' }}>Glissez-déposez un fichier ici</p>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Fichiers supportés : .pdf, .png, .jpg, .jpeg</span>
                </>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <CheckCircle2 size={40} className="text-emerald" style={{ margin: '0 auto 0.75rem' }} />
                  <p style={{ fontWeight: 800, margin: '0 0 0.25rem 0' }}>{fileName}</p>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Type : {uploadFile.type} ({(uploadFile.size / (1024 * 1024)).toFixed(2)} Mo)
                  </span>
                  <div style={{ marginTop: '1rem', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.8rem' }} onClick={(e) => { e.preventDefault(); setUploadFile(null); }}>
                    Changer de fichier
                  </div>
                </div>
              )}
            </label>
          </div>

          <button 
            onClick={handleAnalyze} 
            className="btn" 
            disabled={loading || !uploadFile}
            style={{ width: '100%', padding: '1.25rem', fontSize: '1.1rem', justifyContent: 'center' }}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} style={{ marginRight: '0.5rem' }} />
                Traitement en cours...
              </>
            ) : (
              <>
                <Sparkles size={20} style={{ marginRight: '0.5rem' }} />
                Analyser et extraire le contenu
              </>
            )}
          </button>

          {loading && (
            <div className="animate-fade-in" style={{ marginTop: '1.5rem', width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{progress}</span>
                <span style={{ color: 'var(--violet)', fontWeight: 800 }}>{progressPercent}%</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '99px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                <div style={{
                  width: `${progressPercent}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, var(--violet), var(--emerald))',
                  borderRadius: '99px',
                  transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 0 10px rgba(113, 109, 242, 0.5)'
                }} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── PHASE 2: Edit & Review ── */}
      {phase === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Section 1: Header metadata */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
              📁 Informations Générales du Document
            </h2>

            <div className="dashboard-grid">
              <div className="col-span-6 input-group">
                <label>Titre de la Fiche (ex: Fiche 01 : Arithmétique)</label>
                <input 
                  type="text" 
                  className="input-control" 
                  value={ficheTitle}
                  onChange={e => setFicheTitle(e.target.value)}
                  placeholder="Fiche 01 : Arithmétique"
                />
              </div>

              <div className="col-span-3 input-group">
                <label>Matière</label>
                <select className="input-control" value={subject} onChange={e => setSubject(e.target.value)}>
                  <option value="Algèbre">Algèbre</option>
                  <option value="Analyse">Analyse</option>
                  <option value="Géométrie">Géométrie</option>
                  <option value="Probabilités">Probabilités</option>
                  <option value="Physique">Physique</option>
                  <option value="Chimie">Chimie</option>
                  <option value="SVT">SVT</option>
                </select>
              </div>

              <div className="col-span-3 input-group">
                <label>Numéro de Fiche</label>
                <input 
                  type="text" 
                  className="input-control" 
                  value={chapterNumber}
                  onChange={e => setChapterNumber(e.target.value)}
                  placeholder="01"
                />
              </div>
            </div>

            <div className="dashboard-grid" style={{ marginTop: '1.5rem' }}>
              <div className="col-span-6 input-group">
                <label>En-tête de préparation</label>
                <input 
                  type="text" 
                  className="input-control" 
                  value={prepTitle}
                  onChange={e => setPrepTitle(e.target.value)}
                  placeholder="Préparation aux concours"
                />
              </div>

              <div className="col-span-3 input-group">
                <label>Enseignant</label>
                <input 
                  type="text" 
                  className="input-control" 
                  value={teacher}
                  onChange={e => setTeacher(e.target.value)}
                  placeholder="Prof : FAYSSAL"
                />
              </div>

              <div className="col-span-3 input-group">
                <label>Numéro Téléphone</label>
                <input 
                  type="text" 
                  className="input-control" 
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="0681399067"
                />
              </div>
            </div>

            <div className="input-group" style={{ marginTop: '1.5rem' }}>
              <label>Écoles cibles</label>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                {schools.map(sch => (
                  <button
                    key={sch}
                    type="button"
                    onClick={() => toggleSchool(sch)}
                    style={{
                      padding: '0.4rem 0.85rem',
                      borderRadius: '99px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: selectedSchools.includes(sch) ? '1px solid var(--violet)' : '1px solid var(--border)',
                      background: selectedSchools.includes(sch) ? 'var(--violet-soft)' : 'transparent',
                      color: selectedSchools.includes(sch) ? 'var(--violet)' : 'var(--text-muted)',
                      transition: 'all 0.2s'
                    }}
                  >
                    {sch}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Course Contents */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                📝 Sections du Cours / Exercices
              </h2>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => handleAddSection('content')} className="btn-outline" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
                  <Plus size={14} /> + Section Théorique
                </button>
                <button onClick={() => handleAddSection('exercise')} className="btn-outline" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
                  <Plus size={14} /> + Exercice
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {sections.map((sec, secIdx) => (
                <div 
                  key={sec.id} 
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    background: 'rgba(255,255,255,0.02)',
                    position: 'relative'
                  }}
                >
                  {/* Delete Button */}
                  <button 
                    onClick={() => handleRemoveSection(secIdx)}
                    style={{
                      position: 'absolute', top: '1.25rem', right: '1.25rem',
                      background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)',
                      border: 'none', borderRadius: '8px', padding: '0.4rem', cursor: 'pointer'
                    }}
                  >
                    <Trash2 size={16} />
                  </button>

                  {/* Section Title */}
                  <div style={{ display: 'flex', gap: '1rem', width: '90%', marginBottom: '1.25rem' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>Titre du Bloc</label>
                      <input 
                        type="text" 
                        className="input-control" 
                        value={sec.title || ''} 
                        onChange={e => handleUpdateSection(secIdx, 'title', e.target.value)}
                        style={{ fontWeight: 800, fontSize: '1rem' }}
                      />
                    </div>
                    <div style={{ width: '150px' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>Type</label>
                      <select 
                        className="input-control"
                        value={sec.type}
                        onChange={e => handleUpdateSection(secIdx, 'type', e.target.value)}
                      >
                        <option value="content">Théorie (Cours)</option>
                        <option value="exercise">Exercice / Corrigé</option>
                      </select>
                    </div>
                  </div>

                  {/* Section Metadata Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '80px 1.5fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>N° Section</label>
                      <input 
                        type="text" 
                        className="input-control" 
                        value={sec.section_number || ''} 
                        onChange={e => handleUpdateSection(secIdx, 'section_number', e.target.value)}
                        placeholder="Ex: 1"
                        style={{ padding: '0.35rem', fontSize: '0.85rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>En-tête de Section Pill (ex: Résumé : Suites Numériques)</label>
                      <input 
                        type="text" 
                        className="input-control" 
                        value={sec.section_header || ''} 
                        onChange={e => handleUpdateSection(secIdx, 'section_header', e.target.value)}
                        placeholder="Laisse vide pour continuer la section précédente"
                        style={{ padding: '0.35rem', fontSize: '0.85rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sous-titre Accent Vert (ex: Définitions-Notations-Vocabulaire)</label>
                      <input 
                        type="text" 
                        className="input-control" 
                        value={sec.accent_text || ''} 
                        onChange={e => handleUpdateSection(secIdx, 'accent_text', e.target.value)}
                        placeholder="Optionnel"
                        style={{ padding: '0.35rem', fontSize: '0.85rem' }}
                      />
                    </div>
                  </div>

                  {/* Type 1: Content Block Editor */}
                  {sec.type === 'content' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--violet)' }}>Éléments de texte</span>
                        <button onClick={() => handleAddItemToContentSection(secIdx)} className="btn-outline" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
                          <Plus size={12} /> Ajouter un point
                        </button>
                      </div>

                      {sec.items?.map((item, itemIdx) => (
                        <div key={itemIdx} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                          <select
                            className="input-control"
                            value={item.type}
                            onChange={e => handleUpdateContentItem(secIdx, itemIdx, 'type', e.target.value)}
                            style={{ width: '150px', flexShrink: 0, padding: '0.4rem' }}
                          >
                            <option value="text">Texte Standard</option>
                            <option value="bullet">Puce (Bullet)</option>
                            <option value="highlight_box">Formule (Encadré)</option>
                            <option value="notation_grid">Grille de Notations</option>
                            <option value="table">Tableau Comparatif</option>
                          </select>

                          {item.type === 'notation_grid' ? (
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'rgba(255,255,255,0.01)', padding: '0.75rem', borderRadius: '8px', border: '1px dashed var(--border)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <strong style={{ fontSize: '0.8rem' }}>Colonnes de Notations :</strong>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const cols = item.notation_columns || [];
                                    handleUpdateContentItem(secIdx, itemIdx, 'notation_columns', [...cols, { title: '', math_blocks: [''] }]);
                                  }}
                                  className="btn-outline"
                                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                                >
                                  + Ajouter Colonne
                                </button>
                              </div>
                              {item.notation_columns?.map((col, colIdx) => (
                                <div key={colIdx} style={{ border: '1px solid var(--border)', padding: '0.5rem', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input
                                      type="text"
                                      className="input-control"
                                      placeholder="Titre de colonne (ex: • Notation fonctionnelle)"
                                      value={col.title || ''}
                                      onChange={e => {
                                        const newCols = item.notation_columns.map((c, ci) => ci === colIdx ? { ...c, title: e.target.value } : c);
                                        handleUpdateContentItem(secIdx, itemIdx, 'notation_columns', newCols);
                                      }}
                                      style={{ flex: 1, padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newCols = item.notation_columns.filter((_, ci) => ci !== colIdx);
                                        handleUpdateContentItem(secIdx, itemIdx, 'notation_columns', newCols);
                                      }}
                                      style={{ background: 'transparent', color: 'var(--danger)', border: 'none', cursor: 'pointer' }}
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                  <textarea
                                    className="input-control"
                                    placeholder="Blocs mathématiques (un par ligne, ex: u : E \\rightarrow \\mathbb{R})"
                                    value={col.math_blocks?.join('\n') || ''}
                                    onChange={e => {
                                      const lines = e.target.value.split('\n');
                                      const newCols = item.notation_columns.map((c, ci) => ci === colIdx ? { ...c, math_blocks: lines } : c);
                                      handleUpdateContentItem(secIdx, itemIdx, 'notation_columns', newCols);
                                    }}
                                    rows={2}
                                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                                  />
                                </div>
                              ))}
                            </div>
                          ) : item.type === 'table' ? (
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'rgba(255,255,255,0.01)', padding: '0.75rem', borderRadius: '8px', border: '1px dashed var(--border)' }}>
                              <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 800 }}>En-têtes du Tableau (séparés par | )</label>
                                <input
                                  type="text"
                                  className="input-control"
                                  placeholder="ex: Concept | une suite arithmétique | une suite géométrique"
                                  value={item.table_data?.headers?.join(' | ') || ''}
                                  onChange={e => {
                                    const headers = e.target.value.split('|').map(s => s.trim());
                                    const rows = item.table_data?.rows || [[]];
                                    handleUpdateContentItem(secIdx, itemIdx, 'table_data', { headers, rows });
                                  }}
                                  style={{ padding: '0.35rem', fontSize: '0.8rem' }}
                                />
                              </div>
                              <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 800 }}>Lignes du Tableau (une ligne par rangée, cellules séparées par | )</label>
                                <textarea
                                  className="input-control"
                                  placeholder="ex: Définition | U_{n+1} = U_n + r | U_{n+1} = qU_n"
                                  value={item.table_data?.rows?.map(r => r.join(' | ')).join('\n') || ''}
                                  onChange={e => {
                                    const rows = e.target.value.split('\n').map(line => line.split('|').map(s => s.trim()));
                                    const headers = item.table_data?.headers || [];
                                    handleUpdateContentItem(secIdx, itemIdx, 'table_data', { headers, rows });
                                  }}
                                  rows={3}
                                  style={{ padding: '0.35rem', fontSize: '0.8rem' }}
                                />
                              </div>
                            </div>
                          ) : (
                            <textarea
                              className="input-control"
                              value={item.text || ''}
                              onChange={e => handleUpdateContentItem(secIdx, itemIdx, 'text', e.target.value)}
                              placeholder="Entrez le contenu (LaTeX supporté avec $ ... $)"
                              rows={2}
                              style={{ flex: 1, padding: '0.4rem' }}
                            />
                          )}

                          <button
                            onClick={() => handleRemoveItemFromContentSection(secIdx, itemIdx)}
                            style={{ background: 'transparent', color: 'var(--text-muted)', border: 'none', cursor: 'pointer', marginTop: '0.5rem' }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Type 2: Exercise Block Editor */}
                  {sec.type === 'exercise' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div className="input-group">
                        <label>Énoncé de l'Exercice</label>
                        <textarea
                          className="input-control"
                          value={sec.content}
                          onChange={e => handleUpdateSection(secIdx, 'content', e.target.value)}
                          placeholder="Entrez l'énoncé de l'exercice..."
                          rows={4}
                        />
                      </div>
                      <div className="input-group">
                        <label>Solution Détaillée</label>
                        <textarea
                          className="input-control"
                          value={sec.solution}
                          onChange={e => handleUpdateSection(secIdx, 'solution', e.target.value)}
                          placeholder="Entrez la correction rédigée..."
                          rows={6}
                        />
                      </div>

                      {/* Interactive Verification Checks */}
                      <div style={{ marginTop: '0.5rem', borderTop: '1px dashed var(--border)', paddingTop: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)' }}>
                            Champs de vérification interactive (Optionnel - Pour s'entraîner)
                          </span>
                          <button onClick={() => handleAddInteractiveAnswer(secIdx)} className="btn-outline" style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}>
                            <Plus size={12} /> Ajouter une question interactive
                          </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {sec.interactive_answers?.map((ans, ansIdx) => (
                            <div key={ansIdx} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.8rem', fontWeight: 900 }}>Q{ans.question_idx} :</span>
                              <input
                                type="text"
                                className="input-control"
                                value={ans.label}
                                onChange={e => handleUpdateInteractiveAnswer(secIdx, ansIdx, 'label', e.target.value)}
                                placeholder="Libellé (ex: Entrez la valeur de x)"
                                style={{ flex: 1, padding: '0.4rem' }}
                              />
                              <input
                                type="text"
                                className="input-control"
                                value={ans.expected_answer}
                                onChange={e => handleUpdateInteractiveAnswer(secIdx, ansIdx, 'expected_answer', e.target.value)}
                                placeholder="Réponse exacte attendue"
                                style={{ width: '180px', padding: '0.4rem' }}
                              />
                              <button
                                onClick={() => handleRemoveInteractiveAnswer(secIdx, ansIdx)}
                                style={{ background: 'transparent', color: 'var(--text-muted)', border: 'none', cursor: 'pointer' }}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button onClick={() => setPhase(1)} className="btn-outline" style={{ padding: '1rem 2rem' }} disabled={loading}>
              Retour à l'import
            </button>
            <button onClick={handleSaveLesson} className="btn" style={{ padding: '1rem 2rem' }} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} style={{ marginRight: '0.5rem' }} />
                  Publication en cours...
                </>
              ) : (
                <>
                  <Save size={18} style={{ marginRight: '0.5rem' }} />
                  Publier la fiche interactive
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
