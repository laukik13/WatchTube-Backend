import mongoose from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if ([name, description].some((feilds) => feilds?.trim() === "")) {
    throw new ApiError(400, "All feilds are required");
  }

  const existsPlaylist = await Playlist.findOne({
    $or: [{ name, description }],
  });

  if (existsPlaylist) {
    throw new ApiError(400, "Playlist Already Exists");
  }

  const playlist = await Playlist.create({
    name,
    description,
    owner: req.user?._id,
  });

  if (!playlist) {
    throw new ApiError(400, "Something Went Wrong While Adding Playlist");
  }

  return res
    .status(200)
    .json(new ApiResponse(201, playlist, "Playlist Add Successfully"));
});

const getUserPlaylist = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!userId?.trim()) {
    throw new ApiError(400, "User Id Not Found");
  }

  const user = await Playlist.findOne({
    owner: userId,
  });

  if (!user) {
    throw new ApiError(400, "Playlist is Not Created");
  }

  const getPlaylist = await Playlist.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "users",
        foreignField: "_id",
        localField: "owner",
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
    {
      $lookup: {
        from: "videos",
        foreignField: "_id",
        localField: "videos",
        as: "videos",
      },
    },
    {
      $addFields: {
        owner: {
          $first: "$owner",
        },
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(201, getPlaylist, "Fetch User Playlist Successfully")
    );
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!playlistId?.trim()) {
    throw new ApiError(400, "Playlist Id is Invalid");
  }

  if (!videoId?.trim()) {
    throw new ApiError(400, "Video Id is Invalid");
  }

  const playlistExists = await Playlist.findById(playlistId);

  if (!playlistExists) {
    throw new ApiError(400, "Playlist is Invalid");
  }

  if (playlistExists.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(
      403,
      "You don't have permission to add video in this playlist!"
    );
  }

  if (playlistExists.videos.includes(videoId)) {
    throw new ApiError(400, "Video Already Exists in Playlist");
  }

  const addPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $push: {
        videos: videoId,
      },
    },
    {
      new: true,
    }
  );

  if (!addPlaylist) {
    throw new ApiError(400, "Something Went Wrong While Add Video to Playlist");
  }

  return res
    .status(200)
    .json(new ApiResponse(201, addPlaylist, "Video add to Playlist"));
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!playlistId) {
    throw new ApiError(400, "Playlist Id is Invalid");
  }

  // const playlist = await Playlist.findById(playlistId);

  // if(!playlist){
  //   throw new ApiError(400,"Playlist Not Found")
  // }

  const getPlaylist = await Playlist.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(playlistId),
      },
    },
    {
      $lookup: {
        from: "users",
        foreignField: "_id",
        localField: "owner",
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
    {
      $lookup: {
        from: "videos",
        foreignField: "_id",
        localField: "videos",
        as: "videos",
      },
    },
    {
      $addFields: {
        owner: {
          $first: "$owner",
        },
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(201, getPlaylist, "Playlist Fetch Successfully"));
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!playlistId) {
    throw new ApiError(400, "Playlist Id is Invalid");
  }

  if (!videoId) {
    throw new ApiError(400, "Video id Not Found");
  }

  const playlistExists = await Playlist.findById(playlistId);

  if (!playlistExists) {
    throw new ApiError(400, "Playlist Not Exists");
  }

  if (!playlistExists.videos.includes(videoId)) {
    throw new ApiError(400, "Video not found in Playlist");
  }

  if (playlistExists.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(
      400,
      "You don't have permission to add video in this playlist!"
    );
  }

  const removeVideoFromPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $pull: {
        videos: videoId,
      },
    },
    {
      new: true,
    }
  );

  if (!removeVideoFromPlaylist) {
    throw new ApiError(
      400,
      "Something Went Wrond while Removing Video From Playlist"
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(201, {}, "Video Removed From Playlist"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  const { name, description } = req.body;

  if (!playlistId) {
    throw new ApiError(400, "Playlist Id is Invalid");
  }

  const playlist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      name,
      description,
    },
    { new: true }
  );

  if (!playlist) {
    throw new ApiError(400, "Something Went Wrong While Updating Playlist");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Playlist Updated Successfully"));
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!playlistId) {
    throw new ApiError(400, "Playlist Id is Invalid");
  }

  const playlist = await Playlist.findByIdAndDelete(playlistId, {
    new: true,
  });

  if (!playlist) {
    throw new ApiError(400, "Something Went Wrong While Deleting Playlist");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Playlist Deleted Successfully"));
});

export {
  createPlaylist,
  getUserPlaylist,
  addVideoToPlaylist,
  getPlaylistById,
  removeVideoFromPlaylist,
  updatePlaylist,
  deletePlaylist
};
