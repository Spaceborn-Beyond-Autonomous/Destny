import multer from "multer";
import { uploadToGDrive } from "../services/gdrive.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/apiResponse.js";

// Multer config — memory storage, 100MB limit
const allowedExtensions = [".stl", ".obj", ".3mf"];

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
    fileFilter: (req, file, cb) => {
        const ext = file.originalname
            .toLowerCase()
            .slice(file.originalname.lastIndexOf("."));
        if (allowedExtensions.includes(ext)) {
            cb(null, true);
        } else {
            cb(new ApiError(400, `Invalid file type. Allowed: ${allowedExtensions.join(", ")}`));
        }
    },
});

const uploadFile = asyncHandler(async (req, res) => {
    if (!req.file) {
        throw new ApiError(400, "No file provided");
    }

    const gdriveData = await uploadToGDrive(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
    );

    return res.status(200).json(
        new ApiResponse(200, gdriveData, "File uploaded to Google Drive successfully")
    );
});

export { upload, uploadFile };
