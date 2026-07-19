import { Router } from "express";
import { verifyJWT, verifyAdmin } from "../middlewares/auth.middleware.js";
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryStats,
} from "../controllers/category.controller.js";

const router = Router();

router.route("/").get(getCategories).post(verifyJWT, verifyAdmin, createCategory);
router.route("/stats").get(getCategoryStats);
router.route("/:id").get(getCategoryById).put(verifyJWT, verifyAdmin, updateCategory).delete(verifyJWT, verifyAdmin, deleteCategory);

export default router;
