import { z } from "zod";

export const addCommentSchema = z.object({
    body: z.object({
        content: z
            .string({ required_error: "Content is required" })
            .trim()
            .min(1, "Comment content cannot be empty")
            .max(1000, "Comment cannot exceed 1000 characters"),
        parentCommentId: z.string().optional(),
    }),
    params: z.object({
        videoId: z.string().min(1, "Video ID is required"),
    }),
});

export const updateCommentSchema = z.object({
    body: z.object({
        content: z
            .string({ required_error: "Content is required" })
            .trim()
            .min(1, "Comment content cannot be empty")
            .max(1000, "Comment cannot exceed 1000 characters"),
    }),
    params: z.object({
        commentId: z.string().min(1, "Comment ID is required"),
    }),
});

export const commentIdParamSchema = z.object({
    params: z.object({
        commentId: z.string().min(1, "Comment ID is required"),
    }),
});
