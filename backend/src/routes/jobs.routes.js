// routes/jobs.routes.js
// Définit les URL disponibles pour la ressource "jobs" et les relie
// à la fonction du contrôleur qui doit répondre.

const express = require("express");
const router = express.Router();

const jobsController = require("../controllers/jobs.controller");
const applicationsController = require("../controllers/applications.controller");
const { authenticate, optionalAuthenticate, requireRole } = require("../auth");

router.get("/", jobsController.listJobs); // GET /api/jobs (+ recherche ?q=...)
router.get("/:id", optionalAuthenticate, jobsController.getJob); // GET /api/jobs/:id
router.post("/", authenticate, requireRole("recruiter"), jobsController.createJob); // POST /api/jobs
router.put("/:id", authenticate, requireRole("recruiter"), jobsController.updateJob); // PUT /api/jobs/:id
router.delete("/:id", authenticate, requireRole("recruiter"), jobsController.deleteJob); // DELETE /api/jobs/:id
router.post("/:id/duplicate", authenticate, requireRole("recruiter"), jobsController.duplicateJob);
router.patch("/:id/publish", authenticate, requireRole("recruiter"), jobsController.publishJob);
router.patch("/:id/unpublish", authenticate, requireRole("recruiter"), jobsController.unpublishJob);
router.patch("/:id/archive", authenticate, requireRole("recruiter"), jobsController.archiveJob);

// Candidatures rattachées à une offre précise
router.get("/:jobId/applications", authenticate, requireRole("recruiter"), applicationsController.listApplicationsForJob);
router.post("/:jobId/applications", authenticate, requireRole("candidate"), applicationsController.createApplication);

module.exports = router;
