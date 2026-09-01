import { z } from "zod";

export const searchQuerySchema = z.object({
    query: z.object({
        q: z
            .string({ required_error: "Search query is required" })
            .trim()
            .min(1, "Search query cannot be empty")
            .max(100),
        type: z.enum(["all", "users", "videos"]).optional().default("all"),
    }),
});

export const verifyEmailSchema = z.object({
    body: z.object({
        token: z.string().min(1, "Verification token is required"),
    }),
});
