# Étape 1 : Construction de l'application React avec Node
FROM node:20-alpine AS build

WORKDIR /app

# Copie des fichiers package.json et package-lock.json pour installer les dépendances
COPY package*.json ./

# Installation des dépendances de manière propre et rapide
RUN npm ci

# Copie du reste des fichiers de l'application
COPY . .

# Construction des fichiers statiques de production (dist)
RUN npm run build

# Étape 2 : Service des fichiers construits à l'aide de Nginx
FROM nginx:alpine

# Copie de notre configuration Nginx personnalisée pour SPA (Single Page Application)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copie des fichiers statiques construits vers le dossier de Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Exposition du port 80 pour le conteneur
EXPOSE 80

# Démarrage de Nginx sans mode démon
CMD ["nginx", "-g", "daemon off;"]
