import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { Like } from "../models/like.model.js";
import { Video } from "../models/vedio.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";

const toogleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId?.trim()) {
    throw new ApiError(400, "Video Id is Invalid");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(400, "Video not Found");
  }

  const isAlreadyLiked = await Like.findOne({
    video: video._id,
    likedBy: req.user?._id,
  });

  let isliking;

  if (isAlreadyLiked) {
    await Like.deleteOne({
      video: video._id,
      likedBy: req.user?._id,
    });
    isliking = false;
  } else {
    await Like.create({
      video: video._id,
      likedBy: req.user?._id,
    });
    isliking = true;
  }

  const message = isliking
    ? "Add like to video success"
    : "Remove like from video success";

  return res.status(200).json(new ApiResponse(201, {}, message));
});

const toogleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!commentId?.trim()) {
    throw new ApiError(200, "Comment Id is Invalid");
  }

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(200, "Comment Not Found");
  }

  const isAlreadyCommentLiked = await Like.findOne({
    comment: comment?._id,
    likedBy: req.user,
  });

  let commentLiked;

  if (isAlreadyCommentLiked) {
    await Like.deleteOne({
      comment: comment?._id,
      likedBy: req.user,
    });

    commentLiked = false;
  } else {
    await Like.create({
      comment: comment?._id,
      likedBy: req.user,
    });

    commentLiked = true;
  }

  const message = commentLiked
    ? "Add Like to Comment Success"
    : "Removed Like from Comment Success";

  return res.status(200).json(new ApiResponse(201, {}, message));
});

const toogleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!tweetId?.trim()) {
    throw new ApiError(400, "Tweet Id Not Found");
  }

  const isTweetAlreadylike = await Like.findOne({
    tweet: tweetId,
    likedBy: req.user?._id,
  });

  let isTweetlike;

  if (isTweetAlreadylike) {
    await Like.deleteOne({
      tweet: tweetId,
      likedBy: req.user?._id,
    });

    isTweetlike = false;
  } else {
    await Like.create({
      tweet: tweetId,
      likedBy: req.user?._id,
    });

    isTweetlike = true;
  }

  const message = isTweetAlreadylike ? "Tweet is Disliked" : "Tweet is Liked";

  return res.status(200).json(new ApiResponse(201, {}, message));
});

const getLikedvideo = asyncHandler(async (req, res) => {
  //   const {userId} = req.params

  // if(!userId?.trim()){
  //   throw new ApiError(400,"User Id Not Found")
  // }

  // const user = await User.findById(userId);

  // if(!user){
  //   throw new ApiError(200,"User Not Found")
  // }

  const videoLikes = await Like.aggregate([
      {
        $match: {
          likedBy: new mongoose.Types.ObjectId(req.user?._id)
        }
      },
      {
        $lookup: {
          from: "videos",
          localField: "video",
          foreignField: "_id",
          as: "videosLiked",
          pipeline: [
            {
              $lookup:{
                from:"users",
                 localField: "owner",
                 foreignField: "_id",
                 as: "owner",
                pipeline: [
                  {
                    $project:{
                      fullName:1,
                      username:1,
                      avatar:1
                    }
                  }
                ]
              }
            },
            {
        $addFields: {
          owner: {
            $first: "$owner"
          } 
        }
      },
          ]
        }
      },{
        $addFields: {
          videosLiked: {
            $first: "$videosLiked"
          } 
        }
      },
      {
        $match: {
          videosLiked: { $exists: true }
    }
      },
      {
        $project: {
          videosLiked: 1,
        }
      },
      
    ]
  );

return res.status(200).json(
  new ApiResponse(200, videoLikes || {},"Liked Video fetch Successfully")
)



});

export { toogleVideoLike, toogleCommentLike, toogleTweetLike , getLikedvideo};
