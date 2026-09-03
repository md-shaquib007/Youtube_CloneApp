import { z } from "zod";

export const createPlaylistSchema = z.object({
    body: z.object({
        name: z
            .string({ required_error: "Playlist name is required" })
            .trim()
            .min(1, "Name cannot be empty")
            .max(100, "Name cannot exceed 100 characters"),
        description: z
            .string()
            .trim()
            .max(500, "Description cannot exceed 500 characters")
            .optional(),
        isPrivate: z.boolean().optional().default(false),
    }),
});

export const updatePlaylistSchema = z.object({
    body: z.object({
        name: z.string().trim().min(1).max(100).optional(),
        description: z.string().trim().max(500).optional(),
        isPrivate: z.boolean().optional(),
    }),
    params: z.object({
        playlistId: z.string().min(1, "Playlist ID is required"),
    }),
});

export const playlistIdParamSchema = z.object({
    params: z.object({
        playlistId: z.string().min(1, "Playlist ID is required"),
    }),
});

export const playlistVideoParamsSchema = z.object({
    params: z.object({
        playlistId: z.string().min(1, "Playlist ID is required"),
        videoId: z.string().min(1, "Video ID is required"),
    }),
});
