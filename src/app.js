import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongosanitize from "express-mongo-sanitize";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import ApiError from "./util/ApiError.js";
import { handleMulterError, cleanupRequestFiles } from "./middleware/multer.middleware.js";

const app = express();

app.use(
    helmet({
        crossOriginResourcePolicy: { policy: "cross-origin" },
    })
);

const isTestEnv = process.env.NODE_ENV === "test" || Boolean(process.env.JEST_WORKER_ID);

const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => isTestEnv,
    message: {
        success: false,
        message: "Too many requests from this IP, please try again after 15 minutes.",
        errors: [],
        data: null,
    },
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => isTestEnv,
    message: {
        success: false,
        message: "Too many authentication attempts, please try again after 15 minutes.",
        errors: [],
        data: null,
    },
});

app.use((req, res, next) => {
    Object.defineProperty(req, "query", {
        value: { ...req.query },
        writable: true,
        configurable: true,
        enumerable: true,
    });
    next();
});

app.use(mongosanitize());

const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
    : ["http://localhost:5173", "http://localhost:3000"];

app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
                callback(null, true);
            } else {
                callback(new ApiError(403, "Not allowed by CORS"));
            }
        },
        credentials: true,
    })
);

app.use("/api", generalLimiter);
app.use("/api/v1/users/login", authLimiter);
app.use("/api/v1/users/register", authLimiter);

app.use(express.json({ limit: "16kb" }));

app.use(express.urlencoded({ extended: true, limit: "16kb" }));

app.use(express.static("public"));

app.use(cookieParser());

//routes import
import router from "./route/user.route.js";
import healthRouter from "./route/health.route.js";
import videoRouter from "./route/video.route.js";
import subscriptionRouter from "./route/subscription.route.js";
import searchRouter from "./route/search.route.js";
import likeRouter from "./route/like.route.js";
import commentRouter from "./route/comment.route.js";
import playlistRouter from "./route/playlist.route.js";

app.use("/api/v1/health", healthRouter);
app.use("/api/v1/users", router);
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/subscriptions", subscriptionRouter);
app.use("/api/v1/search", searchRouter);
app.use("/api/v1/likes", likeRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/playlists", playlistRouter);

app.use(handleMulterError);

app.use((req, res) => {
    return res.status(404).json({
        success: false,
        message: "Route not found",
        errors: [],
        data: null,
    });
});

app.use((err, req, res, next) => {
    cleanupRequestFiles(req);

    if (err.name === "MongoServerError" && err.code === 11000) {
        const field = Object.keys(err.keyPattern || {})[0] || "field";
        return res.status(409).json({
            success: false,
            message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`,
            errors: [],
            data: null,
        });
    }

    const statusCode = err.statusCode || 500;
    const isProd = process.env.NODE_ENV === "production";
    const message = (isProd && !(err instanceof ApiError))
        ? "Internal Server Error"
        : (err.message || "Internal Server Error");

    return res.status(statusCode).json({
        success: false,
        message,
        errors: err.errors || err.error || [],
        data: null,
    });
});

export { app };
