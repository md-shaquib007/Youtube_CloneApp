import { jest } from "@jest/globals";
import request from "supertest";
import { app } from "../app.js";

describe("Health Endpoint", () => {
    test("GET /api/v1/health should return service status", async () => {
        const res = await request(app).get("/api/v1/health");

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.status).toBe("ok");
        expect(res.body.data).toHaveProperty("uptime");
        expect(res.body.data).toHaveProperty("database");
    });
});
