import { User } from '../models/User.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

// Simple RFC-5322 inspired email regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Parse token expiry string like "15m", "7d" into milliseconds for cookie maxAge
const parseExpiry = (expiry) => {
    if (!expiry) return undefined;
    const match = String(expiry).match(/^(\d+)([smhd])$/);
    if (!match) return undefined;
    const value = parseInt(match[1], 10);
    const unit = match[2];
    const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
    return value * multipliers[unit];
};

const getCookieOptions = (maxAge) => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    ...(maxAge ? { maxAge } : {}),
});

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = await bcrypt.hash(refreshToken, 10);
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Error generating Access and Refresh tokens");
    }
};

const validAccountTypes = new Set(["general", "printing", "client", "freelancer"]);

const getAccountType = (value) => {
    const accountType = String(value || "general").trim();
    return validAccountTypes.has(accountType) ? accountType : "general";
};

const setCurrentAccountType = async (user, requestedAccountType) => {
    if (!requestedAccountType || !validAccountTypes.has(requestedAccountType)) return;

    const accountTypes = new Set([
        ...(Array.isArray(user.accountTypes) ? user.accountTypes : []),
        user.accountType || "general",
    ]);

    accountTypes.add(requestedAccountType);
    user.accountType = requestedAccountType;

    user.accountTypes = [...accountTypes].filter((accountType) => validAccountTypes.has(accountType));
    await user.save({ validateBeforeSave: false });
};

const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;
    const accountType = getAccountType(req.body.accountType);

    if (!name?.trim() || !email?.trim() || !password || typeof password !== "string") {
        throw new ApiError(400, "All fields are required");
    }

    if (!EMAIL_REGEX.test(email.trim())) {
        throw new ApiError(400, "Invalid email format");
    }

    if (password.length < 8) {
        throw new ApiError(400, "Password must be at least 8 characters");
    }

    const existingUser = await User.findOne({ email: email.trim().toLowerCase() }).select("+password");

    if (existingUser) {
        if (accountType && validAccountTypes.has(accountType)) {
            const isPasswordValid = await existingUser.isPasswordCorrect(password);

            if (!isPasswordValid) {
                throw new ApiError(401, "Invalid credentials");
            }

            await setCurrentAccountType(existingUser, accountType);

            const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(existingUser._id);
            const loggedInUser = await User.findById(existingUser._id).select("-password -refreshToken");
            const accessMaxAge = parseExpiry(process.env.ACCESS_TOKEN_EXPIRY);
            const refreshMaxAge = parseExpiry(process.env.REFRESH_TOKEN_EXPIRY);

            return res
                .status(200)
                .cookie("accessToken", accessToken, getCookieOptions(accessMaxAge))
                .cookie("refreshToken", refreshToken, getCookieOptions(refreshMaxAge))
                .json(new ApiResponse(200, { user: loggedInUser }, "User logged in successfully"));
        }

        throw new ApiError(400, "User already exists");
    }

    const user = await User.create({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        accountType,
        accountTypes: [accountType],
    });

    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if (!createdUser) {
        throw new ApiError(500, "Failed to create user");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);
    const accessMaxAge = parseExpiry(process.env.ACCESS_TOKEN_EXPIRY);
    const refreshMaxAge = parseExpiry(process.env.REFRESH_TOKEN_EXPIRY);

    return res
        .status(201)
        .cookie("accessToken", accessToken, getCookieOptions(accessMaxAge))
        .cookie("refreshToken", refreshToken, getCookieOptions(refreshMaxAge))
        .json(new ApiResponse(201, { user: createdUser }, "User registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const requestedAccountType = req.body.accountType ? getAccountType(req.body.accountType) : null;

    if (!email?.trim()) {
        throw new ApiError(400, "Email is required");
    }

    if (!password || typeof password !== "string") {
        throw new ApiError(400, "Password is required");
    }

    if (!EMAIL_REGEX.test(email.trim())) {
        throw new ApiError(400, "Invalid email format");
    }

    const user = await User.findOne({
        email: email.trim().toLowerCase(),
    }).select("+password");

    if (!user) {
        throw new ApiError(401, "Invalid credentials");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid credentials");
    }

    await setCurrentAccountType(user, requestedAccountType);

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const accessMaxAge = parseExpiry(process.env.ACCESS_TOKEN_EXPIRY);
    const refreshMaxAge = parseExpiry(process.env.REFRESH_TOKEN_EXPIRY);

    return res
        .status(200)
        .cookie("accessToken", accessToken, getCookieOptions(accessMaxAge))
        .cookie("refreshToken", refreshToken, getCookieOptions(refreshMaxAge))
        .json(
            new ApiResponse(
                200,
                { user: loggedInUser },
                "User logged in successfully"
            )
        );
});

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        { $unset: { refreshToken: 1 } },
        { new: true }
    );

    const options = getCookieOptions();

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request");
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );

        const user = await User.findById(decodedToken?._id);

        if (!user) {
            throw new ApiError(401, "Invalid refresh token");
        }

        const isTokenValid = await bcrypt.compare(
            incomingRefreshToken,
            user?.refreshToken || ""
        );

        if (!isTokenValid) {
            throw new ApiError(401, "Refresh token is expired or already used");
        }

        const { accessToken, refreshToken: newRefreshToken } =
            await generateAccessAndRefreshTokens(user._id);

        const accessMaxAge = parseExpiry(process.env.ACCESS_TOKEN_EXPIRY);
        const refreshMaxAge = parseExpiry(process.env.REFRESH_TOKEN_EXPIRY);

        return res
            .status(200)
            .cookie("accessToken", accessToken, getCookieOptions(accessMaxAge))
            .cookie("refreshToken", newRefreshToken, getCookieOptions(refreshMaxAge))
            .json(
                new ApiResponse(
                    200,
                    {},
                    "Access token refreshed"
                )
            );
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token");
    }
});

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(200, req.user, "Fetched current user"));
});

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    getCurrentUser,
};
