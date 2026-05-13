import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    company: {
      type: String,
      trim: true,
      default: "Individual",
    },
    phone: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ["Individual", "Business", "Partner"],
      default: "Individual",
    },
    tags: [String],
    notes: String,
  },
  {
    timestamps: true,
  }
);

export const Customer = mongoose.model("Customer", customerSchema);
