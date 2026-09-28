const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const warrantySchema = new mongoose.Schema(
  {
    _id: { type: String, default: uuidv4 },
    organization_id: { type: String, ref: "Organization", required: true, index: true },
    asset_id: { type: String, ref: "Asset", required: true, index: true },
    vendor_id: { type: String, ref: "Contractor", required: true },
    contract_number: { type: String, required: true },
    coverage_details: { type: String, required: true },
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true, index: true },
    alert_sent_30d: { type: Boolean, default: false },
    alert_sent_7d: { type: Boolean, default: false },
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

module.exports = mongoose.model("Warranty", warrantySchema);
