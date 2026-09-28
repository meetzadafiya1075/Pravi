const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const assetSchema = new mongoose.Schema(
  {
    _id: { type: String, default: uuidv4 },
    organization_id: { type: String, ref: "Organization", required: true, index: true },
    asset_tag: { type: String, required: true, trim: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    serial_number: { type: String, required: true, trim: true, index: true },
    category_id: { type: String, ref: "AssetCategory", required: true, index: true },
    status: {
      type: String,
      default: "OPERATIONAL",
      index: true,
      trim: true,
    },
    department_id: { type: String, ref: "Department", index: true },
    location_id: { type: String, ref: "Location", index: true },
    division: { type: String, trim: true },
    district: { type: String, trim: true, index: true },
    zone: { type: String, trim: true, index: true },
    ward: { type: String, trim: true, index: true },
    facility: { type: String, trim: true },
    address: { type: String, trim: true },
    latitude: { type: Number },
    longitude: { type: Number },
    responsible_officer_id: { type: String, ref: "User" },
    vendor_id: { type: String, ref: "Contractor" },
    project_id: { type: String, ref: "InfrastructureProject", index: true },
    tender_id: { type: String, trim: true },
    funding_source: { type: String, default: "State Infrastructure Budget" },
    funding_scheme: { type: String, trim: true },
    purchase_date: { type: Date },
    commissioning_date: { type: Date },
    purchase_cost: { type: Number, default: 0 },
    salvage_value: { type: Number, default: 0 },
    useful_life_months: { type: Number, default: 360 },
    expected_end_of_life: { type: Date },
    current_book_value: { type: Number, default: 0 },
    condition: {
      type: String,
      enum: ["GOOD", "FAIR", "NEEDS_MAINTENANCE", "POOR", "CRITICAL"],
      default: "GOOD",
      index: true,
    },
    criticality: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      default: "MEDIUM",
      index: true,
    },
    qr_code_url: { type: String },
    custom_attributes: { type: mongoose.Schema.Types.Mixed, default: {} },
    documents: [{ type: String }],
    version: { type: Number, default: 1 },
    is_deleted: { type: Boolean, default: false, index: true },
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

assetSchema.index({ organization_id: 1, asset_tag: 1 }, { unique: true });
assetSchema.index({ organization_id: 1, status: 1 });
assetSchema.index({ organization_id: 1, district: 1 });
assetSchema.index({ organization_id: 1, condition: 1 });
assetSchema.index({ organization_id: 1, criticality: 1 });
assetSchema.index({ organization_id: 1, category_id: 1 });
assetSchema.index({ organization_id: 1, is_deleted: 1 });

module.exports = mongoose.model("Asset", assetSchema);
