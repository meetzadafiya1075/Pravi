const express = require("express");
const router = express.Router();
const operationsController = require("../controllers/operationsController");
const { authenticateToken, requirePermission } = require("../middleware/auth");

// Transfers
router.get("/transfers", authenticateToken, operationsController.listTransfers);
router.post("/transfers", authenticateToken, requirePermission("asset:transfer_request"), operationsController.createTransfer);
router.post("/transfers/:id/approve", authenticateToken, requirePermission("asset:transfer_approve"), operationsController.approveTransfer);

// Maintenance Tickets
router.get("/maintenance", authenticateToken, requirePermission("maintenance:read"), operationsController.listMaintenance);
router.post("/maintenance", authenticateToken, requirePermission("maintenance:create"), operationsController.createMaintenance);
router.patch("/maintenance/:id", authenticateToken, requirePermission("maintenance:update"), operationsController.updateMaintenance);
router.post("/maintenance/:id/history", authenticateToken, requirePermission("maintenance:update"), operationsController.addMaintenanceHistory);

// Warranties
router.get("/warranties", authenticateToken, operationsController.listWarranties);
router.post("/warranties", authenticateToken, requirePermission("asset:create"), operationsController.createWarranty);

module.exports = router;
