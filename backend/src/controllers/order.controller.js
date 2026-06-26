import { Order } from "../models/Order.model.js";
import { Quote } from "../models/Quote.model.js";
import { Customer } from "../models/Customer.model.js";
import { User } from "../models/User.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { getSocketServer } from "../socket.js";
import { deleteFromGDrive } from "../services/gdrive.service.js";
import {
    createPaymentOrder,
    failPaymentOrder,
    verifyPaymentOrder,
} from "../services/payment.service.js";

const formatCurrency = (value) =>
    new Intl.NumberFormat("en-IN", {
        maximumFractionDigits: 0,
    }).format(Math.round(value || 0));

const formatDate = (value) =>
    new Date(value).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });

const toOrderId = (order) => {
    const created = new Date(order.createdAt);
    const year = created.getFullYear();
    return `ORD-${year}-${String(order._id).slice(-6).toUpperCase()}`;
};

const toOrderStatus = (order) => {
    const status = order.orderStatus || "new";
    if (status === "completed") return "Completed";
    if (status === "delivering") return "Delivering";
    if (status === "rejected") return "Rejected";
    if (order.paid) return "Paid";
    if (status === "approved") return "Awaiting Payment";
    return "Under Review";
};

const toCustomerName = (order) => {
    const name = String(order.customerName || "").trim();
    return name || "Guest Customer";
};

const buildDashboardPayload = async () => {
    try {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        const [totalOrders, monthlySummary, paidOrders, orders, quotesRaw, customersRaw, orderStats, quoteStats] = await Promise.all([
            Order.countDocuments(),
            Order.aggregate([
                { $match: { createdAt: { $gte: monthStart } } },
                {
                    $group: {
                        _id: null,
                        totalRevenue: { $sum: "$estimatedTotal" },
                        monthlyOrders: { $sum: 1 },
                    },
                },
            ]),
            Order.countDocuments({ paid: true }),
            Order.find().sort({ createdAt: -1 }).limit(50).lean(),
            Quote.find().sort({ createdAt: -1 }).limit(20).lean(),
            Customer.find().lean(),
            Order.aggregate([
                {
                    $lookup: {
                        from: "users",
                        localField: "customerId",
                        foreignField: "_id",
                        as: "user",
                    },
                },
                {
                    $addFields: {
                        effectiveEmail: {
                            $ifNull: ["$customerEmail", { $arrayElemAt: ["$user.email", 0] }],
                        },
                        effectiveName: {
                            $ifNull: ["$customerName", { $arrayElemAt: ["$user.name", 0] }],
                        },
                    },
                },
                {
                    $group: {
                        _id: { $ifNull: ["$effectiveEmail", "$effectiveName"] },
                        isUser: { $first: { $cond: [{ $ne: [{ $ifNull: ["$customerId", null] }, null] }, true, false] } },
                        name: { $first: "$effectiveName" },
                        email: { $first: "$effectiveEmail" },
                        totalOrders: { $sum: 1 },
                        totalSpend: { $sum: "$estimatedTotal" },
                        latestOrder: { $max: "$createdAt" },
                    },
                },
                { $sort: { latestOrder: -1 } },
                { $limit: 100 },
            ]),
            Quote.aggregate([
                {
                    $group: {
                        _id: "$email",
                        email: { $first: "$email" },
                        name: { $first: "$name" },
                        totalQuotes: { $sum: 1 },
                        latestQuote: { $max: "$createdAt" },
                    },
                },
                { $sort: { latestQuote: -1 } },
                { $limit: 100 },
            ]),
        ]);

        const monthlyRevenue = monthlySummary[0]?.totalRevenue ?? 0;
        const monthlyOrders = monthlySummary[0]?.monthlyOrders ?? 0;
        const pendingOrders = totalOrders - paidOrders;

        const orderRows = orders.map((order) => [
            toOrderId(order),
            toCustomerName(order),
            String(order.material || "").toUpperCase(),
            String(order.quantity),
            formatDate(order.createdAt),
            `₹${formatCurrency(order.estimatedTotal)}`,
            order.paymentStatus === "failed" ? "Failed" : order.paid ? "Paid" : "Pending",
            toOrderStatus(order),
        ]);

        const notifications = orders.slice(0, 6).map((order) => {
            if (order.paymentStatus === "failed") {
                return [
                    "Payment Failed",
                    `${toOrderId(order)} • ${toCustomerName(order)} • Retry required`,
                    "danger",
                ];
            }

            if (order.paid) {
                return [
                    "Payment Received",
                    `${toOrderId(order)} • ${toCustomerName(order)} • ₹${formatCurrency(order.estimatedTotal)}`,
                    "success",
                ];
            }

            return [
                "New Order Received",
                `${toOrderId(order)} • ${String(order.material || "").toUpperCase()} • ₹${formatCurrency(order.estimatedTotal)}`,
                "info",
            ];
        });

        const recentActivity = orders.slice(0, 5).map((order) =>
            `${toOrderId(order)} placed (${String(order.material || "").toUpperCase()}, qty ${order.quantity})`
        );

        const files = orders.slice(0, 20).map((order) => [
            `FILE-${String(order._id).slice(-6).toUpperCase()}`,
            order.fileName || "No File",
            order.fileName ? order.fileName.split(".").pop()?.toUpperCase() || "FILE" : "FILE",
            "-",
            toOrderId(order),
            toCustomerName(order),
            formatDate(order.createdAt),
            "v1.0",
        ]);

        const analyticsCards = [
            ["Monthly Revenue", `₹${formatCurrency(monthlyRevenue)}`, "Live from placed orders"],
            ["Monthly Orders", String(monthlyOrders), "Live from placed orders"],
            ["Total Orders", String(totalOrders), "All-time orders"],
            ["Pending Payments", String(pendingOrders), "Unpaid orders"],
        ];

        const materialCounts = orders.reduce(
            (acc, order) => {
                const key = String(order.material || "").toUpperCase();
                if (!key) return acc;
                acc[key] = (acc[key] || 0) + 1;
                return acc;
            },
            {}
        );
        const materialUsage = Object.entries(materialCounts).map(([label, count]) => [label, String(count)]);

        const quotes = quotesRaw.map((q) => [
            String(q._id).slice(-6).toUpperCase(),
            q.name,
            q.email,
            q.budget,
            formatDate(q.createdAt),
            (q.status || "pending").charAt(0).toUpperCase() + (q.status || "pending").slice(1),
        ]);

        const customerMap = new Map();
        for (const stat of orderStats || []) {
            const key = String(stat.email || stat._id || stat.name || "").toLowerCase();
            if (!key) continue;
            customerMap.set(key, {
                ...stat,
                _id: key,
                email: stat.email || key,
                totalQuotes: 0,
                latestQuote: null,
            });
        }

        for (const quoteStat of quoteStats || []) {
            const key = String(quoteStat.email || quoteStat._id || "").toLowerCase();
            if (!key) continue;
            const existing = customerMap.get(key) || {
                _id: key,
                email: key,
                name: quoteStat.name,
                isUser: false,
                totalOrders: 0,
                totalSpend: 0,
                latestOrder: null,
            };
            existing.name = existing.name || quoteStat.name;
            existing.totalQuotes = quoteStat.totalQuotes || 0;
            existing.latestQuote = quoteStat.latestQuote;
            customerMap.set(key, existing);
        }

        const customerStats = Array.from(customerMap.values()).sort((a, b) => {
            const latestA = new Date(a.latestOrder || a.latestQuote || 0).getTime();
            const latestB = new Date(b.latestOrder || b.latestQuote || 0).getTime();
            return latestB - latestA;
        });

        return {
            metrics: [
                { label: "Total orders", value: String(totalOrders || 0), action: "Orders", detail: "All-time placed orders" },
                { label: "Orders this month", value: String(monthlyOrders || 0), action: "Monthly", detail: "Placed since month start" },
                { label: "Revenue this month", value: `₹${formatCurrency(monthlyRevenue || 0)}`, action: "Revenue", detail: "From estimated totals" },
                { label: "Pending payments", value: String(pendingOrders || 0), action: "Pending", detail: "Orders not yet paid" },
                { label: "Paid orders", value: String(paidOrders || 0), action: "Paid", detail: "Orders marked paid" },
                { label: "Recent uploads", value: String(files?.length || 0), action: "Files", detail: "Files linked to recent orders" },
            ],
            quotes: quotes || [],
            quotesRaw: quotesRaw || [],
            orders: orderRows || [],
            ordersRaw: orders || [],
            jobs: [],
            files: files || [],
            filesRaw: (orders || []).slice(0, 20),
            customers: customerStats.map((stat) => {
                if (!stat) return ["-", "Unknown", "Individual", "Direct", "0", "₹0", "Active"];
                const profile = (customersRaw || []).find(c =>
                    (c?.email && stat?.email && String(c.email).toLowerCase() === String(stat.email).toLowerCase()) ||
                    (c?._id && stat?._id && String(c._id) === String(stat._id)) ||
                    (c?.name && stat?.name && c.name === stat.name)
                );

                return [
                    stat._id ? String(stat._id).slice(-6).toUpperCase() : "GUEST",
                    stat.name || "Guest Customer",
                    profile?.company || "Individual",
                    stat.email || profile?.email || (stat.isUser ? "Registered User" : "Direct Order"),
                    String(stat.totalOrders || 0),
                    `₹${formatCurrency(stat.totalSpend || 0)}`,
                    (Array.isArray(profile?.tags) ? profile.tags.join(", ") : "") || `${stat.totalQuotes || 0} quotes`,
                ];
            }),
            customersRaw: customerStats.map(stat => {
                if (!stat) return {};
                const profile = (customersRaw || []).find(c =>
                    (c?.email && stat?.email && String(c.email).toLowerCase() === String(stat.email).toLowerCase()) ||
                    (c?._id && stat?._id && String(c._id) === String(stat._id)) ||
                    (c?.name && stat?.name && c.name === stat.name)
                );
                return { ...stat, profile: profile || null };
            }),
            printers: [],
            notifications: notifications || [],
            recentActivity: recentActivity || [],
            analyticsCards: analyticsCards || [],
            materialUsage: materialUsage || [],
            revenueTrend: [monthlyRevenue || 0],
        };
    } catch (error) {
        console.error("DASHBOARD PAYLOAD ERROR:", error);
        throw error;
    }
};


const placeOrder = asyncHandler(async (req, res) => {
    const {
        material,
        quality,
        dimensions,
        quantity,
        estimatedWeight,
        estimatedTotal,
        fileName,
        gdriveFileId,
        gdriveLink,
    } = req.body;

    if (
        !material ||
        !quality ||
        !dimensions ||
        !quantity ||
        !estimatedWeight ||
        !estimatedTotal
    ) {
        throw new ApiError(400, "All base order fields are required");
    }

    let finalCustomerName = String(req.user?.name || "").trim();
    if (req.user?.admin && req.body.customerName) {
        finalCustomerName = String(req.body.customerName).trim();
    }

    if (!finalCustomerName) {
        throw new ApiError(401, "User is not authenticated");
    }

    const order = await Order.create({
        material,
        quality,
        dimensions,
        quantity,
        estimatedWeight,
        estimatedTotal,
        customerName: finalCustomerName,
        customerEmail: req.user.email || req.body.customerEmail || "",
        customerId: req.user._id,
        fileName,
        gdriveFileId,
        gdriveLink,
    });

    const io = getSocketServer();
    if (io) {
        const dashboard = await buildDashboardPayload();
        io.emit("order:created", {
            order: {
                id: order._id,
                material: order.material,
                quantity: order.quantity,
                estimatedTotal: order.estimatedTotal,
                createdAt: order.createdAt,
            },
            dashboard,
        });
    }

    return res
        .status(201)
        .json(new ApiResponse(201, order, "Order placed successfully"));
});

const getMyOrders = asyncHandler(async (req, res) => {
    const orders = await Order.find({ customerId: req.user._id }).sort({ createdAt: -1 }).lean();

    return res
        .status(200)
        .json(new ApiResponse(200, orders, "My orders fetched successfully"));
});

const getOrders = asyncHandler(async (_req, res) => {
    const orders = await Order.find().sort({ createdAt: -1 }).lean();

    return res
        .status(200)
        .json(new ApiResponse(200, orders, "Orders fetched successfully"));
});

const getCustomerOrdersForAdmin = asyncHandler(async (req, res) => {
    const { mode, customerKey } = req.params;

    // Fix 11 — sanitize customerKey: cast to plain string, strip to safe characters only
    const decodedKey = String(decodeURIComponent(customerKey || "")).trim();
    const safeKey = decodedKey.replace(/[^\w\s@.\-]/g, "");

    if (!safeKey) {
        throw new ApiError(400, "Customer identifier is required");
    }

    if (mode !== "user" && mode !== "name" && mode !== "email") {
        throw new ApiError(400, "Invalid customer lookup mode");
    }

    let query = mode === "user"
        ? { customerId: safeKey }
        : { customerName: safeKey };

    if (mode === "email") {
        const email = safeKey.toLowerCase();
        const user = await User.findOne({ email }).select("_id").lean();
        query = {
            $or: [
                { customerEmail: email },
                ...(user?._id ? [{ customerId: user._id }] : []),
            ],
        };
    }

    const orders = await Order.find(query).sort({ createdAt: -1 }).lean();
    const quoteEmail = mode === "email" ? safeKey.toLowerCase() : orders[0]?.customerEmail;
    const quotes = quoteEmail
        ? await Quote.find({ email: quoteEmail }).sort({ createdAt: -1 }).lean()
        : [];
    const totalSpend = orders.reduce((sum, order) => sum + (Number(order.estimatedTotal) || 0), 0);
    const paidOrders = orders.filter((order) => order.paid).length;
    const activeOrders = orders.filter((order) => !["completed", "rejected"].includes(order.orderStatus)).length;

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                customer: {
                    id: safeKey,
                    mode,
                    name: orders[0]?.customerName || quotes[0]?.name || safeKey,
                    email: quoteEmail || safeKey,
                    totalOrders: orders.length,
                    totalQuotes: quotes.length,
                    activeOrders,
                    paidOrders,
                    totalSpend,
                },
                orders,
                quotes,
            },
            "Customer orders fetched successfully"
        )
    );
});

const getDashboardData = asyncHandler(async (_req, res) => {
    // Fix 9 — removed error.stack from response body
    const dashboard = await buildDashboardPayload();
    return res
        .status(200)
        .json(new ApiResponse(200, dashboard, "Dashboard data fetched successfully"));
});

const createOrderPayment = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);

    if (!order) {
        throw new ApiError(404, "Order not found");
    }

    if (order.paid) {
        throw new ApiError(400, "Order is already paid");
    }

    if (order.orderStatus !== "approved") {
        throw new ApiError(400, "Order must be approved by admin before payment can be initiated");
    }

    const paymentOrder = await createPaymentOrder(order);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                orderId: order._id,
                amount: paymentOrder.amount,
                currency: paymentOrder.currency,
                razorpayOrderId: paymentOrder.razorpayOrderId,
                keyId: paymentOrder.keyId,
            },
            "Payment order created"
        )
    );
});

const verifyOrderPayment = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const {
        razorpayPaymentId,
        razorpayOrderId,
        razorpaySignature,
    } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
        throw new ApiError(404, "Order not found");
    }

    if (order.paid) {
        return res
            .status(200)
            .json(new ApiResponse(200, order, "Order already marked as paid"));
    }

    await verifyPaymentOrder({
        order,
        razorpayPaymentId,
        razorpayOrderId,
        razorpaySignature,
    });

    const io = getSocketServer();
    if (io) {
        const dashboard = await buildDashboardPayload();
        io.emit("order:paid", {
            order: {
                id: order._id,
                paymentId: order.paymentId,
                paidAt: order.paidAt,
            },
            dashboard,
        });
    }

    return res
        .status(200)
        .json(new ApiResponse(200, order, "Payment verified and order marked as paid"));
});

const markOrderPaymentFailed = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const { razorpayOrderId, failureReason } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
        throw new ApiError(404, "Order not found");
    }

    if (order.paid) {
        throw new ApiError(400, "Order is already paid");
    }

    await failPaymentOrder({ order, razorpayOrderId, failureReason });

    const io = getSocketServer();
    if (io) {
        const dashboard = await buildDashboardPayload();
        io.emit("order:payment_failed", {
            order: {
                id: order._id,
                paymentOrderId: order.paymentOrderId,
                failureReason: order.paymentSignature,
            },
            dashboard,
        });
    }

    return res
        .status(200)
        .json(new ApiResponse(200, order, "Payment marked as failed"));
});

const updateOrder = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const updates = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
        throw new ApiError(404, "Order not found");
    }

    const allowedFields = [
        "material",
        "quality",
        "quantity",
        "customerName",
        "estimatedTotal",
    ];

    for (const field of allowedFields) {
        if (updates[field] !== undefined) {
            order[field] = updates[field];
        }
    }

    await order.save();

    const io = getSocketServer();
    if (io) {
        const dashboard = await buildDashboardPayload();
        io.emit("order:updated", { order, dashboard });
    }

    return res
        .status(200)
        .json(new ApiResponse(200, order, "Order updated successfully"));
});

const deleteOrder = asyncHandler(async (req, res) => {
    const { orderId } = req.params;

    const order = await Order.findByIdAndDelete(orderId);
    if (!order) {
        throw new ApiError(404, "Order not found");
    }

    const io = getSocketServer();
    if (io) {
        const dashboard = await buildDashboardPayload();
        io.emit("order:deleted", { orderId, dashboard });
    }

    return res
        .status(200)
        .json(new ApiResponse(200, null, "Order deleted successfully"));
});

const approveOrder = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);
    if (!order) throw new ApiError(404, "Order not found");

    if (order.orderStatus !== "new") {
        throw new ApiError(400, `Cannot approve an order with status "${order.orderStatus}"`);
    }

    order.orderStatus = "approved";
    order.rejectionReason = "";
    await order.save();

    const io = getSocketServer();
    if (io) {
        const dashboard = await buildDashboardPayload();
        io.emit("order:updated", { order, dashboard });
    }

    return res
        .status(200)
        .json(new ApiResponse(200, order, "Order approved successfully"));
});

const rejectOrder = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const { rejectionReason } = req.body;
    const order = await Order.findById(orderId);
    if (!order) throw new ApiError(404, "Order not found");

    if (order.orderStatus === "completed" || order.orderStatus === "delivering") {
        throw new ApiError(400, `Cannot reject an order with status "${order.orderStatus}"`);
    }

    order.orderStatus = "rejected";
    order.rejectionReason = String(rejectionReason || "").trim();
    await order.save();

    const io = getSocketServer();
    if (io) {
        const dashboard = await buildDashboardPayload();
        io.emit("order:updated", { order, dashboard });
    }

    return res
        .status(200)
        .json(new ApiResponse(200, order, "Order rejected"));
});

const setDelivering = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);
    if (!order) throw new ApiError(404, "Order not found");

    if (!order.paid) {
        throw new ApiError(400, "Order must be paid before marking as delivering");
    }

    order.orderStatus = "delivering";
    await order.save();

    const io = getSocketServer();
    if (io) {
        const dashboard = await buildDashboardPayload();
        io.emit("order:updated", { order, dashboard });
    }

    return res
        .status(200)
        .json(new ApiResponse(200, order, "Order marked as delivering"));
});

const completeOrder = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);
    if (!order) throw new ApiError(404, "Order not found");

    if (!order.paid) {
        throw new ApiError(400, "Order must be paid before marking as completed");
    }

    order.orderStatus = "completed";
    await order.save();

    const io = getSocketServer();
    if (io) {
        const dashboard = await buildDashboardPayload();
        io.emit("order:updated", { order, dashboard });
    }

    return res
        .status(200)
        .json(new ApiResponse(200, order, "Order marked as completed"));
});

const setPaid = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);
    if (!order) throw new ApiError(404, "Order not found");

    // Fix 7c — idempotency guard for manual payment
    if (order.paid) {
        throw new ApiError(409, "Order is already marked as paid");
    }

    order.paid = true;
    order.paymentStatus = "paid";
    order.paymentOrderId = "MANUAL_PAYMENT";
    order.paymentId = "MANUAL_PAYMENT";
    order.paymentSignature = "MANUAL_PAYMENT";
    order.paidAt = new Date();
    await order.save();

    const io = getSocketServer();
    if (io) {
        const dashboard = await buildDashboardPayload();
        io.emit("order:updated", { order, dashboard });
    }

    return res
        .status(200)
        .json(new ApiResponse(200, order, "Order marked as paid"));
});

const getOrderById = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const order = await Order.findById(orderId).lean();
    if (!order) throw new ApiError(404, "Order not found");

    // Fix 8 — ownership check: non-admin users can only fetch their own orders
    if (!req.user.admin && String(order.customerId) !== String(req.user._id)) {
        throw new ApiError(403, "Access denied");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, order, "Order fetched successfully"));
});

const deleteFile = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);

    if (!order) {
        throw new ApiError(404, "Order not found");
    }

    // Fix 12 — deleteFromGDrive is now imported at the top of the file
    if (order.gdriveFileId) {
        try {
            await deleteFromGDrive(order.gdriveFileId);
        } catch (error) {
            console.error("Failed to delete from GDrive, but continuing to clear DB record:", error);
        }
    }

    order.fileName = "";
    order.gdriveFileId = "";
    order.gdriveLink = "";
    await order.save();

    const io = getSocketServer();
    if (io) {
        const dashboard = await buildDashboardPayload();
        io.emit("order:updated", { order, dashboard });
    }

    return res
        .status(200)
        .json(new ApiResponse(200, order, "File deleted from order successfully"));
});

const attachFileToOrder = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const { fileName, gdriveFileId, gdriveLink } = req.body;

    if (!fileName || !gdriveFileId || !gdriveLink) {
        throw new ApiError(400, "All file fields are required");
    }

    const order = await Order.findById(orderId);
    if (!order) {
        throw new ApiError(404, "Order not found");
    }

    // Fix 12 — deleteFromGDrive is now imported at the top of the file
    if (order.gdriveFileId) {
        try {
            await deleteFromGDrive(order.gdriveFileId);
        } catch (error) {
            console.error("Failed to delete old file from GDrive:", error);
        }
    }

    order.fileName = fileName;
    order.gdriveFileId = gdriveFileId;
    order.gdriveLink = gdriveLink;
    await order.save();

    const io = getSocketServer();
    if (io) {
        const dashboard = await buildDashboardPayload();
        io.emit("order:updated", { order, dashboard });
    }

    return res
        .status(200)
        .json(new ApiResponse(200, order, "File attached to order successfully"));
});

export {
    placeOrder,
    getOrders,
    getCustomerOrdersForAdmin,
    getDashboardData,
    createOrderPayment,
    verifyOrderPayment,
    markOrderPaymentFailed,
    updateOrder,
    deleteOrder,
    approveOrder,
    setPaid,
    rejectOrder,
    setDelivering,
    completeOrder,
    getOrderById,
    getMyOrders,
    deleteFile,
    attachFileToOrder,
};