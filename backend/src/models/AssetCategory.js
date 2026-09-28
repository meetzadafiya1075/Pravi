const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const assetCategorySchema = new mongoose.Schema(
  {
    _id: { type: String, default: uuidv4 },
    organization_id: { type: String, ref: "Organization", required: true, index: true },
    parent_id: { type: String, ref: "AssetCategory" },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true },
    depreciation_method: { type: String, default: "STRAIGHT_LINE" },
    default_useful_life_months: { type: Number, default: 360 }, // e.g. 30 years for infra
    custom_field_schema: { type: Array, default: [] },
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

assetCategorySchema.index({ organization_id: 1, code: 1 }, { unique: true });

module.exports = mongoose.model("AssetCategory", assetCategorySchema);
