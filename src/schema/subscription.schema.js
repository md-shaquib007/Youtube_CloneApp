import { z } from "zod";

export const channelIdParamSchema = z.object({
    params: z.object({
        channelId: z.string().min(1, "Channel ID is required"),
    }),
});
