const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const departmentSchema = new mongoose.Schema(
  {
    _id: { type: String, default: uuidv4 },
    organization_id: { type: String, ref: "Organization", required: true, index: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true },
    manager_id: { type: String, ref: "User" },
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

departmentSchema.index({ organization_id: 1, code: 1 }, { unique: true });

module.exports = mongoose.model("Department", departmentSchema);
