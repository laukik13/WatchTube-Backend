import mongoose from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { User } from "../models/user.model.js";

const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;

  const existsTweet = await Tweet.findOne({
    owner: req.user,
    content: content,
  });

  if (existsTweet) {
    throw new ApiError(200, "Tweet is Already Declare");
  }

  const tweet = await Tweet.create({
    owner: req.user?._id,
    content: content,
  });

  return res
    .status(200)
    .json(new ApiResponse(201, tweet, "Tweet is Added Successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!userId?.trim()) {
    throw new ApiError(400, "User Id Not Found");
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(400, "User Not Found");
  }

  const tweets = await Tweet.aggregate([
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
        from: "likes",
        foreignField: "tweet",
        localField: "_id",
        as: "tweetLike",
      },
    },
    {
      $addFields: {
        tweets: {
          $first: "$owner",
        },
        tweetLikeCount: {
          $size: "$tweetLike",
        },
      },
    },
    {
      $project: {
        owner: 1,
        content: 1,
        tweetLikeCount: 1,
        _id: 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, tweets, "Tweet Fetch Successfully"));
});

const updateTweets = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const { content } = req.body;

  if (!tweetId?.trim()) {
    throw new ApiError(400, "Tweet Id not found");
  }

  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new ApiError(400, "Tweet not found");
  }

  const updateTweet = await Tweet.findByIdAndUpdate(
    tweetId,
    {
      owner: req.user,
      content: content,
    },
    {
      new: true,
    }
  );

  if(!updateTweet){
    throw new ApiError(400, "Something Went Wrong While Updating Tweet");
    }

  return res
    .status(200)
    .json(new ApiResponse(200, updateTweet, "Tweet Update Successfully"));
});

const deleteTweets = asyncHandler(async (req, res) => {

    const { tweetId } = req.params;

    if (!tweetId) {
        throw new ApiError(400, "Tweet not found");
      }

      const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new ApiError(400, "Tweet not found");
  }

  const deleteTweet = await Tweet.findByIdAndDelete(tweetId,
    {
      new: true,
    })

    if(!deleteTweet){
    throw new ApiError(400, "Something Went Wrong While Deleting Tweet");
    }

    return res.status(200).json(
        new ApiResponse(200,{},"Tweet Deleted Successfully")
    )

});

export { createTweet, getUserTweets, updateTweets, deleteTweets };
