const express = require("express");
const router = express.Router();
const projectController = require("../controllers/projectController");
const { authenticateToken, requirePermission } = require("../middleware/auth");

router.get("", authenticateToken, projectController.listProjects);
router.post("", authenticateToken, requirePermission("asset:create"), projectController.createProject);
router.get("/:id", authenticateToken, projectController.getProject);

module.exports = router;
