import multer from "multer";
import { uploadToGDrive } from "../services/gdrive.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/apiResponse.js";

// Multer config — memory storage, 10MB limit for resumes
const allowedExtensions = [".pdf", ".doc", ".docx"];

const resumeUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
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

const uploadResume = asyncHandler(async (req, res) => {
    if (!req.file) {
        throw new ApiError(400, "No resume file provided");
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const safeOriginalName = req.file.originalname
        .replace(/[^\w.\-]/g, "_")
        .slice(0, 100);
    const driveFileName = `Resume_${timestamp}_${safeOriginalName}`;

    const folderId = process.env.GDRIVE_RESUME_FOLDER_ID || process.env.GDRIVE_FOLDER_ID;

    const gdriveData = await uploadToGDrive(
        req.file.buffer,
        driveFileName,
        req.file.mimetype,
        folderId
    );

    return res.status(200).json(
        new ApiResponse(200, gdriveData, "Resume uploaded successfully")
    );
});

export { resumeUpload, uploadResume };
