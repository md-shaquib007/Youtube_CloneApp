import { Router } from "express";
import {
    toggleSubscription,
    getSubscribedChannels,
} from "../controller/subscription.controller.js";
import verifyJWT from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validation.middleware.js";
import { channelIdParamSchema } from "../schema/subscription.schema.js";

const router = Router();

router.use(verifyJWT);

router.route("/").get(getSubscribedChannels);

router.route("/c/:channelId").post(
    validate(channelIdParamSchema),
    toggleSubscription
);

export default router;
