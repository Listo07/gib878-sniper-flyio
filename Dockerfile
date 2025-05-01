# Étape 1 : Image officielle Node.js
FROM node:18

# Étape 2 : Dossier de travail
WORKDIR /app

# Étape 3 : Copie des fichiers de dépendances
COPY package*.json ./

# Étape 4 : Installation des dépendances
RUN npm install

# Étape 5 : Copie du reste du projet
COPY . .

# Étape 6 : Port exposé pour Fly.io
EXPOSE 3000

# Étape 7 : Commande de lancement
CMD ["node", "index.js"]
