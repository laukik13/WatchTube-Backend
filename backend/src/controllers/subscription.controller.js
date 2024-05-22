import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { Subscription } from "../models/subscription.model.js";
import mongoose from "mongoose";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!channelId?.trim()) {
    throw new ApiError(400, "Channel Id is Invalid");
  }

  let isSubscribed;

  const subscribed = await Subscription.findOne({
      subscriber: req.user,
      channel: channelId,
  });

  if (subscribed) {
    await Subscription.deleteOne({
      subscriber: req.user,
      channel: channelId,
    });

    isSubscribed = false;
  } else {
    await Subscription.create({
      subscriber: req.user,
      channel: channelId,
    });

    isSubscribed = true;
  }

  const message = isSubscribed
    ? "You Subscribed Successfully"
    : "You Unsubscribed Successfully";

  return res.status(200).json(new ApiResponse(200,{}, message));
});

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  // get id form url
  // check channel from user
  // get aggergate pipeline
  // match user
  // set lookup and get subcriber from channel
  // set project
  // return res

  const { channelId } = req.params;

  if (!channelId?.trim()) {
    throw new ApiError(400, "Channel ID is Invalid");
  }

  // const subscription = await Subscription.findById(channelId);

  // if (!subscription) {
  //   throw new ApiError(400, "Channel ID is Invalid");
  // }

  const getUserSubs = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(channelId?.trim()),
      },
    },
    {
      $lookup: {
        from: "users",
        foreignField: "_id",
        localField: "subscriber",
        as: "subscriberList",
        pipeline: [
          {
            $project: {
              username: 1,
              fullName: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        subscriberList: {
          $first: "$subscriberList",
        },
      },
    },
    {
      $replaceRoot: {
        newRoot: "$subscriberList",
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(200, getUserSubs, "User Subscriber fetch successfully")
    );
});

const getSubscribedChannels = asyncHandler(async (req, res) => {
  //get id from url
  //check id
  //check from subscription database
  //set aggregate pipeline
  //match id
  //lookup with id
  //project field
  //return res

  const { subscriberId } = req.params;

  if (!subscriberId?.trim()) {
    throw new ApiError(400, "Subscriber ID is Invalid");
  }

  // const subscription = await Subscription.findById(subscriberId);

  // if (!subscription) {
  //   throw new ApiError(400, "Subscriber ID is Invalid");
  // }

  const subscribedChannel = await Subscription.aggregate([
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(subscriberId?.trim()),
      },
    },
    {
      $lookup: {
        from: "users",
        foreignField: "_id",
        localField: "channel",
        as: "subscribedChannelList",
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
      $addFields: {
        subscribedChannelList: {
          $first: "$subscribedChannelList",
        },
      },
    },
    {
      $replaceRoot: {
        newRoot: "$subscribedChannelList",
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        201,
        subscribedChannel,
        "Get Subcribed channel list success"
      )
    );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
