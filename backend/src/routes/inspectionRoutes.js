const express = require("express");
const router = express.Router();
const inspectionController = require("../controllers/inspectionController");
const { authenticateToken, requirePermission } = require("../middleware/auth");

router.get("", authenticateToken, inspectionController.listInspections);
router.post("", authenticateToken, requirePermission("audit:scan_verify"), inspectionController.recordInspection);
router.get("/asset/:asset_id", authenticateToken, inspectionController.listAssetInspections);

module.exports = router;
