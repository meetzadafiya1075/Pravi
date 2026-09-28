const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const documentSchema = new mongoose.Schema(
  {
    _id: { type: String, default: uuidv4 },
    organization_id: { type: String, ref: "Organization", required: true, index: true },
    asset_id: { type: String, ref: "Asset", index: true },
    maintenance_ticket_id: { type: String, ref: "MaintenanceTicket", index: true },
    project_id: { type: String, ref: "InfrastructureProject", index: true },
    file_name: { type: String, required: true },
    file_size_bytes: { type: Number, required: true },
    mime_type: { type: String, required: true },
    s3_object_key: { type: String, required: true },
    url: { type: String },
    public_id: { type: String },
    uploaded_by_user_id: { type: String, ref: "User", required: true },
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

module.exports = mongoose.model("Document", documentSchema);
