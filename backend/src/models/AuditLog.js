const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const auditLogSchema = new mongoose.Schema(
  {
    _id: { type: String, default: uuidv4 },
    organization_id: { type: String, ref: "Organization", required: true, index: true },
    actor_id: { type: String, ref: "User", index: true },
    action: { type: String, required: true },
    entity_type: { type: String, required: true },
    entity_id: { type: String, required: true },
    before_state: { type: mongoose.Schema.Types.Mixed },
    after_state: { type: mongoose.Schema.Types.Mixed },
    ip_address: { type: String },
    user_agent: { type: String },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: false,
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

auditLogSchema.index({ organization_id: 1, entity_type: 1, entity_id: 1, timestamp: -1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
