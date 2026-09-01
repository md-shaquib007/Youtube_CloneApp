import { Router } from "express";
import {
    loginUser,
    logoutUser,
    registerUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory,
    verifyEmail,
    resendVerificationEmail,
} from "../controller/user.controller.js";
import { upload } from "../middleware/multer.middleware.js";
import verifyJWT, { optionalVerifyJWT } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validation.middleware.js";
import {
    registerUserSchema,
    loginUserSchema,
    changeCurrentPasswordSchema,
    updateAccountDetailsSchema,
} from "../schema/user.schema.js";
import { verifyEmailSchema } from "../schema/search.schema.js";

const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1,
        },
        {
            name: "coverImage",
            maxCount: 1,
        },
    ]),
    validate(registerUserSchema),
    registerUser
);

router.route("/login").post(validate(loginUserSchema), loginUser);

router.route("/verify-email").post(validate(verifyEmailSchema), verifyEmail);

router.route("/resend-verification").post(verifyJWT, resendVerificationEmail);

//secured route
router.route("/logout").post(verifyJWT, logoutUser);

router.route("/refresh_token").post(refreshAccessToken);

router.route("/change-password").post(verifyJWT, validate(changeCurrentPasswordSchema), changeCurrentPassword);

router.route("/current-user").get(verifyJWT, getCurrentUser);

router.route("/update-account").patch(verifyJWT, validate(updateAccountDetailsSchema), updateAccountDetails);

router
    .route("/avatar")
    .patch(verifyJWT, upload.single("avatar"), updateUserAvatar);

router
    .route("/cover-image")
    .patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage);

router.route("/c/:username").get(optionalVerifyJWT, getUserChannelProfile);

router.route("/history").get(verifyJWT, getWatchHistory);

export default router;
