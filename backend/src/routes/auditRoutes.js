const express = require("express");
const router = express.Router();
const auditController = require("../controllers/auditController");
const { authenticateToken, requirePermission } = require("../middleware/auth");

router.get("", authenticateToken, requirePermission("audit:read"), auditController.listAudits);
router.post("", authenticateToken, requirePermission("audit:create"), auditController.createAudit);
router.post("/:id/scan", authenticateToken, requirePermission("audit:scan_verify"), auditController.scanAsset);
router.get("/logs", authenticateToken, requirePermission("audit:read"), auditController.listAuditLogs);

module.exports = router;
