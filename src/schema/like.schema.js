import { z } from "zod";

export const videoLikeParamSchema = z.object({
    params: z.object({
        videoId: z.string().min(1, "Video ID is required"),
    }),
});

export const commentLikeParamSchema = z.object({
    params: z.object({
        commentId: z.string().min(1, "Comment ID is required"),
    }),
});
