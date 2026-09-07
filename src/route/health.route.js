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

router.get("/metrics", (req, res) => {
    const memory = process.memoryUsage();

    return res.status(200).json(
        new ApiResponse(200, {
            uptimeSeconds: Math.floor(process.uptime()),
            processPid: process.pid,
            nodeVersion: process.version,
            memory: {
                rssMB: Math.round(memory.rss / (1024 * 1024)),
                heapTotalMB: Math.round(memory.heapTotal / (1024 * 1024)),
                heapUsedMB: Math.round(memory.heapUsed / (1024 * 1024)),
                externalMB: Math.round(memory.external / (1024 * 1024)),
            },
            cpuUsage: process.cpuUsage(),
            timestamp: new Date().toISOString(),
        }, "System metrics retrieved successfully")
    );
});

export default router;
