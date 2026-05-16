import { User } from '../models/User.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { generateOTP } from '../utils/generateOTP.js';
import { isOTPValid } from '../utils/isOTPValid.js';
import redis from '../services/redis.service.js';
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = await bcrypt.hash(refreshToken, 10)
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "Error generating Access and Refresh tokens")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body

    if (!name || !email || !password) {
        throw new ApiError(400, "All fields are required")
    }

    const existingUser = await User.findOne({ email })

    if (existingUser) {
        throw new ApiError(400, "User already exists")
    }

    const user = await User.create({
        name,
        email,
        password
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )


    if (!createdUser) {
        throw new ApiError(500, 'Failed to create user');
    }

    return res
        .status(200)
        .json(new ApiResponse(200, createdUser, 'User registered successfully'));

})

const loginUser = asyncHandler(async (req, res) => {

    const { email, password } = req.body

    if (!email) {
        throw new ApiError(404, "email required")
    }

    if (!password) {
        throw new ApiError(404, "password required")
    }

    const user = await User.findOne({
        email
    }).select("+password")

    if (!user) {
        throw new ApiError(408, "user does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(404, "incorrect user credentials")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
    }

    return res
        .status(200)
        .cookie("refreshToken", refreshToken, options)
        .cookie("accessToken", accessToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser, accessToken, refreshToken
                },
                "user logged in successfully"
            )
        )
})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1
            }
        },
        {
            new: true
        }
    )
    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
    }
    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(
            200, {}, "User logged out"
        ))
})

const refreshAccessToken = asyncHandler(async (req, res) => {

    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )

        const user = await User.findById(decodedToken?._id)

        if (!user) {
            throw new ApiError(401, "invalid refrehToken")
        }

        const isTokenValid = await bcrypt.compare(incomingRefreshToken, user?.refreshToken || "")

        if (!isTokenValid) {
            throw new ApiError(401, "refresh token is expired or used")
        }

        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
        }

        const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshTokens(user._id)

        return res
            .status(200)
            .cookie("refreshToken", newRefreshToken, options)
            .cookie("accessToken", accessToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken },
                    "Access token refreshed"
                )
            )

    } catch (error) {
        throw new ApiError(401, error?.message || "invalid refresh token")
    }

})

const getCurrentUser = asyncHandler(async (req, res) => {

    const user = req.user

    return res
        .status(200)
        .json(new ApiResponse(200, user, "fetched the current user"))
})

const sendOTP = asyncHandler(async (req, res) => {

    const { email } = req.body
    if (!email) {
        throw new ApiError(400, 'Email is required');
    }

    const { hashedotp, OrignalOtp } = await generateOTP();

    await redis.set(`otp:${email}`, hashedotp, { ex: 300 });

    const { data, error } = await resend.emails.send({
        from: "onboarding@resend.dev",
        to: "getdestny@gmail.com",
        subject: "Destny OTP Verification Code",
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email - Destny</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #000000; color: #ffffff;">
  <div style="width: 100%; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <!-- Logo/Header -->
    <div style="text-align: center; margin-bottom: 40px;">
      <h1 style="font-size: 32px; font-weight: 800; color: #ffffff; margin: 0; letter-spacing: -1px;">
        Destny
      </h1>
      <div style="height: 3px; width: 40px; background-color: #f97316; margin: 10px auto 0; border-radius: 2px;"></div>
    </div>
    
    <!-- Main Card -->
    <div style="background-color: #111111; border-radius: 16px; padding: 40px; border: 1px solid #333333;">
      <h2 style="font-size: 24px; font-weight: 600; color: #ffffff; margin-top: 0; margin-bottom: 16px; text-align: center;">
        Verification Code
      </h2>
      <p style="font-size: 16px; line-height: 24px; color: #a1a1aa; margin-bottom: 32px; text-align: center;">
        You're almost there! Use the verification code below to securely access your Destny account.
      </p>
      
      <!-- OTP Box -->
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="display: inline-block; border: 2px solid #f97316; border-radius: 12px; padding: 20px 40px; background-color: rgba(249, 115, 22, 0.05);">
          <span style="font-family: monospace; font-size: 40px; font-weight: 700; letter-spacing: 8px; color: #f97316;">
            ${OrignalOtp}
          </span>
        </div>
      </div>
      
      <p style="font-size: 14px; line-height: 20px; color: #71717a; text-align: center; margin-bottom: 0;">
        This code is valid for <strong>5 minutes</strong>. Please do not share this code with anyone.
      </p>
    </div>
    
    <!-- Footer -->
    <div style="text-align: center; margin-top: 32px;">
      <p style="font-size: 13px; color: #52525b; margin-bottom: 8px;">
        If you didn't request this email, you can safely ignore it.
      </p>
      <p style="font-size: 12px; color: #3f3f46;">
        &copy; ${new Date().getFullYear()} Destny. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
`,
    });

    if (error) {
        throw new ApiError(500, "Failed to send OTP");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {}, 'otp sent successfully'));

})

const verifyOTP = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) {
        throw new ApiError(400, "Email and OTP are required");
    }

    const storedOTP = await redis.get(`otp:${email}`);
    if (!storedOTP) {
        throw new ApiError(400, "OTP is invalid or expired");
    }

    const isValid = await isOTPValid(otp, storedOTP);
    if (!isValid) {
        throw new ApiError(400, "OTP is invalid or expired");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, { email }, 'OTP verified successfully'));
})

const updatePassword = asyncHandler(async (req, res) => {
    const { email, newPassword, OTP } = req.body;
    if (!newPassword) {
        throw new ApiError(400, "Password is required");
    }
    const user = await User.findOne({ email });
    if (!user) {
        throw new ApiError(404, "User not found");
    }
    const redisOTP = await redis.get(`otp:${email}`);
    if (!redisOTP) {
        throw new ApiError(400, "OTP is invalid or expired");
    }
    const isValid = await isOTPValid(OTP, redisOTP);
    if (!isValid) {
        throw new ApiError(400, "OTP is invalid or expired");
    }
    user.password = newPassword;
    await user.save();
    return res
        .status(200)
        .json(new ApiResponse(200, { user }, 'Password updated successfully'));
})


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    getCurrentUser,
    sendOTP,
    verifyOTP,
    updatePassword
}

