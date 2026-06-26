import rateLimit from "express-rate-limit";

// Strict limiter for login — prevents brute-force password guessing
export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 attempts per IP per window
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        statusCode: 429,
        message: "Too many login attempts. Please try again after 15 minutes.",
        errors: [],
    },
});

// Strict limiter for registration — prevents mass fake account creation
export const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // 5 registrations per IP per hour
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        statusCode: 429,
        message: "Too many registration attempts. Please try again later.",
        errors: [],
    },
});

// Moderate limiter for refresh-token — legitimate users refresh occasionally,
// but this endpoint should never be hit at high frequency
export const refreshTokenLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 30, // 30 refreshes per IP per window
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        statusCode: 429,
        message: "Too many token refresh attempts. Please try again later.",
        errors: [],
    },
});

// Moderate limiter for public quote submission — prevents spam/flooding
// of the sales team's inbox via fake quote requests
export const quoteSubmitLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 quote submissions per IP per hour
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        statusCode: 429,
        message: "Too many quote requests. Please try again later.",
        errors: [],
    },
});

// General-purpose limiter for all other API routes — broad safety net
// against scripted abuse across the whole API surface
export const generalApiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300, // 300 requests per IP per window
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        statusCode: 429,
        message: "Too many requests. Please slow down.",
        errors: [],
    },
});