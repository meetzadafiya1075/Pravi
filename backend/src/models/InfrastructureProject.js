const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const infrastructureProjectSchema = new mongoose.Schema(
  {
    _id: { type: String, default: uuidv4 },
    organization_id: { type: String, ref: "Organization", required: true, index: true },
    project_code: { type: String, required: true, unique: true, index: true, trim: true },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    department_id: { type: String, ref: "Department", required: true, index: true },
    contractor_id: { type: String, ref: "Contractor" },
    funding_source: { type: String, default: "State Infrastructure Budget" },
    funding_scheme: { type: String, trim: true }, // Smart City Mission, AMRUT, PMGSY, etc.
    budget_allocated: { type: Number, default: 0 },
    actual_expenditure: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["PROPOSED", "APPROVED", "ACTIVE", "UNDER_CONSTRUCTION", "COMPLETED", "DELAYED"],
      default: "ACTIVE",
      index: true,
    },
    start_date: { type: Date },
    expected_completion: { type: Date },
    actual_completion: { type: Date },
    documents: [{ type: String }],
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

infrastructureProjectSchema.index({ organization_id: 1, status: 1 });

module.exports = mongoose.model("InfrastructureProject", infrastructureProjectSchema);
