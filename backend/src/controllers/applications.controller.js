const db = require("../db");

const VALID_STATUSES = [
  "recue", "cv_consulte", "analyse", "preselectionnee", "entretien_rh",
  "test_technique", "entretien_final", "offre_envoyee", "en_cours",
  "acceptee", "refusee", "retiree", "archivee",
];

function notify(userId, type, message, link) {
  if (!userId) return;
  db.prepare("INSERT INTO notifications (user_id, type, message, link) VALUES (?, ?, ?, ?)")
    .run(userId, type, message, link || null);
}

function attachHistory(applications) {
  const historyQuery = db.prepare("SELECT status, comment, created_at FROM application_history WHERE application_id = ? ORDER BY created_at ASC, id ASC");
  return applications.map((application) => ({ ...application, history: historyQuery.all(application.id) }));
}

function createApplication(req, res) {
  const { jobId } = req.params;
  const { cover_letter, cv_url } = req.body;
  const job = db.prepare("SELECT id, title, status, recruiter_id FROM jobs WHERE id = ?").get(jobId);
  if (!job || job.status !== "published") return res.status(404).json({ error: "Cette offre n'est pas disponible." });

  const duplicate = db.prepare("SELECT id FROM applications WHERE job_id = ? AND candidate_id = ? AND status != 'retiree'").get(jobId, req.user.id);
  if (duplicate) return res.status(409).json({ error: "Vous avez déjà postulé à cette offre." });

  const create = db.transaction(() => {
    const result = db.prepare(`INSERT INTO applications (job_id, candidate_name, candidate_email, candidate_id, cover_letter, cv_url, status)
      VALUES (?, ?, ?, ?, ?, ?, 'recue')`).run(jobId, req.user.name, req.user.email, req.user.id, cover_letter || "", cv_url || "");
    db.prepare("INSERT INTO application_history (application_id, status, comment, changed_by) VALUES (?, 'recue', ?, ?)")
      .run(result.lastInsertRowid, "Candidature envoyée.", req.user.id);
    notify(job.recruiter_id, "application_received", `${req.user.name} a postulé à « ${job.title} ».`, `/offres/${jobId}`);
    return db.prepare("SELECT * FROM applications WHERE id = ?").get(result.lastInsertRowid);
  });
  res.status(201).json(create());
}

function listApplications(req, res) {
  const { status, job_id, search, from, to, experience, education, city, skill, availability } = req.query;
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 100));
  const order = req.query.order === "asc" ? "ASC" : "DESC";
  const sortMap = { created_at: "applications.created_at", status: "applications.status", name: "applications.candidate_name" };
  const sort = sortMap[req.query.sort] || sortMap.created_at;
  const filters = ["jobs.recruiter_id = @recruiter_id"];
  const params = { recruiter_id: req.user.id };
  if (status && VALID_STATUSES.includes(status)) { filters.push("applications.status = @status"); params.status = status; }
  if (job_id && Number.isInteger(Number(job_id))) { filters.push("applications.job_id = @job_id"); params.job_id = Number(job_id); }
  if (search?.trim()) {
    filters.push(`(applications.candidate_name LIKE @search OR applications.candidate_email LIKE @search
      OR applications.id LIKE @search OR EXISTS (SELECT 1 FROM candidate_profiles cp WHERE cp.user_id = applications.candidate_id AND cp.skills_json LIKE @search))`);
    params.search = `%${search.trim()}%`;
  }
  if (from && !Number.isNaN(Date.parse(from))) { filters.push("applications.created_at >= @from"); params.from = from; }
  if (to && !Number.isNaN(Date.parse(to))) { filters.push("applications.created_at <= @to"); params.to = to; }
  if (experience !== undefined && Number.isFinite(Number(experience))) { filters.push("cp.experience_years >= @experience"); params.experience = Number(experience); }
  if (education?.trim()) { filters.push("cp.education_level LIKE @education"); params.education = `%${education.trim()}%`; }
  if (city?.trim()) { filters.push("cp.address LIKE @city"); params.city = `%${city.trim()}%`; }
  if (skill?.trim()) { filters.push("cp.skills_json LIKE @skill"); params.skill = `%${skill.trim()}%`; }
  if (availability?.trim()) { filters.push("cp.availability LIKE @availability"); params.availability = `%${availability.trim()}%`; }
  const where = filters.join(" AND ");
  const joins = "JOIN jobs ON jobs.id = applications.job_id LEFT JOIN candidate_profiles cp ON cp.user_id = applications.candidate_id";
  const total = db.prepare(`SELECT COUNT(*) AS total FROM applications ${joins} WHERE ${where}`).get(params).total;
  const data = db.prepare(`SELECT applications.*, jobs.title AS job_title, jobs.company AS job_company,
      cp.photo_url AS candidate_photo_url, cp.cv_url AS profile_cv_url, cp.experience_years, cp.education_level AS candidate_education, cp.skills_json AS candidate_skills, cp.availability
    FROM applications ${joins} WHERE ${where}
    ORDER BY ${sort} ${order} LIMIT @limit OFFSET @offset`).all({ ...params, limit, offset: (page - 1) * limit });
  res.json({ current_page: page, per_page: limit, total, last_page: Math.max(1, Math.ceil(total / limit)), data });
}

function listMyApplications(req, res) {
  const applications = db.prepare(`SELECT applications.*, jobs.title AS job_title, jobs.company AS job_company
    FROM applications JOIN jobs ON jobs.id = applications.job_id
    WHERE applications.candidate_id = ? ORDER BY applications.created_at DESC`).all(req.user.id);
  res.json(attachHistory(applications));
}

function listApplicationsForJob(req, res) {
  const job = db.prepare("SELECT id FROM jobs WHERE id = ? AND recruiter_id = ?").get(req.params.jobId, req.user.id);
  if (!job) return res.status(404).json({ error: "Offre introuvable." });
  res.json(db.prepare("SELECT * FROM applications WHERE job_id = ? ORDER BY created_at DESC").all(job.id));
}

function accessibleApplication(id, user) {
  return db.prepare(`SELECT applications.*, jobs.title AS job_title, jobs.recruiter_id
    FROM applications JOIN jobs ON jobs.id = applications.job_id WHERE applications.id = ?
    AND (applications.candidate_id = ? OR jobs.recruiter_id = ?)`).get(id, user.id, user.id);
}

function updateApplicationStatus(req, res) {
  const { status, comment = "" } = req.body;
  if (!VALID_STATUSES.includes(status)) return res.status(400).json({ error: `Statut invalide. Valeurs possibles : ${VALID_STATUSES.join(", ")}.` });
  const application = accessibleApplication(req.params.id, req.user);
  if (!application || application.recruiter_id !== req.user.id) return res.status(404).json({ error: "Candidature introuvable." });
  if (application.status !== status) {
    const update = db.transaction(() => {
      db.prepare("UPDATE applications SET status = ? WHERE id = ?").run(status, application.id);
      db.prepare("INSERT INTO application_history (application_id, status, comment, changed_by) VALUES (?, ?, ?, ?)")
        .run(application.id, status, comment || null, req.user.id);
      notify(application.candidate_id, "application_status", `Le statut de votre candidature « ${application.job_title} » a changé : ${status}.`, "/mes-candidatures");
    });
    update();
  }
  res.json(db.prepare("SELECT * FROM applications WHERE id = ?").get(application.id));
}

function getApplicationHistory(req, res) {
  const application = accessibleApplication(req.params.id, req.user);
  if (!application) return res.status(404).json({ error: "Candidature introuvable." });
  res.json(db.prepare("SELECT status, comment, created_at FROM application_history WHERE application_id = ? ORDER BY created_at ASC, id ASC").all(application.id));
}

function updateInternalNote(req, res) {
  const application = accessibleApplication(req.params.id, req.user);
  if (!application || application.recruiter_id !== req.user.id) return res.status(404).json({ error: "Candidature introuvable." });
  db.prepare("UPDATE applications SET internal_note = ? WHERE id = ?").run(String(req.body.note || "").slice(0, 5000), application.id);
  res.json({ internal_note: String(req.body.note || "").slice(0, 5000) });
}

function withdrawApplication(req, res) {
  const application = db.prepare("SELECT * FROM applications WHERE id = ? AND candidate_id = ?").get(req.params.id, req.user.id);
  if (!application) return res.status(404).json({ error: "Candidature introuvable." });
  if (application.status === "acceptee" || application.status === "refusee" || application.status === "archivee") {
    return res.status(409).json({ error: "Cette candidature ne peut plus être retirée." });
  }
  const withdraw = db.transaction(() => {
    db.prepare("UPDATE applications SET status = 'retiree' WHERE id = ?").run(application.id);
    db.prepare("INSERT INTO application_history (application_id, status, comment, changed_by) VALUES (?, 'retiree', ?, ?)")
      .run(application.id, "Candidature retirée par le candidat.", req.user.id);
  });
  withdraw();
  res.json(db.prepare("SELECT * FROM applications WHERE id = ?").get(application.id));
}

function deleteApplication(req, res) {
  const application = accessibleApplication(req.params.id, req.user);
  if (!application || application.recruiter_id !== req.user.id) return res.status(404).json({ error: "Candidature introuvable." });
  db.prepare("DELETE FROM applications WHERE id = ?").run(application.id);
  res.status(204).send();
}

function recruiterStats(req, res) {
  const recruiterId = req.user.id;
  const jobs = db.prepare(`SELECT COUNT(*) AS total,
    SUM(status = 'published') AS published,
    SUM(status = 'published' AND (deadline IS NULL OR date(deadline) >= date('now'))) AS active,
    SUM(status = 'published' AND deadline IS NOT NULL AND date(deadline) < date('now')) AS expired,
    SUM(status = 'archived') AS archived FROM jobs WHERE recruiter_id = ?`).get(recruiterId);
  const apps = db.prepare(`SELECT COUNT(*) AS total,
    SUM(date(applications.created_at) = date('now')) AS today,
    SUM(applications.status IN ('entretien_rh', 'entretien_final')) AS interviews,
    SUM(applications.status = 'acceptee') AS accepted, SUM(applications.status = 'refusee') AS rejected,
    AVG(CASE WHEN applications.status = 'acceptee' THEN
      julianday((SELECT MIN(application_history.created_at) FROM application_history
        WHERE application_history.application_id = applications.id AND application_history.status = 'acceptee'))
      - julianday(applications.created_at) END) AS average_days_to_hire
    FROM applications JOIN jobs ON jobs.id = applications.job_id WHERE jobs.recruiter_id = ?`).get(recruiterId);
  res.json({ jobs, applications: { ...apps, acceptance_rate: apps.total ? Math.round((apps.accepted / apps.total) * 100) : 0 } });
}

module.exports = {
  VALID_STATUSES, createApplication, listApplications, listMyApplications,
  listApplicationsForJob, updateApplicationStatus, getApplicationHistory,
  updateInternalNote, withdrawApplication, deleteApplication, recruiterStats,
};