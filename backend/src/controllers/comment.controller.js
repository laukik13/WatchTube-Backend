import { Video } from "../models/vedio.models.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { Comment } from "../models/comment.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";

const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!videoId?.trim()) {
    throw new ApiError(400, "Video Id is Invalid");
  }

  const allVideoComment = await Comment.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $skip: (page - 1) * 10,
    },
    {
      $limit: parseInt(limit, 10),
    },
  ]);

  return res.status(200).json(new ApiResponse(201,allVideoComment,"All Comment fetch Successfully"));
  
});

const addComment = asyncHandler(async (req, res) => {
  //get id from url
  //check id
  //check id in video db
  //get content from user
  //check content field
  //send data to databse
  //return res

  const { content } = req.body;
  const { videoId } = req.params;

  if (!videoId?.trim()) {
    throw new ApiError(400, "Video ID not Found");
  }

  if (!content?.trim()) {
    throw new ApiError(400, "Content Feild Is Empty");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(400, "Video Not found");
  }

  const comment = await Comment.create({
    content,
    video: video?._id,
    owner: req.user?._id,
  });

  return res
    .status(200)
    .json(new ApiResponse(201, comment, "Comment Added Successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;

  if (!commentId?.trim()) {
    throw new ApiError(400, "Video Id is Invalid");
  }

  if (!content?.trim()) {
    throw new ApiError(400, "Content Field Is Empty");
  }

  const comment = await Comment.findByIdAndUpdate(
    commentId,
    {
      $set: {
        content,
      },
    },
    {
      new: true,
    }
  );

  if (!comment) {
    throw new ApiError(200, "Something went Wrong While Updating Comment");
  }

  return res
    .status(200)
    .json(new ApiResponse(201, comment, "Comment Updated Successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!commentId?.trim()) {
    throw new ApiError(400, "Comment Id is Invalid");
  }

  const comment = await Comment.findByIdAndDelete(commentId);

  if (!comment) {
    throw new ApiError(200, "Something went Wrong While Deleting Comment");
  }

  return res
    .status(200)
    .json(new ApiResponse(201, {}, "Comment Deleted Successfully"));
});

export { addComment, getVideoComments, updateComment, deleteComment };
