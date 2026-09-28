const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const roleSchema = new mongoose.Schema(
  {
    _id: { type: String, default: uuidv4 },
    organization_id: { type: String, ref: "Organization", index: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, index: true },
    description: { type: String },
    is_system: { type: Boolean, default: false },
    permissions: [{ type: String, ref: "Permission" }],
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

roleSchema.index({ organization_id: 1, code: 1 }, { unique: true });

module.exports = mongoose.model("Role", roleSchema);
