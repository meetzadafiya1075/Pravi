const Asset = require("../models/Asset");
const AssetCategory = require("../models/AssetCategory");
const Contractor = require("../models/Contractor");
const AssetStatusHistory = require("../models/AssetStatusHistory");
const AssetAssignment = require("../models/AssetAssignment");
const QrService = require("../services/qrService");
const AuditService = require("../services/auditService");

// Valid government lifecycle transitions + backward compatible legacy states
const VALID_TRANSITIONS = {
  // Government Lifecycle
  PROPOSED: ["PROJECT_APPROVED", "RETIRED", "DISPOSED"],
  PROJECT_APPROVED: ["PROCUREMENT", "PROPOSED", "RETIRED"],
  PROCUREMENT: ["UNDER_CONSTRUCTION", "COMMISSIONED", "OPERATIONAL"],
  UNDER_CONSTRUCTION: ["COMMISSIONED", "DELAYED", "RETIRED"],
  COMMISSIONED: ["OPERATIONAL", "UNDER_MAINTENANCE", "IN_USE"],
  OPERATIONAL: ["UNDER_MAINTENANCE", "RENOVATION", "TRANSFERRED", "DECOMMISSIONED", "RETIRED"],
  UNDER_MAINTENANCE: ["OPERATIONAL", "IN_USE", "RENOVATION", "DECOMMISSIONED", "RETIRED"],
  RENOVATION: ["OPERATIONAL", "DECOMMISSIONED", "RETIRED"],
  DECOMMISSIONED: ["DISPOSED", "RETIRED"],
  DISPOSED: [],

  // Legacy mappings for backward compatibility
  PLANNED: ["ORDERED", "PROCUREMENT", "OPERATIONAL"],
  ORDERED: ["RECEIVED", "UNDER_CONSTRUCTION"],
  RECEIVED: ["IN_STOCK", "COMMISSIONED"],
  IN_STOCK: ["ASSIGNED", "IN_USE", "OPERATIONAL", "UNDER_MAINTENANCE", "RETIRED"],
  ASSIGNED: ["IN_USE", "OPERATIONAL", "IN_STOCK"],
  IN_USE: ["IN_STOCK", "OPERATIONAL", "UNDER_MAINTENANCE", "TRANSFERRED", "RETIRED", "DECOMMISSIONED"],
  TRANSFERRED: ["IN_USE", "OPERATIONAL", "IN_STOCK"],
  RETIRED: ["DISPOSED"],
};

// 1. Categories
exports.listCategories = async (req, res, next) => {
  try {
    const categories = await AssetCategory.find({
      organization_id: req.user.organization_id,
    }).sort({ name: 1 });
    res.json(categories);
  } catch (err) {
    next(err);
  }
};

exports.createCategory = async (req, res, next) => {
  try {
    const { name, code, parent_id, depreciation_method, default_useful_life_months, custom_field_schema } = req.body;
    const existing = await AssetCategory.findOne({
      organization_id: req.user.organization_id,
      code,
    });
    if (existing) {
      return res.status(409).json({ detail: `Category code '${code}' already exists` });
    }

    const cat = await AssetCategory.create({
      organization_id: req.user.organization_id,
      name,
      code,
      parent_id: parent_id || null,
      depreciation_method: depreciation_method || "STRAIGHT_LINE",
      default_useful_life_months: default_useful_life_months || 360,
      custom_field_schema: custom_field_schema || [],
    });

    res.status(201).json(cat);
  } catch (err) {
    next(err);
  }
};

// 2. Vendors / Contractors
exports.listVendors = async (req, res, next) => {
  try {
    const vendors = await Contractor.find({
      organization_id: req.user.organization_id,
    }).sort({ name: 1 });
    res.json(vendors);
  } catch (err) {
    next(err);
  }
};

exports.createVendor = async (req, res, next) => {
  try {
    const { name, contact_person, email, phone, address, vendor_type, contract_value } = req.body;
    const vendor = await Contractor.create({
      organization_id: req.user.organization_id,
      name,
      contact_person,
      email,
      phone,
      address,
      vendor_type: vendor_type || "INFRASTRUCTURE_CONTRACTOR",
      contract_value: contract_value || 0,
    });
    res.status(201).json(vendor);
  } catch (err) {
    next(err);
  }
};

// 3. Assets List & Create
exports.listAssets = async (req, res, next) => {
  try {
    const {
      status: statusFilter,
      category_id,
      department_id,
      district,
      condition,
      criticality,
      project_id,
      q,
    } = req.query;

    const query = {
      organization_id: req.user.organization_id,
      is_deleted: false,
    };

    // Scoping by user role
    if (req.userRole?.code === "DEPARTMENT_MANAGER" && req.user.department_id) {
      query.department_id = req.user.department_id;
    } else if (department_id) {
      query.department_id = department_id;
    }

    if (req.userRole?.code === "DISTRICT_OFFICER" && req.user.district) {
      query.district = req.user.district;
    } else if (district) {
      query.district = district;
    }

    if (statusFilter) {
      query.status = statusFilter.toUpperCase();
    }
    if (category_id) {
      query.category_id = category_id;
    }
    if (condition) {
      query.condition = condition.toUpperCase();
    }
    if (criticality) {
      query.criticality = criticality.toUpperCase();
    }
    if (project_id) {
      query.project_id = project_id;
    }
    if (q) {
      const searchRegex = new RegExp(q, "i");
      query.$or = [
        { _id: q },
        { name: searchRegex },
        { asset_tag: searchRegex },
        { serial_number: searchRegex },
        { district: searchRegex },
        { address: searchRegex },
      ];
    }

    const assets = await Asset.find(query).sort({ createdAt: -1 });
    res.json(assets);
  } catch (err) {
    next(err);
  }
};

exports.createAsset = async (req, res, next) => {
  try {
    const orgId = req.user.organization_id;
    const body = req.body;

    const existing = await Asset.findOne({
      organization_id: orgId,
      asset_tag: body.asset_tag,
    });
    if (existing) {
      return res.status(409).json({ detail: `Asset tag '${body.asset_tag}' already exists` });
    }

    const initialStatus = body.status ? body.status.toUpperCase() : "OPERATIONAL";
    const bookValue = body.purchase_cost !== undefined ? Number(body.purchase_cost) : 0;

    const asset = new Asset({
      organization_id: orgId,
      asset_tag: body.asset_tag,
      name: body.name,
      description: body.description || "",
      serial_number: body.serial_number,
      category_id: body.category_id,
      status: initialStatus,
      department_id: body.department_id || null,
      location_id: body.location_id || null,
      vendor_id: body.vendor_id || body.contractor_id || null,
      division: body.division || null,
      district: body.district || null,
      zone: body.zone || null,
      ward: body.ward || null,
      facility: body.facility || null,
      address: body.address || null,
      latitude: body.latitude ? Number(body.latitude) : null,
      longitude: body.longitude ? Number(body.longitude) : null,
      purchase_date: body.purchase_date ? new Date(body.purchase_date) : null,
      commissioning_date: body.commissioning_date ? new Date(body.commissioning_date) : null,
      purchase_cost: bookValue,
      salvage_value: body.salvage_value ? Number(body.salvage_value) : 0,
      useful_life_months: body.useful_life_months ? Number(body.useful_life_months) : 360,
      current_book_value: bookValue,
      custom_attributes: body.custom_attributes || {},
      condition: (body.condition || "GOOD").toUpperCase(),
      criticality: (body.criticality || "MEDIUM").toUpperCase(),
      project_id: body.project_id || null,
      tender_id: body.tender_id || null,
      funding_source: body.funding_source || "State Infrastructure Budget",
      funding_scheme: body.funding_scheme || null,
      version: 1,
    });

    await asset.save();

    // Generate QR Code URL
    const qrDataUrl = await QrService.generateAssetQrBase64(asset.id, asset.asset_tag);
    asset.qr_code_url = qrDataUrl;
    await asset.save();

    // Record initial status history
    await AssetStatusHistory.create({
      organization_id: orgId,
      asset_id: asset.id,
      from_status: "NONE",
      to_status: initialStatus,
      actor_id: req.user.id || req.user._id,
      reason: "Infrastructure asset commissioned in public registry",
    });

    // Record audit log
    await AuditService.logAction({
      organizationId: orgId,
      actorId: req.user.id || req.user._id,
      action: "ASSET_CREATED",
      entityType: "Asset",
      entityId: asset.id,
      afterState: { asset_tag: asset.asset_tag, name: asset.name, status: asset.status },
    });

    res.status(201).json(asset);
  } catch (err) {
    next(err);
  }
};

exports.getAsset = async (req, res, next) => {
  try {
    const asset = await Asset.findOne({
      $or: [{ _id: req.params.id }, { asset_tag: req.params.id }],
      organization_id: req.user.organization_id,
      is_deleted: false,
    });
    if (!asset) {
      return res.status(404).json({ detail: `Asset '${req.params.id}' not found` });
    }
    res.json(asset);
  } catch (err) {
    next(err);
  }
};

exports.getAssetQr = async (req, res, next) => {
  try {
    const asset = await Asset.findOne({
      $or: [{ _id: req.params.id }, { asset_tag: req.params.id }],
      organization_id: req.user.organization_id,
    });
    if (!asset) {
      return res.status(404).json({ detail: `Asset '${req.params.id}' not found` });
    }

    const qrDataUrl = await QrService.generateAssetQrBase64(asset.id, asset.asset_tag);
    res.json({
      asset_id: asset.id,
      asset_tag: asset.asset_tag,
      qr_data_url: qrDataUrl,
    });
  } catch (err) {
    next(err);
  }
};

exports.getAssetHistory = async (req, res, next) => {
  try {
    const history = await AssetStatusHistory.find({
      asset_id: req.params.id,
      organization_id: req.user.organization_id,
    }).sort({ createdAt: -1 });
    res.json(history);
  } catch (err) {
    next(err);
  }
};

exports.transitionAsset = async (req, res, next) => {
  try {
    const { to_status, reason, extra_metadata } = req.body;
    const targetStatus = to_status.toUpperCase();

    const asset = await Asset.findOne({
      _id: req.params.id,
      organization_id: req.user.organization_id,
    });
    if (!asset) {
      return res.status(404).json({ detail: `Asset '${req.params.id}' not found` });
    }

    const currentStatus = asset.status;
    const allowed = VALID_TRANSITIONS[currentStatus] || [];

    // Allow super admin or authorized transitions
    if (!allowed.includes(targetStatus) && req.userRole?.code !== "SUPER_ADMIN") {
      return res.status(400).json({
        detail: `Invalid lifecycle transition from ${currentStatus} to ${targetStatus}. Allowed targets: ${allowed.join(", ") || "None"}`,
      });
    }

    const prevStatus = asset.status;
    asset.status = targetStatus;
    asset.version = (asset.version || 1) + 1;
    await asset.save();

    await AssetStatusHistory.create({
      organization_id: req.user.organization_id,
      asset_id: asset.id,
      from_status: prevStatus,
      to_status: targetStatus,
      actor_id: req.user.id || req.user._id,
      reason: reason || `Lifecycle transition to ${targetStatus}`,
      extra_metadata: extra_metadata || {},
    });

    await AuditService.logAction({
      organizationId: req.user.organization_id,
      actorId: req.user.id || req.user._id,
      action: `ASSET_TRANSITION_${prevStatus}_TO_${targetStatus}`,
      entityType: "Asset",
      entityId: asset.id,
      beforeState: { status: prevStatus },
      afterState: { status: targetStatus },
    });

    res.json(asset);
  } catch (err) {
    next(err);
  }
};

exports.assignAsset = async (req, res, next) => {
  try {
    const { assigned_to_user_id, return_due_date, condition_on_assignment } = req.body;
    const asset = await Asset.findOne({
      _id: req.params.id,
      organization_id: req.user.organization_id,
    });
    if (!asset) {
      return res.status(404).json({ detail: `Asset '${req.params.id}' not found` });
    }

    const assignment = await AssetAssignment.create({
      organization_id: req.user.organization_id,
      asset_id: asset.id,
      assigned_to_user_id,
      assigned_by_user_id: req.user.id || req.user._id,
      return_due_date: return_due_date ? new Date(return_due_date) : null,
      condition_on_assignment: condition_on_assignment || asset.condition,
      status: "ACTIVE",
    });

    asset.responsible_officer_id = assigned_to_user_id;
    await asset.save();

    res.status(201).json(assignment);
  } catch (err) {
    next(err);
  }
};

exports.returnAsset = async (req, res, next) => {
  try {
    const { condition_on_return } = req.body;
    const assignment = await AssetAssignment.findOne({
      asset_id: req.params.id,
      organization_id: req.user.organization_id,
      status: "ACTIVE",
    }).sort({ createdAt: -1 });

    if (!assignment) {
      return res.status(404).json({ detail: "No active assignment found for this asset" });
    }

    assignment.status = "RETURNED";
    assignment.returned_date = new Date();
    assignment.condition_on_return = condition_on_return || "";
    await assignment.save();

    const asset = await Asset.findById(req.params.id);
    if (asset) {
      if (condition_on_return) asset.condition = condition_on_return.toUpperCase();
      asset.responsible_officer_id = null;
      await asset.save();
    }

    res.json(assignment);
  } catch (err) {
    next(err);
  }
};
