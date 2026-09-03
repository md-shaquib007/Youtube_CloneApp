import { Router } from "express";
import {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
    recordView,
    getChannelVideos,
} from "../controller/video.controller.js";
import { videoUpload } from "../middleware/multer.middleware.js";
import verifyJWT, {
    optionalVerifyJWT,
    requireVerifiedEmail,
} from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validation.middleware.js";
import {
    publishVideoSchema,
    updateVideoSchema,
    videoIdParamSchema,
    channelVideosParamSchema,
} from "../schema/video.schema.js";

const router = Router();

router.route("/").get(getAllVideos);

router.route("/publish").post(
    verifyJWT,
    requireVerifiedEmail,
    videoUpload.fields([
        { name: "videoFile", maxCount: 1 },
        { name: "thumbnail", maxCount: 1 },
    ]),
    validate(publishVideoSchema),
    publishAVideo
);

router.route("/channel/:username").get(
    optionalVerifyJWT,
    validate(channelVideosParamSchema),
    getChannelVideos
);

router.route("/view/:videoId").post(
    optionalVerifyJWT,
    validate(videoIdParamSchema),
    recordView
);

router.route("/toggle/publish/:videoId").patch(
    verifyJWT,
    validate(videoIdParamSchema),
    togglePublishStatus
);

router
    .route("/:videoId")
    .get(optionalVerifyJWT, validate(videoIdParamSchema), getVideoById)
    .patch(verifyJWT, validate(updateVideoSchema), updateVideo)
    .delete(verifyJWT, validate(videoIdParamSchema), deleteVideo);

export default router;
