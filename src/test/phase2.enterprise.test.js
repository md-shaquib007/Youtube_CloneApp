process.env.ACCESS_TOKEN_SECRET = "test_phase2_access_secret";
process.env.REFRESH_TOKEN_SECRET = "test_phase2_refresh_secret";
process.env.CLOUDINARY_CLOUD_NAME = "test_cloud";
process.env.CLOUDINARY_API_KEY = "test_key";
process.env.CLOUDINARY_API_SECRET = "test_secret";

import { jest } from "@jest/globals";

jest.unstable_mockModule("../util/cloudinary.js", () => ({
    uploadOnCloudinary: jest.fn(async () => null),
}));

jest.unstable_mockModule("../util/email.js", () => ({
    sendVerificationEmail: jest.fn(async () => {}),
    sendPasswordResetEmail: jest.fn(async () => {}),
    isEmailConfigured: jest.fn(() => true),
    useResend: jest.fn(() => true),
}));

const { app } = await import("../app.js");
const { User } = await import("../model/user.model.js");
const { logger } = await import("../util/logger.js");
const { cacheMiddleware, clearCacheKey } = await import("../middleware/cache.middleware.js");
const request = (await import("supertest")).default;
const jwt = (await import("jsonwebtoken")).default;

const mockUserId = "507f1f77bcf86cd799439011";
const token = jwt.sign({ _id: mockUserId, email: "test@example.com" }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "1h",
});

describe("Phase 2 Enterprise Features & Production Hardening", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("1. Direct Presigned Upload Signatures", () => {
        test("POST /api/v1/videos/presigned-url generates valid presigned data", async () => {
            jest.spyOn(User, "findById").mockReturnValue({
                select: jest.fn().mockResolvedValue({ _id: mockUserId }),
            });

            const res = await request(app)
                .post("/api/v1/videos/presigned-url?folder=test_folder&resourceType=video")
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty("signature");
            expect(res.body.data).toHaveProperty("uploadUrl");
            expect(res.body.data.folder).toBe("test_folder");
        });
    });

    describe("2. Response Caching Middleware & Cache Controls", () => {
        test("cacheMiddleware sets X-Cache headers and clears cache keys", async () => {
            clearCacheKey();

            const req = { method: "GET", originalUrl: "/test-cache-url", user: { _id: "user123" } };
            const resData = { success: true, message: "OK" };

            let cachedRes = null;
            const res = {
                setHeader: jest.fn(),
                status: jest.fn().mockReturnThis(),
                json: (d) => {
                    cachedRes = d;
                    return d;
                },
                statusCode: 200,
            };

            const middleware = cacheMiddleware(10);

            let nextCalled = false;
            middleware(req, res, () => {
                nextCalled = true;
                res.json(resData);
            });

            expect(nextCalled).toBe(true);
            expect(res.setHeader).toHaveBeenCalledWith("X-Cache", "MISS");

            const resHit = {
                setHeader: jest.fn(),
                status: jest.fn().mockReturnThis(),
                json: (d) => d,
                statusCode: 200,
            };

            middleware(req, resHit, () => {});
            expect(resHit.setHeader).toHaveBeenCalledWith("X-Cache", "HIT");

            clearCacheKey("/test-cache-url");
        });
    });

    describe("3. System Performance Metrics", () => {
        test("GET /api/v1/health/metrics returns Node.js system telemetry", async () => {
            const res = await request(app).get("/api/v1/health/metrics");

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty("memory");
            expect(res.body.data.memory).toHaveProperty("heapUsedMB");
            expect(res.body.data).toHaveProperty("uptimeSeconds");
            expect(res.body.data).toHaveProperty("processPid");
        });
    });

    describe("4. Structured JSON Logger", () => {
        test("logger outputs structured JSON with level and meta tags", () => {
            const spyLog = jest.spyOn(console, "log").mockImplementation(() => {});

            logger.info("Test log message", { userId: mockUserId });

            expect(spyLog).toHaveBeenCalled();
            const output = JSON.parse(spyLog.mock.calls[0][0]);
            expect(output.level).toBe("INFO");
            expect(output.message).toBe("Test log message");
            expect(output.userId).toBe(mockUserId);
        });
    });
});
