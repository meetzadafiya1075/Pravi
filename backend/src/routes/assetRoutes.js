const express = require("express");
const router = express.Router();
const assetController = require("../controllers/assetController");
const { authenticateToken, requirePermission } = require("../middleware/auth");

// Categories
router.get("/categories", authenticateToken, assetController.listCategories);
router.post("/categories", authenticateToken, requirePermission("asset:create"), assetController.createCategory);

// Vendors / Contractors
router.get("/vendors", authenticateToken, assetController.listVendors);
router.post("/vendors", authenticateToken, requirePermission("asset:create"), assetController.createVendor);

// Assets
router.get("", authenticateToken, requirePermission("asset:read"), assetController.listAssets);
router.post("", authenticateToken, requirePermission("asset:create"), assetController.createAsset);

router.get("/:id", authenticateToken, requirePermission("asset:read"), assetController.getAsset);
router.get("/:id/qr", authenticateToken, requirePermission("asset:read"), assetController.getAssetQr);
router.get("/:id/history", authenticateToken, requirePermission("asset:read"), assetController.getAssetHistory);
router.post("/:id/transition", authenticateToken, requirePermission("asset:update"), assetController.transitionAsset);
router.post("/:id/assign", authenticateToken, requirePermission("asset:assign"), assetController.assignAsset);
router.post("/:id/return", authenticateToken, requirePermission("asset:assign"), assetController.returnAsset);

module.exports = router;
