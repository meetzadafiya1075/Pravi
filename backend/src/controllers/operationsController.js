const Asset = require("../models/Asset");
const AssetTransfer = require("../models/AssetTransfer");
const { MaintenanceTicket, MaintenanceHistory } = require("../models/MaintenanceTicket");
const Warranty = require("../models/Warranty");
const AssetStatusHistory = require("../models/AssetStatusHistory");
const AuditService = require("../services/auditService");

// 1. Transfers
exports.listTransfers = async (req, res, next) => {
  try {
    const transfers = await AssetTransfer.find({
      organization_id: req.user.organization_id,
    }).sort({ initiated_at: -1 });
    res.json(transfers);
  } catch (err) {
    next(err);
  }
};

exports.createTransfer = async (req, res, next) => {
  try {
    const { asset_id, target_department_id, target_location_id, notes } = req.body;
    const asset = await Asset.findOne({
      _id: asset_id,
      organization_id: req.user.organization_id,
    });
    if (!asset) {
      return res.status(404).json({ detail: `Asset '${asset_id}' not found` });
    }

    if (!asset.department_id) {
      return res.status(409).json({ detail: "Asset has no assigned source department to transfer from." });
    }

    const transfer = await AssetTransfer.create({
      organization_id: req.user.organization_id,
      asset_id: asset.id,
      source_department_id: asset.department_id,
      target_department_id,
      source_location_id: asset.location_id,
      target_location_id,
      initiated_by_user_id: req.user.id || req.user._id,
      status: "PENDING",
      notes,
    });

    const prevStatus = asset.status;
    asset.status = "TRANSFERRED";
    asset.version = (asset.version || 1) + 1;
    await asset.save();

    await AssetStatusHistory.create({
      organization_id: req.user.organization_id,
      asset_id: asset.id,
      from_status: prevStatus,
      to_status: "TRANSFERRED",
      actor_id: req.user.id || req.user._id,
      reason: `Transfer initiated to department ${target_department_id}`,
    });

    res.status(201).json(transfer);
  } catch (err) {
    next(err);
  }
};

exports.approveTransfer = async (req, res, next) => {
  try {
    const { status, notes } = req.body;
    const transfer = await AssetTransfer.findOne({
      _id: req.params.id,
      organization_id: req.user.organization_id,
    });
    if (!transfer) {
      return res.status(404).json({ detail: `Transfer '${req.params.id}' not found` });
    }

    if (transfer.status !== "PENDING") {
      return res.status(409).json({ detail: `Transfer is already in '${transfer.status}' status.` });
    }

    const asset = await Asset.findById(transfer.asset_id);

    if (status === "APPROVED") {
      transfer.status = "COMPLETED";
      transfer.approved_by_user_id = req.user.id || req.user._id;
      transfer.completed_at = new Date();

      if (asset) {
        asset.department_id = transfer.target_department_id;
        asset.location_id = transfer.target_location_id;
        asset.status = "OPERATIONAL";
        asset.version = (asset.version || 1) + 1;
        await asset.save();

        await AssetStatusHistory.create({
          organization_id: req.user.organization_id,
          asset_id: asset.id,
          from_status: "TRANSFERRED",
          to_status: "OPERATIONAL",
          actor_id: req.user.id || req.user._id,
          reason: `Transfer completed to new department jurisdiction. ${notes || ""}`.trim(),
        });
      }
    } else {
      transfer.status = "REJECTED";
      transfer.approved_by_user_id = req.user.id || req.user._id;
      transfer.completed_at = new Date();

      if (asset) {
        asset.status = "OPERATIONAL";
        asset.version = (asset.version || 1) + 1;
        await asset.save();
      }
    }

    await transfer.save();
    res.json(transfer);
  } catch (err) {
    next(err);
  }
};

// 2. Maintenance Tickets
exports.listMaintenance = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = { organization_id: req.user.organization_id };
    if (status) query.status = status.toUpperCase();

    const tickets = await MaintenanceTicket.find(query).sort({ createdAt: -1 });
    res.json(tickets);
  } catch (err) {
    next(err);
  }
};

exports.createMaintenance = async (req, res, next) => {
  try {
    const {
      asset_id,
      assigned_technician_id,
      contractor_id,
      priority,
      maintenance_type,
      issue_description,
    } = req.body;

    const asset = await Asset.findOne({
      _id: asset_id,
      organization_id: req.user.organization_id,
    });
    if (!asset) {
      return res.status(404).json({ detail: `Asset '${asset_id}' not found` });
    }

    const ticketNumber = `TICK-${Date.now().toString().slice(-6)}`;
    const ticket = await MaintenanceTicket.create({
      organization_id: req.user.organization_id,
      ticket_number: ticketNumber,
      asset_id: asset.id,
      requested_by_user_id: req.user.id || req.user._id,
      assigned_technician_id: assigned_technician_id || null,
      contractor_id: contractor_id || null,
      priority: (priority || "MEDIUM").toUpperCase(),
      maintenance_type: (maintenance_type || "CORRECTIVE").toUpperCase(),
      issue_description,
      status: "OPEN",
    });

    const prevStatus = asset.status;
    asset.status = "UNDER_MAINTENANCE";
    asset.version = (asset.version || 1) + 1;
    await asset.save();

    await AssetStatusHistory.create({
      organization_id: req.user.organization_id,
      asset_id: asset.id,
      from_status: prevStatus,
      to_status: "UNDER_MAINTENANCE",
      actor_id: req.user.id || req.user._id,
      reason: `Maintenance ticket ${ticketNumber} raised: ${issue_description}`,
    });

    res.status(201).json(ticket);
  } catch (err) {
    next(err);
  }
};

exports.updateMaintenance = async (req, res, next) => {
  try {
    const {
      status,
      resolution_notes,
      total_cost,
      downtime_hours,
      assigned_technician_id,
      action_taken,
      parts_replaced,
    } = req.body;

    const ticket = await MaintenanceTicket.findOne({
      _id: req.params.id,
      organization_id: req.user.organization_id,
    });
    if (!ticket) {
      return res.status(404).json({ detail: `Maintenance ticket '${req.params.id}' not found` });
    }

    if (status) ticket.status = status.toUpperCase();
    if (resolution_notes !== undefined) ticket.resolution_notes = resolution_notes;
    if (total_cost !== undefined) ticket.total_cost = Number(total_cost);
    if (downtime_hours !== undefined) ticket.downtime_hours = Number(downtime_hours);
    if (assigned_technician_id !== undefined) ticket.assigned_technician_id = assigned_technician_id;

    if (["RESOLVED", "CLOSED", "VERIFIED"].includes(ticket.status)) {
      ticket.resolved_at = new Date();
      // Restore asset status to OPERATIONAL
      const asset = await Asset.findById(ticket.asset_id);
      if (asset && asset.status === "UNDER_MAINTENANCE") {
        asset.status = "OPERATIONAL";
        asset.condition = "GOOD";
        asset.version = (asset.version || 1) + 1;
        await asset.save();

        await AssetStatusHistory.create({
          organization_id: req.user.organization_id,
          asset_id: asset.id,
          from_status: "UNDER_MAINTENANCE",
          to_status: "OPERATIONAL",
          actor_id: req.user.id || req.user._id,
          reason: `Maintenance completed under ticket ${ticket.ticket_number}`,
        });
      }
    }

    // Append log if action provided
    if (action_taken) {
      ticket.history_logs.push({
        ticket_id: ticket.id,
        logged_by_id: req.user.id || req.user._id,
        action_taken,
        parts_replaced: parts_replaced || "",
        cost: total_cost || 0,
        logged_at: new Date(),
      });
    }

    await ticket.save();
    res.json(ticket);
  } catch (err) {
    next(err);
  }
};

exports.addMaintenanceHistory = async (req, res, next) => {
  try {
    const { action_taken, parts_replaced, cost } = req.body;
    const ticket = await MaintenanceTicket.findOne({
      _id: req.params.id,
      organization_id: req.user.organization_id,
    });
    if (!ticket) {
      return res.status(404).json({ detail: `Ticket '${req.params.id}' not found` });
    }

    const logEntry = {
      ticket_id: ticket.id,
      logged_by_id: req.user.id || req.user._id,
      action_taken,
      parts_replaced: parts_replaced || "",
      cost: cost ? Number(cost) : 0,
      logged_at: new Date(),
    };

    ticket.history_logs.push(logEntry);
    if (cost) ticket.total_cost = (ticket.total_cost || 0) + Number(cost);
    await ticket.save();

    res.status(201).json(logEntry);
  } catch (err) {
    next(err);
  }
};

// 3. Warranties
exports.listWarranties = async (req, res, next) => {
  try {
    const warranties = await Warranty.find({
      organization_id: req.user.organization_id,
    });
    res.json(warranties);
  } catch (err) {
    next(err);
  }
};

exports.createWarranty = async (req, res, next) => {
  try {
    const { asset_id, vendor_id, contract_number, coverage_details, start_date, end_date } = req.body;
    const warranty = await Warranty.create({
      organization_id: req.user.organization_id,
      asset_id,
      vendor_id,
      contract_number,
      coverage_details,
      start_date: new Date(start_date),
      end_date: new Date(end_date),
    });
    res.status(201).json(warranty);
  } catch (err) {
    next(err);
  }
};
