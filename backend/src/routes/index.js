const express = require("express");
const router = express.Router();

const authRoutes = require("./authRoutes");
const dashboardRoutes = require("./dashboardRoutes");
const assetRoutes = require("./assetRoutes");
const projectRoutes = require("./projectRoutes");
const inspectionRoutes = require("./inspectionRoutes");
const operationsRoutes = require("./operationsRoutes");
const organizationRoutes = require("./organizationRoutes");
const userRoutes = require("./userRoutes");
const auditRoutes = require("./auditRoutes");
const documentRoutes = require("./documentRoutes");
const complaintRoutes = require("./complaintRoutes");
const reportRoutes = require("./reportRoutes");

// Mount V1 Subrouters
router.use("/auth", authRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/assets", assetRoutes);
router.use("/projects", projectRoutes);
router.use("/inspections", inspectionRoutes);
router.use("/operations", operationsRoutes);
router.use("/organizations", organizationRoutes);
router.use("/users", userRoutes);
router.use("/audits", auditRoutes);
router.use("/documents", documentRoutes);
router.use("/complaints", complaintRoutes);
router.use("/reports", reportRoutes);

// Direct contractor alias
router.use("/contractors", require("../controllers/assetController").listVendors);

module.exports = router;
