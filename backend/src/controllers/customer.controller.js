import { Customer } from "../models/Customer.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/apiResponse.js";

const createCustomer = asyncHandler(async (req, res) => {
    const { name, email, company, phone, address, type, tags, notes } = req.body;

    if (!name || !email) {
        throw new ApiError(400, "Name and email are required");
    }

    const existedCustomer = await Customer.findOne({ email });
    if (existedCustomer) {
        throw new ApiError(409, "Customer with this email already exists");
    }

    const customer = await Customer.create({
        name,
        email,
        company: company || "Individual",
        phone,
        address,
        type: type || "Individual",
        tags: tags || [],
        notes,
    });

    return res
        .status(201)
        .json(new ApiResponse(201, customer, "Customer created successfully"));
});

const getCustomers = asyncHandler(async (req, res) => {
    const customers = await Customer.find().sort({ createdAt: -1 });

    return res
        .status(200)
        .json(new ApiResponse(200, customers, "Customers fetched successfully"));
});

const updateCustomer = asyncHandler(async (req, res) => {
    const { customerId } = req.params;
    const updateData = req.body;

    const customer = await Customer.findByIdAndUpdate(
        customerId,
        { $set: updateData },
        { new: true }
    );

    if (!customer) {
        throw new ApiError(404, "Customer not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, customer, "Customer updated successfully"));
});

const deleteCustomer = asyncHandler(async (req, res) => {
    const { customerId } = req.params;
    const customer = await Customer.findByIdAndDelete(customerId);

    if (!customer) {
        throw new ApiError(404, "Customer not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Customer deleted successfully"));
});

export { createCustomer, getCustomers, updateCustomer, deleteCustomer };
