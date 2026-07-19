import { Job } from "../models/Job.model.js";
import { Category } from "../models/Category.model.js";
import { Contract } from "../models/Contract.model.js";
import { Freelancer } from "../models/Freelancer.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/apiResponse.js";


const getClientKey = (req) =>
  String(req.query.clientKey || req.body?.clientKey || req.headers["x-freelance-client-key"] || "").trim();

const buildJobFilter = ({ search, category, includeClosed = false, postedBy, clientKey }) => {
  const filter = {};
  if (!includeClosed) {
    filter.active = true;
  }
  if (postedBy) {
    filter.postedBy = postedBy;
  }
  if (clientKey) {
    filter.clientKey = clientKey;
  }
  if (category) {
    filter.category = String(category).trim();
  }
  if (search) {
    const regex = new RegExp(String(search).trim(), "i");
    filter.$or = [
      { title: regex },
      { description: regex },
      { category: regex },
      { skills: regex },
    ];
  }
  return filter;
};

const getJobs = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.max(Number(req.query.limit) || 10, 1);
  const filter = buildJobFilter(req.query);

  const total = await Job.countDocuments(filter);
  const jobs = await Job.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  return res.status(200).json(
    new ApiResponse(200, {
      data: jobs,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
      hasNext: page * limit < total,
      hasPrev: page > 1,
    })
  );
});

const getMyJobs = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.max(Number(req.query.limit) || 10, 1);
  const clientKey = getClientKey(req);
  const filter = buildJobFilter({
    ...req.query,
    includeClosed: true,
    postedBy: req.user?._id,
    clientKey,
  });

  const total = await Job.countDocuments(filter);
  const jobs = await Job.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  return res.status(200).json(
    new ApiResponse(200, {
      data: jobs,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
      hasNext: page * limit < total,
      hasPrev: page > 1,
    })
  );
});

const getJobById = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.jobId).lean();
  if (!job) throw new ApiError(404, "Job not found");
  return res.status(200).json(new ApiResponse(200, job));
});

const createJob = asyncHandler(async (req, res) => {
  const { title, category, description, skills, budget, dueDate, clientName } = req.body;
  if (!title || !category || !description) {
    throw new ApiError(400, "Title, category and description are required");
  }

  const clientKey = getClientKey(req);

  const job = await Job.create({
    title: String(title).trim(),
    category: String(category).trim(),
    description: String(description).trim(),
    skills: Array.isArray(skills) ? skills.map(String) : [],
    budget: {
      min: Number(budget?.min) || 0,
      max: Number(budget?.max) || 0,
      type: String(budget?.type || "Fixed"),
    },
    dueDate: dueDate ? new Date(dueDate) : null,
    postedBy: req.user?._id || null,
    clientKey,
    clientName: String(clientName || req.user?.name || "Client").trim(),
    postedByName: String(clientName || req.user?.name || "Client").trim(),
  });

  return res.status(201).json(new ApiResponse(201, job, "Job created successfully"));
});

const updateJob = asyncHandler(async (req, res) => {
  const existingJob = await Job.findById(req.params.jobId).lean();
  if (!existingJob) throw new ApiError(404, "Job not found");
  if (!req.user?.admin && String(existingJob.postedBy || "") !== String(req.user?._id || "")) {
    throw new ApiError(403, "Only the job poster can edit this job");
  }

  const updates = { ...req.body };
  delete updates.postedBy;
  delete updates.clientKey;
  delete updates.applications;
  delete updates.proposals;

  if (updates.skills && !Array.isArray(updates.skills)) {
    updates.skills = [String(updates.skills)];
  }
  if (updates.budget) {
    updates.budget = {
      min: Number(updates.budget.min) || 0,
      max: Number(updates.budget.max) || 0,
      type: String(updates.budget.type || "Fixed"),
    };
  }
  if (updates.dueDate) {
    updates.dueDate = new Date(updates.dueDate);
  }
  const job = await Job.findByIdAndUpdate(req.params.jobId, updates, { new: true }).lean();
  if (!job) throw new ApiError(404, "Job not found");
  return res.status(200).json(new ApiResponse(200, job, "Job updated successfully"));
});

const deleteJob = asyncHandler(async (req, res) => {
  const existingJob = await Job.findById(req.params.jobId).lean();
  if (!existingJob) throw new ApiError(404, "Job not found");
  if (!req.user?.admin && String(existingJob.postedBy || "") !== String(req.user?._id || "")) {
    throw new ApiError(403, "Only the job poster can delete this job");
  }

  const job = await Job.findByIdAndDelete(req.params.jobId).lean();
  if (!job) throw new ApiError(404, "Job not found");
  return res.status(200).json(new ApiResponse(200, {}, "Job deleted successfully"));
});

const searchJobs = asyncHandler(async (req, res) => {
  const query = String(req.query.q || req.query.search || "").trim();
  const filter = buildJobFilter({ search: query, category: req.query.category });
  const results = await Job.find(filter).sort({ createdAt: -1 }).lean();
  return res.status(200).json(new ApiResponse(200, {
    data: results,
    page: 1,
    limit: results.length,
    total: results.length,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  }));
});

const applyToJob = asyncHandler(async (req, res) => {
  const { proposal, rate, applicantName, freelancerKey, freelancerId } = req.body;
  if (!proposal || rate === undefined || rate === null) {
    throw new ApiError(400, "Proposal text and rate are required");
  }

  const job = await Job.findById(req.params.jobId);
  if (!job) throw new ApiError(404, "Job not found");
  if (String(job.postedBy || "") === String(req.user?._id || "")) {
    throw new ApiError(400, "You cannot apply to your own job");
  }

  const freelancer = await Freelancer.findOne({ userId: req.user._id }).lean();
  if (!freelancer) {
    throw new ApiError(400, "Create your freelancer profile before applying");
  }

  const applicantKey = String(freelancerKey || req.headers["x-freelance-freelancer-key"] || "").trim();
  const existingApplication = job.applications.find((a) => (
    (applicantKey && a.freelancerKey === applicantKey) ||
    (freelancerId && a.applicantId && String(a.applicantId) === String(freelancerId)) ||
    (a.applicantId && String(a.applicantId) === String(freelancer._id))
  ));

  if (existingApplication) {
    existingApplication.proposal = String(proposal).trim();
    existingApplication.rate = Number(rate);
    existingApplication.status = "pending";
  } else {
    job.applications.push({
      applicantName: String(applicantName || freelancer.name || req.user?.name || "Freelancer").trim(),
      applicantId: freelancer._id,
      freelancerKey: applicantKey,
      proposal: String(proposal).trim(),
      rate: Number(rate),
      status: "pending",
    });
  }

  job.proposals = job.applications.length;
  await job.save();

  return res.status(200).json(new ApiResponse(200, {}, "Proposal submitted successfully"));
});

const declineApplication = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.jobId);
  if (!job) throw new ApiError(404, "Job not found");

  if (!req.user?.admin && String(job.postedBy) !== String(req.user?._id)) {
    throw new ApiError(403, "Only the job poster can decline proposals");
  }

  const application = job.applications.id(req.params.applicationId);
  if (!application) throw new ApiError(404, "Proposal not found");

  application.status = "rejected";
  await job.save();

  return res.status(200).json(new ApiResponse(200, application, "Proposal declined"));
});

const acceptJob = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const { applicationId } = req.body; // optional; if missing we accept the latest pending application of freelancer

  const job = await Job.findById(jobId);
  if (!job) throw new ApiError(404, "Job not found");

  if (!job.active) {
    throw new ApiError(400, "Job is not active");
  }

  const clientKey = getClientKey(req);
  if (
    !req.user?.admin &&
    (!job.postedBy || String(job.postedBy) !== String(req.user?._id)) &&
    (!clientKey || clientKey !== job.clientKey)
  ) {
    throw new ApiError(403, "Only the job poster can accept proposals");
  }

  // Determine freelancer application to accept
  let targetApp = null;
  if (applicationId) {
    const asId = String(applicationId);
    targetApp = job.applications.find((a) => String(a._id) === asId && a.status === "pending");
    if (!targetApp) {
      targetApp = job.applications.find((a) => a.applicantId && String(a.applicantId) === asId && a.status === "pending");
    }
  }

  if (!targetApp) {
    // accept first pending application
    targetApp = job.applications.find((a) => a.status === "pending") || job.applications.find((a) => a.status === "accepted");
  }

  if (!targetApp) throw new ApiError(404, "No pending proposal found to accept");
  if (!targetApp.applicantId) throw new ApiError(400, "Applicant user id not available");

  // update statuses (only one accepted)
  for (const app of job.applications) {
    if (!app.applicantId) continue;

    if (String(app.applicantId) === String(targetApp.applicantId)) {
      app.status = "accepted";
    } else if (app.status === "pending") {
      app.status = "rejected";
    }
  }

  job.active = false;
  await job.save();

  const contractAmount = Number(targetApp.rate) || Number(job.budget?.max) || 0;
  const discoveryAmount = Math.round(contractAmount * 0.15);
  const phaseOneAmount = Math.round(contractAmount * 0.35);
  const phaseTwoAmount = Math.round(contractAmount * 0.35);
  const testingAmount = Math.max(contractAmount - discoveryAmount - phaseOneAmount - phaseTwoAmount, 0);

  // Create contract linked to freelancer
  const contract = await Contract.create({
    freelancerId: targetApp.applicantId,
    clientId: job.postedBy,
    title: `Contract: ${job.title}`,
    description: job.description,
    amount: contractAmount,
    milestones: [
      { title: "Discovery & Planning", amount: discoveryAmount, status: "pending" },
      { title: "Development Phase 1", amount: phaseOneAmount, status: "pending" },
      { title: "Development Phase 2", amount: phaseTwoAmount, status: "pending" },
      { title: "Testing & Deployment", amount: testingAmount, status: "pending" },
    ],
    status: "active",
  });

  await Freelancer.findByIdAndUpdate(targetApp.applicantId, {
    $inc: {
      completedProjects: 1,
      totalEarnings: Number(targetApp.rate) || Number(job.budget?.max) || 0,
    },
  });

  return res.status(201).json(new ApiResponse(201, contract, "Contract created from accepted job"));
});


const getJobApplications = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.jobId).lean();
  if (!job) throw new ApiError(404, "Job not found");
  const clientKey = getClientKey(req);
  if (
    !req.user?.admin &&
    (!job.postedBy || String(job.postedBy) !== String(req.user?._id)) &&
    (!clientKey || clientKey !== job.clientKey)
  ) {
    throw new ApiError(403, "Only the job poster can view proposals");
  }

  const freelancerIds = (job.applications || [])
    .map((application) => application.applicantId)
    .filter(Boolean);
  const freelancers = await Freelancer.find({ _id: { $in: freelancerIds } }).lean();
  const freelancerById = new Map(freelancers.map((freelancer) => [String(freelancer._id), freelancer]));

  const applications = (job.applications || []).map((application) => {
    const freelancer = application.applicantId
      ? freelancerById.get(String(application.applicantId))
      : null;

    return {
      ...application,
      freelancer: freelancer ? {
        _id: freelancer._id,
        name: freelancer.name,
        title: freelancer.title,
        location: freelancer.location,
        rating: freelancer.rating,
        reviews: freelancer.reviews,
        completedProjects: freelancer.completedProjects,
        avatar: freelancer.avatar,
        skills: freelancer.skills,
        rate: freelancer.rate,
        availability: freelancer.availability,
        bio: freelancer.bio,
      } : null,
    };
  });

  return res.status(200).json(new ApiResponse(200, applications));
});

const getJobCategories = asyncHandler(async (req, res) => {
  const categories = await Job.distinct("category", { active: true });
  if (!categories || categories.length === 0) {
    const persisted = await Category.find().sort({ name: 1 }).lean();
    return res.status(200).json(new ApiResponse(200, persisted.map((cat) => cat.name)));
  }
  return res.status(200).json(new ApiResponse(200, categories.sort()));
});

export {
  getJobs,
  getMyJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  searchJobs,
  applyToJob,
  acceptJob,
  getJobApplications,
  declineApplication,
  getJobCategories,
};

