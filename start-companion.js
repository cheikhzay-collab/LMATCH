import http from 'http';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 5002;

const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Ping endpoint to verify status
  if (req.method === 'GET' && req.url === '/ping') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'online', message: "L'Conq Companion is ready!" }));
    return;
  }

  // Local Render endpoint
  if (req.method === 'POST' && req.url === '/render') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        
        const studioPath = path.join(__dirname, 'remotion-video-studio');
        const jsonPath = path.join(studioPath, 'question.json');
        
        // Write the JSON question payload
        fs.writeFileSync(jsonPath, JSON.stringify(payload, null, 2));

        console.log(`[Companion] Démarrage du rendu local Remotion CLI...`);
        
        // Run Remotion CLI render via npx to avoid PATH issues
        exec('npx remotion render src/index.jsx TikTokVideo out.mp4 --props=question.json', { cwd: studioPath }, (error, stdout, stderr) => {
          if (error) {
            console.error(`[Companion] Erreur lors du rendu :`, error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: error.message, stderr }));
            return;
          }

          console.log(`[Companion] Rendu terminé avec succès !`);
          const mp4Path = path.join(studioPath, 'out.mp4');

          if (fs.existsSync(mp4Path)) {
            const stat = fs.statSync(mp4Path);
            res.writeHead(200, {
              'Content-Type': 'video/mp4',
              'Content-Length': stat.size,
              'Content-Disposition': 'attachment; filename="tiktok-render.mp4"'
            });
            const readStream = fs.createReadStream(mp4Path);
            readStream.pipe(res);
          } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'Output MP4 file not found.' }));
          }
        });

      } catch (err) {
        console.error(`[Companion] Erreur de requête :`, err);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  if (req.method === 'POST' && req.url.startsWith('/save-icon')) {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
        const size = parsedUrl.searchParams.get('size');
        const payload = JSON.parse(body);
        const base64Data = payload.image.replace(/^data:image\/png;base64,/, "");
        const iconsDir = path.join(__dirname, 'public', 'icons');
        if (!fs.existsSync(iconsDir)) {
          fs.mkdirSync(iconsDir, { recursive: true });
        }
        const iconPath = path.join(iconsDir, `icon-${size}.png`);
        fs.writeFileSync(iconPath, base64Data, 'base64');
        console.log(`[Companion] Icon icon-${size}.png saved successfully!`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (err) {
        console.error('[Companion] Error saving icon:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end();
});

server.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`🚀 L'Conq Local Companion Server est en ligne !`);
  console.log(`🔌 Adresse : http://localhost:${PORT}`);
  console.log(`💡 Rendu local en 1-Clic activé sur la page marketing.`);
  console.log(`=================================================`);
});
