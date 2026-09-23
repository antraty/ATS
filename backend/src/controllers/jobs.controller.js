// controllers/jobs.controller.js
// ------------------------------------------------------------------
// Toute la logique métier liée aux OFFRES D'EMPLOI :
//   - lister / rechercher
//   - récupérer une offre
//   - créer / modifier / supprimer
//
// Un "controller" reçoit une requête HTTP (req) déjà validée par la
// route, parle à la base de données, puis renvoie une réponse (res).
// ------------------------------------------------------------------

const db = require("../db");

// GET /api/jobs?q=motclé&contract=CDI
// Liste toutes les offres, avec une recherche optionnelle par mot-clé.
// La recherche porte sur le titre, l'entreprise, la description et les
// compétences (skills), ce qui couvre la majorité des cas d'usage.
function listJobs(req, res) {
  const { q, contract } = req.query;

  let sql = "SELECT * FROM jobs";
  const conditions = [];
  const params = {};

  if (q && q.trim() !== "") {
    conditions.push(
      "(title LIKE @kw OR company LIKE @kw OR description LIKE @kw OR skills LIKE @kw)"
    );
    params.kw = `%${q.trim()}%`;
  }

  if (contract && contract.trim() !== "") {
    conditions.push("contract = @contract");
    params.contract = contract.trim();
  }

  if (conditions.length > 0) {
    sql += " WHERE " + conditions.join(" AND ");
  }
  sql += " ORDER BY created_at DESC";

  const jobs = db.prepare(sql).all(params);
  res.json(jobs);
}

// GET /api/jobs/:id
function getJob(req, res) {
  const job = db.prepare("SELECT * FROM jobs WHERE id = ?").get(req.params.id);
  if (!job) {
    return res.status(404).json({ error: "Offre introuvable." });
  }
  res.json(job);
}

// POST /api/jobs
function createJob(req, res) {
  const { title, company, location, contract, salary, description, skills } = req.body;

  // Validation minimale mais utile : on refuse les champs essentiels manquants
  if (!title || !company || !location || !description) {
    return res.status(400).json({
      error: "Champs requis manquants : title, company, location, description.",
    });
  }

  const result = db
    .prepare(
      `INSERT INTO jobs (title, company, location, contract, salary, description, skills, recruiter_id)
       VALUES (@title, @company, @location, @contract, @salary, @description, @skills, @recruiter_id)`
    )
    .run({
      title,
      company,
      location,
      contract: contract || "CDI",
      salary: salary || "",
      description,
      skills: skills || "",
      recruiter_id: req.user.id,
    });

  const newJob = db.prepare("SELECT * FROM jobs WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json(newJob);
}

// PUT /api/jobs/:id
function updateJob(req, res) {
  const existing = db.prepare("SELECT * FROM jobs WHERE id = ?").get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: "Offre introuvable." });
  }

  // On fusionne les champs envoyés avec les valeurs existantes,
  // pour permettre une mise à jour partielle (PATCH-like).
  const updated = { ...existing, ...req.body, id: existing.id };

  db.prepare(
    `UPDATE jobs SET
       title = @title,
       company = @company,
       location = @location,
       contract = @contract,
       salary = @salary,
       description = @description,
       skills = @skills
     WHERE id = @id`
  ).run(updated);

  const job = db.prepare("SELECT * FROM jobs WHERE id = ?").get(existing.id);
  res.json(job);
}

// DELETE /api/jobs/:id
function deleteJob(req, res) {
  const existing = db.prepare("SELECT * FROM jobs WHERE id = ?").get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: "Offre introuvable." });
  }

  // Grâce à "ON DELETE CASCADE" dans le schéma, les candidatures
  // liées à cette offre sont supprimées automatiquement.
  db.prepare("DELETE FROM jobs WHERE id = ?").run(existing.id);
  res.status(204).send();
}

module.exports = { listJobs, getJob, createJob, updateJob, deleteJob };
