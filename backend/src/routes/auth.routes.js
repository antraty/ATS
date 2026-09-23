const express = require("express");
const router = express.Router();
const controller = require("../controllers/auth.controller");
const { authenticate } = require("../auth");

router.post("/login", controller.login);
router.post("/register", controller.register);
router.get("/me", authenticate, controller.me);

module.exports = router;
