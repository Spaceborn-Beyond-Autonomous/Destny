import mongoose, { Schema } from "mongoose";

const quoteSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },
        projectDescription: {
            type: String,
            required: true,
        },
        budget: {
            type: String,
            required: true,
        },
        technicalSpecifications: {
            type: String,
        },
        status: {
            type: String,
            enum: ["pending", "under review", "accepted", "rejected", "in production", "completed"],
            default: "pending",
        },
        source: {
            type: String,
            default: "website-cta",
        },
    },
    { timestamps: true }
);

export const Quote = mongoose.model("Quote", quoteSchema);
