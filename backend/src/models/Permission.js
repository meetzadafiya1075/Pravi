const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const permissionSchema = new mongoose.Schema(
  {
    _id: { type: String, default: uuidv4 },
    code: { type: String, required: true, unique: true, index: true, trim: true },
    module: { type: String, required: true, trim: true },
    description: { type: String, required: true },
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

module.exports = mongoose.model("Permission", permissionSchema);
