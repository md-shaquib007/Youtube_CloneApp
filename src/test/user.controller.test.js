import { jest } from "@jest/globals";

// Mock the cloudinary utility before importing anything else
jest.unstable_mockModule("../util/cloudinary.js", () => ({
    uploadOnCloudinary: jest.fn(async (path) => {
        if (!path) return null;
        return { url: "http://res.cloudinary.com/mock-image.jpg" };
    })
}));

// Dynamically import dependencies after mocking
const { app } = await import("../app.js");
const { User } = await import("../model/user.model.js");
const request = (await import("supertest")).default;

// Mock environment variables for JWT signing
process.env.ACCESS_TOKEN_SECRET = "test_access_secret";
process.env.REFRESH_TOKEN_SECRET = "test_refresh_secret";
process.env.ACCESS_TOKEN_EXPIRY = "1h";
process.env.REFRESH_TOKEN_EXPIRY = "7d";

describe("User Controller Endpoints", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("POST /api/v1/users/register", () => {
        test("should register a new user successfully", async () => {
            const findOneSpy = jest.spyOn(User, "findOne").mockResolvedValue(null);
            const createSpy = jest.spyOn(User, "create").mockResolvedValue({
                _id: "mockuserid123",
                username: "testuser",
                email: "test@example.com",
                fullName: "Test User",
                avatar: "http://res.cloudinary.com/mock-image.jpg",
            });
            const findByIdSpy = jest.spyOn(User, "findById").mockReturnValue({
                select: jest.fn().mockResolvedValue({
                    _id: "mockuserid123",
                    username: "testuser",
                    email: "test@example.com",
                    fullName: "Test User",
                    avatar: "http://res.cloudinary.com/mock-image.jpg",
                }),
            });

            // Send registration request using supertest
            const res = await request(app)
                .post("/api/v1/users/register")
                .field("username", "testuser")
                .field("email", "test@example.com")
                .field("fullName", "Test User")
                .field("password", "password123")
                .attach("avatar", Buffer.from("fake avatar content"), "avatar.jpg");

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe("User registered successfully");
            expect(res.body.data.username).toBe("testuser");
        });

        test("should return 400 if validation fields are missing", async () => {
            const res = await request(app)
                .post("/api/v1/users/register")
                .send({
                    username: "",
                    email: "test@example.com",
                });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.errors.length).toBeGreaterThan(0);
        });
    });

    describe("POST /api/v1/users/login", () => {
        test("should login user successfully and return tokens", async () => {
            const mockUser = new User({
                _id: "mockuserid123",
                username: "testuser",
                email: "test@example.com",
                fullName: "Test User",
                avatar: "http://res.cloudinary.com/mock-image.jpg",
                password: "hashedpassword",
            });

            // Spy on user schema methods
            jest.spyOn(mockUser, "isPasswordCorrect").mockResolvedValue(true);
            jest.spyOn(mockUser, "generateAccessToken").mockReturnValue("mockAccessToken");
            jest.spyOn(mockUser, "generateRefreshToken").mockReturnValue("mockRefreshToken");
            jest.spyOn(mockUser, "save").mockResolvedValue(mockUser);

            jest.spyOn(User, "findOne").mockResolvedValue(mockUser);
            
            const queryMock = {
                then: (resolve) => resolve(mockUser),
                select: jest.fn().mockReturnThis()
            };
            jest.spyOn(User, "findById").mockReturnValue(queryMock);

            const res = await request(app)
                .post("/api/v1/users/login")
                .send({
                    username: "testuser",
                    password: "password123",
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe("User logged in Successfully");
            expect(res.body.data.accessToken).toBe("mockAccessToken");
            expect(res.body.data.refreshToken).toBe("mockRefreshToken");
        });
    });
});
