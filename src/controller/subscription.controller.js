import { asyncHandler } from "../util/asyncHandler.js";
import ApiError from "../util/ApiError.js";
import { Subscription } from "../model/subscription.model.js";
import { User } from "../model/user.model.js";
import { ApiResponse } from "../util/ApiResponse.js";
import mongoose from "mongoose";

const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    if (channelId === req.user._id.toString()) {
        throw new ApiError(400, "You cannot subscribe to your own channel");
    }

    const channel = await User.findById(channelId);

    if (!channel) {
        throw new ApiError(404, "Channel not found");
    }

    const existing = await Subscription.findOne({
        subscriber: req.user._id,
        channel: channelId,
    });

    if (existing) {
        await Subscription.findByIdAndDelete(existing._id);
        return res
            .status(200)
            .json(
                new ApiResponse(200, { subscribed: false }, "Unsubscribed successfully")
            );
    }

    await Subscription.create({
        subscriber: req.user._id,
        channel: channelId,
    });

    return res
        .status(200)
        .json(
            new ApiResponse(200, { subscribed: true }, "Subscribed successfully")
        );
});

const getSubscribedChannels = asyncHandler(async (req, res) => {
    const subscriptions = await Subscription.find({
        subscriber: req.user._id,
    }).populate("channel", "fullName username avatar");

    const channels = subscriptions
        .map((sub) => sub.channel)
        .filter(Boolean);

    return res
        .status(200)
        .json(
            new ApiResponse(200, channels, "Subscribed channels fetched successfully")
        );
});

export { toggleSubscription, getSubscribedChannels };
