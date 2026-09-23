const crypto = require("crypto");
const db = require("./db");

const SECRET = process.env.AUTH_SECRET || "recrute-dev-secret-change-me";

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  return `${salt}:${crypto.scryptSync(password, salt, 64).toString("hex")}`;
}

function verifyPassword(password, storedHash) {
  const [salt, key] = storedHash.split(":");
  if (!salt || !key) return false;
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(derived, "hex"), Buffer.from(key, "hex"));
}

function createToken(user) {
  const payload = Buffer.from(JSON.stringify({ id: user.id, role: user.role, exp: Date.now() + 1000 * 60 * 60 * 24 * 7 })).toString("base64url");
  const signature = crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function getUserFromToken(token) {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!data.id || data.exp < Date.now()) return null;
    return db.prepare("SELECT id, name, email, role, company FROM users WHERE id = ?").get(data.id) || null;
  } catch {
    return null;
  }
}

function authenticate(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const user = getUserFromToken(token);
  if (!user) return res.status(401).json({ error: "Connexion requise." });
  req.user = user;
  next();
}

function requireRole(role) {
  return (req, res, next) => {
    if (req.user?.role !== role) return res.status(403).json({ error: "Accès réservé à ce profil." });
    next();
  };
}

module.exports = { db, hashPassword, verifyPassword, createToken, authenticate, requireRole };
