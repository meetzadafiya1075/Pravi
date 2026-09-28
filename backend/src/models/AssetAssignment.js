const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const assetAssignmentSchema = new mongoose.Schema(
  {
    _id: { type: String, default: uuidv4 },
    organization_id: { type: String, ref: "Organization", required: true, index: true },
    asset_id: { type: String, ref: "Asset", required: true, index: true },
    assigned_to_user_id: { type: String, ref: "User", required: true, index: true },
    assigned_by_user_id: { type: String, ref: "User", required: true },
    assigned_date: { type: Date, default: Date.now },
    return_due_date: { type: Date },
    returned_date: { type: Date },
    status: {
      type: String,
      enum: ["ACTIVE", "RETURNED", "OVERDUE"],
      default: "ACTIVE",
      index: true,
    },
    condition_on_assignment: { type: String },
    condition_on_return: { type: String },
    acceptance_signature_url: { type: String },
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

module.exports = mongoose.model("AssetAssignment", assetAssignmentSchema);
