import { Router } from "express";
import { upload, uploadFile } from "../controllers/upload.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/").post(verifyJWT, upload.single("file"), uploadFile);

export default router;
