const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const organizationSchema = new mongoose.Schema(
  {
    _id: { type: String, default: uuidv4 },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true, trim: true },
    plan_type: { type: String, default: "ENTERPRISE" },
    settings: { type: mongoose.Schema.Types.Mixed, default: {} },
    is_active: { type: Boolean, default: true },
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

module.exports = mongoose.model("Organization", organizationSchema);
