import express from "express"
import cookieParser from "cookie-parser"
import cors from "cors"
import helmet from "helmet"
import { generalApiLimiter } from "./middlewares/rateLimiter.middleware.js"
const app = express()

const origin = process.env.CLIENT_URL || process.env.CORS_ORIGIN || "http://localhost:5173";

app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false,
}))

app.use(cors({
    origin: origin.replace(/\/$/, ""),
    credentials: true
}))
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

app.use("/api/v1/users", userRouter)
app.use("/api/v1/upload", uploadRouter)
app.use("/api/v1/orders", orderRouter)
app.use("/api/v1/quotes", quoteRouter)
app.use("/api/v1/customers", customerRouter)
app.use("/api/v1/resume", resumeRouter)

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