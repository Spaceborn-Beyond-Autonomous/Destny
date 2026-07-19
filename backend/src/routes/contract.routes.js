import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  getContracts,
  getContract,
  createContract,
  updateContract,
  updateContractWorkspace,
  getActiveContract,
  addMilestone,
  updateMilestone,
  fundMilestone,
  completeContractPayment,
  createContractPaymentOrder,
  verifyContractPayment,
  markContractPaymentFailed,
  addComment,
  rateFreelancer,
  getContractStats,
} from "../controllers/contract.controller.js";


const router = Router();

router.route("/").get(getContracts).post(verifyJWT, createContract);
router.route("/active").get(getActiveContract);
router.route("/stats").get(getContractStats);
router.route("/:id").get(getContract).put(verifyJWT, updateContract);
router.route("/:contractId/workspace").put(verifyJWT, updateContractWorkspace);
router.route("/:contractId/milestones").post(verifyJWT, addMilestone);
router.route("/:contractId/milestones/fund").post(verifyJWT, fundMilestone);
router.route("/:contractId/payment").post(verifyJWT, completeContractPayment);
router.route("/:contractId/payment/create-order").post(verifyJWT, createContractPaymentOrder);
router.route("/:contractId/payment/verify").post(verifyJWT, verifyContractPayment);
router.route("/:contractId/payment/fail").post(verifyJWT, markContractPaymentFailed);
router.route("/:contractId/milestones/:milestoneId").put(verifyJWT, updateMilestone);
router.route("/:contractId/comments").post(verifyJWT, addComment);
router.route("/:contractId/rate").post(verifyJWT, rateFreelancer);

export default router;
