import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  getFreelanceChatMessages,
  getFreelanceChatSummaries,
  markFreelanceChatRead,
  sendFreelanceChatMessage,
} from "../controllers/freelanceChat.controller.js";

const router = Router();

router.route("/summaries").get(verifyJWT, getFreelanceChatSummaries);
router
  .route("/contracts/:conversationId/messages")
  .get(verifyJWT, getFreelanceChatMessages)
  .post(verifyJWT, sendFreelanceChatMessage);
router.route("/contracts/:conversationId/read").post(verifyJWT, markFreelanceChatRead);

export default router;
