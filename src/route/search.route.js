import { Router } from "express";
import { search } from "../controller/search.controller.js";
import { validate } from "../middleware/validation.middleware.js";
import { searchQuerySchema } from "../schema/search.schema.js";

const router = Router();

router.route("/").get(validate(searchQuerySchema), search);

export default router;
