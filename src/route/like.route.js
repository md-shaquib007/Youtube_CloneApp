import { Router } from "express";
import {
    toggleVideoLike,
    toggleCommentLike,
    getLikedVideos,
} from "../controller/like.controller.js";
import verifyJWT from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validation.middleware.js";
import {
    videoLikeParamSchema,
    commentLikeParamSchema,
} from "../schema/like.schema.js";

const router = Router();

router.use(verifyJWT);

router.route("/videos").get(getLikedVideos);
router
    .route("/toggle/v/:videoId")
    .post(validate(videoLikeParamSchema), toggleVideoLike);
router
    .route("/toggle/c/:commentId")
    .post(validate(commentLikeParamSchema), toggleCommentLike);

export default router;
