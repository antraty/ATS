# Recrute. — Mini ATS (plateforme de recrutement)

Application complète permettant à des recruteurs de publier des offres
d'emploi, et à des candidats d'y postuler et de suivre l'avancement
de leur candidature.

## Stack technique

| Partie    | Techno                                   |
|-----------|-------------------------------------------|
| Backend   | Node.js, Express, SQLite (`better-sqlite3`) |
| Frontend  | React 18, Vite, React Router              |
| Style     | CSS "maison" (pas de librairie UI), un seul fichier `global.css` |

L'application propose deux espaces authentifiés : candidat et recruteur.
Les offres restent publiques, mais publier, gérer les candidatures et
postuler nécessitent le profil approprié.

## Structure du projet

```
ats-project/
├── backend/
│   ├── src/
│   │   ├── server.js              # point d'entrée Express
│   │   ├── db.js                  # connexion SQLite + création des tables + données de démo
│   │   ├── controllers/
│   │   │   ├── jobs.controller.js
│   │   │   └── applications.controller.js
│   │   └── routes/
│   │       ├── jobs.routes.js
│   │       └── applications.routes.js
│   └── data/                      # fichier ats.sqlite généré au premier lancement
│
└── frontend/
    └── src/
        ├── api/client.js          # toutes les fonctions fetch() vers l'API
        ├── components/            # Navbar, JobRow, StatusBadge
        ├── pages/                 # JobsPage, JobDetailPage, JobFormPage, RecruiterDashboard
        ├── styles/global.css      # design system (couleurs, typographie, composants)
        ├── App.jsx                # définition des routes
        └── main.jsx               # point d'entrée React
```

## Fonctionnalités

- **CRUD des offres d'emploi** : création, consultation, modification, suppression.
- **Candidatures** : un candidat postule via un formulaire sur la page de l'offre ;
  chaque candidature est liée à une offre (`job_id`) et contient les informations
  du candidat (nom, email, message de motivation).
- **Statuts de candidature** : `recue`, `en_cours`, `acceptee`, `refusee`.
  Le tableau de bord recruteur (`/recrutement`) affiche un pipeline en 4 colonnes
  et permet de changer le statut d'une candidature via un menu déroulant.
- **Recherche d'offres par mots-clés** : la barre de recherche sur la page
  d'accueil interroge le titre, l'entreprise, la description et les compétences,
  avec un filtre additionnel par type de contrat.
- **Authentification** : inscription et connexion avec token signé, profils
  séparés, compte démo recruteur et compte démo candidat.
- **Espace candidat** : candidature avec identité du compte et suivi de ses
  statuts dans `/mes-candidatures`.
- **Espace recruteur** : publication d'offres et pipeline des candidatures
  protégé par rôle.

## Lancer le projet en local

Il faut deux terminaux (un pour l'API, un pour le frontend).

### 1. Backend (API sur http://localhost:4000)

```bash
cd backend
npm install
npm run dev
```

Au premier lancement, un fichier `backend/data/ats.sqlite` est créé
automatiquement avec 4 offres de démonstration.

### 2. Frontend (interface sur http://localhost:5173)

```bash
cd frontend
npm install
npm run dev
```

Ouvrez ensuite **http://localhost:5173** dans votre navigateur.

## Aperçu de l'API

| Méthode | Route                              | Description                             |
|---------|-------------------------------------|------------------------------------------|
| GET     | `/api/jobs?q=react&contract=CDI`    | Liste + recherche + filtre des offres    |
| GET     | `/api/jobs/:id`                     | Détail d'une offre                       |
| POST    | `/api/jobs`                         | Créer une offre                          |
| PUT     | `/api/jobs/:id`                     | Modifier une offre                       |
| DELETE  | `/api/jobs/:id`                     | Supprimer une offre (+ ses candidatures) |
| GET     | `/api/jobs/:id/applications`        | Candidatures d'une offre                 |
| POST    | `/api/jobs/:id/applications`        | Postuler à une offre                     |
| GET     | `/api/applications?status=recue`    | Toutes les candidatures (+ filtre statut)|
| PATCH   | `/api/applications/:id/status`      | Changer le statut d'une candidature      |
| DELETE  | `/api/applications/:id`             | Supprimer une candidature                |

Comptes de démonstration : `candidat@recrute.test` et
`recruteur@recrute.test`, mot de passe `demo123`.

## Pistes d'amélioration (pour aller plus loin)

- Upload de CV (PDF) plutôt qu'un simple message de motivation.
- Pagination de la liste des offres.
- Notifications email lors d'un changement de statut.
