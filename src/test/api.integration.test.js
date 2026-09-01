import { jest } from "@jest/globals";

jest.unstable_mockModule("../util/cloudinary.js", () => ({
    uploadOnCloudinary: jest.fn(async (path, type) => {
        if (!path) return null;
        return {
            url:
                type === "video"
                    ? "https://res.cloudinary.com/mock/video.mp4"
                    : "https://res.cloudinary.com/mock-image.jpg",
            duration: 120,
        };
    }),
}));

jest.unstable_mockModule("../util/email.js", () => ({
    sendVerificationEmail: jest.fn(async () => {}),
    isEmailConfigured: jest.fn(() => true),
    useResend: jest.fn(() => true),
}));

const { app } = await import("../app.js");
const { User } = await import("../model/user.model.js");
const { Video } = await import("../model/video.model.js");
const { Subscription } = await import("../model/subscription.model.js");
const request = (await import("supertest")).default;

process.env.ACCESS_TOKEN_SECRET = "test_access_secret";
process.env.REFRESH_TOKEN_SECRET = "test_refresh_secret";
process.env.ACCESS_TOKEN_EXPIRY = "1h";
process.env.REFRESH_TOKEN_EXPIRY = "7d";

const mockUserId = "507f1f77bcf86cd799439011";
const mockChannelId = "507f1f77bcf86cd799439012";
const mockVideoId = "507f1f77bcf86cd799439013";

describe("Full API integration", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("Health & Search", () => {
        test("GET /api/v1/health returns ok", async () => {
            const res = await request(app).get("/api/v1/health");
            expect(res.status).toBe(200);
            expect(res.body.data.status).toBe("ok");
            expect(res.body.data).toHaveProperty("email");
        });

        test("GET /api/v1/search requires query", async () => {
            const res = await request(app).get("/api/v1/search");
            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        test("GET /api/v1/search returns results", async () => {
            jest.spyOn(User, "find").mockReturnValue({
                select: jest.fn().mockReturnValue({
                    limit: jest.fn().mockResolvedValue([
                        {
                            _id: mockUserId,
                            username: "testuser",
                            fullName: "Test User",
                            avatar: "https://example.com/a.jpg",
                        },
                    ]),
                }),
            });
            jest.spyOn(Video, "find").mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    sort: jest.fn().mockReturnValue({
                        limit: jest.fn().mockResolvedValue([]),
                    }),
                }),
            });

            const res = await request(app).get("/api/v1/search?q=test&type=all");
            expect(res.status).toBe(200);
            expect(res.body.data.users).toHaveLength(1);
        });

        test("GET /api/v1/search handles special regex characters safely", async () => {
            jest.spyOn(User, "find").mockReturnValue({
                select: jest.fn().mockReturnValue({
                    limit: jest.fn().mockResolvedValue([]),
                }),
            });
            jest.spyOn(Video, "find").mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    sort: jest.fn().mockReturnValue({
                        limit: jest.fn().mockResolvedValue([]),
                    }),
                }),
            });

            const res = await request(app).get("/api/v1/search?q=test.*(hello)+[world]&type=all");
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        test("Response includes security headers (helmet)", async () => {
            const res = await request(app).get("/api/v1/health");
            expect(res.headers).toHaveProperty("x-dns-prefetch-control");
            expect(res.headers).toHaveProperty("x-content-type-options");
        });
    });

    describe("Auth protection", () => {
        test("protected routes return 401 without token", async () => {
            const routes = [
                { method: "get", path: "/api/v1/users/current-user" },
                { method: "get", path: "/api/v1/users/history" },
                { method: "post", path: "/api/v1/users/logout" },
                { method: "get", path: "/api/v1/subscriptions" },
            ];

            for (const route of routes) {
                const res = await request(app)[route.method](route.path);
                expect(res.status).toBe(401);
            }
        });
    });

    describe("Email verification", () => {
        test("POST /api/v1/users/verify-email rejects invalid token", async () => {
            jest.spyOn(User, "findOne").mockResolvedValue(null);

            const res = await request(app)
                .post("/api/v1/users/verify-email")
                .send({ token: "invalid-token" });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        test("POST /api/v1/users/verify-email accepts valid token", async () => {
            const mockUser = {
                isEmailVerified: false,
                emailVerificationToken: undefined,
                emailVerificationExpiry: undefined,
                save: jest.fn().mockResolvedValue(true),
            };
            jest.spyOn(User, "findOne").mockResolvedValue(mockUser);

            const res = await request(app)
                .post("/api/v1/users/verify-email")
                .send({ token: "valid-token-abc" });

            expect(res.status).toBe(200);
            expect(res.body.message).toBe("Email verified successfully");
            expect(mockUser.isEmailVerified).toBe(true);
        });
    });

    describe("Public channel", () => {
        test("GET /api/v1/users/c/:username works without auth", async () => {
            jest.spyOn(User, "aggregate").mockResolvedValue([
                {
                    _id: mockUserId,
                    fullName: "Test User",
                    username: "testuser",
                    avatar: "https://example.com/a.jpg",
                    coverImage: "",
                    subscribersCount: 5,
                    channelSubscribedToCount: 2,
                    isSubscribed: false,
                },
            ]);

            const res = await request(app).get("/api/v1/users/c/testuser");
            expect(res.status).toBe(200);
            expect(res.body.data.username).toBe("testuser");
            expect(res.body.data.email).toBeUndefined();
            const pipeline = User.aggregate.mock.calls[0][0];
            const subscriptionStage = pipeline.find((stage) => stage.$addFields)?.$addFields;
            expect(subscriptionStage.isSubscribed.$cond.if.$in[0]).toBeNull();
        });
    });

    test("unknown routes return a JSON 404 response", async () => {
        const res = await request(app).get("/api/v1/does-not-exist");
        expect(res.status).toBe(404);
        expect(res.body).toMatchObject({ success: false, message: "Route not found" });
    });

    describe("Videos", () => {
        test("GET /api/v1/videos returns paginated list", async () => {
            jest.spyOn(Video, "aggregatePaginate").mockResolvedValue({
                docs: [
                    {
                        _id: mockVideoId,
                        title: "Test Video",
                        thumbnail: "https://example.com/t.jpg",
                        views: 10,
                        duration: 60,
                        owner: {
                            username: "testuser",
                            fullName: "Test User",
                            avatar: "https://example.com/a.jpg",
                        },
                    },
                ],
                totalDocs: 1,
                page: 1,
                totalPages: 1,
            });

            const res = await request(app).get("/api/v1/videos");
            expect(res.status).toBe(200);
            expect(res.body.data.docs).toHaveLength(1);
        });

        test("GET /api/v1/videos/:id returns 404 for missing video", async () => {
            jest.spyOn(Video, "aggregate").mockResolvedValue([]);

            const res = await request(app).get(
                `/api/v1/videos/${mockVideoId}`
            );
            expect(res.status).toBe(404);
        });

        test("GET /api/v1/videos/channel/:username returns channel videos", async () => {
            jest.spyOn(User, "findOne").mockResolvedValue({
                _id: mockUserId,
                username: "testuser",
            });
            jest.spyOn(Video, "find").mockReturnValue({
                sort: jest.fn().mockReturnValue({
                    populate: jest.fn().mockResolvedValue([]),
                }),
            });

            const res = await request(app).get(
                "/api/v1/videos/channel/testuser"
            );
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    describe("Subscriptions", () => {
        test("POST /api/v1/subscriptions/c/:channelId requires auth", async () => {
            const res = await request(app).post(
                `/api/v1/subscriptions/c/${mockChannelId}`
            );
            expect(res.status).toBe(401);
        });
    });

    describe("Validation", () => {
        test("POST /api/v1/users/login rejects empty body", async () => {
            const res = await request(app)
                .post("/api/v1/users/login")
                .send({ password: "test123" });

            expect(res.status).toBe(400);
            expect(res.body.errors.length).toBeGreaterThan(0);
        });

        test("GET /api/v1/search rejects empty query", async () => {
            const res = await request(app).get("/api/v1/search?q=");
            expect(res.status).toBe(400);
        });
    });
});
