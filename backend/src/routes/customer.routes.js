import { Router } from "express";
import {
    createCustomer,
    getCustomers,
    updateCustomer,
    deleteCustomer,
} from "../controllers/customer.controller.js";
import { verifyJWT, verifyAdmin } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT, verifyAdmin); // All customer routes are admin-only

router.route("/").get(getCustomers).post(createCustomer);
router.route("/:customerId").put(updateCustomer).delete(deleteCustomer);

export default router;
