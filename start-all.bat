@echo off
title L'Conq Developer Suite
echo =======================================================
echo 🚀 Démarrage de la suite de développement L'Conq...
echo =======================================================
echo.
echo [1/2] Lancement du Serveur Compagnon (Rendu Vidéo Local)...
start cmd /k "node start-companion.js"
echo.
echo [2/2] Lancement de l'Application Frontend (Vite)...
npm run dev
pause
