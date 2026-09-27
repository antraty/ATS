const express = require("express");
const { authenticate, requireRole } = require("../auth");
const controller = require("../controllers/account.controller");

const router = express.Router();
router.use(authenticate);
router.get("/profile", controller.getProfile);
router.put("/profile", controller.updateProfile);
router.get("/notifications", controller.listNotifications);
router.patch("/notifications/read-all", controller.markAllNotificationsRead);
router.patch("/notifications/:id/read", controller.markNotificationRead);
router.get("/candidate-dashboard", requireRole("candidate"), controller.candidateDashboard);
router.get("/saved-jobs", requireRole("candidate"), controller.listSavedJobs);
router.post("/saved-jobs/:jobId", requireRole("candidate"), controller.saveJob);
router.delete("/saved-jobs/:jobId", requireRole("candidate"), controller.unsaveJob);

module.exports = router;