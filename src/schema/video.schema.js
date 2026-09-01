import { z } from "zod";

export const publishVideoSchema = z.object({
    body: z.object({
        title: z
            .string({ required_error: "Title is required" })
            .trim()
            .min(1, "Title cannot be empty")
            .max(200, "Title must be at most 200 characters"),
        description: z
            .string({ required_error: "Description is required" })
            .trim()
            .min(1, "Description cannot be empty")
            .max(5000, "Description must be at most 5000 characters"),
    }),
});

export const updateVideoSchema = z.object({
    body: z.object({
        title: z
            .string()
            .trim()
            .min(1, "Title cannot be empty")
            .max(200)
            .optional(),
        description: z
            .string()
            .trim()
            .min(1, "Description cannot be empty")
            .max(5000)
            .optional(),
    }),
    params: z.object({
        videoId: z.string().min(1, "Video ID is required"),
    }),
});

export const videoIdParamSchema = z.object({
    params: z.object({
        videoId: z.string().min(1, "Video ID is required"),
    }),
});

export const channelVideosParamSchema = z.object({
    params: z.object({
        username: z.string().trim().min(1, "Username is required"),
    }),
});
