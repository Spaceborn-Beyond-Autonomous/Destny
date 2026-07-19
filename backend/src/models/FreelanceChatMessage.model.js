import mongoose from "mongoose";

const freelanceChatMessageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    conversationType: {
      type: String,
      enum: ["contract", "job"],
      default: "contract",
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    senderName: {
      type: String,
      required: true,
      trim: true,
    },
    senderRole: {
      type: String,
      enum: ["client", "freelancer", "admin"],
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

freelanceChatMessageSchema.index({ conversationId: 1, conversationType: 1, createdAt: 1 });

export const FreelanceChatMessage = mongoose.model(
  "FreelanceChatMessage",
  freelanceChatMessageSchema
);
