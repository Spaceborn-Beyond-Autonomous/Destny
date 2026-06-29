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

const validateFileMagicBytes = (buffer, ext) => {
    if (ext === ".3mf") {
        // .3mf files are ZIP archives — magic bytes: PK\x03\x04
        return buffer.length >= 4 &&
            buffer[0] === 0x50 && buffer[1] === 0x4B &&
            buffer[2] === 0x03 && buffer[3] === 0x04;
    }
    if (ext === ".stl") {
        // Binary STL: 80-byte header followed by uint32 triangle count
        // ASCII STL: starts with "solid"
        if (buffer.length < 5) return false;
        const header = buffer.slice(0, 5).toString("ascii");
        if (header === "solid") return true; // ASCII STL
        return buffer.length >= 84; // Binary STL minimum size
    }
    if (ext === ".obj") {
        // OBJ files are plain ASCII text — verify no null bytes in first 512 bytes
        const sample = buffer.slice(0, Math.min(512, buffer.length));
        for (let i = 0; i < sample.length; i++) {
            if (sample[i] === 0x00) return false;
        }
        return true;
    }
    return false;
};

const uploadFile = asyncHandler(async (req, res) => {
    if (!req.file) {
        throw new ApiError(400, "No file provided");
    }
    const ext = req.file.originalname
        .toLowerCase()
        .slice(req.file.originalname.lastIndexOf("."));
    if (!validateFileMagicBytes(req.file.buffer, ext)) {
        throw new ApiError(400, "File content does not match the declared file type");
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
