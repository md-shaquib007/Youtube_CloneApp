import ApiError from "../util/ApiError.js";
import { asyncHandler } from "../util/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../model/user.model.js";

const userSelect = "-password -refreshToken -emailVerificationToken";

const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        const token =
            req.cookies?.accessToken ||
            req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            throw new ApiError(401, "Unauthorized request");
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const user = await User.findById(decodedToken?._id).select(userSelect);

        if (!user) {
            throw new ApiError(401, "Invalid Access Token");
        }

        req.user = user;
        next();
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(401, error?.message || "Invalid access token");
    }
});

const optionalVerifyJWT = asyncHandler(async (req, res, next) => {
    const token =
        req.cookies?.accessToken ||
        req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
        req.user = null;
        return next();
    }

    try {
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(decodedToken?._id).select(userSelect);
        req.user = user || null;
    } catch {
        req.user = null;
    }

    next();
});

const requireVerifiedEmail = asyncHandler(async (req, res, next) => {
    if (!req.user?.isEmailVerified) {
        throw new ApiError(
            403,
            "Please verify your email before performing this action"
        );
    }

    next();
});

export default verifyJWT;
export { optionalVerifyJWT, requireVerifiedEmail };
