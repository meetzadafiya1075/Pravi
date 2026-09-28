const Asset = require("../models/Asset");
const InfrastructureProject = require("../models/InfrastructureProject");
const InfrastructureInspection = require("../models/InfrastructureInspection");
const { MaintenanceTicket } = require("../models/MaintenanceTicket");
const { Audit } = require("../models/Audit");
const Department = require("../models/Department");
const Complaint = require("../models/Complaint");

exports.getMetrics = async (req, res, next) => {
  try {
    const orgId = req.user.organization_id;

    // 1. Total assets and total valuation
    const [assetStats] = await Asset.aggregate([
      { $match: { organization_id: orgId, is_deleted: false } },
      {
        $group: {
          _id: null,
          total_count: { $sum: 1 },
          total_valuation: { $sum: "$current_book_value" },
        },
      },
    ]);

    const totalAssets = assetStats ? assetStats.total_count : 0;
    const totalValuation = assetStats ? assetStats.total_valuation : 0;

    // 2. Status distribution
    const statusAgg = await Asset.aggregate([
      { $match: { organization_id: orgId, is_deleted: false } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    const statusDist = {};
    statusAgg.forEach((item) => {
      if (item._id) statusDist[item._id] = item.count;
    });

    // 3. Condition distribution
    const condAgg = await Asset.aggregate([
      { $match: { organization_id: orgId, is_deleted: false } },
      { $group: { _id: "$condition", count: { $sum: 1 } } },
    ]);
    const condDist = {};
    condAgg.forEach((item) => {
      if (item._id) condDist[item._id] = item.count;
    });

    const criticalAssets = condDist["CRITICAL"] || 0;
    const needsMaintenanceAssets = condDist["NEEDS_MAINTENANCE"] || 0;

    // 4. Criticality distribution
    const critAgg = await Asset.aggregate([
      { $match: { organization_id: orgId, is_deleted: false } },
      { $group: { _id: "$criticality", count: { $sum: 1 } } },
    ]);
    const criticalityDist = {};
    critAgg.forEach((item) => {
      if (item._id) criticalityDist[item._id] = item.count;
    });

    // 5. Active Projects & Completed Projects
    const activeProjects = await InfrastructureProject.countDocuments({
      organization_id: orgId,
      status: { $in: ["ACTIVE", "APPROVED", "UNDER_CONSTRUCTION"] },
    });
    const completedProjects = await InfrastructureProject.countDocuments({
      organization_id: orgId,
      status: "COMPLETED",
    });

    // 6. Inspections Due / Total Inspections
    const inspectionsDue = await InfrastructureInspection.countDocuments({
      organization_id: orgId,
    });

    // 7. Open Maintenance Tickets
    const openTickets = await MaintenanceTicket.countDocuments({
      organization_id: orgId,
      status: { $in: ["OPEN", "IN_PROGRESS", "WORK_STARTED", "INSPECTION_PENDING"] },
    });

    // 8. Open Public Complaints / Issues
    const openIssues = await Complaint.countDocuments({
      organization_id: orgId,
      status: { $in: ["REPORTED", "ASSIGNED", "INSPECTION", "MAINTENANCE"] },
    });

    // 9. Pending Audits
    const pendingAudits = await Audit.countDocuments({
      organization_id: orgId,
      status: { $in: ["PLANNED", "IN_PROGRESS"] },
    });

    // 10. Department distribution
    const deptAgg = await Asset.aggregate([
      { $match: { organization_id: orgId, is_deleted: false, department_id: { $ne: null } } },
      { $group: { _id: "$department_id", count: { $sum: 1 } } },
    ]);
    const departments = await Department.find({ organization_id: orgId }).select("name _id");
    const deptNameMap = {};
    departments.forEach((d) => {
      deptNameMap[d.id || d._id] = d.name;
    });
    const deptDist = {};
    deptAgg.forEach((item) => {
      const name = deptNameMap[item._id] || "Other Department";
      deptDist[name] = item.count;
    });

    // 11. District distribution
    const distAgg = await Asset.aggregate([
      { $match: { organization_id: orgId, is_deleted: false, district: { $ne: null } } },
      { $group: { _id: "$district", count: { $sum: 1 } } },
    ]);
    const districtDist = {};
    distAgg.forEach((item) => {
      if (item._id) districtDist[item._id] = item.count;
    });

    // 12. Category distribution
    const catAgg = await Asset.aggregate([
      { $match: { organization_id: orgId, is_deleted: false } },
      {
        $lookup: {
          from: "assetcategories",
          localField: "category_id",
          foreignField: "_id",
          as: "cat",
        },
      },
      { $unwind: { path: "$cat", preserveNullAndEmptyArrays: true } },
      { $group: { _id: "$cat.name", count: { $sum: 1 } } },
    ]);
    const catDist = {};
    catAgg.forEach((item) => {
      if (item._id) catDist[item._id] = item.count;
    });

    res.json({
      total_assets: totalAssets,
      total_valuation: totalValuation,
      assets_in_use: statusDist["OPERATIONAL"] || statusDist["IN_USE"] || 0,
      assets_under_maintenance: statusDist["UNDER_MAINTENANCE"] || 0,
      assets_in_stock: statusDist["COMMISSIONED"] || statusDist["IN_STOCK"] || 0,
      critical_assets: criticalAssets,
      needs_maintenance_assets: needsMaintenanceAssets,
      active_projects: activeProjects,
      completed_projects: completedProjects,
      inspections_due: inspectionsDue,
      open_tickets: openTickets,
      open_issues: openIssues,
      pending_audits: pendingAudits,
      status_distribution: statusDist,
      category_distribution: catDist,
      condition_distribution: condDist,
      criticality_distribution: criticalityDist,
      department_distribution: deptDist,
      district_distribution: districtDist,
    });
  } catch (err) {
    next(err);
  }
};
