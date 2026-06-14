import { useState } from 'react';
import Papa from 'papaparse';
import { useAuth } from '../context/AuthContext';
import { UploadCloud, CheckCircle2, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const { exams, addExam } = useAuth();
  const [examName, setExamName] = useState('');
  const [tier, setTier] = useState('freemium'); // freemium or premium
  const [fileData, setFileData] = useState(null);
  const navigate = useNavigate();

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedQuestions = results.data.map(row => ({
          id: Math.random().toString(36).substr(2, 9),
          topic: row['Sujet'] || row['Topic'] || 'Général',
          question: row['Question'] || '',
          options: row['Options'] ? parseOptions(row['Options']) : [],
          correct_answer: row['Réponse'] || row['Correct'] || '',
          astuce: row['Astuce'] || ''
        }));
        
        setFileData(parsedQuestions);
      }
    });
  };

  const parseOptions = (optionsStr) => {
    if (!optionsStr) return [];
    const regex = /([A-E])\)\s+/g;
    const matches = [];
    let match;
    while ((match = regex.exec(optionsStr)) !== null) {
      matches.push({
        id: match[1],
        index: match.index,
        length: match[0].length
      });
    }
    const options = [];
    for (let i = 0; i < matches.length; i++) {
      const current = matches[i];
      const next = matches[i + 1];
      const startIndex = current.index + current.length;
      const endIndex = next ? next.index : optionsStr.length;
      let text = optionsStr.substring(startIndex, endIndex).trim();
      text = text.replace(/[,;]\s*$/, '').trim();
      options.push({ id: current.id, text });
    }
    if (options.length === 0) {
      return [{ id: 'A', text: optionsStr.trim() }];
    }
    return options;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!fileData || !examName) return;

    addExam(examName, tier, fileData);
    alert('Examen ajouté avec succès !');
    navigate('/admin/dashboard');
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '2rem' }}>Administration : Upload QCM</h1>
      
      <div className="glass-panel" style={{ marginBottom: '2rem' }}>
        <form onSubmit={handleSubmit}>
          
          <div className="input-group">
            <label>Nom de l'Examen (ex: Concours Médecine 2024)</label>
            <input 
              type="text" 
              className="input-control" 
              value={examName}
              onChange={(e) => setExamName(e.target.value)}
              required 
            />
          </div>

          <div className="input-group">
            <label>Abonnement Requis (Tier)</label>
            <select 
              className="input-control" 
              value={tier}
              onChange={(e) => setTier(e.target.value)}
              style={{ appearance: 'auto' }} // for basic select arrow
            >
              <option value="freemium">Freemium (Accès Gratuit)</option>
              <option value="premium">Premium (Accès Restreint)</option>
            </select>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              {tier === 'freemium' ? 'Tous les étudiants pourront réviser ce module.' : 'Seuls les étudiants Premium auront accès à ce module.'}
            </p>
          </div>

          <div className="input-group">
            <label>Fichier QCM (.csv généré par l'IA)</label>
            <label className="upload-zone" style={{ display: 'block', padding: '2rem' }}>
              <input 
                type="file" 
                accept=".csv" 
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
              <UploadCloud className="upload-icon" style={{ margin: '0 auto 1rem' }} />
              <h3 style={{ marginBottom: '0.5rem' }}>Cliquez pour uploader le fichier CSV</h3>
              {fileData && (
                <div style={{ color: 'var(--accent)', marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <CheckCircle2 size={18} /> {fileData.length} questions chargées en mémoire
                </div>
              )}
            </label>
          </div>

          <button type="submit" className="btn" disabled={!fileData || !examName} style={{ width: '100%' }}>
            Enregistrer l'Examen
          </button>
        </form>
      </div>

      <h2>Historique des Concours</h2>
      <div className="dashboard-grid mt-4">
        {exams.length === 0 ? (
          <div className="col-span-12 text-center" style={{ color: 'var(--text-muted)' }}>Aucun examen enregistré pour le moment.</div>
        ) : (
          exams.map((exam) => (
            <div key={exam.id} className="col-span-12 glass-panel flex justify-between items-center" style={{ padding: '1rem 1.5rem' }}>
              <div>
                <h4 style={{ fontSize: '1.1rem' }}>{exam.name}</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{exam.questions.length} Questions • Ajouté aujourd'hui</p>
              </div>
              <div>
                {exam.tier === 'premium' ? (
                  <span className="badge flex items-center gap-2" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '0.5rem 1rem', borderRadius: '2rem', fontWeight: 'bold' }}>
                    <Lock size={16} /> Premium
                  </span>
                ) : (
                  <span className="badge flex items-center gap-2" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent)', padding: '0.5rem 1rem', borderRadius: '2rem', fontWeight: 'bold' }}>
                    Freemium
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
