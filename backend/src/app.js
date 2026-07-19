import express from "express"
import cookieParser from "cookie-parser"
import cors from "cors"
import helmet from "helmet"
import { generalApiLimiter } from "./middlewares/rateLimiter.middleware.js"
const app = express()

const origin = process.env.CLIENT_URL || process.env.CORS_ORIGIN || "http://localhost:5173";
const configuredOrigins = origin
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);

app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false,
}))

// Allow multiple origins (local dev + deployed frontend)
const allowedOrigins = Array.from(
  new Set([
    ...configuredOrigins,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "https://destny.in",
    "https://www.destny.in",
  ])
).map((o) => String(o).replace(/\/$/, ""));

app.use(cors({
    origin: (requestOrigin, callback) => {
        // allow requests with no Origin header (e.g. mobile apps, curl)
        if (!requestOrigin) return callback(null, true);
        const cleaned = String(requestOrigin).replace(/\/$/, "");
    // If env origin includes a different host than the current request (common in deployed setups),
    // allow local dev origins explicitly and otherwise require explicit match.
    if (allowedOrigins.includes(cleaned)) return callback(null, true);
    // Fallback: allow localhost dev even if origin var is set incorrectly.
    if (cleaned.startsWith("http://localhost") || cleaned.startsWith("http://127.0.0.1")) return callback(null, true);
    return callback(new Error(`CORS origin not allowed: ${cleaned}`));
    },
    credentials: true
}))

app.use("/api/v1/orders/webhook/razorpay", express.raw({ type: "application/json" }))
app.use(express.json({ limit: "50kb" }))
app.use(express.urlencoded({
    extended: true,
    limit: "50kb"
}))
app.use(express.static("public"))
app.use(cookieParser())
app.use("/api", generalApiLimiter)

app.get("/", (req, res) => {
  res.send("Backend is live ✅");
});

import userRouter from "./routes/user.routes.js"
import uploadRouter from "./routes/upload.routes.js"
import orderRouter from "./routes/order.routes.js"
import quoteRouter from "./routes/quote.routes.js"
import customerRouter from "./routes/customer.routes.js"
import resumeRouter from "./routes/resume.routes.js"
import webhookRouter from "./routes/webhook.routes.js"
import jobRouter from "./routes/job.routes.js"
import freelancerRouter from "./routes/freelancer.routes.js"
import contractRouter from "./routes/contract.routes.js"
import categoryRouter from "./routes/category.routes.js"
import freelanceChatRouter from "./routes/freelanceChat.routes.js"

app.use("/api/v1/users", userRouter)
app.use("/api/v1/upload", uploadRouter)
app.use("/api/v1/orders", orderRouter)
app.use("/api/v1/webhook", webhookRouter)
app.use("/api/v1/quotes", quoteRouter)
app.use("/api/v1/customers", customerRouter)
app.use("/api/v1/resume", resumeRouter)
app.use("/api/v1/jobs", jobRouter)
app.use("/api/v1/freelancers", freelancerRouter)
app.use("/api/v1/contracts", contractRouter)
app.use("/api/v1/categories", categoryRouter)
app.use("/api/v1/freelance-chat", freelanceChatRouter)

// Global error handler — replaces errorHandler.js (which imports a non-existent errorResponse)
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = (process.env.NODE_ENV === "production" && statusCode === 500)
        ? "Internal server error"
        : (err.message || "Something went wrong");

    if (process.env.NODE_ENV !== "test") {
        console.error(err);
    }

    return res.status(statusCode).json({
        success: false,
        statusCode,
        message,
        errors: err.errors || [],
    });
});

export {app}
