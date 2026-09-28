const express = require("express");
const router = express.Router();
const documentController = require("../controllers/documentController");
const { authenticateToken } = require("../middleware/auth");

router.post("/presign-upload", authenticateToken, documentController.presignUpload);
router.post("/confirm", authenticateToken, documentController.confirmDocument);
router.get("", authenticateToken, documentController.listDocuments);

module.exports = router;
