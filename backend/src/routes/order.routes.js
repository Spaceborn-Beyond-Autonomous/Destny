import { Router } from "express";
import { verifyJWT, verifyAdmin } from "../middlewares/auth.middleware.js";
import {
	approveOrder,
	completeOrder,
	createOrderPayment,
	deleteOrder,
	getDashboardData,
	getCustomerOrdersForAdmin,
	getOrderById,
	getOrders,
	getMyOrders,
	markOrderPaymentFailed,
	placeOrder,
	rejectOrder,
	setDelivering,
	setPaid,
	updateOrder,
	verifyOrderPayment,
	deleteFile,
	attachFileToOrder,
} from "../controllers/order.controller.js";
import {
	getOrderChatMessages,
	getOrderChatSummaries,
	markOrderChatRead,
	sendOrderChatMessage,
} from "../controllers/chat.controller.js";

const router = Router();

// Admin-only dashboard & full list
router.route("/dashboard").get(verifyJWT, verifyAdmin, getDashboardData);
router.route("/").get(verifyJWT, verifyAdmin, getOrders);
router.route("/customer-orders/:mode/:customerKey").get(verifyJWT, verifyAdmin, getCustomerOrdersForAdmin);

// User specific routes
router.route("/").post(verifyJWT, placeOrder);
router.route("/my-orders").get(verifyJWT, getMyOrders);
router.route("/chat-summaries").get(verifyJWT, getOrderChatSummaries);
router.route("/:orderId").get(verifyJWT, getOrderById); // getOrderById should handle ownership check
router.route("/:orderId/chat")
	.get(verifyJWT, getOrderChatMessages)
	.post(verifyJWT, sendOrderChatMessage);
router.route("/:orderId/chat/read").post(verifyJWT, markOrderChatRead);

// Admin management routes
router.route("/:orderId")
    .put(verifyJWT, verifyAdmin, updateOrder)
    .delete(verifyJWT, verifyAdmin, deleteOrder);

router.route("/:orderId/approve").patch(verifyJWT, verifyAdmin, approveOrder);
router.route("/:orderId/reject").patch(verifyJWT, verifyAdmin, rejectOrder);
router.route("/:orderId/delivering").patch(verifyJWT, verifyAdmin, setDelivering);
router.route("/:orderId/complete").patch(verifyJWT, verifyAdmin, completeOrder);
router.route("/:orderId/paid").patch(verifyJWT, verifyAdmin, setPaid);

// File management (Admin)
router.route("/:orderId/file")
    .post(verifyJWT, verifyAdmin, attachFileToOrder)
    .delete(verifyJWT, verifyAdmin, deleteFile);

// Payment routes (Admin controlled)
router.route("/:orderId/payment/create-order").post(verifyJWT, verifyAdmin, createOrderPayment);
router.route("/:orderId/payment/verify").post(verifyJWT, verifyAdmin, verifyOrderPayment);
router.route("/:orderId/payment/fail").post(verifyJWT, verifyAdmin, markOrderPaymentFailed);

export default router;
