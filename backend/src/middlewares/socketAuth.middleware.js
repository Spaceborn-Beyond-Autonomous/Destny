import jwt from "jsonwebtoken";
import { User } from "../models/User.model.js";

const parseCookieHeader = (rawCookieHeader) => {
    const result = {};
    if (!rawCookieHeader) return result;

    rawCookieHeader.split(";").forEach((pair) => {
        const eqIndex = pair.indexOf("=");
        if (eqIndex === -1) return;
        const key = pair.slice(0, eqIndex).trim();
        const value = pair.slice(eqIndex + 1).trim();
        if (key) {
            try {
                result[key] = decodeURIComponent(value);
            } catch {
                result[key] = value;
            }
        }
    });

    return result;
};

const socketAuthMiddleware = async (socket, next) => {
    try {
        const rawCookies = socket.handshake.headers.cookie;
        if (!rawCookies) {
            return next(new Error("Authentication required"));
        }

        const parsed = parseCookieHeader(rawCookies);
        const token = parsed.accessToken;
        if (!token) {
            return next(new Error("Authentication required"));
        }

        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(decoded?._id).select("-password -refreshToken");

        if (!user) {
            return next(new Error("Authentication required"));
        }

        socket.user = user;
        return next();
    } catch (error) {
        return next(new Error("Authentication required"));
    }
};

export { socketAuthMiddleware };