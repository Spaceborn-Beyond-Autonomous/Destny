import crypto from "node:crypto";
import { Order } from "../models/Order.model.js";
import { getSocketServer } from "../socket.js";

const handleRazorpayWebhook = async (req, res) => {
    // Always respond 200 immediately — Razorpay retries if it doesn't get 200 quickly
    res.status(200).json({ received: true });

    try {
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
        if (!webhookSecret) {
            console.error("[Webhook] RAZORPAY_WEBHOOK_SECRET not configured — ignoring event");
            return;
        }

        const signature = req.headers["x-razorpay-signature"];
        if (!signature) {
            console.error("[Webhook] Missing x-razorpay-signature header");
            return;
        }

        // Verify signature using raw body bytes
        const expectedSignature = crypto
            .createHmac("sha256", webhookSecret)
            .update(req.body)
            .digest("hex");

        if (expectedSignature !== signature) {
            console.error("[Webhook] Invalid signature — possible spoofed request");
            return;
        }

        const event = JSON.parse(req.body.toString());
        const eventType = event?.event;

        if (eventType !== "payment.captured") {
            // Not an event we handle — silently ignore
            return;
        }

        const payment = event?.payload?.payment?.entity;
        if (!payment) return;

        const razorpayOrderId = payment.order_id;
        const razorpayPaymentId = payment.id;

        if (!razorpayOrderId || !razorpayPaymentId) return;

        const order = await Order.findOne({ paymentOrderId: razorpayOrderId });
        if (!order) {
            console.error(`[Webhook] No order found for Razorpay order ID: ${razorpayOrderId}`);
            return;
        }

        // Idempotency — skip if already paid
        if (order.paymentStatus === "paid") {
            return;
        }

        order.paid = true;
        order.paidAt = new Date();
        order.paymentStatus = "paid";
        order.paymentId = razorpayPaymentId;
        await order.save();

        const io = getSocketServer();
        if (io) {
            io.to("admin").emit("order:paid", {
                orderId: order._id,
                paymentId: razorpayPaymentId,
                source: "webhook",
            });
        }

        console.log(`[Webhook] payment.captured processed — order ${order._id} marked paid`);
    } catch (err) {
        console.error("[Webhook] Error processing event:", err);
    }
};

export { handleRazorpayWebhook };