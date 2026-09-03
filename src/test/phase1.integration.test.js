process.env.ACCESS_TOKEN_SECRET = "test_access_secret";
process.env.REFRESH_TOKEN_SECRET = "test_refresh_secret";

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
const { Video } = await import("../model/video.model.js");
const { Like } = await import("../model/like.model.js");
const { Comment } = await import("../model/comment.model.js");
const { Playlist } = await import("../model/playlist.model.js");
const request = (await import("supertest")).default;
const jwt = (await import("jsonwebtoken")).default;

const mockUserId = "507f1f77bcf86cd799439011";
const mockVideoId = "507f1f77bcf86cd799439012";
const mockCommentId = "507f1f77bcf86cd799439013";
const mockPlaylistId = "507f1f77bcf86cd799439014";

const generateTestToken = (userId = mockUserId) => {
    return jwt.sign({ _id: userId, email: "test@example.com" }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
    });
};

describe("Phase 1 New Features API Integration", () => {
    let token;

    beforeAll(() => {
        token = generateTestToken();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("Password Reset Flow", () => {
        test("POST /api/v1/users/forgot-password sends reset link for existing user", async () => {
            const mockUser = {
                _id: mockUserId,
                email: "test@example.com",
                fullName: "Test User",
                save: jest.fn().mockResolvedValue(true),
            };
            jest.spyOn(User, "findOne").mockResolvedValue(mockUser);

            const res = await request(app)
                .post("/api/v1/users/forgot-password")
                .send({ email: "test@example.com" });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(mockUser).toHaveProperty("forgotPasswordToken");
        });

        test("POST /api/v1/users/reset-password updates password with valid token", async () => {
            const mockUser = {
                _id: mockUserId,
                password: "oldpassword",
                save: jest.fn().mockResolvedValue(true),
            };
            jest.spyOn(User, "findOne").mockResolvedValue(mockUser);

            const res = await request(app)
                .post("/api/v1/users/reset-password")
                .send({ token: "valid-reset-token", newPassword: "newsecretpassword" });

            expect(res.status).toBe(200);
            expect(res.body.message).toBe("Password reset successfully");
            expect(mockUser.password).toBe("newsecretpassword");
        });
    });

    describe("Likes API", () => {
        test("POST /api/v1/likes/toggle/v/:videoId toggles video like", async () => {
            jest.spyOn(User, "findById").mockReturnValue({
                select: jest.fn().mockResolvedValue({ _id: mockUserId }),
            });
            jest.spyOn(Video, "findById").mockResolvedValue({ _id: mockVideoId });
            jest.spyOn(Like, "findOne").mockResolvedValue(null);
            jest.spyOn(Like, "create").mockResolvedValue({ _id: "like123" });

            const res = await request(app)
                .post(`/api/v1/likes/toggle/v/${mockVideoId}`)
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.data.isLiked).toBe(true);
        });

        test("GET /api/v1/likes/videos returns liked videos", async () => {
            jest.spyOn(User, "findById").mockReturnValue({
                select: jest.fn().mockResolvedValue({ _id: mockUserId }),
            });
            jest.spyOn(Like, "aggregate").mockResolvedValue([
                {
                    _id: mockVideoId,
                    title: "Liked Video 1",
                    owner: { username: "owner1" },
                },
            ]);

            const res = await request(app)
                .get("/api/v1/likes/videos")
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(1);
        });
    });

    describe("Comments API", () => {
        test("POST /api/v1/comments/:videoId adds a new comment", async () => {
            jest.spyOn(User, "findById").mockReturnValue({
                select: jest.fn().mockResolvedValue({ _id: mockUserId }),
            });
            jest.spyOn(Video, "findById").mockResolvedValue({ _id: mockVideoId });
            jest.spyOn(Comment, "create").mockResolvedValue({ _id: mockCommentId });
            jest.spyOn(Comment, "findById").mockReturnValue({
                populate: jest.fn().mockResolvedValue({
                    _id: mockCommentId,
                    content: "Great video!",
                    owner: { username: "testuser" },
                }),
            });

            const res = await request(app)
                .post(`/api/v1/comments/${mockVideoId}`)
                .set("Authorization", `Bearer ${token}`)
                .send({ content: "Great video!" });

            expect(res.status).toBe(201);
            expect(res.body.data.content).toBe("Great video!");
        });

        test("GET /api/v1/comments/:videoId returns paginated comments", async () => {
            jest.spyOn(Video, "findById").mockResolvedValue({ _id: mockVideoId });
            jest.spyOn(Comment, "aggregatePaginate").mockResolvedValue({
                docs: [
                    {
                        _id: mockCommentId,
                        content: "Nice video",
                        likesCount: 3,
                        repliesCount: 0,
                    },
                ],
                totalDocs: 1,
            });

            const res = await request(app).get(`/api/v1/comments/${mockVideoId}`);
            expect(res.status).toBe(200);
            expect(res.body.data.docs).toHaveLength(1);
        });
    });

    describe("Playlists API", () => {
        test("POST /api/v1/playlists creates a new playlist", async () => {
            jest.spyOn(User, "findById").mockReturnValue({
                select: jest.fn().mockResolvedValue({ _id: mockUserId }),
            });
            jest.spyOn(Playlist, "create").mockResolvedValue({
                _id: mockPlaylistId,
                name: "My Favorites",
                description: "Cool videos",
                isPrivate: false,
                owner: mockUserId,
            });

            const res = await request(app)
                .post("/api/v1/playlists")
                .set("Authorization", `Bearer ${token}`)
                .send({ name: "My Favorites", description: "Cool videos" });

            expect(res.status).toBe(201);
            expect(res.body.data.name).toBe("My Favorites");
        });

        test("POST /api/v1/playlists/add/:playlistId/:videoId adds video to playlist", async () => {
            jest.spyOn(User, "findById").mockReturnValue({
                select: jest.fn().mockResolvedValue({ _id: mockUserId }),
            });
            jest.spyOn(Playlist, "findById").mockResolvedValue({
                _id: mockPlaylistId,
                owner: mockUserId,
            });
            jest.spyOn(Video, "findById").mockResolvedValue({ _id: mockVideoId });
            jest.spyOn(Playlist, "findByIdAndUpdate").mockReturnValue({
                populate: jest.fn().mockResolvedValue({
                    _id: mockPlaylistId,
                    videos: [{ _id: mockVideoId, title: "Test Video" }],
                }),
            });

            const res = await request(app)
                .post(`/api/v1/playlists/add/${mockPlaylistId}/${mockVideoId}`)
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.data.videos).toHaveLength(1);
        });
    });
});
