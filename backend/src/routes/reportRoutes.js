const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");
const { authenticateToken, requirePermission } = require("../middleware/auth");

router.get("/export/assets", authenticateToken, requirePermission("report:export"), reportController.exportAssetRegister);
router.get("/export/audits", authenticateToken, requirePermission("report:export"), reportController.exportAuditLogs);

module.exports = router;
