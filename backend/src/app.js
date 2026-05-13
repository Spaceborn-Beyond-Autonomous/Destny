import express from "express"
import cookieParser from "cookie-parser"
import cors from "cors"
const app = express()

const origin = process.env.CLIENT_URL || process.env.CORS_ORIGIN || "http://localhost:5173";

app.use(cors({
    origin: origin.replace(/\/$/, ""),
    credentials: true
}))
app.use(express.json())
app.use(express.urlencoded({
    extended: true,
    limit: "10000kb"
}))
app.use(express.static("public"))
app.use(cookieParser())

app.get("/", (req, res) => {
  res.send("Backend is live ✅");
});

import userRouter from "./routes/user.routes.js"
import uploadRouter from "./routes/upload.routes.js"
import orderRouter from "./routes/order.routes.js"
import quoteRouter from "./routes/quote.routes.js"
import customerRouter from "./routes/customer.routes.js"

app.use("/api/v1/users", userRouter)
app.use("/api/v1/upload", uploadRouter)
app.use("/api/v1/orders", orderRouter)
app.use("/api/v1/quotes", quoteRouter)
app.use("/api/v1/customers", customerRouter)

// Global error handler
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || "Something went wrong";

    return res.status(statusCode).json({
        success: false,
        statusCode,
        message,
        errors: err.errors || [],
    });
});

export {app}