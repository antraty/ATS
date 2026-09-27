const { db, hashPassword, verifyPassword, createToken } = require("../auth");

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role, company: user.company };
}

function login(req, res) {
  const { email, password } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(String(email || "").trim());
  if (!user || !user.is_active || !verifyPassword(String(password || ""), user.password_hash)) {
    return res.status(401).json({ error: "Email ou mot de passe incorrect." });
  }
  res.json({ token: createToken(user), user: publicUser(user) });
}

function register(req, res) {
  const { name, email, password, role, company } = req.body;
  if (!name?.trim() || !email?.trim() || !password || !["candidate", "recruiter"].includes(role)) {
    return res.status(400).json({ error: "Nom, email, mot de passe et profil sont obligatoires." });
  }
  if (password.length < 6) return res.status(400).json({ error: "Le mot de passe doit contenir au moins 6 caractères." });
  try {
    const result = db.prepare(`
      INSERT INTO users (name, email, password_hash, role, company)
      VALUES (@name, @email, @password_hash, @role, @company)
    `).run({ name: name.trim(), email: email.trim().toLowerCase(), password_hash: hashPassword(password), role, company: company?.trim() || null });
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(result.lastInsertRowid);
    res.status(201).json({ token: createToken(user), user: publicUser(user) });
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") return res.status(409).json({ error: "Cet email est déjà utilisé." });
    throw error;
  }
}

function me(req, res) {
  res.json(req.user);
}

function refresh(req, res) {
  const user = db.prepare("SELECT * FROM users WHERE id = ? AND is_active = 1").get(req.user.id);
  if (!user) return res.status(401).json({ error: "Compte désactivé." });
  res.json({ token: createToken(user), user: publicUser(user) });
}

function changePassword(req, res) {
  const { current_password, new_password } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE id = ? AND is_active = 1").get(req.user.id);
  if (!user || !verifyPassword(String(current_password || ""), user.password_hash)) {
    return res.status(401).json({ error: "Mot de passe actuel incorrect." });
  }
  if (typeof new_password !== "string" || new_password.length < 8) {
    return res.status(400).json({ error: "Le nouveau mot de passe doit contenir au moins 8 caractères." });
  }
  db.prepare("UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?")
    .run(hashPassword(new_password), user.id);
  res.json({ success: true });
}

function deactivate(req, res) {
  const result = db.prepare("UPDATE users SET is_active = 0, updated_at = datetime('now') WHERE id = ?")
    .run(req.user.id);
  if (!result.changes) return res.status(404).json({ error: "Compte introuvable." });
  res.json({ success: true });
}

module.exports = { login, register, me, refresh, changePassword, deactivate };
