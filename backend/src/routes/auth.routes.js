const express = require("express");
const router = express.Router();
const controller = require("../controllers/auth.controller");
const { authenticate } = require("../auth");

router.post("/login", controller.login);
router.post("/register", controller.register);
router.get("/me", authenticate, controller.me);
router.post("/refresh", authenticate, controller.refresh);
router.post("/change-password", authenticate, controller.changePassword);
router.post("/deactivate", authenticate, controller.deactivate);

module.exports = router;
