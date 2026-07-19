import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  getJobs,
  getMyJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  searchJobs,
  applyToJob,
  getJobApplications,
  declineApplication,
  getJobCategories,
  acceptJob,
} from "../controllers/job.controller.js";


const router = Router();

router.route("/").get(getJobs).post(verifyJWT, createJob);
router.route("/mine").get(verifyJWT, getMyJobs);
router.route("/search").get(searchJobs);
router.route("/categories").get(getJobCategories);
router.route("/:jobId").get(getJobById).put(verifyJWT, updateJob).delete(verifyJWT, deleteJob);
router.route("/:jobId/apply").post(verifyJWT, applyToJob);
router.route("/:jobId/applications").get(verifyJWT, getJobApplications);
router.route("/:jobId/applications/:applicationId/decline").post(verifyJWT, declineApplication);
router.route("/:jobId/accept").post(verifyJWT, acceptJob);


export default router;
