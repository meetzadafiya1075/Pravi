const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const inspectionSchema = new mongoose.Schema(
  {
    _id: { type: String, default: uuidv4 },
    organization_id: { type: String, ref: "Organization", required: true, index: true },
    inspection_code: { type: String, required: true, unique: true, index: true, trim: true },
    asset_id: { type: String, ref: "Asset", required: true, index: true },
    inspector_id: { type: String, ref: "User", required: true, index: true },
    inspection_date: { type: Date, default: Date.now },
    condition: {
      type: String,
      enum: ["GOOD", "FAIR", "NEEDS_MAINTENANCE", "POOR", "CRITICAL"],
      default: "GOOD",
      required: true,
    },
    risk_level: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      default: "LOW",
      required: true,
    },
    observations: { type: String, required: true },
    recommended_action: { type: String },
    next_inspection_date: { type: Date },
    photos: [{ type: String }],
    documents: [{ type: String }],
    status: {
      type: String,
      enum: ["COMPLETED", "VERIFIED", "FOLLOWUP_REQUIRED"],
      default: "COMPLETED",
    },
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

inspectionSchema.index({ asset_id: 1, inspection_date: -1 });

module.exports = mongoose.model("InfrastructureInspection", inspectionSchema);
