import mongoose from "mongoose";

const ratingSchema = new mongoose.Schema(
  {
    rating: { type: Number, required: true, min: 0, max: 5 },
    review: { type: String, default: "" },
    reviewerName: { type: String, default: "Guest" },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const freelancerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    freelanceKey: { type: String, default: "", trim: true, index: true },
    title: { type: String, required: true, trim: true },
    rating: { type: Number, default: 0 },
    reviews: { type: Number, default: 0 },
    location: { type: String, default: "Remote", trim: true },
    bio: { type: String, default: "", trim: true },
    skills: { type: [String], default: [] },
    rate: { type: Number, default: 0 },
    upiId: { type: String, default: "", trim: true },
    availability: {
      type: String,
      enum: ["available", "busy", "unavailable"],
      default: "available",
    },
    avatar: { type: String, default: "" },
    completedProjects: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    portfolio: { type: [String], default: [] },
    ratings: { type: [ratingSchema], default: [] },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const Freelancer = mongoose.model("Freelancer", freelancerSchema);
