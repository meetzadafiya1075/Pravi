const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const districtSchema = new mongoose.Schema(
  {
    _id: { type: String, default: uuidv4 },
    organization_id: { type: String, ref: "Organization", required: true, index: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true },
    headquarters: { type: String },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
districtSchema.index({ organization_id: 1, code: 1 }, { unique: true });

const zoneSchema = new mongoose.Schema(
  {
    _id: { type: String, default: uuidv4 },
    district_id: { type: String, ref: "District", required: true, index: true },
    organization_id: { type: String, ref: "Organization", required: true, index: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

const wardSchema = new mongoose.Schema(
  {
    _id: { type: String, default: uuidv4 },
    zone_id: { type: String, ref: "Zone", required: true, index: true },
    organization_id: { type: String, ref: "Organization", required: true, index: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true },
    population: { type: Number },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

module.exports = {
  District: mongoose.model("District", districtSchema),
  Zone: mongoose.model("Zone", zoneSchema),
  Ward: mongoose.model("Ward", wardSchema),
};
