const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const auditItemSchema = new mongoose.Schema(
  {
    _id: { type: String, default: uuidv4 },
    audit_id: { type: String, ref: "Audit", required: true, index: true },
    asset_id: { type: String, ref: "Asset", required: true, index: true },
    scanned_by_user_id: { type: String, ref: "User" },
    scanned_at: { type: Date },
    verification_status: {
      type: String,
      enum: ["PENDING", "VERIFIED_OK", "MISSING", "DAMAGED", "WRONG_LOCATION"],
      default: "PENDING",
    },
    observed_location_id: { type: String, ref: "Location" },
    remarks: { type: String },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

const auditSchema = new mongoose.Schema(
  {
    _id: { type: String, default: uuidv4 },
    organization_id: { type: String, ref: "Organization", required: true, index: true },
    title: { type: String, required: true },
    audit_code: { type: String, required: true, unique: true, index: true },
    target_location_id: { type: String, ref: "Location" },
    target_department_id: { type: String, ref: "Department" },
    status: {
      type: String,
      enum: ["PLANNED", "IN_PROGRESS", "RECONCILED", "CLOSED"],
      default: "IN_PROGRESS",
    },
    start_date: { type: Date, required: true },
    end_date: { type: Date },
    lead_auditor_id: { type: String, ref: "User", required: true },
    summary_notes: { type: String },
    items: [auditItemSchema],
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
  Audit: mongoose.model("Audit", auditSchema),
  AuditItem: mongoose.model("AuditItem", auditItemSchema),
};
