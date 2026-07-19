import multer from "multer";
import { Freelancer } from "../models/Freelancer.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/apiResponse.js";

const upload = multer({ storage: multer.memoryStorage() });

const buildFreelancerFilter = ({ search, availability }) => {
  const filter = {};
  if (availability) {
    filter.availability = String(availability).trim();
  }
  if (search) {
    const regex = new RegExp(String(search).trim(), "i");
    filter.$or = [
      { name: regex },
      { title: regex },
      { location: regex },
      { bio: regex },
      { skills: regex },
    ];
  }
  return filter;
};

const getFreelancers = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.max(Number(req.query.limit) || 10, 1);
  const filter = buildFreelancerFilter(req.query);

  const total = await Freelancer.countDocuments(filter);
  const freelancers = await Freelancer.find(filter)
    .sort({ completedProjects: -1, totalEarnings: -1, rating: -1, reviews: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  return res.status(200).json(
    new ApiResponse(200, {
      data: freelancers,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
      hasNext: page * limit < total,
      hasPrev: page > 1,
    })
  );
});

const getFreelancer = asyncHandler(async (req, res) => {
  const freelancer = await Freelancer.findById(req.params.id).lean();
  if (!freelancer) throw new ApiError(404, "Freelancer not found");
  return res.status(200).json(new ApiResponse(200, freelancer));
});

const createFreelancer = asyncHandler(async (req, res) => {
  const { name, title, location, bio, skills, rate, availability, avatar, freelanceKey, upiId } = req.body;
  if (!name || !title) {
    throw new ApiError(400, "Freelancer name and title are required");
  }

  const payload = {
    name: String(name).trim(),
    title: String(title).trim(),
    location: String(location || "Remote").trim(),
    bio: String(bio || "").trim(),
    skills: Array.isArray(skills) ? skills.map(String) : [],
    rate: Number(rate) || 0,
    upiId: String(upiId || "").trim(),
    availability: String(availability || "available").trim(),
    avatar: String(avatar || "").trim(),
    freelanceKey: String(freelanceKey || req.headers["x-freelance-freelancer-key"] || "").trim(),
    userId: req.user?._id || null,
  };

  const filter = payload.userId ? { userId: payload.userId } : payload.freelanceKey ? { freelanceKey: payload.freelanceKey } : null;

  let freelancer;
  if (filter) {
    const existingFreelancer = await Freelancer.findOne(filter).lean();
    freelancer = existingFreelancer || await Freelancer.create(payload);
  } else {
    freelancer = await Freelancer.create(payload);
  }

  return res.status(201).json(new ApiResponse(201, freelancer, "Freelancer created successfully"));
});

const updateFreelancer = asyncHandler(async (req, res) => {
  const updates = { ...req.body };
  if (updates.skills && !Array.isArray(updates.skills)) {
    updates.skills = [String(updates.skills)];
  }
  if (updates.upiId !== undefined) {
    updates.upiId = String(updates.upiId || "").trim();
  }
  const freelancer = await Freelancer.findByIdAndUpdate(req.params.id, updates, { new: true }).lean();
  if (!freelancer) throw new ApiError(404, "Freelancer not found");
  return res.status(200).json(new ApiResponse(200, freelancer, "Freelancer updated successfully"));
});

const deleteFreelancer = asyncHandler(async (req, res) => {
  const freelancer = await Freelancer.findByIdAndDelete(req.params.id).lean();
  if (!freelancer) throw new ApiError(404, "Freelancer not found");
  return res.status(200).json(new ApiResponse(200, {}, "Freelancer deleted successfully"));
});

const searchFreelancers = asyncHandler(async (req, res) => {
  const query = String(req.query.q || req.query.search || "").trim();
  const filter = buildFreelancerFilter({ search: query, availability: req.query.availability });
  const results = await Freelancer.find(filter).sort({ rating: -1, reviews: -1 }).lean();
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

const getTopFreelancers = asyncHandler(async (req, res) => {
  const limit = Math.max(Number(req.query.limit) || 3, 1);
  const freelancers = await Freelancer.find()
    .sort({ completedProjects: -1, totalEarnings: -1, rating: -1, reviews: -1 })
    .limit(limit)
    .lean();
  return res.status(200).json(new ApiResponse(200, freelancers));
});

const getFreelancerStats = asyncHandler(async (req, res) => {
  const freelancer = await Freelancer.findById(req.params.id).lean();
  if (!freelancer) throw new ApiError(404, "Freelancer not found");

  const totalJobs = Number(freelancer.completedProjects || 0);
  const averageRating = Number(freelancer.rating || 0);
  const totalEarnings = Number(freelancer.totalEarnings || 0);
  const completionRate = totalJobs > 0 ? 100 : 0;

  return res.status(200).json(
    new ApiResponse(200, {
      totalJobs,
      completionRate,
      averageRating,
      totalEarnings,
    })
  );
});

const getFreelancerPortfolio = asyncHandler(async (req, res) => {
  const freelancer = await Freelancer.findById(req.params.id).lean();
  if (!freelancer) throw new ApiError(404, "Freelancer not found");
  return res.status(200).json(new ApiResponse(200, freelancer.portfolio || []));
});

const uploadPortfolio = asyncHandler(async (req, res) => {
  const freelancer = await Freelancer.findById(req.params.id);
  if (!freelancer) throw new ApiError(404, "Freelancer not found");

  if (!req.files || req.files.length === 0) {
    throw new ApiError(400, "At least one portfolio file is required");
  }

  const fileNames = req.files.map((file) => file.originalname || `file-${Date.now()}`);
  freelancer.portfolio = [...(freelancer.portfolio || []), ...fileNames];
  await freelancer.save();

  return res.status(200).json(new ApiResponse(200, freelancer.portfolio, "Portfolio uploaded successfully"));
});

const rateFreelancer = asyncHandler(async (req, res) => {
  const { rating, review } = req.body;
  if (rating === undefined || rating === null) {
    throw new ApiError(400, "Rating is required");
  }

  const freelancer = await Freelancer.findById(req.params.id);
  if (!freelancer) throw new ApiError(404, "Freelancer not found");

  const parsedRating = Math.max(0, Math.min(5, Number(rating)));
  freelancer.ratings = freelancer.ratings || [];
  freelancer.ratings.push({
    rating: parsedRating,
    review: String(review || "").trim(),
    reviewerName: req.user?.name || "Guest",
  });
  freelancer.reviews = freelancer.ratings.length;
  freelancer.rating =
    freelancer.ratings.reduce((sum, item) => sum + Number(item.rating || 0), 0) /
    freelancer.ratings.length;

  await freelancer.save();
  return res.status(200).json(new ApiResponse(200, {}, "Freelancer rated successfully"));
});

export {
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
};
