const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const maintenanceHistorySchema = new mongoose.Schema(
  {
    _id: { type: String, default: uuidv4 },
    ticket_id: { type: String, ref: "MaintenanceTicket", required: true, index: true },
    logged_by_id: { type: String, ref: "User", required: true },
    action_taken: { type: String, required: true },
    parts_replaced: { type: String },
    cost: { type: Number, default: 0 },
    logged_at: { type: Date, default: Date.now },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

const maintenanceTicketSchema = new mongoose.Schema(
  {
    _id: { type: String, default: uuidv4 },
    organization_id: { type: String, ref: "Organization", required: true, index: true },
    ticket_number: { type: String, required: true, index: true },
    asset_id: { type: String, ref: "Asset", required: true, index: true },
    requested_by_user_id: { type: String, ref: "User", required: true },
    assigned_technician_id: { type: String, ref: "User" },
    contractor_id: { type: String, ref: "Contractor" },
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      default: "MEDIUM",
    },
    maintenance_type: {
      type: String,
      enum: ["PREVENTATIVE", "CORRECTIVE", "EMERGENCY", "CALIBRATION", "REPAIR", "REPLACEMENT"],
      default: "CORRECTIVE",
    },
    issue_description: { type: String, required: true },
    resolution_notes: { type: String },
    status: {
      type: String,
      enum: ["OPEN", "IN_PROGRESS", "WORK_STARTED", "WORK_COMPLETED", "INSPECTION_PENDING", "VERIFIED", "RESOLVED", "CLOSED"],
      default: "OPEN",
      index: true,
    },
    total_cost: { type: Number, default: 0 },
    downtime_hours: { type: Number, default: 0 },
    resolved_at: { type: Date },
    history_logs: [maintenanceHistorySchema],
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

module.exports = {
  MaintenanceTicket: mongoose.model("MaintenanceTicket", maintenanceTicketSchema),
  MaintenanceHistory: mongoose.model("MaintenanceHistory", maintenanceHistorySchema),
};
