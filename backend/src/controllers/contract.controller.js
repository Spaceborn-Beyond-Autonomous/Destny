import { Contract } from "../models/Contract.model.js";
import { Freelancer } from "../models/Freelancer.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import {
  createRazorpayOrderForAmount,
  createRazorpayVpaPayout,
  verifyRazorpaySignature,
} from "../services/payment.service.js";

const PLATFORM_FEE_PERCENTAGE = Number(process.env.PLATFORM_FEE_PERCENTAGE || 15);
const PLATFORM_UPI_ID = String(process.env.PLATFORM_UPI_ID || process.env.VITE_PLATFORM_UPI_ID || "").trim();
const RAZORPAYX_ACCOUNT_NUMBER = String(process.env.RAZORPAYX_ACCOUNT_NUMBER || process.env.RAZORPAY_ACCOUNT_NUMBER || "").trim();

const calculateFees = (amount) => {
  const safeAmount = Math.max(Number(amount) || 0, 0);
  const platformFee = Math.round((safeAmount * PLATFORM_FEE_PERCENTAGE) / 100);
  return {
    platformFee,
    freelancerAmount: safeAmount - platformFee,
  };
};

const assertContractClientAccess = (contract, user) => {
  if (!contract) throw new ApiError(404, "Contract not found");
  if (!user?.admin && String(contract.clientId || "") !== String(user?._id || "")) {
    throw new ApiError(403, "Only the client can update this contract");
  }
};

const assertRazorpayPayment = (paymentMethod, paymentVerified) => {
  if (paymentMethod !== "razorpay" || !paymentVerified) {
    throw new ApiError(400, "Freelance payments must be completed with Razorpay");
  }
};

const getPaymentDestinations = async (contract) => {
  const freelancer = await Freelancer.findById(contract.freelancerId).select("name upiId").lean();
  const freelancerUpiId = String(freelancer?.upiId || "").trim();

  if (!freelancerUpiId) {
    throw new ApiError(400, "Freelancer UPI ID is required before payment");
  }

  if (!PLATFORM_UPI_ID) {
    throw new ApiError(503, "Platform UPI ID is not configured");
  }

  if (!RAZORPAYX_ACCOUNT_NUMBER) {
    throw new ApiError(503, "RazorpayX account number is not configured");
  }

  return {
    platformUpiId: PLATFORM_UPI_ID,
    freelancerUpiId,
    freelancerName: freelancer?.name || "Freelancer",
  };
};

const createFreelancePayouts = async ({
  contract,
  amount,
  razorpayPaymentId,
  purpose,
  milestoneId,
}) => {
  const fees = calculateFees(amount);
  const destinations = await getPaymentDestinations(contract);
  const baseReference = `${String(contract._id).slice(-12)}_${String(Date.now()).slice(-8)}`;

  const freelancerPayout = await createRazorpayVpaPayout({
    upiId: destinations.freelancerUpiId,
    name: destinations.freelancerName,
    amount: fees.freelancerAmount,
    referenceId: `fr_${baseReference}`,
    narration: "Destny freelancer",
    notes: {
      contractId: String(contract._id),
      milestoneId: String(milestoneId || ""),
      purpose,
      razorpayPaymentId,
      share: "freelancer_85_percent",
    },
  });

  const platformPayout = await createRazorpayVpaPayout({
    upiId: destinations.platformUpiId,
    name: "Destny",
    amount: fees.platformFee,
    referenceId: `pf_${baseReference}`,
    narration: "Destny platform",
    notes: {
      contractId: String(contract._id),
      milestoneId: String(milestoneId || ""),
      purpose,
      razorpayPaymentId,
      share: "platform_15_percent",
    },
  });

  return {
    fees,
    destinations,
    freelancerPayoutId: freelancerPayout.id,
    platformPayoutId: platformPayout.id,
  };
};

const getExpectedContractPayment = (contract, { purpose = "milestone", milestoneId } = {}) => {
  if (purpose === "final") {
    if (contract.status !== "completed") {
      throw new ApiError(400, "Contract must be completed before final payment");
    }
    if (contract.paymentStatus === "released") {
      throw new ApiError(400, "Contract payment has already been released");
    }

    const totalAmount = Number(contract.amount || 0);
    const alreadyPaid = Number(contract.paidAmount || 0);
    const remainingAmount = Math.max(totalAmount - alreadyPaid, 0);
    if (remainingAmount <= 0) {
      throw new ApiError(400, "This contract has no pending balance");
    }
    return { amount: remainingAmount };
  }

  let milestone = milestoneId
    ? contract.milestones.id(milestoneId)
    : contract.milestones.find((item) => item.status === "pending");

  if (!milestone && contract.milestones.length === 0) {
    return { amount: Number(contract.amount || 0), milestone: null };
  }

  if (!milestone) {
    throw new ApiError(404, "Milestone not found");
  }

  if (["funded", "in progress", "completed", "released"].includes(milestone.status)) {
    throw new ApiError(400, "Milestone is already funded");
  }

  const expectedAmount = Number(milestone.amount || contract.amount || 0);
  if (expectedAmount <= 0) {
    throw new ApiError(400, "Milestone amount must be greater than zero");
  }

  return { amount: expectedAmount, milestone };
};

const assertContractFreelancerAccess = async (contract, user) => {
  if (!contract) throw new ApiError(404, "Contract not found");
  if (user?.admin) return;

  const freelancer = await Freelancer.findById(contract.freelancerId).select("userId").lean();
  if (!freelancer?.userId || String(freelancer.userId) !== String(user?._id || "")) {
    throw new ApiError(403, "Only the assigned freelancer can update this workspace");
  }
};

const enrichContractsWithFreelancers = async (contracts) => {
  const freelancerIds = [...new Set(contracts.map((contract) => String(contract.freelancerId)).filter(Boolean))];
  const freelancers = await Freelancer.find({ _id: { $in: freelancerIds } }).select("name title upiId").lean();
  const freelancersById = new Map(freelancers.map((freelancer) => [String(freelancer._id), freelancer]));
  return contracts
    .map((contract) => ({
      ...contract,
      freelancerName: freelancersById.get(String(contract.freelancerId))?.name,
      freelancerEmail: freelancersById.get(String(contract.freelancerId))?.title,
      freelancerUpiId: freelancersById.get(String(contract.freelancerId))?.upiId || "",
    }))
    .filter((contract) => Boolean(contract.freelancerName));
};

const getContracts = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = String(req.query.status).trim();
  if (req.query.freelancerId) filter.freelancerId = req.query.freelancerId;
  if (req.query.clientId) filter.clientId = req.query.clientId;

  const contracts = await Contract.find(filter).sort({ createdAt: -1 }).lean();
  const enriched = await enrichContractsWithFreelancers(contracts);
  return res.status(200).json(new ApiResponse(200, enriched));
});

const getContract = asyncHandler(async (req, res) => {
  const contract = await Contract.findById(req.params.id).lean();
  if (!contract) throw new ApiError(404, "Contract not found");
  return res.status(200).json(new ApiResponse(200, contract));
});

const createContract = asyncHandler(async (req, res) => {
  const { freelancerId, title, description, amount, milestones } = req.body;
  if (!freelancerId || !title) {
    throw new ApiError(400, "freelancerId and title are required");
  }

  const contract = await Contract.create({
    freelancerId,
    clientId: req.user?._id || req.body.clientId || null,
    title: String(title).trim(),
    description: String(description || "").trim(),
    amount: Number(amount) || 0,
    milestones: Array.isArray(milestones) ? milestones : [],
  });

  return res.status(201).json(new ApiResponse(201, contract, "Contract created successfully"));
});

const updateContract = asyncHandler(async (req, res) => {
  const updates = { ...req.body };
  if (updates.milestones && !Array.isArray(updates.milestones)) {
    throw new ApiError(400, "Milestones must be an array");
  }

  const existingContract = await Contract.findById(req.params.id);
  assertContractClientAccess(existingContract, req.user);

  Object.assign(existingContract, updates);
  await existingContract.save();

  const contract = existingContract.toObject();
  return res.status(200).json(new ApiResponse(200, contract, "Contract updated successfully"));
});

const updateContractWorkspace = asyncHandler(async (req, res) => {
  const contract = await Contract.findById(req.params.contractId);
  await assertContractFreelancerAccess(contract, req.user);

  const updates = {};
  if (req.body.progress !== undefined) {
    const progress = Math.round(Number(req.body.progress));
    if (!Number.isFinite(progress) || progress < 0 || progress > 100) {
      throw new ApiError(400, "Progress must be between 0 and 100");
    }
    updates.progress = progress;
  }

  if (req.body.freelancerNote !== undefined) {
    updates.freelancerNote = String(req.body.freelancerNote || "").trim();
  }

  if (req.body.status !== undefined) {
    const status = String(req.body.status).trim();
    if (!["active", "completed", "cancelled"].includes(status)) {
      throw new ApiError(400, "Status must be active, completed, or cancelled");
    }
    updates.status = status;
    if (status === "completed") {
      updates.progress = 100;
      updates.completedAt = new Date();
    }
    if (status === "cancelled") {
      updates.withdrawnAt = new Date();
    }
  }

  Object.assign(contract, updates, { lastProgressAt: new Date() });
  await contract.save();

  const [enriched] = await enrichContractsWithFreelancers([contract.toObject()]);
  return res.status(200).json(new ApiResponse(200, enriched || contract.toObject(), "Contract workspace updated"));
});

const getActiveContract = asyncHandler(async (req, res) => {
  const contract = await Contract.findOne({ status: "active" }).sort({ createdAt: -1 }).lean();
  if (!contract) {
    return res.status(200).json(new ApiResponse(200, null));
  }

  const freelancer = await Freelancer.findById(contract.freelancerId).select("name title upiId").lean();
  if (!freelancer) {
    return res.status(200).json(new ApiResponse(200, null));
  }

  return res.status(200).json(
    new ApiResponse(200, {
      ...contract,
      freelancerName: freelancer.name,
      freelancerEmail: freelancer.title,
      freelancerUpiId: freelancer.upiId || "",
    })
  );
});

const addMilestone = asyncHandler(async (req, res) => {
  const { title, description, amount, dueDate } = req.body;
  if (!title) throw new ApiError(400, "Milestone title is required");

  const contract = await Contract.findById(req.params.contractId);
  if (!contract) throw new ApiError(404, "Contract not found");
  assertContractClientAccess(contract, req.user);

  contract.milestones.push({
    title: String(title).trim(),
    description: String(description || "").trim(),
    amount: Number(amount) || 0,
    dueDate: dueDate ? new Date(dueDate) : null,
  });
  await contract.save();

  return res.status(201).json(new ApiResponse(201, contract.milestones[contract.milestones.length - 1], "Milestone added successfully"));
});

const updateMilestone = asyncHandler(async (req, res) => {
  const { milestoneId } = req.params;
  const updates = { ...req.body };
  const contract = await Contract.findById(req.params.contractId);
  if (!contract) throw new ApiError(404, "Contract not found");
  assertContractClientAccess(contract, req.user);

  const milestone = contract.milestones.id(milestoneId);
  if (!milestone) throw new ApiError(404, "Milestone not found");

  Object.assign(milestone, updates);
  await contract.save();

  return res.status(200).json(new ApiResponse(200, milestone, "Milestone updated successfully"));
});

const createContractPaymentOrder = asyncHandler(async (req, res) => {
  const { contractId } = req.params;
  const { milestoneId, purpose = "milestone" } = req.body;

  const contract = await Contract.findById(contractId);
  assertContractClientAccess(contract, req.user);

  const { amount } = getExpectedContractPayment(contract, { purpose, milestoneId });
  const fees = calculateFees(amount);
  const destinations = await getPaymentDestinations(contract);

  const receipt = `con_${String(contract._id).slice(-10)}_${String(Date.now()).slice(-8)}`;
  const paymentOrder = await createRazorpayOrderForAmount({
    amount,
    receipt,
    notes: {
      contractId: String(contract._id),
      milestoneId: String(milestoneId || ""),
      purpose: String(purpose),
      clientId: String(req.user?._id || ""),
      platformFee: String(fees.platformFee),
      freelancerAmount: String(fees.freelancerAmount),
      platformUpiId: destinations.platformUpiId,
      freelancerUpiId: destinations.freelancerUpiId,
    },
  });

  return res.status(201).json(
    new ApiResponse(201, {
      ...paymentOrder,
      split: {
        platformFee: fees.platformFee,
        freelancerAmount: fees.freelancerAmount,
        platformFeePercentage: PLATFORM_FEE_PERCENTAGE,
        platformUpiId: destinations.platformUpiId,
        freelancerUpiId: destinations.freelancerUpiId,
      },
    }, "Freelance payment order created successfully")
  );
});

const applyMilestoneFunding = async ({
  contractId,
  user,
  milestoneId,
  amount,
  paymentId,
  platformPaymentId,
  freelancerPaymentId,
  platformPayoutId,
  freelancerPayoutId,
  paymentMethod,
}) => {
  const contract = await Contract.findById(contractId);
  assertContractClientAccess(contract, user);
  const destinations = await getPaymentDestinations(contract);

  const requestedAmount = Number(amount) || 0;
  let milestone = milestoneId ? contract.milestones.id(milestoneId) : null;

  if (!milestone) {
    milestone = contract.milestones.find((item) => item.status === "pending");
  }

  if (!milestone) {
    contract.milestones.push({
      title: "Project funding",
      amount: requestedAmount || Number(contract.amount || 0),
      status: "pending",
    });
    milestone = contract.milestones[contract.milestones.length - 1];
  }

  if (!milestone) throw new ApiError(404, "Milestone not found");
  if (["funded", "in progress", "completed", "released"].includes(milestone.status)) {
    throw new ApiError(400, "Milestone is already funded");
  }

  const fundedAmount = requestedAmount || Number(milestone.amount || contract.amount || 0);
  if (fundedAmount <= 0) {
    throw new ApiError(400, "Funding amount must be greater than zero");
  }

  const fees = calculateFees(fundedAmount);
  milestone.amount = fundedAmount;
  milestone.platformFee = fees.platformFee;
  milestone.freelancerAmount = fees.freelancerAmount;
  milestone.status = "funded";
  milestone.fundedAt = new Date();
  milestone.paymentId = String(paymentId || "");
  milestone.platformPaymentId = String(platformPaymentId || "");
  milestone.freelancerPaymentId = String(freelancerPaymentId || "");
  milestone.platformPayoutId = String(platformPayoutId || "");
  milestone.freelancerPayoutId = String(freelancerPayoutId || "");
  milestone.paymentMethod = String(paymentMethod || "razorpay");
  milestone.platformUpiId = destinations.platformUpiId;
  milestone.freelancerUpiId = destinations.freelancerUpiId;
  milestone.payoutStatus = "queued";

  contract.paidAmount = Number(contract.paidAmount || 0) + fundedAmount;
  contract.platformFee = Number(contract.platformFee || 0) + fees.platformFee;
  contract.freelancerAmount = Number(contract.freelancerAmount || 0) + fees.freelancerAmount;
  contract.platformUpiId = destinations.platformUpiId;
  contract.freelancerUpiId = destinations.freelancerUpiId;
  contract.payoutStatus = "queued";
  contract.fundedAt = contract.fundedAt || new Date();
  contract.paymentStatus = contract.paidAmount >= Number(contract.amount || 0) ? "funded" : "partially_funded";
  contract.status = "active";

  await contract.save();

  const [enriched] = await enrichContractsWithFreelancers([contract.toObject()]);

  return {
    contract: enriched || contract.toObject(),
    milestone,
    feeBreakdown: {
      totalAmount: fundedAmount,
      platformFee: fees.platformFee,
      freelancerAmount: fees.freelancerAmount,
      platformFeePercentage: PLATFORM_FEE_PERCENTAGE,
    },
  };
};

const fundMilestone = asyncHandler(async (req, res) => {
  const { contractId } = req.params;
  const { milestoneId, amount, paymentId, platformPaymentId, freelancerPaymentId, paymentMethod } = req.body;
  assertRazorpayPayment(paymentMethod, req.paymentVerified);

  const result = await applyMilestoneFunding({
    contractId,
    user: req.user,
    milestoneId,
    amount,
    paymentId,
    platformPaymentId,
    freelancerPaymentId,
    paymentMethod,
  });

  return res.status(200).json(new ApiResponse(200, result, "Milestone funded successfully"));
});

const applyFinalContractPayment = async ({
  contractId,
  user,
  amount,
  paymentId,
  platformPaymentId,
  freelancerPaymentId,
  platformPayoutId,
  freelancerPayoutId,
  paymentMethod,
}) => {
  const contract = await Contract.findById(contractId);
  assertContractClientAccess(contract, user);
  const destinations = await getPaymentDestinations(contract);

  if (contract.status !== "completed") {
    throw new ApiError(400, "Contract must be completed before final payment");
  }
  if (contract.paymentStatus === "released") {
    throw new ApiError(400, "Contract payment has already been released");
  }

  const totalAmount = Number(contract.amount || 0);
  const alreadyPaid = Number(contract.paidAmount || 0);
  const remainingAmount = Math.max(totalAmount - alreadyPaid, 0);
  const paymentAmount = Number(amount) || remainingAmount || totalAmount;

  if (paymentAmount <= 0 || paymentAmount > remainingAmount) {
    throw new ApiError(400, "Payment amount must cover the remaining contract balance");
  }

  const fees = calculateFees(paymentAmount);
  contract.paidAmount = Math.min(alreadyPaid + paymentAmount, totalAmount);
  contract.platformFee = Number(contract.platformFee || 0) + fees.platformFee;
  contract.freelancerAmount = Number(contract.freelancerAmount || 0) + fees.freelancerAmount;
  contract.fundedAt = contract.fundedAt || new Date();
  contract.releasedAt = new Date();
  contract.finalPaymentId = String(paymentId || "");
  contract.finalPlatformPaymentId = String(platformPaymentId || "");
  contract.finalFreelancerPaymentId = String(freelancerPaymentId || "");
  contract.finalPlatformPayoutId = String(platformPayoutId || "");
  contract.finalFreelancerPayoutId = String(freelancerPayoutId || "");
  contract.finalPlatformUpiId = destinations.platformUpiId;
  contract.finalFreelancerUpiId = destinations.freelancerUpiId;
  contract.platformUpiId = destinations.platformUpiId;
  contract.freelancerUpiId = destinations.freelancerUpiId;
  contract.payoutStatus = "queued";
  contract.paymentMethod = String(paymentMethod || "razorpay");
  contract.paymentStatus = contract.paidAmount >= totalAmount ? "released" : "partially_funded";

  contract.milestones.forEach((milestone) => {
    if (milestone.status !== "released") {
      milestone.status = "released";
      milestone.releasedAt = milestone.releasedAt || new Date();
    }
  });

  await contract.save();

  const [enriched] = await enrichContractsWithFreelancers([contract.toObject()]);
  return {
    contract: enriched || contract.toObject(),
    feeBreakdown: {
      totalAmount: paymentAmount,
      platformFee: fees.platformFee,
      freelancerAmount: fees.freelancerAmount,
      platformFeePercentage: PLATFORM_FEE_PERCENTAGE,
    },
  };
};

const completeContractPayment = asyncHandler(async (req, res) => {
  const { contractId } = req.params;
  const { amount, paymentId, platformPaymentId, freelancerPaymentId, paymentMethod } = req.body;
  assertRazorpayPayment(paymentMethod, req.paymentVerified);

  const result = await applyFinalContractPayment({
    contractId,
    user: req.user,
    amount,
    paymentId,
    platformPaymentId,
    freelancerPaymentId,
    paymentMethod,
  });

  return res.status(200).json(new ApiResponse(200, result, "Contract payment released successfully"));
});

const verifyContractPayment = asyncHandler(async (req, res) => {
  const { contractId } = req.params;
  const {
    milestoneId,
    purpose = "milestone",
    razorpayPaymentId,
    razorpayOrderId,
    razorpaySignature,
  } = req.body;

  verifyRazorpaySignature({ razorpayPaymentId, razorpayOrderId, razorpaySignature });

  const contract = await Contract.findById(contractId);
  assertContractClientAccess(contract, req.user);
  const expectedPayment = getExpectedContractPayment(contract, { purpose, milestoneId });
  const payoutResult = await createFreelancePayouts({
    contract,
    amount: expectedPayment.amount,
    razorpayPaymentId,
    purpose,
    milestoneId,
  });

  const paymentPayload = {
    contractId,
    user: req.user,
    amount: expectedPayment.amount,
    paymentId: razorpayPaymentId,
    platformPaymentId: razorpayOrderId,
    freelancerPaymentId: razorpayPaymentId,
    platformPayoutId: payoutResult.platformPayoutId,
    freelancerPayoutId: payoutResult.freelancerPayoutId,
    paymentMethod: "razorpay",
  };

  const result = purpose === "final"
    ? await applyFinalContractPayment(paymentPayload)
    : await applyMilestoneFunding({ ...paymentPayload, milestoneId });

  return res.status(200).json(
    new ApiResponse(200, result, "Freelance payment verified and contract updated")
  );
});

const markContractPaymentFailed = asyncHandler(async (req, res) => {
  const { contractId } = req.params;
  const contract = await Contract.findById(contractId);
  assertContractClientAccess(contract, req.user);

  return res.status(200).json(
    new ApiResponse(200, {
      contractId,
      razorpayOrderId: req.body?.razorpayOrderId || "",
      failed: true,
    }, "Freelance payment marked failed")
  );
});

const addComment = asyncHandler(async (req, res) => {
  const { content } = req.body;
  if (!content) throw new ApiError(400, "Comment content is required");

  const contract = await Contract.findById(req.params.contractId);
  if (!contract) throw new ApiError(404, "Contract not found");
  assertContractClientAccess(contract, req.user);

  contract.comments.push({
    authorName: req.user?.name || "Client",
    content: String(content).trim(),
  });
  await contract.save();

  return res.status(201).json(new ApiResponse(201, contract.comments[contract.comments.length - 1], "Comment added successfully"));
});

const rateFreelancer = asyncHandler(async (req, res) => {
  const { contractId } = req.params;
  const { rating, review } = req.body;

  const parsedRating = Number(rating);
  if (!Number.isFinite(parsedRating) || parsedRating < 0 || parsedRating > 5) {
    throw new ApiError(400, "rating must be a number between 0 and 5");
  }

  const contract = await Contract.findById(contractId);
  assertContractClientAccess(contract, req.user);

  // allow rating only if freelancer work is completed
  if (!contract || contract.status !== "completed") {
    throw new ApiError(400, "Contract must be completed before rating the freelancer");
  }

  const freelancer = await Freelancer.findById(contract.freelancerId);
  if (!freelancer) {
    throw new ApiError(404, "Freelancer not found");
  }

  const existing = (freelancer.ratings || []).find(
    (r) => String(r.contractId) === String(contractId)
  );

  if (existing) {
    existing.rating = parsedRating;
    existing.review = String(review || "").trim();
    existing.updatedAt = new Date();
  } else {
    freelancer.ratings = freelancer.ratings || [];
    freelancer.ratings.push({
      contractId,
      rating: parsedRating,
      review: String(review || "").trim(),
      reviewerName: req.user?.name || "Client",
      createdAt: new Date(),
    });
  }

  // Recompute freelancer aggregates from embedded ratings
  const ratings = freelancer.ratings || [];
  const totalRatings = ratings.length;
  const avg = totalRatings
    ? ratings.reduce((sum, r) => sum + Number(r.rating || 0), 0) / totalRatings
    : 0;

  freelancer.rating = avg;
  freelancer.reviews = totalRatings;

  await freelancer.save({ validateBeforeSave: false });

  return res.status(200).json(
    new ApiResponse(200, {
      freelancerId: freelancer._id,
      rating: freelancer.rating,
      reviews: freelancer.reviews,
    }, "Freelancer rated successfully")
  );
});

const getContractStats = asyncHandler(async (req, res) => {
  const contracts = await Contract.find().lean();
  const freelancerIds = [...new Set(contracts.map((contract) => String(contract.freelancerId)).filter(Boolean))];
  const freelancers = await Freelancer.find({ _id: { $in: freelancerIds } }).select("_id").lean();
  const validFreelancerIds = new Set(freelancers.map((freelancer) => String(freelancer._id)));
  const validContracts = contracts.filter(
    (contract) => contract.freelancerId && validFreelancerIds.has(String(contract.freelancerId))
  );

  const summary = {
    active: validContracts.filter((c) => c.status === "active").length,
    completed: validContracts.filter((c) => c.status === "completed").length,
    cancelled: validContracts.filter((c) => c.status === "cancelled").length,
    totalValue: validContracts.reduce((sum, c) => sum + Number(c.amount || 0), 0),
  };
  return res.status(200).json(new ApiResponse(200, summary));
});

export {
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
};
