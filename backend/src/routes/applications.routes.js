// routes/applications.routes.js
// Endpoints pour gérer les candidatures de façon transversale
// (vue "recruteur" : toutes candidatures, tous postes confondus).

const express = require("express");
const router = express.Router();

const applicationsController = require("../controllers/applications.controller");
const { authenticate, requireRole } = require("../auth");

router.get("/", authenticate, requireRole("recruiter"), applicationsController.listApplications); // GET /api/applications (+ ?status=...)
router.get("/mine", authenticate, requireRole("candidate"), applicationsController.listMyApplications);
router.patch("/:id/status", authenticate, requireRole("recruiter"), applicationsController.updateApplicationStatus); // PATCH /api/applications/:id/status
router.delete("/:id", authenticate, requireRole("recruiter"), applicationsController.deleteApplication); // DELETE /api/applications/:id

module.exports = router;
