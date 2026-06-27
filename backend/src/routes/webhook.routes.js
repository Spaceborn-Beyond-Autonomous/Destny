import { Router } from "express";
import { handleRazorpayWebhook } from "../controllers/webhook.controller.js";

const router = Router();

router.route("/razorpay").post(handleRazorpayWebhook);

export default router;