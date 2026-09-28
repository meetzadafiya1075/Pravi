const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const assetTransferSchema = new mongoose.Schema(
  {
    _id: { type: String, default: uuidv4 },
    organization_id: { type: String, ref: "Organization", required: true, index: true },
    asset_id: { type: String, ref: "Asset", required: true, index: true },
    source_department_id: { type: String, ref: "Department", required: true },
    target_department_id: { type: String, ref: "Department", required: true },
    source_location_id: { type: String, ref: "Location" },
    target_location_id: { type: String, ref: "Location", required: true },
    initiated_by_user_id: { type: String, ref: "User", required: true },
    approved_by_user_id: { type: String, ref: "User" },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED", "COMPLETED"],
      default: "PENDING",
      index: true,
    },
    notes: { type: String },
    initiated_at: { type: Date, default: Date.now },
    completed_at: { type: Date },
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

module.exports = mongoose.model("AssetTransfer", assetTransferSchema);
