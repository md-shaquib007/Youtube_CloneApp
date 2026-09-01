import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const cleanupLocalFile = (localFilePath) => {
    if (fs.existsSync(localFilePath)) {
        try {
            fs.unlinkSync(localFilePath);
        } catch (unlinkError) {
            console.error("Failed to delete local temp file:", unlinkError);
        }
    }
};

const uploadOnCloudinary = async (localFilePath, resourceType = "auto") => {
    try {
        if (!localFilePath) return null;

        const uploadResponse = await cloudinary.uploader.upload(localFilePath, {
            resource_type: resourceType,
        });

        cleanupLocalFile(localFilePath);
        return uploadResponse;
    } catch (error) {
        cleanupLocalFile(localFilePath);
        console.error("Cloudinary upload failed:", error?.message);
        return null;
    }
};

export { uploadOnCloudinary };
