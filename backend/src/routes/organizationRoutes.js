const express = require("express");
const router = express.Router();
const organizationController = require("../controllers/organizationController");
const { authenticateToken, requirePermission } = require("../middleware/auth");

router.get("/departments", authenticateToken, organizationController.listDepartments);
router.post("/departments", authenticateToken, requirePermission("user:manage"), organizationController.createDepartment);

router.get("/locations", authenticateToken, organizationController.listLocations);
router.post("/locations", authenticateToken, requirePermission("user:manage"), organizationController.createLocation);

router.get("/districts", authenticateToken, organizationController.listDistricts);
router.get("/zones", authenticateToken, organizationController.listZones);
router.get("/wards", authenticateToken, organizationController.listWards);

module.exports = router;
