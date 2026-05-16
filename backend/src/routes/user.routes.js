import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { registerUser, loginUser, logoutUser, refreshAccessToken, getCurrentUser, sendOTP, verifyOTP, updatePassword } from "../controllers/user.controller.js";

const router = Router()

router.route("/register").post(registerUser)
router.route("/loginUser").post(loginUser)
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/current-user").get(verifyJWT, getCurrentUser)
router.route("/send-otp").post(sendOTP)
router.route("/verify-otp").post(verifyOTP)
router.route("/update-password").post(updatePassword)

export default router;