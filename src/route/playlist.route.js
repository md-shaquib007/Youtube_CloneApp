import { Router } from "express";
import {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    updatePlaylist,
    deletePlaylist,
} from "../controller/playlist.controller.js";
import verifyJWT, { optionalVerifyJWT } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validation.middleware.js";
import {
    createPlaylistSchema,
    updatePlaylistSchema,
    playlistIdParamSchema,
    playlistVideoParamsSchema,
} from "../schema/playlist.schema.js";

const router = Router();

router.route("/").post(verifyJWT, validate(createPlaylistSchema), createPlaylist);

router.route("/user/:userId").get(optionalVerifyJWT, getUserPlaylists);

router
    .route("/:playlistId")
    .get(optionalVerifyJWT, validate(playlistIdParamSchema), getPlaylistById)
    .patch(verifyJWT, validate(updatePlaylistSchema), updatePlaylist)
    .delete(verifyJWT, validate(playlistIdParamSchema), deletePlaylist);

router
    .route("/add/:playlistId/:videoId")
    .post(verifyJWT, validate(playlistVideoParamsSchema), addVideoToPlaylist);

router
    .route("/remove/:playlistId/:videoId")
    .delete(verifyJWT, validate(playlistVideoParamsSchema), removeVideoFromPlaylist);

export default router;
