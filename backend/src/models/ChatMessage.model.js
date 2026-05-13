import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema(
    {
        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
            required: true,
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
            enum: ["admin", "user"],
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

export const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema);
