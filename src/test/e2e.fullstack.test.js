process.env.ACCESS_TOKEN_SECRET = "test_e2e_access_secret";
process.env.REFRESH_TOKEN_SECRET = "test_e2e_refresh_secret";
process.env.ACCESS_TOKEN_EXPIRY = "1h";
process.env.REFRESH_TOKEN_EXPIRY = "7d";

import { jest } from "@jest/globals";

jest.unstable_mockModule("../util/cloudinary.js", () => ({
    uploadOnCloudinary: jest.fn(async (path, type) => ({
        url: type === "video" ? "https://cloudinary.com/test-video.mp4" : "https://cloudinary.com/test-image.jpg",
        duration: 180,
    })),
}));

jest.unstable_mockModule("../util/email.js", () => ({
    sendVerificationEmail: jest.fn(async () => {}),
    sendPasswordResetEmail: jest.fn(async () => {}),
    isEmailConfigured: jest.fn(() => true),
    useResend: jest.fn(() => true),
}));

const { app } = await import("../app.js");
const { User } = await import("../model/user.model.js");
const { Video } = await import("../model/video.model.js");
const { Like } = await import("../model/like.model.js");
const { Comment } = await import("../model/comment.model.js");
const { Playlist } = await import("../model/playlist.model.js");
const { Subscription } = await import("../model/subscription.model.js");
const request = (await import("supertest")).default;
const jwt = (await import("jsonwebtoken")).default;

const userId = "507f1f77bcf86cd799439011";
const creatorId = "507f1f77bcf86cd799439012";
const videoId = "507f1f77bcf86cd799439013";
const commentId = "507f1f77bcf86cd799439014";
const replyId = "507f1f77bcf86cd799439015";
const playlistId = "507f1f77bcf86cd799439016";

const authToken = jwt.sign({ _id: userId, email: "user@example.com" }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "1h",
});

const makeMockQuery = (val) => {
    const p = Promise.resolve(val);
    p.select = jest.fn().mockResolvedValue(val);
    return p;
};

describe("Complete End-to-End Platform Flow (Fullstack E2E)", () => {
    beforeEach(() => {
        jest.spyOn(User, "findById").mockImplementation((id) => {
            if (id === userId) {
                return makeMockQuery({
                    _id: userId,
                    username: "e2euser",
                    email: "user@example.com",
                    fullName: "E2E User",
                    isEmailVerified: true,
                    avatar: "https://example.com/avatar.jpg",
                    generateAccessToken: () => "mock_access_token",
                    generateRefreshToken: () => "mock_refresh_token",
                    save: async () => true,
                });
            }
            return makeMockQuery({
                _id: creatorId,
                username: "creator",
                email: "creator@example.com",
                fullName: "Creator User",
                isEmailVerified: true,
                generateAccessToken: () => "mock_access_token",
                generateRefreshToken: () => "mock_refresh_token",
                save: async () => true,
            });
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("1. User Auth & Profile Lifecycle", () => {
        test("Full Auth Flow: Register -> Login -> Fetch Profile", async () => {
            const mockUser = {
                _id: userId,
                username: "e2euser",
                email: "user@example.com",
                fullName: "E2E User",
                isPasswordCorrect: jest.fn().mockResolvedValue(true),
                generateAccessToken: jest.fn().mockReturnValue("mock_access_token"),
                generateRefreshToken: jest.fn().mockReturnValue("mock_refresh_token"),
                save: jest.fn().mockResolvedValue(true),
            };

            jest.spyOn(User, "findOne").mockResolvedValue(mockUser);
            jest.spyOn(User, "findById").mockReturnValue(makeMockQuery(mockUser));

            const loginRes = await request(app)
                .post("/api/v1/users/login")
                .send({ username: "e2euser", password: "Password123!" });

            expect(loginRes.status).toBe(200);
            expect(loginRes.body.success).toBe(true);
            expect(loginRes.body.data).toHaveProperty("accessToken");

            const profileRes = await request(app)
                .get("/api/v1/users/current-user")
                .set("Authorization", `Bearer ${authToken}`);

            expect(profileRes.status).toBe(200);
            expect(profileRes.body.data.username).toBe("e2euser");
        });

        test("Password Reset Flow: Request Token -> Reset Password", async () => {
            const mockUser = {
                _id: userId,
                email: "user@example.com",
                password: "OldPassword123!",
                save: jest.fn().mockResolvedValue(true),
            };

            jest.spyOn(User, "findOne").mockResolvedValue(mockUser);

            const forgotRes = await request(app)
                .post("/api/v1/users/forgot-password")
                .send({ email: "user@example.com" });

            expect(forgotRes.status).toBe(200);
            expect(mockUser).toHaveProperty("forgotPasswordToken");

            const resetRes = await request(app)
                .post("/api/v1/users/reset-password")
                .send({ token: "valid-reset-token", newPassword: "NewSecretPassword123!" });

            expect(resetRes.status).toBe(200);
            expect(mockUser.password).toBe("NewSecretPassword123!");
        });
    });

    describe("2. Video Content Lifecycle", () => {
        test("Get Video Feed -> Video Details -> Record View", async () => {
            jest.spyOn(Video, "aggregatePaginate").mockResolvedValue({
                docs: [
                    {
                        _id: videoId,
                        title: "E2E Test Video",
                        views: 100,
                        isPublished: true,
                        owner: { username: "creator" },
                    },
                ],
                totalDocs: 1,
            });

            const feedRes = await request(app).get("/api/v1/videos?page=1&limit=12");
            expect(feedRes.status).toBe(200);
            expect(feedRes.body.data.docs).toHaveLength(1);

            jest.spyOn(Video, "findById").mockReturnValue({
                populate: jest.fn().mockResolvedValue({
                    _id: videoId,
                    title: "E2E Test Video",
                    isPublished: true,
                    owner: { _id: creatorId, username: "creator" },
                }),
            });

            const detailRes = await request(app).get(`/api/v1/videos/${videoId}`);
            expect(detailRes.status).toBe(200);
            expect(detailRes.body.data.title).toBe("E2E Test Video");

            jest.spyOn(Video, "findByIdAndUpdate").mockResolvedValue({
                _id: videoId,
                views: 101,
            });
            jest.spyOn(User, "findByIdAndUpdate").mockResolvedValue(true);

            const viewRes = await request(app)
                .post(`/api/v1/videos/view/${videoId}`)
                .set("Authorization", `Bearer ${authToken}`);

            expect(viewRes.status).toBe(200);
            expect(viewRes.body.data.views).toBe(101);
        });
    });

    describe("3. Social Interactions (Likes & Threaded Comments)", () => {
        test("Toggle Video Like -> Post Comment -> Delete Comment Thread", async () => {
            jest.spyOn(Video, "findById").mockResolvedValue({ _id: videoId });
            jest.spyOn(Like, "findOne").mockResolvedValue(null);
            jest.spyOn(Like, "create").mockResolvedValue({ _id: "like1" });

            const likeRes = await request(app)
                .post(`/api/v1/likes/toggle/v/${videoId}`)
                .set("Authorization", `Bearer ${authToken}`);

            expect(likeRes.status).toBe(200);
            expect(likeRes.body.data.isLiked).toBe(true);

            jest.spyOn(Comment, "create").mockResolvedValue({ _id: commentId });
            jest.spyOn(Comment, "findById").mockReturnValue({
                populate: jest.fn().mockResolvedValue({
                    _id: commentId,
                    content: "Awesome video!",
                    owner: { username: "e2euser" },
                }),
            });

            const commentRes = await request(app)
                .post(`/api/v1/comments/${videoId}`)
                .set("Authorization", `Bearer ${authToken}`)
                .send({ content: "Awesome video!" });

            expect(commentRes.status).toBe(201);
            expect(commentRes.body.data.content).toBe("Awesome video!");

            jest.spyOn(Comment, "findById").mockResolvedValue({
                _id: commentId,
                video: videoId,
                owner: userId,
            });
            jest.spyOn(Comment, "find").mockReturnValue({
                select: jest.fn().mockResolvedValue([{ _id: replyId }]),
            });
            jest.spyOn(Comment, "deleteMany").mockResolvedValue({ deletedCount: 2 });
            jest.spyOn(Like, "deleteMany").mockResolvedValue({ deletedCount: 1 });

            const deleteCommentRes = await request(app)
                .delete(`/api/v1/comments/c/${commentId}`)
                .set("Authorization", `Bearer ${authToken}`);

            expect(deleteCommentRes.status).toBe(200);
            expect(Comment.deleteMany).toHaveBeenCalled();
            expect(Like.deleteMany).toHaveBeenCalled();
        });
    });

    describe("4. Playlists & Subscriptions", () => {
        test("Create Playlist -> Add Video -> Toggle Subscription", async () => {
            jest.spyOn(Playlist, "create").mockResolvedValue({
                _id: playlistId,
                name: "My E2E Playlist",
                videos: [],
                owner: userId,
            });

            const createPlRes = await request(app)
                .post("/api/v1/playlists")
                .set("Authorization", `Bearer ${authToken}`)
                .send({ name: "My E2E Playlist", description: "Test playlist" });

            expect(createPlRes.status).toBe(201);
            expect(createPlRes.body.data.name).toBe("My E2E Playlist");

            jest.spyOn(Playlist, "findById").mockResolvedValue({
                _id: playlistId,
                owner: userId,
            });
            jest.spyOn(Video, "findById").mockResolvedValue({ _id: videoId });
            jest.spyOn(Playlist, "findByIdAndUpdate").mockReturnValue({
                populate: jest.fn().mockResolvedValue({
                    _id: playlistId,
                    videos: [{ _id: videoId, title: "Test Video" }],
                }),
            });

            const addVideoRes = await request(app)
                .post(`/api/v1/playlists/add/${playlistId}/${videoId}`)
                .set("Authorization", `Bearer ${authToken}`);

            expect(addVideoRes.status).toBe(200);

            jest.spyOn(User, "findById").mockImplementation((id) => {
                if (id === userId) {
                    return makeMockQuery({ _id: userId });
                }
                return makeMockQuery({ _id: creatorId });
            });
            jest.spyOn(Subscription, "findOne").mockResolvedValue(null);
            jest.spyOn(Subscription, "create").mockResolvedValue({ _id: "sub1" });

            const subRes = await request(app)
                .post(`/api/v1/subscriptions/c/${creatorId}`)
                .set("Authorization", `Bearer ${authToken}`);

            expect(subRes.status).toBe(200);
            expect(subRes.body.data.subscribed).toBe(true);
        });
    });
});
