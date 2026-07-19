import crypto from "node:crypto";
import Razorpay from "razorpay";
import { ApiError } from "../utils/ApiError.js";

let razorpayInstance;

const hasRazorpayCredentials = () =>
    Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

const getRazorpayAuthHeader = () => {
    const token = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64");
    return `Basic ${token}`;
};

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

const callRazorpayApi = async (path, data) => {
    if (!hasRazorpayCredentials()) {
        throw new ApiError(500, "Razorpay is not configured on server");
    }

    const response = await fetch(`https://api.razorpay.com/v1${path}`, {
        method: "POST",
        headers: {
            Authorization: getRazorpayAuthHeader(),
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new ApiError(
            response.status,
            payload?.error?.description || payload?.error?.reason || "Razorpay API request failed",
            payload?.error ? [payload.error] : []
        );
    }

    return payload;
};

const createRazorpayOrderForAmount = async ({ amount, receipt, notes = {} }) => {
    const amountInPaise = Math.round(Number(amount || 0) * 100);
    if (!Number.isFinite(amountInPaise) || amountInPaise <= 0) {
        throw new ApiError(400, "Payment amount is invalid");
    }

    const razorpay = getRazorpayInstance();
    const razorpayOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: "INR",
        receipt,
        notes,
    });

    return {
        amount: amountInPaise,
        currency: "INR",
        razorpayOrderId: razorpayOrder.id,
        keyId: process.env.RAZORPAY_KEY_ID,
    };
};

const verifyRazorpaySignature = ({ razorpayPaymentId, razorpayOrderId, razorpaySignature }) => {
    if (!razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
        throw new ApiError(400, "Payment verification details are required");
    }

    const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest("hex");

    if (expectedSignature !== razorpaySignature) {
        throw new ApiError(400, "Invalid payment signature");
    }
};

const createRazorpayVpaPayout = async ({
    upiId,
    name,
    amount,
    referenceId,
    narration,
    notes = {},
}) => {
    const accountNumber = String(process.env.RAZORPAYX_ACCOUNT_NUMBER || process.env.RAZORPAY_ACCOUNT_NUMBER || "").trim();
    if (!accountNumber) {
        throw new ApiError(500, "RazorpayX account number is not configured");
    }

    const amountInPaise = Math.round(Number(amount || 0) * 100);
    if (!Number.isFinite(amountInPaise) || amountInPaise <= 0) {
        throw new ApiError(400, "Payout amount is invalid");
    }

    const safeName = String(name || "Destny payout").trim().slice(0, 120) || "Destny payout";
    const contact = await callRazorpayApi("/contacts", {
        name: safeName,
        type: "vendor",
        reference_id: String(referenceId).slice(0, 40),
        notes,
    });

    const fundAccount = await callRazorpayApi("/fund_accounts", {
        contact_id: contact.id,
        account_type: "vpa",
        vpa: {
            address: String(upiId).trim(),
            name: safeName,
        },
    });

    return callRazorpayApi("/payouts", {
        account_number: accountNumber,
        fund_account_id: fundAccount.id,
        amount: amountInPaise,
        currency: "INR",
        mode: "UPI",
        purpose: "payout",
        queue_if_low_balance: true,
        reference_id: String(referenceId).slice(0, 40),
        narration: String(narration || "Destny payout").slice(0, 30),
        notes,
    });
};

const createPaymentOrder = async (order) => {
    // Idempotency guard — if a Razorpay order already exists and payment is not failed, reuse it
    if (order.paymentOrderId && order.paymentStatus !== "failed") {
        const amountInPaise = Math.round(Number(order.estimatedTotal || 0) * 100);
        return {
            amount: amountInPaise,
            currency: "INR",
            razorpayOrderId: order.paymentOrderId,
            keyId: process.env.RAZORPAY_KEY_ID,
        };
    }

    const amountInPaise = Math.round(Number(order.estimatedTotal || 0) * 100);
    if (!Number.isFinite(amountInPaise) || amountInPaise <= 0) {
        throw new ApiError(400, "Order amount is invalid");
    }

    const receipt = `ord_${String(order._id).slice(-10)}_${String(Date.now()).slice(-8)}`;
    const paymentOrder = await createRazorpayOrderForAmount({
        amount: Number(order.estimatedTotal || 0),
        receipt,
        notes: {
            orderId: String(order._id),
            customerName: String(order.customerName || "Guest Customer").trim() || "Guest Customer",
        },
    });

    order.paymentGateway = "razorpay";
    order.paymentOrderId = paymentOrder.razorpayOrderId;
    order.paymentAmount = amountInPaise;
    order.paymentStatus = "created";
    await order.save();

    return paymentOrder;
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

    // Idempotency guard — if this payment ID was already verified, do not process again
    if (order.paymentStatus === "paid" && order.paymentId === razorpayPaymentId) {
        return order;
    }

    // Reject if order is already paid with a different payment ID (replay with different ID)
    if (order.paymentStatus === "paid") {
        throw new ApiError(409, "Order is already paid");
    }

    if (order.paymentOrderId && order.paymentOrderId !== razorpayOrderId) {
        throw new ApiError(400, "Payment order ID mismatch");
    }

    if (!razorpaySignature) {
        throw new ApiError(400, "Payment signature is required");
    }

    verifyRazorpaySignature({ razorpayPaymentId, razorpayOrderId, razorpaySignature });

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

export {
    createPaymentOrder,
    createRazorpayOrderForAmount,
    createRazorpayVpaPayout,
    failPaymentOrder,
    verifyPaymentOrder,
    verifyRazorpaySignature,
};
