import { Router } from "express";
import multer from "multer";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  upload,
  getFreelancers,
  getFreelancer,
  createFreelancer,
  updateFreelancer,
  deleteFreelancer,
  searchFreelancers,
  getTopFreelancers,
  getFreelancerStats,
  getFreelancerPortfolio,
  uploadPortfolio,
  rateFreelancer,
} from "../controllers/freelancer.controller.js";

const router = Router();
const fileUpload = multer({ storage: multer.memoryStorage() });

router.route("/").get(getFreelancers).post(verifyJWT, createFreelancer);
router.route("/search").get(searchFreelancers);
router.route("/top").get(getTopFreelancers);
router.route("/:id").get(getFreelancer).put(verifyJWT, updateFreelancer).delete(verifyJWT, deleteFreelancer);
router.route("/:id/stats").get(getFreelancerStats);
router.route("/:id/portfolio").get(getFreelancerPortfolio).post(verifyJWT, fileUpload.array("portfolio", 10), uploadPortfolio);
router.route("/:id/rate").post(verifyJWT, rateFreelancer);

export default router;
