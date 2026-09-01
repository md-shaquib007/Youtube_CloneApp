import multer from "multer";
import crypto from "crypto";
import path from "path";
import ApiError from "../util/ApiError.js";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_VIDEO_SIZE = 100 * 1024 * 1024;

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const tempDir = process.env.VERCEL ? "/tmp" : "./public/temp";
        cb(null, tempDir);
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname) || "";
        cb(null, `${crypto.randomUUID()}${ext}`);
    },
});

const imageFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
        cb(null, true);
    } else {
        cb(new ApiError(400, "Only image files are allowed"), false);
    }
};

const videoFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("video/")) {
        cb(null, true);
    } else {
        cb(new ApiError(400, "Only video files are allowed"), false);
    }
};

const mixedMediaFilter = (req, file, cb) => {
    if (file.fieldname === "thumbnail") {
        return imageFilter(req, file, cb);
    }
    if (file.fieldname === "videoFile") {
        return videoFilter(req, file, cb);
    }
    cb(new ApiError(400, "Unexpected file field"), false);
};

export const upload = multer({
    storage,
    limits: { fileSize: MAX_IMAGE_SIZE },
    fileFilter: imageFilter,
});

export const videoUpload = multer({
    storage,
    limits: { fileSize: MAX_VIDEO_SIZE },
    fileFilter: mixedMediaFilter,
});

import fs from "fs";

export const cleanupRequestFiles = (req) => {
    try {
        if (req?.file?.path && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        if (req?.files) {
            Object.keys(req.files).forEach((key) => {
                const fileList = Array.isArray(req.files[key]) ? req.files[key] : [req.files[key]];
                fileList.forEach((file) => {
                    if (file?.path && fs.existsSync(file.path)) {
                        fs.unlinkSync(file.path);
                    }
                });
            });
        }
    } catch (err) {
        console.error("Failed to cleanup request files:", err?.message);
    }
};

export const handleMulterError = (err, req, res, next) => {
    cleanupRequestFiles(req);

    if (err instanceof ApiError) return next(err);

    if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
            const isVideoRoute = req.originalUrl?.includes("/videos");
            const maxMb = isVideoRoute ? 100 : 5;
            return next(
                new ApiError(400, `File too large. Maximum size is ${maxMb} MB`)
            );
        }
        return next(new ApiError(400, err.message));
    }

    next(err);
};
