import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { loginLimiter, registerLimiter, refreshTokenLimiter } from "../middlewares/rateLimiter.middleware.js";
import { registerUser, loginUser, logoutUser, refreshAccessToken, getCurrentUser} from "../controllers/user.controller.js";

const router = Router()

router.route("/register").post(registerLimiter, registerUser)
router.route("/loginUser").post(loginLimiter, loginUser)
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(refreshTokenLimiter, refreshAccessToken)
router.route("/current-user").get(verifyJWT, getCurrentUser)

export default router;