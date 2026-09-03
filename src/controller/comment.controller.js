import { asyncHandler } from "../util/asyncHandler.js";
import ApiError from "../util/ApiError.js";
import { ApiResponse } from "../util/ApiResponse.js";
import { Comment } from "../model/comment.model.js";
import { Video } from "../model/video.model.js";
import { Like } from "../model/like.model.js";
import mongoose from "mongoose";

const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    const commentsAggregate = Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId),
                parentComment: null,
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            fullName: 1,
                            username: 1,
                            avatar: 1,
                        },
                    },
                ],
            },
        },
        { $addFields: { owner: { $first: "$owner" } } },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "comment",
                as: "likes",
            },
        },
        {
            $lookup: {
                from: "comments",
                localField: "_id",
                foreignField: "parentComment",
                as: "replies",
            },
        },
        {
            $addFields: {
                likesCount: { $size: "$likes" },
                repliesCount: { $size: "$replies" },
                isLiked: {
                    $cond: {
                        if: { $in: [req.user?._id || null, "$likes.likedBy"] },
                        then: true,
                        else: false,
                    },
                },
            },
        },
        { $project: { likes: 0, replies: 0 } },
        { $sort: { createdAt: -1 } },
    ]);

    const result = await Comment.aggregatePaginate(commentsAggregate, { page, limit });

    return res
        .status(200)
        .json(new ApiResponse(200, result, "Video comments fetched successfully"));
});

const getCommentReplies = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }

    const repliesAggregate = Comment.aggregate([
        {
            $match: {
                parentComment: new mongoose.Types.ObjectId(commentId),
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            fullName: 1,
                            username: 1,
                            avatar: 1,
                        },
                    },
                ],
            },
        },
        { $addFields: { owner: { $first: "$owner" } } },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "comment",
                as: "likes",
            },
        },
        {
            $addFields: {
                likesCount: { $size: "$likes" },
                isLiked: {
                    $cond: {
                        if: { $in: [req.user?._id || null, "$likes.likedBy"] },
                        then: true,
                        else: false,
                    },
                },
            },
        },
        { $project: { likes: 0 } },
        { $sort: { createdAt: 1 } },
    ]);

    const result = await Comment.aggregatePaginate(repliesAggregate, { page, limit });

    return res
        .status(200)
        .json(new ApiResponse(200, result, "Comment replies fetched successfully"));
});

const addComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { content, parentCommentId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    let parentComment = null;
    if (parentCommentId) {
        if (!mongoose.Types.ObjectId.isValid(parentCommentId)) {
            throw new ApiError(400, "Invalid parent comment ID");
        }
        parentComment = await Comment.findById(parentCommentId);
        if (!parentComment) {
            throw new ApiError(404, "Parent comment not found");
        }
    }

    const comment = await Comment.create({
        content,
        video: videoId,
        owner: req.user._id,
        parentComment: parentComment ? parentComment._id : null,
    });

    const populated = await Comment.findById(comment._id).populate(
        "owner",
        "fullName username avatar"
    );

    return res
        .status(201)
        .json(new ApiResponse(201, populated, "Comment added successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { content } = req.body;

    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You can only edit your own comment");
    }

    comment.content = content;
    await comment.save();

    const updated = await Comment.findById(commentId).populate(
        "owner",
        "fullName username avatar"
    );

    return res
        .status(200)
        .json(new ApiResponse(200, updated, "Comment updated successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    const video = await Video.findById(comment.video);

    const isCommentOwner = comment.owner.toString() === req.user._id.toString();
    const isVideoOwner = video?.owner ? video.owner.toString() === req.user._id.toString() : false;

    if (!isCommentOwner && !isVideoOwner) {
        throw new ApiError(403, "You do not have permission to delete this comment");
    }

    const childComments = await Comment.find({ parentComment: commentId }).select("_id");
    const commentIdsToDelete = [commentId, ...childComments.map((c) => c._id)];

    await Comment.deleteMany({ _id: { $in: commentIdsToDelete } });
    await Like.deleteMany({ comment: { $in: commentIdsToDelete } });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Comment deleted successfully"));
});

export {
    getVideoComments,
    getCommentReplies,
    addComment,
    updateComment,
    deleteComment,
};
