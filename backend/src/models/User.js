const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");

const userSchema = new mongoose.Schema(
  {
    _id: { type: String, default: uuidv4 },
    organization_id: { type: String, ref: "Organization", required: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    hashed_password: { type: String, required: true },
    first_name: { type: String, required: true, trim: true },
    last_name: { type: String, required: true, trim: true },
    role_id: { type: String, ref: "Role", required: true, index: true },
    department_id: { type: String, ref: "Department", index: true },
    district: { type: String, trim: true },
    zone: { type: String, trim: true },
    ward: { type: String, trim: true },
    phone: { type: String, trim: true },
    is_active: { type: Boolean, default: true },
    last_login_at: { type: Date },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret.hashed_password;
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

userSchema.index({ organization_id: 1, email: 1 }, { unique: true });

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.hashed_password);
};

module.exports = mongoose.model("User", userSchema);
