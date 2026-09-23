const { db, hashPassword, verifyPassword, createToken } = require("../auth");

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role, company: user.company };
}

function login(req, res) {
  const { email, password } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(String(email || "").trim());
  if (!user || !verifyPassword(String(password || ""), user.password_hash)) {
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

module.exports = { login, register, me };
