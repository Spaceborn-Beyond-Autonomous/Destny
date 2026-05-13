import { Router } from "express";
import {
    submitQuoteRequest,
    getQuotes,
    getMyQuotes,
    updateQuoteStatus,
    deleteQuote,
    createQuote,
    getQuoteChatMessages,
    sendQuoteChatMessage,
} from "../controllers/quote.controller.js";
import { verifyJWT, verifyAdmin } from "../middlewares/auth.middleware.js";

const router = Router();

// Public route
router.route("/submit").post(submitQuoteRequest);

// Admin routes
router.route("/").get(verifyJWT, verifyAdmin, getQuotes);
router.route("/").post(verifyJWT, verifyAdmin, createQuote);
router.route("/my-quotes").get(verifyJWT, getMyQuotes);
router.route("/:quoteId/status").patch(verifyJWT, verifyAdmin, updateQuoteStatus);
router.route("/:quoteId/chat")
    .get(verifyJWT, getQuoteChatMessages)
    .post(verifyJWT, sendQuoteChatMessage);
router.route("/:quoteId").delete(verifyJWT, verifyAdmin, deleteQuote);

export default router;
