import { ChatMessage } from "../models/ChatMessage.model.js";
import { Order } from "../models/Order.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { getSocketServer } from "../socket.js";

const assertOrderAccess = async (orderId, user) => {
    const order = await Order.findById(orderId).lean();
    if (!order) {
        throw new ApiError(404, "Order not found");
    }

    if (!user?.admin && String(order.customerId) !== String(user?._id)) {
        throw new ApiError(403, "You do not have access to this order chat");
    }

    return order;
};

const getAccessibleOrders = async (user) => {
    const query = user?.admin ? {} : { customerId: user._id };
    return Order.find(query).sort({ createdAt: -1 }).lean();
};

const toOrderLabel = (order) => `ORD-${new Date(order.createdAt).getFullYear()}-${String(order._id).slice(-6).toUpperCase()}`;

const buildChatSummaries = async (user) => {
    const orders = await getAccessibleOrders(user);
    const orderIds = orders.map((order) => order._id);
    if (orderIds.length === 0) return [];

    const messages = await ChatMessage.find({ orderId: { $in: orderIds } })
        .sort({ createdAt: -1 })
        .lean();

    const byOrder = new Map();
    const viewerRole = user.admin ? "admin" : "user";
    const viewerId = String(user._id);

    for (const message of messages) {
        const key = String(message.orderId);
        const summary = byOrder.get(key) || {
            latestMessage: message,
            unreadCount: 0,
            totalMessages: 0,
        };

        summary.totalMessages += 1;
        const readBy = (message.readBy || []).map((id) => String(id));
        if (message.senderRole !== viewerRole && !readBy.includes(viewerId)) {
            summary.unreadCount += 1;
        }

        byOrder.set(key, summary);
    }

    return orders
        .map((order) => {
            const summary = byOrder.get(String(order._id));
            if (!summary) return null;
            return {
                orderId: String(order._id),
                orderLabel: toOrderLabel(order),
                customerName: order.customerName || "Guest Customer",
                fileName: order.fileName || "Custom Print Project",
                orderStatus: order.orderStatus || "new",
                latestMessage: summary.latestMessage,
                unreadCount: summary.unreadCount,
                totalMessages: summary.totalMessages,
            };
        })
        .filter(Boolean)
        .sort((a, b) => new Date(b.latestMessage.createdAt) - new Date(a.latestMessage.createdAt));
};

const getOrderChatSummaries = asyncHandler(async (req, res) => {
    const summaries = await buildChatSummaries(req.user);

    return res
        .status(200)
        .json(new ApiResponse(200, summaries, "Chat summaries fetched successfully"));
});

const getOrderChatMessages = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    await assertOrderAccess(orderId, req.user);

    const messages = await ChatMessage.find({ orderId })
        .sort({ createdAt: 1 })
        .limit(200)
        .lean();

    return res
        .status(200)
        .json(new ApiResponse(200, messages, "Chat messages fetched successfully"));
});

const sendOrderChatMessage = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const text = String(req.body?.message || "").trim();

    if (!text) {
        throw new ApiError(400, "Message is required");
    }

    if (text.length > 2000) {
        throw new ApiError(400, "Message must be 2000 characters or fewer");
    }

    await assertOrderAccess(orderId, req.user);

    const message = await ChatMessage.create({
        orderId,
        senderId: req.user._id,
        senderName: req.user.name || (req.user.admin ? "Destny Support" : "Customer"),
        senderRole: req.user.admin ? "admin" : "user",
        message: text,
        readBy: [req.user._id],
    });

    const payload = message.toObject();
    const io = getSocketServer();
    if (io) {
        io.to("admin").emit("chat:message", { orderId, message: payload });
        io.to(`order:${orderId}`).emit("chat:message", { orderId, message: payload });
    }

    return res
        .status(201)
        .json(new ApiResponse(201, payload, "Message sent successfully"));
});

const markOrderChatRead = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    await assertOrderAccess(orderId, req.user);

    const viewerRole = req.user.admin ? "admin" : "user";
    await ChatMessage.updateMany(
        { orderId, senderRole: { $ne: viewerRole } },
        { $addToSet: { readBy: req.user._id } }
    );

    const io = getSocketServer();
    if (io) {
        io.to("admin").emit("chat:read", { orderId, readerRole: viewerRole, userId: req.user._id });
        io.to(`order:${orderId}`).emit("chat:read", { orderId, readerRole: viewerRole, userId: req.user._id });
    }

    return res
        .status(200)
        .json(new ApiResponse(200, { orderId }, "Chat marked as read"));
});

export { getOrderChatMessages, getOrderChatSummaries, markOrderChatRead, sendOrderChatMessage };
