import { asyncHandler } from "../util/asyncHandler.js";
import { User } from "../model/user.model.js";
import { Video } from "../model/video.model.js";
import { ApiResponse } from "../util/ApiResponse.js";

const escapeRegex = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const search = asyncHandler(async (req, res) => {
    const { q, type = "all" } = req.query;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 12));
    const skip = (page - 1) * limit;

    const safeQuery = escapeRegex(q.trim());
    const regex = new RegExp(safeQuery, "i");
    const results = { users: [], videos: [] };

    if (type === "all" || type === "users") {
        let userQuery = User.find({
            $or: [{ username: regex }, { fullName: regex }],
        }).select("fullName username avatar");

        if (skip > 0) {
            userQuery = userQuery.skip(skip);
        }

        results.users = await userQuery.limit(limit);
    }

    if (type === "all" || type === "videos") {
        let videoQuery = Video.find({
            isPublished: true,
            $or: [{ title: regex }, { description: regex }],
        })
            .populate("owner", "fullName username avatar")
            .sort({ views: -1 });

        if (skip > 0) {
            videoQuery = videoQuery.skip(skip);
        }

        results.videos = await videoQuery.limit(limit);
    }

    return res
        .status(200)
        .json(new ApiResponse(200, results, "Search results fetched successfully"));
});

export { search };
