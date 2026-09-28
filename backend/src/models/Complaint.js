const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const complaintSchema = new mongoose.Schema(
  {
    _id: { type: String, default: uuidv4 },
    organization_id: { type: String, ref: "Organization", required: true, index: true },
    complaint_id: { type: String, required: true, unique: true, index: true },
    asset_id: { type: String, ref: "Asset", index: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    location: { type: String },
    district: { type: String, index: true },
    zone: { type: String },
    ward: { type: String },
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      default: "MEDIUM",
    },
    reported_by_name: { type: String, default: "Citizen / Field Reporter" },
    reported_by_phone: { type: String },
    reported_by_email: { type: String },
    department_id: { type: String, ref: "Department", index: true },
    assigned_officer_id: { type: String, ref: "User" },
    status: {
      type: String,
      enum: ["REPORTED", "ASSIGNED", "INSPECTION", "MAINTENANCE", "RESOLVED", "VERIFIED", "CLOSED"],
      default: "REPORTED",
      index: true,
    },
    resolution: { type: String },
    resolved_at: { type: Date },
    attachments: [{ type: String }],
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

module.exports = mongoose.model("Complaint", complaintSchema);
