const InfrastructureInspection = require("../models/InfrastructureInspection");
const Asset = require("../models/Asset");
const AuditService = require("../services/auditService");

exports.listInspections = async (req, res, next) => {
  try {
    const inspections = await InfrastructureInspection.find({
      organization_id: req.user.organization_id,
    }).sort({ inspection_date: -1 });
    res.json(inspections);
  } catch (err) {
    next(err);
  }
};

exports.recordInspection = async (req, res, next) => {
  try {
    const {
      inspection_code,
      asset_id,
      inspection_date,
      condition,
      risk_level,
      observations,
      recommended_action,
      next_inspection_date,
    } = req.body;

    const asset = await Asset.findOne({
      _id: asset_id,
      organization_id: req.user.organization_id,
    });
    if (!asset) {
      return res.status(404).json({ detail: `Asset '${asset_id}' not found` });
    }

    const prevCondition = asset.condition;
    const targetCondition = condition.toUpperCase();
    const targetRisk = risk_level.toUpperCase();

    const inspection = await InfrastructureInspection.create({
      organization_id: req.user.organization_id,
      inspection_code,
      asset_id,
      inspector_id: req.user.id || req.user._id,
      inspection_date: inspection_date ? new Date(inspection_date) : new Date(),
      condition: targetCondition,
      risk_level: targetRisk,
      observations,
      recommended_action: recommended_action || null,
      next_inspection_date: next_inspection_date ? new Date(next_inspection_date) : null,
      status: "COMPLETED",
    });

    // Automatically synchronize asset physical condition and version
    asset.condition = targetCondition;
    if (targetCondition === "CRITICAL" && asset.criticality !== "CRITICAL") {
      asset.criticality = "HIGH";
    }
    asset.version = (asset.version || 1) + 1;
    await asset.save();

    await AuditService.logAction({
      organizationId: req.user.organization_id,
      actorId: req.user.id || req.user._id,
      action: "INSPECTION_RECORDED",
      entityType: "Asset",
      entityId: asset.id,
      beforeState: { condition: prevCondition },
      afterState: { condition: targetCondition, inspection_code },
    });

    res.status(201).json(inspection);
  } catch (err) {
    next(err);
  }
};

exports.listAssetInspections = async (req, res, next) => {
  try {
    const inspections = await InfrastructureInspection.find({
      asset_id: req.params.asset_id,
      organization_id: req.user.organization_id,
    }).sort({ inspection_date: -1 });
    res.json(inspections);
  } catch (err) {
    next(err);
  }
};
