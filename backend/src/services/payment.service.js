import crypto from "node:crypto";
import Razorpay from "razorpay";
import { ApiError } from "../utils/ApiError.js";

let razorpayInstance;

const hasRazorpayCredentials = () =>
    Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

const getRazorpayInstance = () => {
    if (!hasRazorpayCredentials()) {
        throw new ApiError(500, "Razorpay is not configured on server");
    }

    if (razorpayInstance) return razorpayInstance;

    razorpayInstance = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    return razorpayInstance;
};

const createPaymentOrder = async (order) => {
    const amountInPaise = Math.round(Number(order.estimatedTotal || 0) * 100);
    if (!Number.isFinite(amountInPaise) || amountInPaise <= 0) {
        throw new ApiError(400, "Order amount is invalid");
    }

    const razorpay = getRazorpayInstance();
    const receipt = `ord_${String(order._id).slice(-10)}_${String(Date.now()).slice(-8)}`;
    const razorpayOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: "INR",
        receipt,
        notes: {
            orderId: String(order._id),
            customerName: String(order.customerName || "Guest Customer").trim() || "Guest Customer",
        },
    });

    order.paymentGateway = "razorpay";
    order.paymentOrderId = razorpayOrder.id;
    order.paymentAmount = amountInPaise;
    order.paymentStatus = "created";
    await order.save();

    return {
        amount: amountInPaise,
        currency: "INR",
        razorpayOrderId: razorpayOrder.id,
        keyId: process.env.RAZORPAY_KEY_ID,
    };
};

const verifyPaymentOrder = async ({
    order,
    razorpayPaymentId,
    razorpayOrderId,
    razorpaySignature,
}) => {
    if (!razorpayPaymentId || !razorpayOrderId) {
        throw new ApiError(400, "Payment details are required");
    }

    if (order.paymentOrderId && order.paymentOrderId !== razorpayOrderId) {
        throw new ApiError(400, "Payment order ID mismatch");
    }

    if (!razorpaySignature) {
        throw new ApiError(400, "Payment signature is required");
    }

    const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest("hex");

    if (expectedSignature !== razorpaySignature) {
        throw new ApiError(400, "Invalid payment signature");
    }

    order.paid = true;
    order.paidAt = new Date();
    order.paymentStatus = "paid";
    order.paymentGateway = "razorpay";
    order.paymentOrderId = razorpayOrderId;
    order.paymentId = razorpayPaymentId;
    order.paymentSignature = razorpaySignature;
    await order.save();

    return order;
};

const failPaymentOrder = async ({ order, razorpayOrderId, failureReason }) => {
    if (razorpayOrderId && order.paymentOrderId && order.paymentOrderId !== razorpayOrderId) {
        throw new ApiError(400, "Payment order ID mismatch");
    }

    order.paid = false;
    order.paidAt = null;
    order.paymentStatus = "failed";
    order.paymentGateway = "razorpay";
    if (razorpayOrderId) {
        order.paymentOrderId = razorpayOrderId;
    }
    order.paymentId = "";
    order.paymentSignature = String(failureReason || "payment_failed").trim().slice(0, 180);
    await order.save();

    return order;
};

export { createPaymentOrder, verifyPaymentOrder, failPaymentOrder };