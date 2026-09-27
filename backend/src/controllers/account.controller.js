const db = require("../db");

const PROFILE_FIELDS = [
  "first_name", "last_name", "phone", "photo_url", "address", "birth_date", "target_role",
  "education_level", "experience_years", "availability", "salary_expectation",
  "skills_json", "education_json", "experience_json", "cv_url", "cover_letter_url", "portfolio_url",
];
const COMPANY_FIELDS = ["company_name", "logo_url", "sector", "description", "address", "phone", "website"];

function parseProfile(profile, fields) {
  const output = { ...profile };
  for (const field of fields) {
    if (field.endsWith("_json")) {
      try { output[field.replace("_json", "")] = JSON.parse(profile[field] || "[]"); }
      catch { output[field.replace("_json", "")] = []; }
      delete output[field];
    }
  }
  return output;
}

function getProfile(req, res) {
  if (req.user.role === "candidate") {
    db.prepare("INSERT OR IGNORE INTO candidate_profiles (user_id) VALUES (?)").run(req.user.id);
    const profile = db.prepare("SELECT * FROM candidate_profiles WHERE user_id = ?").get(req.user.id);
    return res.json({ ...parseProfile(profile, PROFILE_FIELDS), name: req.user.name, email: req.user.email });
  }
  if (req.user.role === "recruiter") {
    db.prepare("INSERT OR IGNORE INTO recruiter_profiles (user_id, company_name) VALUES (?, ?)").run(req.user.id, req.user.company || "");
    const profile = db.prepare("SELECT * FROM recruiter_profiles WHERE user_id = ?").get(req.user.id);
    return res.json({ ...profile, name: req.user.name, email: req.user.email });
  }
  return res.status(403).json({ error: "Profil utilisateur non pris en charge." });
}

function updateProfile(req, res) {
  const allowed = req.user.role === "candidate" ? PROFILE_FIELDS : req.user.role === "recruiter" ? COMPANY_FIELDS : [];
  if (!allowed.length) return res.status(403).json({ error: "Profil utilisateur non pris en charge." });
  const table = req.user.role === "candidate" ? "candidate_profiles" : "recruiter_profiles";
  const idColumn = req.user.role === "candidate" ? "user_id" : "user_id";
  db.prepare(`INSERT OR IGNORE INTO ${table} (user_id) VALUES (?)`).run(req.user.id);
  const current = db.prepare(`SELECT * FROM ${table} WHERE ${idColumn} = ?`).get(req.user.id);
  const values = {};
  for (const field of allowed) {
    const clientField = field.endsWith("_json") ? field.replace("_json", "") : field;
    if (Object.prototype.hasOwnProperty.call(req.body, field) || Object.prototype.hasOwnProperty.call(req.body, clientField)) {
      const value = req.body[field] ?? req.body[clientField];
      values[field] = field.endsWith("_json") ? JSON.stringify(Array.isArray(value) ? value : []) : (value == null ? "" : String(value).slice(0, 5000));
    } else values[field] = current[field] ?? "";
  }
  let email;
  if (req.body.email !== undefined) {
    email = String(req.body.email).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: "Adresse e-mail invalide." });
    const duplicate = db.prepare("SELECT id FROM users WHERE email = ? COLLATE NOCASE AND id != ?").get(email, req.user.id);
    if (duplicate) return res.status(409).json({ error: "Cette adresse e-mail est déjà utilisée." });
  }
  db.prepare(`UPDATE ${table} SET ${allowed.map((field) => `${field} = @${field}`).join(", ")} WHERE user_id = @user_id`)
    .run({ ...values, user_id: req.user.id });

  if (req.user.role === "candidate" && (req.body.first_name !== undefined || req.body.last_name !== undefined)) {
    const fullName = `${values.first_name || ""} ${values.last_name || ""}`.trim();
    if (fullName) {
      db.prepare("UPDATE users SET name = ?, updated_at = datetime('now') WHERE id = ?").run(fullName, req.user.id);
      req.user.name = fullName;
    }
  }
  if (req.user.role === "recruiter" && req.body.company_name !== undefined) {
    db.prepare("UPDATE users SET company = ?, updated_at = datetime('now') WHERE id = ?").run(req.body.company_name, req.user.id);
    req.user.company = req.body.company_name;
  }
  if (email) {
    db.prepare("UPDATE users SET email = ?, updated_at = datetime('now') WHERE id = ?").run(email, req.user.id);
    req.user.email = email;
  }
  getProfile(req, res);
}

function listNotifications(req, res) {
  const notifications = db.prepare("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 100").all(req.user.id);
  res.json(notifications);
}

function markNotificationRead(req, res) {
  const result = db.prepare("UPDATE notifications SET read_at = datetime('now') WHERE id = ? AND user_id = ?")
    .run(req.params.id, req.user.id);
  if (!result.changes) return res.status(404).json({ error: "Notification introuvable." });
  res.json({ success: true });
}

function markAllNotificationsRead(req, res) {
  db.prepare("UPDATE notifications SET read_at = datetime('now') WHERE user_id = ? AND read_at IS NULL").run(req.user.id);
  res.json({ success: true });
}

function saveJob(req, res) {
  const job = db.prepare("SELECT id FROM jobs WHERE id = ? AND status = 'published'").get(req.params.jobId);
  if (!job) return res.status(404).json({ error: "Offre introuvable." });
  db.prepare("INSERT OR IGNORE INTO saved_jobs (user_id, job_id) VALUES (?, ?)").run(req.user.id, job.id);
  res.status(201).json({ success: true });
}

function unsaveJob(req, res) {
  db.prepare("DELETE FROM saved_jobs WHERE user_id = ? AND job_id = ?").run(req.user.id, req.params.jobId);
  res.status(204).send();
}

function listSavedJobs(req, res) {
  const data = db.prepare(`SELECT jobs.*, saved_jobs.created_at AS saved_at FROM saved_jobs
    JOIN jobs ON jobs.id = saved_jobs.job_id WHERE saved_jobs.user_id = ? ORDER BY saved_jobs.created_at DESC`).all(req.user.id);
  res.json(data);
}

function candidateDashboard(req, res) {
  const applications = db.prepare(`SELECT COUNT(*) AS total,
    SUM(status IN ('recue', 'cv_consulte', 'analyse', 'preselectionnee', 'en_cours')) AS pending,
    SUM(status IN ('entretien_rh', 'test_technique', 'entretien_final')) AS interviews,
    SUM(status = 'acceptee') AS accepted, SUM(status = 'refusee') AS rejected
    FROM applications WHERE candidate_id = ?`).get(req.user.id);
  const saved = db.prepare("SELECT COUNT(*) AS total FROM saved_jobs WHERE user_id = ?").get(req.user.id).total;
  const unread = db.prepare("SELECT COUNT(*) AS total FROM notifications WHERE user_id = ? AND read_at IS NULL").get(req.user.id).total;
  res.json({ applications, saved_jobs: saved, unread_notifications: unread });
}

module.exports = {
  getProfile, updateProfile, listNotifications, markNotificationRead,
  markAllNotificationsRead, saveJob, unsaveJob, listSavedJobs, candidateDashboard,
};