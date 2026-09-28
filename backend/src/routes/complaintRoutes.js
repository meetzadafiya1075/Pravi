const express = require("express");
const router = express.Router();
const complaintController = require("../controllers/complaintController");
const { authenticateToken } = require("../middleware/auth");

router.get("", authenticateToken, complaintController.listComplaints);
router.post("", authenticateToken, complaintController.createComplaint);
router.patch("/:id", authenticateToken, complaintController.updateComplaint);

module.exports = router;
