import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
    {
        material: {
            type: String,
            required: true,
            enum: ["pla", "petg", "abs"],
        },
        quality: {
            type: String,
            required: true,
            enum: ["draft", "standard", "high", "rush"],
        },
        dimensions: {
            x: { type: Number, required: true },
            y: { type: Number, required: true },
            z: { type: Number, required: true },
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
        },
        estimatedWeight: {
            type: Number,
            required: true,
        },
        estimatedTotal: {
            type: Number,
            required: true,
        },
        customerName: {
            type: String,
            trim: true,
            default: "Guest Customer",
        },
        customerEmail: {
            type: String,
            trim: true,
            lowercase: true,
            default: "",
        },
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        fileName: {
            type: String,
        },
        gdriveFileId: {
            type: String,
        },
        gdriveLink: {
            type: String,
        },
        paid: {
            type: Boolean,
            default: false,
        },
        paymentStatus: {
            type: String,
            enum: ["not_initiated", "created", "paid", "failed"],
            default: "not_initiated",
        },
        paymentGateway: {
            type: String,
            default: "",
            trim: true,
        },
        paymentOrderId: {
            type: String,
            default: "",
            trim: true,
        },
        paymentId: {
            type: String,
            default: "",
            trim: true,
        },
        paymentSignature: {
            type: String,
            default: "",
            trim: true,
        },
        paymentAmount: {
            type: Number,
            default: 0,
        },
        orderStatus: {
            type: String,
            enum: ["new", "approved", "rejected", "delivering", "completed"],
            default: "new",
        },
        rejectionReason: {
            type: String,
            default: "",
            trim: true,
        },
        paidAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

export const Order = mongoose.model("Order", orderSchema);
