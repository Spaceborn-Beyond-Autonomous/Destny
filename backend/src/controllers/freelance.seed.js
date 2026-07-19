import { Category } from "../models/Category.model.js";

const DEFAULT_CATEGORIES = [
  { name: "3D Printing", description: "Tasks related to additive manufacturing and CAD-driven printing." },
  { name: "AI Automation", description: "Workflows, bots, and smart automation built with AI and ML." },
  { name: "MVP Dev", description: "Minimum viable product development for startups and early-stage products." },
  { name: "Drone Software", description: "Embedded systems, flight control, and aerial autonomy software." },
  { name: "Design", description: "UI/UX, product design, and visual systems for digital products." },
  { name: "Other", description: "General freelance requests and exploratory gigs." },
];

async function ensureCategories() {
  const count = await Category.countDocuments();
  if (count === 0) {
    return await Category.create(DEFAULT_CATEGORIES);
  }
  return Category.find().sort({ name: 1 }).lean();
}

async function ensureFreelancers() {
  return [];
}

async function ensureJobs() {
  return [];
}

async function ensureContracts() {
  return [];
}

async function ensureDefaultFreelanceData() {
  const categories = await ensureCategories();
  return { categories, freelancers: [] };
}

export { ensureDefaultFreelanceData, ensureCategories, ensureFreelancers, ensureJobs, ensureContracts };
