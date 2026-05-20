import React, { useCallback } from 'react';
import Papa from 'papaparse';
import { UploadCloud } from 'lucide-react';

export default function AdminUpload({ onDataParsed }) {
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedData = results.data.map(row => {
          // Format based on the prompt we gave to Claude
          // Expected columns: Sujet, Question, Options, Réponse, Astuce
          return {
            id: Math.random().toString(36).substr(2, 9),
            topic: row['Sujet'] || row['Topic'] || 'Général',
            question: row['Question'] || '',
            options: row['Options'] ? parseOptions(row['Options']) : [],
            correct_answer: row['Réponse'] || row['Correct'] || '',
            astuce: row['Astuce'] || ''
          };
        });
        
        onDataParsed(parsedData);
      },
      error: (error) => {
        console.error('Error parsing CSV:', error);
        alert('Erreur lors de la lecture du fichier CSV.');
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

  return (
    <div className="glass-card">
      <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <UploadCloud />
        Importer les questions
      </h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
        Uploadez le fichier CSV généré par l'IA contenant les questions (QCM), les options et les astuces.
      </p>

      <label className="upload-zone" style={{ display: 'block' }}>
        <input 
          type="file" 
          accept=".csv" 
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
        <UploadCloud className="upload-icon" />
        <h3 style={{ marginBottom: '0.5rem' }}>Cliquez pour uploader le fichier CSV</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Format attendu : Sujet, Question, Options, Réponse, Astuce
        </p>
      </label>
    </div>
  );
}
