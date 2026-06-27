import { Customer } from "../models/Customer.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/apiResponse.js";

const ALLOWED_UPDATE_FIELDS = [
    "name",
    "email",
    "company",
    "phone",
    "address",
    "type",
    "tags",
    "notes",
];

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
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 50, 1), 100);
    const skip = (page - 1) * limit;

    const [customers, totalCount] = await Promise.all([
        Customer.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
        Customer.countDocuments(),
    ]);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                customers,
                pagination: {
                    page,
                    limit,
                    totalCount,
                    totalPages: Math.ceil(totalCount / limit),
                },
            },
            "Customers fetched successfully"
        )
    );
});

const updateCustomer = asyncHandler(async (req, res) => {
    const { customerId } = req.params;
    const updateData = {};

    for (const field of ALLOWED_UPDATE_FIELDS) {
        if (req.body[field] !== undefined) {
            updateData[field] = req.body[field];
        }
    }

    if (Object.keys(updateData).length === 0) {
        throw new ApiError(400, "No valid fields provided to update");
    }

    let customer;
    try {
        customer = await Customer.findByIdAndUpdate(
            customerId,
            { $set: updateData },
            { new: true, runValidators: true }
        );
    } catch (error) {
        if (error.code === 11000) {
            throw new ApiError(409, "Customer with this email already exists");
        }
        throw error;
    }

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