// controllers/applications.controller.js
// ------------------------------------------------------------------
// Toute la logique métier liée aux CANDIDATURES :
//   - postuler à une offre
//   - lister les candidatures (globalement ou par offre)
//   - changer le statut d'une candidature
//   - supprimer une candidature
// ------------------------------------------------------------------

const db = require("../db");

// Les 4 statuts autorisés pour une candidature.
// On les centralise ici pour ne pas les répéter (et pour que le
// front-end puisse aussi s'appuyer dessus via la route GET /api/statuses).
const VALID_STATUSES = ["recue", "en_cours", "acceptee", "refusee"];

// POST /api/jobs/:jobId/applications
// Un candidat postule à une offre précise.
function createApplication(req, res) {
  const { jobId } = req.params;
  const { cover_letter } = req.body;

  const job = db.prepare("SELECT id FROM jobs WHERE id = ?").get(jobId);
  if (!job) {
    return res.status(404).json({ error: "Cette offre n'existe pas." });
  }

  const result = db
    .prepare(
      `INSERT INTO applications (job_id, candidate_name, candidate_email, candidate_id, cover_letter, status)
       VALUES (@job_id, @candidate_name, @candidate_email, @candidate_id, @cover_letter, 'recue')`
    )
    .run({
      job_id: jobId,
      candidate_name: req.user.name,
      candidate_email: req.user.email,
      candidate_id: req.user.id,
      cover_letter: cover_letter || "",
    });

  const newApplication = db
    .prepare("SELECT * FROM applications WHERE id = ?")
    .get(result.lastInsertRowid);

  res.status(201).json(newApplication);
}

// GET /api/applications?status=recue
// Liste TOUTES les candidatures (vue "recruteur"), avec le titre de
// l'offre associée pour éviter au front de faire une requête en plus.
// Filtrage optionnel par statut.
function listApplications(req, res) {
  const { status } = req.query;

  let sql = `
    SELECT applications.*, jobs.title AS job_title, jobs.company AS job_company
    FROM applications
    JOIN jobs ON jobs.id = applications.job_id
  `;
  const params = {};

  if (status && VALID_STATUSES.includes(status)) {
    sql += " WHERE applications.status = @status";
    params.status = status;
  }

  sql += " ORDER BY applications.created_at DESC";

  const applications = db.prepare(sql).all(params);
  res.json(applications);
}

function listMyApplications(req, res) {
  const applications = db
    .prepare(`
      SELECT applications.*, jobs.title AS job_title, jobs.company AS job_company
      FROM applications
      JOIN jobs ON jobs.id = applications.job_id
      WHERE applications.candidate_id = ?
      ORDER BY applications.created_at DESC
    `)
    .all(req.user.id);
  res.json(applications);
}

// GET /api/jobs/:jobId/applications
// Liste les candidatures pour UNE offre précise.
function listApplicationsForJob(req, res) {
  const { jobId } = req.params;
  const applications = db
    .prepare("SELECT * FROM applications WHERE job_id = ? ORDER BY created_at DESC")
    .all(jobId);
  res.json(applications);
}

// PATCH /api/applications/:id/status
// Fait avancer une candidature dans le pipeline de recrutement.
function updateApplicationStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body;

  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({
      error: `Statut invalide. Valeurs possibles : ${VALID_STATUSES.join(", ")}.`,
    });
  }

  const existing = db.prepare("SELECT * FROM applications WHERE id = ?").get(id);
  if (!existing) {
    return res.status(404).json({ error: "Candidature introuvable." });
  }

  db.prepare("UPDATE applications SET status = ? WHERE id = ?").run(status, id);

  const updated = db.prepare("SELECT * FROM applications WHERE id = ?").get(id);
  res.json(updated);
}

// DELETE /api/applications/:id
function deleteApplication(req, res) {
  const existing = db.prepare("SELECT * FROM applications WHERE id = ?").get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: "Candidature introuvable." });
  }
  db.prepare("DELETE FROM applications WHERE id = ?").run(existing.id);
  res.status(204).send();
}

module.exports = {
  VALID_STATUSES,
  createApplication,
  listApplications,
  listMyApplications,
  listApplicationsForJob,
  updateApplicationStatus,
  deleteApplication,
};
