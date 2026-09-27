// routes/applications.routes.js
// Endpoints pour gérer les candidatures de façon transversale
// (vue "recruteur" : toutes candidatures, tous postes confondus).

const express = require("express");
const router = express.Router();

const applicationsController = require("../controllers/applications.controller");
const { authenticate, requireRole } = require("../auth");

router.get("/stats", authenticate, requireRole("recruiter"), applicationsController.recruiterStats);
router.get("/", authenticate, requireRole("recruiter"), applicationsController.listApplications); // GET /api/applications (+ ?status=...)
router.get("/mine", authenticate, requireRole("candidate"), applicationsController.listMyApplications);
router.patch("/:id/status", authenticate, requireRole("recruiter"), applicationsController.updateApplicationStatus); // PATCH /api/applications/:id/status
router.get("/:id/history", authenticate, applicationsController.getApplicationHistory);
router.patch("/:id/note", authenticate, requireRole("recruiter"), applicationsController.updateInternalNote);
router.patch("/:id/withdraw", authenticate, requireRole("candidate"), applicationsController.withdrawApplication);
router.delete("/:id", authenticate, requireRole("recruiter"), applicationsController.deleteApplication); // DELETE /api/applications/:id

module.exports = router;
