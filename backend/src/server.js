
const express = require("express");
const cors = require("cors");

const jobsRoutes = require("./routes/jobs.routes");
const applicationsRoutes = require("./routes/applications.routes");
const authRoutes = require("./routes/auth.routes");
const accountRoutes = require("./routes/account.routes");
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

app.get("/api/openapi.json", (req, res) => {
  res.json({
    openapi: "3.0.3",
    info: { title: "Recrute ATS API", version: "1.0.0", description: "API de recrutement avec authentification Bearer, offres, candidatures et profils." },
    servers: [{ url: "http://localhost:4000/api" }],
    components: { securitySchemes: { bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" } } },
    paths: {
      "/jobs": { get: { summary: "Rechercher les offres publiées", parameters: ["search", "city", "region", "contract", "sector", "salary_min", "salary_max", "experience", "remote", "sort", "order", "page", "limit"].map((name) => ({ name, in: "query", schema: { type: "string" } })) }, post: { summary: "Créer une offre", security: [{ bearerAuth: [] }] } },
      "/jobs/{id}": { get: { summary: "Consulter une offre" }, put: { summary: "Modifier une offre", security: [{ bearerAuth: [] }] }, delete: { summary: "Supprimer une offre", security: [{ bearerAuth: [] }] } },
      "/jobs/{id}/applications": { post: { summary: "Postuler à une offre", security: [{ bearerAuth: [] }] }, get: { summary: "Lister les candidatures de l’offre", security: [{ bearerAuth: [] }] } },
      "/applications": { get: { summary: "Filtrer les candidatures recruteur", security: [{ bearerAuth: [] }] } },
      "/applications/{id}/status": { patch: { summary: "Changer le statut et enregistrer l’historique", security: [{ bearerAuth: [] }] } },
      "/applications/{id}/history": { get: { summary: "Consulter l’historique", security: [{ bearerAuth: [] }] } },
      "/account/profile": { get: { summary: "Consulter le profil", security: [{ bearerAuth: [] }] }, put: { summary: "Modifier le profil", security: [{ bearerAuth: [] }] } },
      "/account/notifications": { get: { summary: "Lister les notifications", security: [{ bearerAuth: [] }] } },
    },
  });
});

// --- Routes principales de l'application ---
app.use("/api/jobs", jobsRoutes);
app.use("/api/applications", applicationsRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/account", accountRoutes);

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
