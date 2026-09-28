const { Audit, AuditItem } = require("../models/Audit");
const AuditLog = require("../models/AuditLog");
const Asset = require("../models/Asset");

exports.listAudits = async (req, res, next) => {
  try {
    const audits = await Audit.find({
      organization_id: req.user.organization_id,
    }).sort({ createdAt: -1 });
    res.json(audits);
  } catch (err) {
    next(err);
  }
};

exports.createAudit = async (req, res, next) => {
  try {
    const { title, audit_code, target_location_id, target_department_id, start_date, end_date, summary_notes } = req.body;

    const existing = await Audit.findOne({
      organization_id: req.user.organization_id,
      audit_code,
    });
    if (existing) {
      return res.status(409).json({ detail: `Audit code '${audit_code}' already exists` });
    }

    const audit = new Audit({
      organization_id: req.user.organization_id,
      title,
      audit_code,
      target_location_id: target_location_id || null,
      target_department_id: target_department_id || null,
      start_date: start_date ? new Date(start_date) : new Date(),
      end_date: end_date ? new Date(end_date) : null,
      lead_auditor_id: req.user.id || req.user._id,
      summary_notes,
      status: "IN_PROGRESS",
      items: [],
    });

    // Pre-populate matching assets
    const assetQuery = {
      organization_id: req.user.organization_id,
      is_deleted: false,
    };
    if (target_location_id) assetQuery.location_id = target_location_id;
    if (target_department_id) assetQuery.department_id = target_department_id;

    const matchingAssets = await Asset.find(assetQuery).select("_id");
    matchingAssets.forEach((a) => {
      audit.items.push({
        audit_id: audit.id,
        asset_id: a.id || a._id,
        verification_status: "PENDING",
      });
    });

    await audit.save();
    res.status(201).json(audit);
  } catch (err) {
    next(err);
  }
};

exports.scanAsset = async (req, res, next) => {
  try {
    const { asset_tag, verification_status, observed_location_id, remarks } = req.body;
    const audit = await Audit.findOne({
      _id: req.params.id,
      organization_id: req.user.organization_id,
    });
    if (!audit) {
      return res.status(404).json({ detail: `Audit '${req.params.id}' not found` });
    }

    const asset = await Asset.findOne({
      asset_tag,
      organization_id: req.user.organization_id,
    });
    if (!asset) {
      return res.status(404).json({ detail: `Asset with tag '${asset_tag}' not found` });
    }

    let item = audit.items.find((i) => i.asset_id === asset.id || i.asset_id === asset._id);
    if (!item) {
      audit.items.push({
        audit_id: audit.id,
        asset_id: asset.id,
        verification_status: (verification_status || "VERIFIED_OK").toUpperCase(),
        scanned_by_user_id: req.user.id || req.user._id,
        scanned_at: new Date(),
        observed_location_id: observed_location_id || asset.location_id,
        remarks,
      });
      item = audit.items[audit.items.length - 1];
    } else {
      item.verification_status = (verification_status || "VERIFIED_OK").toUpperCase();
      item.scanned_by_user_id = req.user.id || req.user._id;
      item.scanned_at = new Date();
      if (observed_location_id) item.observed_location_id = observed_location_id;
      if (remarks) item.remarks = remarks;
    }

    await audit.save();
    res.json(item);
  } catch (err) {
    next(err);
  }
};

exports.listAuditLogs = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || "50", 10), 100);
    const logs = await AuditLog.find({
      organization_id: req.user.organization_id,
    })
      .sort({ timestamp: -1 })
      .limit(limit);
    res.json(logs);
  } catch (err) {
    next(err);
  }
};
