import { Category } from "../models/Category.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/apiResponse.js";

const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort({ name: 1 }).lean();
  return res.status(200).json(new ApiResponse(200, categories));
});

const getCategoryById = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id).lean();
  if (!category) throw new ApiError(404, "Category not found");
  return res.status(200).json(new ApiResponse(200, category));
});

const createCategory = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  if (!name) throw new ApiError(400, "Category name is required");
  const exists = await Category.findOne({ name: String(name).trim() }).lean();
  if (exists) throw new ApiError(400, "Category already exists");

  const category = await Category.create({
    name: String(name).trim(),
    description: String(description || "").trim(),
  });
  return res.status(201).json(new ApiResponse(201, category, "Category created successfully"));
});

const updateCategory = asyncHandler(async (req, res) => {
  const updates = { ...req.body };
  if (updates.name) updates.name = String(updates.name).trim();
  if (updates.description) updates.description = String(updates.description).trim();

  const category = await Category.findByIdAndUpdate(req.params.id, updates, { new: true }).lean();
  if (!category) throw new ApiError(404, "Category not found");
  return res.status(200).json(new ApiResponse(200, category, "Category updated successfully"));
});

const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndDelete(req.params.id).lean();
  if (!category) throw new ApiError(404, "Category not found");
  return res.status(200).json(new ApiResponse(200, {}, "Category deleted successfully"));
});

const getCategoryStats = asyncHandler(async (req, res) => {
  const categories = await Category.find().lean();
  return res.status(200).json(
    new ApiResponse(
      200,
      categories.map((category) => ({
        category: category.name,
        jobCount: 0,
        freelancerCount: 0,
      }))
    )
  );
});

export {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryStats,
};
