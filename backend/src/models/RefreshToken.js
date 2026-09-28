const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const refreshTokenSchema = new mongoose.Schema(
  {
    _id: { type: String, default: uuidv4 },
    user_id: { type: String, ref: "User", required: true, index: true },
    token_hash: { type: String, required: true, unique: true, index: true },
    family_id: { type: String, required: true },
    is_revoked: { type: Boolean, default: false, index: true },
    expires_at: { type: Date, required: true },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: false },
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

refreshTokenSchema.index({ token_hash: 1, is_revoked: 1 });

module.exports = mongoose.model("RefreshToken", refreshTokenSchema);
