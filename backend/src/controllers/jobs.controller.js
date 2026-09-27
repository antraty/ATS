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

function listJobs(req, res) {
  const { q, search, contract, company, sector, city, region, education, experience, salary_min, salary_max, remote, since } = req.query;
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
  const sortColumns = { date: "jobs.created_at", created_at: "jobs.created_at", deadline: "jobs.deadline", salary: "jobs.salary_min", title: "jobs.title" };
  const sortColumn = sortColumns[req.query.sort] || "jobs.created_at";
  const direction = String(req.query.order || "desc").toLowerCase() === "asc" ? "ASC" : "DESC";
  const conditions = ["jobs.status = 'published'", "(jobs.deadline IS NULL OR date(jobs.deadline) >= date('now'))"];
  const params = {};
  const keyword = String(search || q || "").trim();

  if (keyword) {
    conditions.push("(jobs.title LIKE @keyword OR jobs.company LIKE @keyword OR jobs.description LIKE @keyword OR jobs.missions LIKE @keyword OR jobs.skills LIKE @keyword)");
    params.keyword = `%${keyword}%`;
  }
  for (const [key, value] of Object.entries({ contract, company, sector, city, region, education })) {
    if (value && String(value).trim()) {
      if (key === "city") {
        conditions.push("(jobs.city LIKE @city OR jobs.location LIKE @city)");
        params.city = `%${String(value).trim()}%`;
        continue;
      }
      const column = `jobs.${{ education: "education_level" }[key] || key}`;
      conditions.push(`${column} LIKE @${key}`);
      params[key] = `%${String(value).trim()}%`;
    }
  }
  if (salary_min !== undefined && Number.isFinite(Number(salary_min))) {
    conditions.push("(jobs.salary_max >= @salary_min OR (jobs.salary_max IS NULL AND jobs.salary_min >= @salary_min))");
    params.salary_min = Number(salary_min);
  }
  if (salary_max !== undefined && Number.isFinite(Number(salary_max))) {
    conditions.push("(jobs.salary_min <= @salary_max OR (jobs.salary_min IS NULL AND jobs.salary_max <= @salary_max))");
    params.salary_max = Number(salary_max);
  }
  if (experience !== undefined && Number.isFinite(Number(experience))) {
    conditions.push("jobs.min_experience <= @experience");
    params.experience = Number(experience);
  }
  if (remote === "true" || remote === "1") conditions.push("jobs.remote = 1");
  if (since && !Number.isNaN(Date.parse(since))) {
    conditions.push("jobs.created_at >= @since");
    params.since = new Date(since).toISOString();
  }

  const where = conditions.join(" AND ");
  const total = db.prepare(`SELECT COUNT(*) AS total FROM jobs WHERE ${where}`).get(params).total;
  const jobs = db.prepare(`SELECT jobs.*, recruiter_profiles.logo_url AS company_logo,
      (SELECT COUNT(*) FROM applications WHERE applications.job_id = jobs.id) AS applications_count
    FROM jobs LEFT JOIN recruiter_profiles ON recruiter_profiles.user_id = jobs.recruiter_id WHERE ${where}
    ORDER BY ${req.query.sort === "relevance" && keyword ? "CASE WHEN jobs.title LIKE @keyword THEN 0 WHEN jobs.company LIKE @keyword THEN 1 ELSE 2 END, " : ""}${sortColumn} ${direction}, jobs.id DESC LIMIT @limit OFFSET @offset`)
    .all({ ...params, limit, offset: (page - 1) * limit });
  res.json({ current_page: page, per_page: limit, total, last_page: Math.max(1, Math.ceil(total / limit)), data: jobs });
}

function getJob(req, res) {
  const job = db.prepare(`SELECT jobs.*, recruiter_profiles.logo_url AS company_logo,
    (SELECT COUNT(*) FROM applications WHERE applications.job_id = jobs.id) AS applications_count
    FROM jobs LEFT JOIN recruiter_profiles ON recruiter_profiles.user_id = jobs.recruiter_id WHERE jobs.id = ?`).get(req.params.id);
  const expired = job?.deadline && job.deadline.slice(0, 10) < new Date().toISOString().slice(0, 10);
  if (!job || ((job.status !== "published" || expired) && job.recruiter_id !== req.user?.id)) {
    return res.status(404).json({ error: "Offre introuvable." });
  }
  res.json(job);
}

function createJob(req, res) {
  const fields = ["title", "company", "location", "description"];
  if (fields.some((field) => !String(req.body[field] || "").trim())) {
    return res.status(400).json({ error: "Champs requis manquants : title, company, location, description." });
  }

  const data = { ...req.body };
  const result = db.prepare(`INSERT INTO jobs (
    title, company, location, contract, salary, description, skills, recruiter_id,
    missions, min_experience, required_degree, education_level, openings, deadline,
    status, city, region, remote, salary_min, salary_max, sector
  ) VALUES (
    @title, @company, @location, @contract, @salary, @description, @skills, @recruiter_id,
    @missions, @min_experience, @required_degree, @education_level, @openings, @deadline,
    @status, @city, @region, @remote, @salary_min, @salary_max, @sector
  )`).run({
    title: data.title.trim(), company: data.company.trim(), location: data.location.trim(),
    contract: data.contract || "CDI", salary: data.salary || "", description: data.description.trim(),
    skills: data.skills || "", recruiter_id: req.user.id, missions: data.missions || "",
    min_experience: Number(data.min_experience) || 0, required_degree: data.required_degree || "",
    education_level: data.education_level || "", openings: Math.max(1, Number(data.openings) || 1),
    deadline: data.deadline || null, status: data.status === "draft" ? "draft" : "published",
    city: data.city || "", region: data.region || "", remote: data.remote ? 1 : 0,
    salary_min: Number.isFinite(Number(data.salary_min)) && data.salary_min !== "" ? Number(data.salary_min) : null,
    salary_max: Number.isFinite(Number(data.salary_max)) && data.salary_max !== "" ? Number(data.salary_max) : null,
    sector: data.sector || "",
  });
  res.status(201).json(db.prepare("SELECT * FROM jobs WHERE id = ?").get(result.lastInsertRowid));
}

function recruiterJob(req, res) {
  const job = db.prepare("SELECT * FROM jobs WHERE id = ?").get(req.params.id);
  if (!job) return { error: res.status(404).json({ error: "Offre introuvable." }) };
  if (job.recruiter_id !== req.user.id) return { error: res.status(403).json({ error: "Cette offre ne vous appartient pas." }) };
  return { job };
}

function updateJob(req, res) {
  const { job, error } = recruiterJob(req, res);
  if (error) return;
  if (req.body.status && !["draft", "published", "unpublished", "archived"].includes(req.body.status)) {
    return res.status(400).json({ error: "Statut d'offre invalide." });
  }
  const updated = { ...job, ...req.body, updated_at: new Date().toISOString() };
  const columns = ["title", "company", "location", "contract", "salary", "description", "skills", "missions", "min_experience", "required_degree", "education_level", "openings", "deadline", "status", "city", "region", "remote", "salary_min", "salary_max", "sector", "updated_at"];
  db.prepare(`UPDATE jobs SET ${columns.map((column) => `${column} = @${column}`).join(", ")} WHERE id = @id`)
    .run({ ...updated, remote: updated.remote ? 1 : 0, id: job.id });
  res.json(db.prepare("SELECT * FROM jobs WHERE id = ?").get(job.id));
}

function deleteJob(req, res) {
  const { job, error } = recruiterJob(req, res);
  if (error) return;
  db.prepare("DELETE FROM jobs WHERE id = ?").run(job.id);
  res.status(204).send();
}

function setJobStatus(status) {
  return (req, res) => {
    const { job, error } = recruiterJob(req, res);
    if (error) return;
    db.prepare("UPDATE jobs SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, job.id);
    res.json(db.prepare("SELECT * FROM jobs WHERE id = ?").get(job.id));
  };
}

function duplicateJob(req, res) {
  const { job, error } = recruiterJob(req, res);
  if (error) return;
  const result = db.prepare(`INSERT INTO jobs (
    title, company, location, contract, salary, description, skills, recruiter_id, missions,
    min_experience, required_degree, education_level, openings, deadline, status, city, region,
    remote, salary_min, salary_max, sector
  ) VALUES (
    @title, @company, @location, @contract, @salary, @description, @skills, @recruiter_id, @missions,
    @min_experience, @required_degree, @education_level, @openings, @deadline, 'draft', @city, @region,
    @remote, @salary_min, @salary_max, @sector
  )`).run({ ...job, title: `${job.title} (copie)`, recruiter_id: req.user.id });
  res.status(201).json(db.prepare("SELECT * FROM jobs WHERE id = ?").get(result.lastInsertRowid));
}

module.exports = { listJobs, getJob, createJob, updateJob, deleteJob, duplicateJob, publishJob: setJobStatus("published"), unpublishJob: setJobStatus("unpublished"), archiveJob: setJobStatus("archived") };
