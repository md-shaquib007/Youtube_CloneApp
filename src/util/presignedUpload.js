import { v2 as cloudinary } from "cloudinary";
import crypto from "crypto";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Generate a pre-signed upload signature for direct browser-to-Cloudinary upload
 */
export const generatePresignedUploadUrl = async (folder = "chaitube_media", resourceType = "auto") => {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const paramsToSign = {
        timestamp,
        folder,
    };

    const signature = cloudinary.utils.api_sign_request(
        paramsToSign,
        process.env.CLOUDINARY_API_SECRET || "mock_secret"
    );

    return {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME || "demo",
        apiKey: process.env.CLOUDINARY_API_KEY || "mock_api_key",
        timestamp,
        folder,
        signature,
        uploadUrl: `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME || "demo"}/${resourceType}/upload`,
    };
};
