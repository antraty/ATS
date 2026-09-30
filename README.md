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

- **Authentification** : inscription candidat/recruteur, connexion, JWT HS256, renouvellement du token, changement de mot de passe et désactivation du compte. Les anciens jetons signés restent valides jusqu'à expiration.
- **Profils** : informations professionnelles candidat, compétences, formations/expériences structurées en JSON, liens CV/portfolio ; profil entreprise avec secteur, site, logo et coordonnées.
- **Offres** : CRUD, brouillon/publication/dépublication/archivage/duplication, missions, critères d'expérience et diplôme, localisation détaillée, salaire numérique, télétravail, date limite et nombre de postes.
- **Recherche** : recherche textuelle et filtres combinables par ville, région, entreprise, secteur, contrat, niveau d'études, expérience, salaire, télétravail et date ; tri par date, pertinence, salaire, intitulé ou échéance ; pagination configurable (`page`, `limit`).
- **Candidatures** : candidature unique par offre, lien CV et lettre, retrait par le candidat, notes internes recruteur, recherche/filtrage, historique horodaté et workflow complet : `recue`, `cv_consulte`, `analyse`, `preselectionnee`, `entretien_rh`, `test_technique`, `entretien_final`, `offre_envoyee`, `acceptee`, `refusee`, `retiree`, `archivee`.
- **Tableaux de bord** : compteurs recruteur et candidat, recherche candidat, filtres statut, offres favorites, historique des étapes et notifications en application.
- **Sécurité de données** : routes rôle-protégées, vérification de propriété des offres/candidatures, contrôle des comptes désactivés et index SQLite.
- **Documentation** : spécification OpenAPI disponible sur `/api/openapi.json`.

Les photos, CV et logos sont actuellement stockés comme URL/liens : aucun stockage/téléversement de fichier n'est configuré. Les notifications sont internes à l'application ; l'envoi d'e-mails, la réinitialisation de mot de passe par e-mail et les notifications de nouvelles offres nécessitent un fournisseur SMTP ou transactionnel. L'inscription publique ne permet pas de créer un administrateur ; aucun écran/rôle administrateur n'est livré.

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
| GET     | `/api/jobs?search=react&city=Antananarivo&contract=CDI&page=1&limit=20&sort=date&order=desc` | Recherche filtrée et paginée |
| GET     | `/api/jobs/:id`                     | Détail d'une offre                       |
| POST    | `/api/jobs`                         | Créer une offre                          |
| PUT     | `/api/jobs/:id`                     | Modifier une offre                       |
| DELETE  | `/api/jobs/:id`                     | Supprimer une offre (+ ses candidatures) |
| PATCH   | `/api/jobs/:id/publish`             | Publier une offre                        |
| PATCH   | `/api/jobs/:id/unpublish`           | Dépublier une offre                      |
| PATCH   | `/api/jobs/:id/archive`             | Archiver une offre                       |
| POST    | `/api/jobs/:id/duplicate`            | Dupliquer en brouillon                   |
| GET     | `/api/jobs/:id/applications`        | Candidatures d'une offre                 |
| POST    | `/api/jobs/:id/applications`        | Postuler à une offre                     |
| GET     | `/api/applications?status=recue&search=nom&page=1&limit=20` | Candidatures recruteur filtrées |
| GET     | `/api/applications/:id/history`     | Historique d'une candidature             |
| PATCH   | `/api/applications/:id/status`      | Changer le statut et notifier             |
| PATCH   | `/api/applications/:id/note`        | Modifier une note interne                |
| PATCH   | `/api/applications/:id/withdraw`    | Retrait côté candidat                    |
| GET/PUT | `/api/account/profile`              | Lire/modifier le profil                  |
| GET     | `/api/account/notifications`        | Notifications en application             |
| GET     | `/api/applications/stats`           | Statistiques recruteur                   |
| GET     | `/api/account/candidate-dashboard`  | Statistiques candidat                    |
| GET     | `/api/openapi.json`                 | Spécification OpenAPI                    |
| POST    | `/api/auth/refresh`                 | Renouveler le JWT                        |
| POST    | `/api/auth/change-password`         | Changer le mot de passe                  |
| POST    | `/api/auth/deactivate`              | Désactiver son compte                    |
| DELETE  | `/api/applications/:id`             | Supprimer une candidature                |

Comptes de démonstration : `candidat@recrute.test` et
`recruteur@recrute.test`, mot de passe `demo123`.




-----------------------------
Développé par:
ANTRATIA
AMBININTSOA Antonio
ANDRIANASOA Minonantenaina Enzo
RAJAONAH Tendrilalaina Herimino





