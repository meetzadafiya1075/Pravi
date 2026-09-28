const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const locationSchema = new mongoose.Schema(
  {
    _id: { type: String, default: uuidv4 },
    organization_id: { type: String, ref: "Organization", required: true, index: true },
    name: { type: String, required: true, trim: true },
    site_code: { type: String, required: true, trim: true },
    building: { type: String, trim: true },
    floor: { type: String, trim: true },
    room: { type: String, trim: true },
    address: { type: String, trim: true },
    district: { type: String, trim: true },
    zone: { type: String, trim: true },
    ward: { type: String, trim: true },
    latitude: { type: Number },
    longitude: { type: Number },
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

locationSchema.index({ organization_id: 1, site_code: 1 }, { unique: true });

module.exports = mongoose.model("Location", locationSchema);
