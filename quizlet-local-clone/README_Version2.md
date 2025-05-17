# Quizlet Local Clone

Clone local de Quizlet : une application web éducative pour apprendre avec des fiches interactives et plusieurs modes d'entraînement.

## Fonctionnalités principales

- **Cartes (Flashcards)** : Parcours interactif de fiches, marquage "connue" ou "à revoir".
- **Apprendre (Learn)** : Parcours intelligent, QCM/adaptatif.
- **Écrire (Write)** : Saisie et correction des réponses.
- **Dictée (Spell)** : Synthèse vocale locale (Web Speech API), correction orthographique.
- **Test** : QCM, vrai/faux, correspondances, réponses écrites, score final, mode chronométré.
- **Associer (Match)** : Jeu d'association glisser-déposer, chronométré.
- **Gravité (Gravity)** : Définitions à taper avant qu'elles n'atteignent le bas.

## Technologies utilisées

- **Frontend** : React.js (Vite)
- **Backend** : Node.js + Express
- **Base de données** : JSON local (via le backend Express)
- **Synthèse vocale** : Web Speech API (navigateur)
- **Stockage local** : LocalStorage pour la progression utilisateur

## Installation

1. **Cloner le dépôt**

   ```bash
   git clone <repo_url>
   cd quizlet-local-clone
   ```

2. **Installer les dépendances**

   ```bash
   # Backend
   cd server
   npm install

   # Frontend
   cd ../client
   npm install
   ```

3. **Lancer l'application**

   ```bash
   # Terminal 1 : lancer le backend
   cd server
   npm run start

   # Terminal 2 : lancer le frontend
   cd ../client
   npm run dev
   ```

4. Accéder à [http://localhost:5173](http://localhost:5173)

## Structure du projet

```
quizlet-local-clone/
│
├── client/            # Frontend React
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── modes/
│   │   ├── data/
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
│
├── server/            # Backend Express
│   ├── data/
│   │   └── sets.json
│   ├── index.js
│   └── package.json
│
└── README.md
```

## Exemples de jeux de fiches

Voir `server/data/sets.json` pour des exemples.

## Synthèse vocale

La synthèse vocale fonctionne uniquement sur les navigateurs compatibles (Chrome/Edge/Firefox). Aucune donnée envoyée à l'extérieur.

## Contribution

Pull requests bienvenues !

## Licence

MIT