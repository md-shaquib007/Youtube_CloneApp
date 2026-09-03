import { Router } from "express";
import {
    getVideoComments,
    getCommentReplies,
    addComment,
    updateComment,
    deleteComment,
} from "../controller/comment.controller.js";
import verifyJWT, { optionalVerifyJWT } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validation.middleware.js";
import {
    addCommentSchema,
    updateCommentSchema,
    commentIdParamSchema,
} from "../schema/comment.schema.js";
import { videoIdParamSchema } from "../schema/video.schema.js";

const router = Router();

router
    .route("/:videoId")
    .get(optionalVerifyJWT, validate(videoIdParamSchema), getVideoComments)
    .post(verifyJWT, validate(addCommentSchema), addComment);

router
    .route("/c/:commentId/replies")
    .get(optionalVerifyJWT, validate(commentIdParamSchema), getCommentReplies);

router
    .route("/c/:commentId")
    .patch(verifyJWT, validate(updateCommentSchema), updateComment)
    .delete(verifyJWT, validate(commentIdParamSchema), deleteComment);

export default router;
