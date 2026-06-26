import { Quote } from "../models/Quote.model.js";
import { QuoteChatMessage } from "../models/QuoteChatMessage.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { getSocketServer } from "../socket.js";

const assertQuoteAccess = async (quoteId, user) => {
    const quote = await Quote.findById(quoteId).lean();
    if (!quote) throw new ApiError(404, "Quote not found");
    if (!user?.admin && String(quote.email).toLowerCase() !== String(user?.email).toLowerCase()) {
        throw new ApiError(403, "You do not have access to this quote");
    }
    return quote;
};

const submitQuoteRequest = asyncHandler(async (req, res) => {
    const { name, email, projectDescription, budget, technicalSpecifications, source } = req.body;

    if ([name, email, projectDescription, budget].some((field) => !field || !String(field).trim())) {
        throw new ApiError(400, "All required fields must be provided");
    }

    const quote = await Quote.create({
        name,
        email,
        projectDescription,
        budget,
        technicalSpecifications,
        source: source || "website-cta",
    });

    return res
        .status(201)
        .json(new ApiResponse(201, quote, "Quote request submitted successfully"));
});

const getQuotes = asyncHandler(async (req, res) => {
    const quotes = await Quote.find().sort({ createdAt: -1 });

    return res
        .status(200)
        .json(new ApiResponse(200, quotes, "Quotes fetched successfully"));
});

const getMyQuotes = asyncHandler(async (req, res) => {
    const quotes = await Quote.find({ email: req.user.email }).sort({ createdAt: -1 }).lean();

    return res
        .status(200)
        .json(new ApiResponse(200, quotes, "My quotes fetched successfully"));
});

const updateQuoteStatus = asyncHandler(async (req, res) => {
    const { quoteId } = req.params;
    const { status } = req.body;

    if (!["pending", "under review", "accepted", "rejected", "in production", "completed"].includes(status)) {
        throw new ApiError(400, "Invalid status");
    }

    const quote = await Quote.findByIdAndUpdate(
        quoteId,
        { $set: { status } },
        { new: true }
    );

    if (!quote) {
        throw new ApiError(404, "Quote not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, quote, "Quote status updated successfully"));
});

const deleteQuote = asyncHandler(async (req, res) => {
    const { quoteId } = req.params;
    const quote = await Quote.findByIdAndDelete(quoteId);

    if (!quote) {
        throw new ApiError(404, "Quote not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Quote deleted successfully"));
});

const createQuote = asyncHandler(async (req, res) => {
    const { name, email, projectDescription, budget, technicalSpecifications } = req.body;

    if (!name || !email) {
        throw new ApiError(400, "Name and email are required");
    }

    const quote = await Quote.create({
        name,
        email,
        projectDescription: projectDescription || "Manual Quote",
        budget: budget || "TBD",
        technicalSpecifications,
        source: "admin-manual",
    });

    return res
        .status(201)
        .json(new ApiResponse(201, quote, "Quote created successfully by admin"));
});

const getQuoteChatMessages = asyncHandler(async (req, res) => {
    const { quoteId } = req.params;
    await assertQuoteAccess(quoteId, req.user);

    const messages = await QuoteChatMessage.find({ quoteId }).sort({ createdAt: 1 }).limit(200).lean();

    return res
        .status(200)
        .json(new ApiResponse(200, messages, "Quote chat messages fetched successfully"));
});

const sendQuoteChatMessage = asyncHandler(async (req, res) => {
    const { quoteId } = req.params;
    const text = String(req.body?.message || "").trim();
    if (!text) throw new ApiError(400, "Message is required");

    await assertQuoteAccess(quoteId, req.user);

    const message = await QuoteChatMessage.create({
        quoteId,
        senderId: req.user._id,
        senderName: req.user.name || (req.user.admin ? "Destny Support" : "Customer"),
        senderRole: req.user.admin ? "admin" : "user",
        message: text,
    });

    const payload = message.toObject();
    const io = getSocketServer();
    if (io) {
        io.emit("quote:chat:message", { quoteId, message: payload });
    }

    return res
        .status(201)
        .json(new ApiResponse(201, payload, "Message sent successfully"));
});

export {
    submitQuoteRequest,
    getQuotes,
    getMyQuotes,
    updateQuoteStatus,
    deleteQuote,
    createQuote,
    getQuoteChatMessages,
    sendQuoteChatMessage,
};
