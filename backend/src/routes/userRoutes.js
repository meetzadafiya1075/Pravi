const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { authenticateToken, requirePermission } = require("../middleware/auth");

router.get("", authenticateToken, requirePermission("user:manage"), userController.listUsers);
router.post("", authenticateToken, requirePermission("user:manage"), userController.createUser);
router.get("/roles", authenticateToken, userController.listRoles);

module.exports = router;
