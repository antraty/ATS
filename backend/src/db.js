// db.js
// ------------------------------------------------------------------
// Ce fichier s'occupe uniquement de la base de données :
//   1. Ouvrir (ou créer) le fichier SQLite
//   2. Créer les tables si elles n'existent pas encore
//   3. Insérer quelques données de démonstration au premier lancement
//
// On utilise "better-sqlite3" : une librairie SYNCHRONE (pas besoin
// de async/await pour parler à la base), ce qui rend le code des
// contrôleurs beaucoup plus simple à lire pour un projet pédagogique.
// ------------------------------------------------------------------

const path = require("path");
const Database = require("better-sqlite3");

// Le fichier .sqlite est stocké dans backend/data/ats.sqlite
const dbPath = path.join(__dirname, "..", "data", "ats.sqlite");
const db = new Database(dbPath);

// De bonnes pratiques SQLite pour éviter les soucis de verrouillage
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// --------------------------------------------------------------
// 1. Création des tables
// --------------------------------------------------------------
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT NOT NULL,
    email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL CHECK (role IN ('candidate', 'recruiter')),
    company       TEXT,
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS jobs (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    title       TEXT NOT NULL,
    company     TEXT NOT NULL,
    location    TEXT NOT NULL,
    contract    TEXT NOT NULL DEFAULT 'CDI',   -- CDI, CDD, Stage, Freelance...
    salary      TEXT,                          -- champ libre : "35-45k€", "Selon profil"...
    description TEXT NOT NULL,
    skills      TEXT,                          -- mots-clés séparés par des virgules
    recruiter_id INTEGER,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS applications (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id            INTEGER NOT NULL,
    candidate_name    TEXT NOT NULL,
    candidate_email   TEXT NOT NULL,
    candidate_id      INTEGER,
    cover_letter      TEXT,
    status            TEXT NOT NULL DEFAULT 'recue',
                      -- valeurs possibles : recue | en_cours | acceptee | refusee
    created_at        TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
  );
`);

// Compatible avec une base créée par la première version.
const jobColumns = db.prepare("PRAGMA table_info(jobs)").all().map((column) => column.name);
if (!jobColumns.includes("recruiter_id")) db.exec("ALTER TABLE jobs ADD COLUMN recruiter_id INTEGER");
const applicationColumns = db
  .prepare("PRAGMA table_info(applications)")
  .all()
  .map((column) => column.name);
if (!applicationColumns.includes("candidate_id")) db.exec("ALTER TABLE applications ADD COLUMN candidate_id INTEGER");

// --------------------------------------------------------------
// 2. Données de démonstration (uniquement si la table est vide)
//    -> pratique pour tester l'application dès le premier lancement
// --------------------------------------------------------------
const demoPasswordHash = `recrute-demo-salt:${require("crypto")
  .scryptSync("demo123", "recrute-demo-salt", 64)
  .toString("hex")}`;
const insertDemoUser = db.prepare(`
  INSERT OR IGNORE INTO users (name, email, password_hash, role, company)
  VALUES (@name, @email, @password_hash, @role, @company)
`);
insertDemoUser.run({
  name: "Nadia Rakoto",
  email: "recruteur@recrute.test",
  password_hash: demoPasswordHash,
  role: "recruiter",
  company: "Nova Digital",
});
db.prepare("UPDATE users SET password_hash = ? WHERE email IN (?, ?)").run(
  demoPasswordHash,
  "recruteur@recrute.test",
  "candidat@recrute.test"
);
insertDemoUser.run({
  name: "Miora Andriam",
  email: "candidat@recrute.test",
  password_hash: demoPasswordHash,
  role: "candidate",
  company: null,
});

const demoRecruiter = db.prepare("SELECT id FROM users WHERE email = ?").get("recruteur@recrute.test");
const jobCount = db.prepare("SELECT COUNT(*) AS n FROM jobs").get().n;

if (jobCount === 0) {
  const insertJob = db.prepare(`
    INSERT INTO jobs (title, company, location, contract, salary, description, skills, recruiter_id)
    VALUES (@title, @company, @location, @contract, @salary, @description, @skills, @recruiter_id)
  `);

  const demoJobs = [
    {
      title: "Développeur·se Full-Stack JavaScript",
      company: "Nova Digital",
      location: "Antananarivo (Hybride)",
      contract: "CDI",
      salary: "1 800 000 - 2 400 000 Ar",
      description:
        "Vous rejoignez une équipe produit de 6 personnes pour construire nos outils internes en React et Node.js. Vous participerez à la fois au développement d'API et à l'interface utilisateur, dans une logique d'amélioration continue.",
      skills: "javascript,react,node.js,express,sql",
      recruiter_id: demoRecruiter.id,
    },
    {
      title: "Chargé·e de Recrutement",
      company: "TalentSphere RH",
      location: "Antananarivo",
      contract: "CDI",
      salary: "Selon profil",
      description:
        "Poste polyvalent couvrant tout le cycle de recrutement : rédaction d'offres, sourcing, entretiens, suivi des candidatures jusqu'à l'intégration. Une bonne connaissance des outils ATS est un plus.",
      skills: "recrutement,sourcing,entretien,rh",
      recruiter_id: demoRecruiter.id,
    },
    {
      title: "Data Analyst Junior",
      company: "Insightly",
      location: "Toamasina (Télétravail possible)",
      contract: "CDD",
      salary: "1 200 000 Ar",
      description:
        "Vous accompagnez les équipes métier dans l'analyse de leurs données de vente. Vous serez formé·e aux outils internes et travaillerez avec SQL, Python et des tableaux de bord.",
      skills: "sql,python,excel,powerbi",
      recruiter_id: demoRecruiter.id,
    },
    {
      title: "Stage - Assistant·e Développement Web",
      company: "Nova Digital",
      location: "Antananarivo",
      contract: "Stage",
      salary: "Indemnité de stage",
      description:
        "Stage de 3 à 6 mois pour découvrir le développement web moderne aux côtés de développeurs seniors. Vous contribuerez à de vraies fonctionnalités, avec du mentorat au quotidien.",
      skills: "html,css,javascript,git",
      recruiter_id: demoRecruiter.id,
    },
  ];

  const insertMany = db.transaction((jobs) => {
    for (const job of jobs) insertJob.run(job);
  });
  insertMany(demoJobs);

  console.log(`Base de données initialisée avec ${demoJobs.length} offres de démonstration.`);
}

module.exports = db;
