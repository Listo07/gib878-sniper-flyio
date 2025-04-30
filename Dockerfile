# Image officielle Node.js v18
FROM node:18

# Crée le répertoire de travail dans le container
WORKDIR /app

# Copie uniquement les fichiers de dépendances d’abord pour optimiser le cache Docker
COPY package*.json ./

# Installation des dépendances
RUN npm install

# Copie le reste du projet dans le container
COPY . .

# Expose le port attendu (ex. : 3000)
EXPOSE 3000

# Commande de lancement
CMD ["node", "index.js"]
