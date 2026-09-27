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
    cv_url            TEXT,
    internal_note     TEXT,
    status            TEXT NOT NULL DEFAULT 'recue',
                      -- valeurs possibles : recue | en_cours | acceptee | refusee
    created_at        TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS candidate_profiles (
    user_id INTEGER PRIMARY KEY,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    photo_url TEXT,
    address TEXT,
    birth_date TEXT,
    target_role TEXT,
    education_level TEXT,
    experience_years REAL DEFAULT 0,
    availability TEXT,
    salary_expectation TEXT,
    skills_json TEXT NOT NULL DEFAULT '[]',
    education_json TEXT NOT NULL DEFAULT '[]',
    experience_json TEXT NOT NULL DEFAULT '[]',
    cv_url TEXT,
    cover_letter_url TEXT,
    portfolio_url TEXT
  );

  CREATE TABLE IF NOT EXISTS recruiter_profiles (
    user_id INTEGER PRIMARY KEY,
    company_name TEXT,
    logo_url TEXT,
    sector TEXT,
    description TEXT,
    address TEXT,
    phone TEXT,
    website TEXT
  );

  CREATE TABLE IF NOT EXISTS application_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    application_id INTEGER NOT NULL,
    status TEXT NOT NULL,
    comment TEXT,
    changed_by INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    read_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS saved_jobs (
    user_id INTEGER NOT NULL,
    job_id INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, job_id),
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
  );
`);

function ensureColumns(table, columns) {
  const existing = new Set(db.prepare(`PRAGMA table_info(${table})`).all().map((column) => column.name));
  for (const [name, definition] of Object.entries(columns)) {
    if (!existing.has(name)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${name} ${definition}`);
  }
}

ensureColumns("jobs", {
  missions: "TEXT DEFAULT ''",
  min_experience: "REAL DEFAULT 0",
  required_degree: "TEXT DEFAULT ''",
  education_level: "TEXT DEFAULT ''",
  openings: "INTEGER DEFAULT 1",
  deadline: "TEXT",
  status: "TEXT NOT NULL DEFAULT 'published'",
  city: "TEXT DEFAULT ''",
  region: "TEXT DEFAULT ''",
  remote: "INTEGER NOT NULL DEFAULT 0",
  salary_min: "REAL",
  salary_max: "REAL",
  sector: "TEXT DEFAULT ''",
  updated_at: "TEXT",
});
ensureColumns("applications", { cv_url: "TEXT", internal_note: "TEXT" });
ensureColumns("users", { is_active: "INTEGER NOT NULL DEFAULT 1", updated_at: "TEXT" });
ensureColumns("candidate_profiles", { photo_url: "TEXT" });

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_jobs_status_created ON jobs(status, created_at);
  CREATE INDEX IF NOT EXISTS idx_jobs_contract_location ON jobs(contract, city, region);
  CREATE INDEX IF NOT EXISTS idx_applications_candidate ON applications(candidate_id, created_at);
  CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status, created_at);
  CREATE INDEX IF NOT EXISTS idx_application_history_application ON application_history(application_id, created_at);
  CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at);
  CREATE INDEX IF NOT EXISTS idx_saved_jobs_user ON saved_jobs(user_id, created_at);
`);

const existingApplications = db.prepare("SELECT id, status FROM applications WHERE id NOT IN (SELECT application_id FROM application_history)").all();
const seedHistory = db.prepare("INSERT INTO application_history (application_id, status, comment) VALUES (?, ?, ?)");
for (const application of existingApplications) {
  seedHistory.run(application.id, application.status, "Candidature importée dans le suivi ATS.");
}

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
db.prepare("UPDATE jobs SET recruiter_id = ? WHERE recruiter_id IS NULL").run(demoRecruiter.id);
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
