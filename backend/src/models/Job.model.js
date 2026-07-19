import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    applicantName: { type: String, default: "Guest" },
    applicantId: { type: mongoose.Schema.Types.ObjectId, ref: "Freelancer", default: null },
    freelancerKey: { type: String, default: "", trim: true },
    proposal: { type: String, required: true, trim: true },
    rate: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);


const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    skills: { type: [String], default: [] },
    budget: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
      type: {
        type: String,
        enum: ["Fixed", "Hourly", "Milestone"],
        default: "Fixed",
      },
    },
    proposals: { type: Number, default: 0 },
    dueDate: { type: Date, default: null },
    active: { type: Boolean, default: true },
    applications: { type: [applicationSchema], default: [] },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    clientKey: { type: String, default: "", trim: true, index: true },
    clientName: { type: String, default: "Client", trim: true },
    postedByName: { type: String, default: "Client", trim: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const Job = mongoose.model("Job", jobSchema);
