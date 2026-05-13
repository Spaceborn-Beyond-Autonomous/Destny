import { User } from '../models/User.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

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
    const {name, email, password} = req.body

    if(!name || !email || !password){
        throw new ApiError(400, "All fields are required")
    }

    const existingUser = await User.findOne({email})

    if(existingUser){
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

    const { email, password} = req.body

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

export { 
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    getCurrentUser
 }

