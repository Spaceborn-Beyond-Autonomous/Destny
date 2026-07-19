import mongoose from "mongoose";

const milestoneSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    amount: { type: Number, default: 0 },
    platformFee: { type: Number, default: 0 },
    freelancerAmount: { type: Number, default: 0 },
    dueDate: { type: Date, default: null },
    status: {
      type: String,
      enum: ["pending", "funded", "in progress", "completed", "released"],
      default: "pending",
    },
    fundedAt: { type: Date, default: null },
    releasedAt: { type: Date, default: null },
    paymentId: { type: String, default: "", trim: true },
    platformPaymentId: { type: String, default: "", trim: true },
    freelancerPaymentId: { type: String, default: "", trim: true },
    platformPayoutId: { type: String, default: "", trim: true },
    freelancerPayoutId: { type: String, default: "", trim: true },
    paymentMethod: { type: String, default: "upi", trim: true },
    platformUpiId: { type: String, default: "", trim: true },
    freelancerUpiId: { type: String, default: "", trim: true },
    payoutStatus: {
      type: String,
      enum: ["pending", "queued", "paid"],
      default: "pending",
    },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const commentSchema = new mongoose.Schema(
  {
    authorName: { type: String, default: "Client" },
    content: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const contractSchema = new mongoose.Schema(
  {
    freelancerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Freelancer",
      required: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    amount: { type: Number, default: 0 },
    platformFee: { type: Number, default: 0 },
    freelancerAmount: { type: Number, default: 0 },
    paidAmount: { type: Number, default: 0 },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "partially_funded", "funded", "released"],
      default: "unpaid",
    },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    freelancerNote: { type: String, default: "", trim: true },
    lastProgressAt: { type: Date, default: null },
    fundedAt: { type: Date, default: null },
    releasedAt: { type: Date, default: null },
    finalPaymentId: { type: String, default: "", trim: true },
    finalPlatformPaymentId: { type: String, default: "", trim: true },
    finalFreelancerPaymentId: { type: String, default: "", trim: true },
    finalPlatformPayoutId: { type: String, default: "", trim: true },
    finalFreelancerPayoutId: { type: String, default: "", trim: true },
    platformUpiId: { type: String, default: "", trim: true },
    freelancerUpiId: { type: String, default: "", trim: true },
    finalPlatformUpiId: { type: String, default: "", trim: true },
    finalFreelancerUpiId: { type: String, default: "", trim: true },
    payoutStatus: {
      type: String,
      enum: ["pending", "queued", "paid"],
      default: "pending",
    },
    paymentMethod: { type: String, default: "upi", trim: true },
    completedAt: { type: Date, default: null },
    withdrawnAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ["pending", "active", "completed", "cancelled"],
      default: "pending",
    },
    milestones: { type: [milestoneSchema], default: [] },
    comments: { type: [commentSchema], default: [] },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const Contract = mongoose.model("Contract", contractSchema);
