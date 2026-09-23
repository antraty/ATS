// server.js
// ------------------------------------------------------------------
// Point d'entrée de l'API. Ce fichier :
//   1. Configure Express (middlewares globaux)
//   2. Branche les routes
//   3. Démarre le serveur HTTP
// ------------------------------------------------------------------

const express = require("express");
const cors = require("cors");

const jobsRoutes = require("./routes/jobs.routes");
const applicationsRoutes = require("./routes/applications.routes");
const authRoutes = require("./routes/auth.routes");
const { VALID_STATUSES } = require("./controllers/applications.controller");

const app = express();
const PORT = process.env.PORT || 4000;

// --- Middlewares globaux ---
app.use(cors()); // autorise le front-end (autre origine) à appeler l'API
app.use(express.json()); // parse automatiquement les JSON dans req.body

// --- Petit log lisible de chaque requête, pratique pour le debug ---
app.use((req, res, next) => {
  console.log(`${new Date().toLocaleTimeString()}  ${req.method}  ${req.originalUrl}`);
  next();
});

// --- Route de vérification que l'API tourne bien ---
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "API du mini ATS opérationnelle." });
});

// --- Expose la liste des statuts valides (utile pour le front) ---
app.get("/api/statuses", (req, res) => {
  res.json(VALID_STATUSES);
});

// --- Routes principales de l'application ---
app.use("/api/jobs", jobsRoutes);
app.use("/api/applications", applicationsRoutes);
app.use("/api/auth", authRoutes);

// --- Gestion des routes inconnues (404) ---
app.use((req, res) => {
  res.status(404).json({ error: "Route inexistante." });
});

// --- Gestion centralisée des erreurs inattendues ---
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Erreur interne du serveur." });
});

app.listen(PORT, () => {
  console.log(`API du mini ATS démarrée sur http://localhost:${PORT}`);
});
