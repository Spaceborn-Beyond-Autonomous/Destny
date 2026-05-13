import mongoose from "mongoose";

const quoteChatMessageSchema = new mongoose.Schema(
    {
        quoteId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Quote",
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
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

export const QuoteChatMessage = mongoose.model("QuoteChatMessage", quoteChatMessageSchema);
