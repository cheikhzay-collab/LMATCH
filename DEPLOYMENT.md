# 🚀 Guide de Déploiement — L'Match

Ce guide détaille les différentes méthodes pour déployer l'application **L'Match** (Vite + React + PWA) en production.

---

## 📋 Prérequis de Build

Avant de déployer, assurez-vous d'avoir Node.js (version 20 recommandée) installé pour tester le build de production localement :

```bash
# Installer les dépendances propres
npm ci

# Tester la compilation de production
npm run build
```

Les fichiers générés se trouveront dans le dossier `dist/` à la racine du projet.

---

## 🐳 Méthode 1 : Déploiement avec Docker (Recommandé pour VPS et Cloud)

Nous avons configuré un **Dockerfile** multi-étape et un fichier **nginx.conf** adapté pour gérer le routage SPA (Single Page Application) sans erreur 404 sur les routes dynamiques (`/study`, `/dashboard`, etc.).

### 1. Construire l'image Docker
```bash
docker build -t lmatch-app .
```

### 2. Lancer le conteneur localement
```bash
docker run -d -p 8080:80 --name lmatch-container lmatch-app
```
L'application sera alors accessible sur `http://localhost:8080`.

---

## ☁️ Méthode 2 : Déploiement Cloud (Vercel, Netlify, Cloudflare Pages)

Ces plateformes de serveurs statiques (Serverless) conviennent parfaitement pour l'architecture SPA de L'Match.

### Option A : Vercel (Recommandé - Ultra rapide)
1. Installez le CLI Vercel ou connectez votre dépôt GitHub sur [Vercel](https://vercel.com).
2. Configurez les paramètres suivants lors de l'importation :
   - **Framework Preset** : `Vite`
   - **Build Command** : `npm run build`
   - **Output Directory** : `dist`
3. Créez un fichier `vercel.json` à la racine si vous voulez forcer la redirection SPA (géré automatiquement par Vercel la plupart du temps) :
   ```json
   {
     "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
   }
   ```

### Option B : Netlify
1. Connectez votre dépôt GitHub sur [Netlify](https://netlify.com).
2. Configurez les mêmes commandes de build (`npm run build`, dossier `dist`).
3. Pour éviter les erreurs 404 lors du rafraîchissement des pages, créez un fichier `_redirects` dans le dossier `public/` avec le contenu suivant :
   ```text
   /*    /index.html   200
   ```

---

## 🛠️ Méthode 3 : Déploiement sur un VPS classique (Nginx direct)

Si vous utilisez un serveur VPS Linux (Ubuntu/Debian) avec Nginx déjà installé :

1. Compilez le projet localement ou sur votre serveur d'intégration continue :
   ```bash
   npm run build
   ```
2. Transférez le contenu du dossier `dist/` vers votre dossier web sur le VPS (ex: `/var/www/lmatch`).
3. Configurez votre bloc serveur Nginx (similaire à notre `nginx.conf`) :

```nginx
server {
    listen 80;
    server_name votre-domaine.com;

    location / {
        root /var/www/lmatch;
        index index.html index.htm;
        try_files $uri $uri/ /index.html; # Très important pour le routage React Router
    }

    # Cache des éléments statiques pour de superbes performances PWA
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|otf|json)$ {
        root /var/www/lmatch;
        expires 1y;
        add_header Cache-Control "public, no-transform";
    }
}
```

---

## 🔄 Intégration Continue (CI/CD)

Un workflow **GitHub Actions** a été ajouté dans le dossier [`.github/workflows/ci-cd.yml`](file:///.github/workflows/ci-cd.yml).
* À chaque **push** ou **pull request** sur la branche `main`, le code est automatiquement récupéré, les dépendances sont installées et le build est testé pour s'assurer qu'aucune régression ou erreur de compilation n'est poussée en production.
