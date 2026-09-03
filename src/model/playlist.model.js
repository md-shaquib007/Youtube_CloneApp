import mongoose from "mongoose";

const playlistSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
            default: "",
        },
        videos: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Video",
            },
        ],
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        isPrivate: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

playlistSchema.index({ owner: 1, createdAt: -1 });

export const Playlist = mongoose.model("Playlist", playlistSchema);
