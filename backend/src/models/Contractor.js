const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const contractorSchema = new mongoose.Schema(
  {
    _id: { type: String, default: uuidv4 },
    organization_id: { type: String, ref: "Organization", required: true, index: true },
    name: { type: String, required: true, trim: true },
    registration_number: { type: String, trim: true },
    contact_person: { type: String, trim: true },
    email: { type: String, trim: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    vendor_type: { type: String, default: "INFRASTRUCTURE_CONTRACTOR" }, // CONTRACTOR, MAINTENANCE_AGENCY, SUPPLIER
    contract_start: { type: Date },
    contract_end: { type: Date },
    contract_value: { type: Number, default: 0 },
    rating: { type: Number, default: 4.5 },
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

contractorSchema.index({ organization_id: 1, name: 1 }, { unique: true });

const Contractor = mongoose.model("Contractor", contractorSchema);

module.exports = Contractor;
