import { Router } from "express";
import { resumeUpload, uploadResume } from "../controllers/resume.controller.js";

const router = Router();

// Public route — no auth required for resume submissions
router.route("/").post(resumeUpload.single("resume"), uploadResume);

export default router;
