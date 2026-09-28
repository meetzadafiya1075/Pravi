const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const assetStatusHistorySchema = new mongoose.Schema(
  {
    _id: { type: String, default: uuidv4 },
    organization_id: { type: String, ref: "Organization", required: true, index: true },
    asset_id: { type: String, ref: "Asset", required: true, index: true },
    from_status: { type: String, required: true },
    to_status: { type: String, required: true },
    actor_id: { type: String, ref: "User", required: true },
    reason: { type: String },
    extra_metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
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

assetStatusHistorySchema.index({ asset_id: 1, createdAt: -1 });

module.exports = mongoose.model("AssetStatusHistory", assetStatusHistorySchema);
