import { Router } from "express";
import mongoose from "mongoose";
import { ApiResponse } from "../util/ApiResponse.js";
import { isEmailConfigured, useResend } from "../util/email.js";

const router = Router();

router.get("/", (req, res) => {
    const dbState = mongoose.connection.readyState;
    const dbStatus = {
        0: "disconnected",
        1: "connected",
        2: "connecting",
        3: "disconnecting",
    }[dbState];

    return res.status(200).json(
        new ApiResponse(200, {
            status: "ok",
            uptime: process.uptime(),
            database: dbStatus,
            email: isEmailConfigured()
                ? useResend()
                    ? "resend"
                    : "smtp"
                : "dev-console",
            timestamp: new Date().toISOString(),
        }, "Service is healthy")
    );
});

export default router;
