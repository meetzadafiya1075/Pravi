const Complaint = require("../models/Complaint");
const Asset = require("../models/Asset");
const { MaintenanceTicket } = require("../models/MaintenanceTicket");

exports.listComplaints = async (req, res, next) => {
  try {
    const { status, district, department_id } = req.query;
    const query = { organization_id: req.user.organization_id };
    if (status) query.status = status.toUpperCase();
    if (district) query.district = district;
    if (department_id) query.department_id = department_id;

    const complaints = await Complaint.find(query).sort({ createdAt: -1 });
    res.json(complaints);
  } catch (err) {
    next(err);
  }
};

exports.createComplaint = async (req, res, next) => {
  try {
    const {
      asset_id,
      title,
      description,
      location,
      district,
      zone,
      ward,
      priority,
      reported_by_name,
      reported_by_phone,
      reported_by_email,
      department_id,
    } = req.body;

    const complaintId = `GRV-${Date.now().toString().slice(-6)}`;
    const complaint = await Complaint.create({
      organization_id: req.user.organization_id,
      complaint_id: complaintId,
      asset_id: asset_id || null,
      title,
      description,
      location,
      district,
      zone,
      ward,
      priority: (priority || "MEDIUM").toUpperCase(),
      reported_by_name: reported_by_name || "Citizen / Officer",
      reported_by_phone,
      reported_by_email,
      department_id: department_id || null,
      status: "REPORTED",
    });

    res.status(201).json(complaint);
  } catch (err) {
    next(err);
  }
};

exports.updateComplaint = async (req, res, next) => {
  try {
    const { status, resolution, assigned_officer_id, trigger_maintenance } = req.body;
    const complaint = await Complaint.findOne({
      _id: req.params.id,
      organization_id: req.user.organization_id,
    });
    if (!complaint) {
      return res.status(404).json({ detail: `Complaint '${req.params.id}' not found` });
    }

    if (status) complaint.status = status.toUpperCase();
    if (resolution) complaint.resolution = resolution;
    if (assigned_officer_id) complaint.assigned_officer_id = assigned_officer_id;

    if (["RESOLVED", "CLOSED"].includes(complaint.status)) {
      complaint.resolved_at = new Date();
    }

    // Optionally auto-create maintenance ticket if grievance requires field repair
    if (trigger_maintenance && complaint.asset_id && complaint.status === "MAINTENANCE") {
      const ticketNumber = `TICK-${Date.now().toString().slice(-6)}`;
      await MaintenanceTicket.create({
        organization_id: req.user.organization_id,
        ticket_number: ticketNumber,
        asset_id: complaint.asset_id,
        requested_by_user_id: req.user.id || req.user._id,
        priority: complaint.priority,
        maintenance_type: "CORRECTIVE",
        issue_description: `Public Grievance ${complaint.complaint_id}: ${complaint.title} - ${complaint.description}`,
        status: "OPEN",
      });
    }

    await complaint.save();
    res.json(complaint);
  } catch (err) {
    next(err);
  }
};
