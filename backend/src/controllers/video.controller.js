import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { Video } from "../models/vedio.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
  deleteImageFromCloudinary,
  deleteVideoFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import mongoose from "mongoose";
import { User } from "../models/user.model.js";

const getAllVideo = asyncHandler(async (req, res) => {
  const { page = 1, limit = 4, query, sortBy, sortType, userId } = req.query;

  // ?page=1&sortBy=views&sortType=asc&limit=4
  const parsedLimit = parseInt(limit);
  const pageSkip = (page - 1) * parsedLimit;
  const sortStage = {};
  sortStage[sortBy] = sortType === "asc" ? 1 : -1;

  const allVideo = await Video.aggregate([
    {
      $match: {
        isPublished: true,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerResult",
        pipeline: [
          {
            $project: {
              userName: 1,
              avatar: 1,
            },
          },
        ],
      },
    },

    {
      $addFields: {
        owner_details: {
          $arrayElemAt: ["$ownerResult", 0],
        },
      },
    },
    {
      $sort: sortStage,
    },
    {
      $skip: pageSkip,
    },
    {
      $limit: parsedLimit,
    },
    {
      $project: {
        ownerResult: 0,
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(201, allVideo, "All Video fetch Successfully"));
});

const publishVideo = asyncHandler(async (req, res) => {
  //get required data from user
  //check fields empty
  //get thumbnail path
  //check thumbnail path
  //get video file path
  //check  video path
  //upload on cloudinary
  //send data to database
  //check video content or not
  //return res

  const { title, description } = req.body;

  if ([title, description].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are Empty");
  }

  const existsVideo = await Video.findOne({ title });

  if (existsVideo) {
    throw new ApiError(400, "Video already exsist");
  }

  const thumbnailLocalPath = req.files?.thumbnail[0].path;

  const videoFileLocalPath = req.files?.videoFile[0].path;

  if (!thumbnailLocalPath) {
    throw new ApiError(400, "Thumbnail is required");
  }

  if (!videoFileLocalPath) {
    throw new ApiError(400, "Thumbnail is required");
  }

  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  const videoFile = await uploadOnCloudinary(videoFileLocalPath);

  if (!thumbnail) {
    throw new ApiError(400, "Thumbnail is required");
  }

  //   const videoOwner = await Video.aggregate([
  //     {
  //       $match: {
  //         _id: new mongoose.Types.ObjectId(req.user?._id),
  //       },
  //     },
  //     {
  //       $lookup:{
  //         from:"users",
  //         localField:"owner",
  //         foreignField:"_id",
  //         as:"owner",
  //         pipeline:[
  //             {
  //                 $project:{
  //                     username: 1,
  //                     fullName: 1,
  //                     avatar: 1,
  //                 }
  //             }
  //         ]
  //       }
  //     },
  //     {
  //         $addFields:{
  //             owner:{
  //                 $first: "$owner",
  //             }
  //         }
  //     }
  //   ]);

  const video = await Video.create({
    title,
    description,
    thumbnail: thumbnail.url,
    videoFile: videoFile.url || "",
    duration: videoFile.duration,
    owner: req.user?.id,
  });

  const contentVideo = await Video.findById(video?._id);

  if (!contentVideo) {
    throw new ApiError(400, "Something went Wrong while publishing video");
  }

  return res
    .status(200)
    .json(new ApiResponse(201, contentVideo, "Video Publish Successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  //get video id from url
  //find id fom user
  //check user
  //return res

  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(400, "Video Id Not Found");
  }

  const getVideo = await Video.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId),
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
            $lookup: {
              from: "subscriptions",
              localField: "_id",
              foreignField: "channel",
              as: "subscribers",
            },
          },
          {
            $addFields: {
              subscriberCount: {
                $size: "$subscribers",
              },
              isSubscribed: {
                $cond: {
                  if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                  then: true,
                  else: false,
                },
              },
            },
          },
          {
            $project: {
              fullName: 1,
              username: 1,
              subscriberCount: 1,
              isSubscribed: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    // {
    //   $lookup:{
    //     form: "comments",
    //     foreignField: "video",
    //     localField: "_id",
    //     as:"comments",
    //     pipeline: [
    //       {
    //         $lookup:{
    //             from: "users",
    //             foreignField: "_id",
    //             localField: "owner",
    //             as:"owner",
    //         }
    //       },{
    //           $addFields:{
    //              owner:{
    //               $first: "$owner"
    //              }
    //           }
    //       },{
    //         $project: {
    //           fullName: 1,
    //           username: 1,
    //           avatar: 1
    //         }
    //       }
    //     ]
    //   }
    // },
    // {
    //   $addFields:{
    //     owner:{
    //       $first : "$owner"
    //     },
    //     totalComment:{
    //       $size: "$comments"
    //     }
    //   }
    // }
  ]);

  return res
    .status(200)
    .json(new ApiResponse(201, getVideo[0], "Video fetch Successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  //get id from url
  //check id
  //get which data to update
  //check data in database
  //get thumbnail path
  //check thumbnail path
  //upload on cloudinary
  //update video in databse
  //return res

  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(400, "Video Id Not Found");
  }

  const { title, description } = req.body;

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(400, "video not found");
  }

  const isOldAvatarDeleted = await deleteImageFromCloudinary(video.thumbnail);

  // console.log(req.user?.avatar);

  if (!isOldAvatarDeleted) {
    throw new ApiError(
      400,
      "Something Went Wrong While Deleting Old Thumbnail"
    );
  }

  const thumbnailLocalPath = req.file?.path;

  if (!thumbnailLocalPath) {
    throw new ApiError(400, "Thumbnail is required");
  }

  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  if (!thumbnail) {
    throw new ApiError(400, "Thumbnail is required");
  }

  const user = await Video.findByIdAndUpdate(
    videoId,
    {
      title: title,
      description: description,
      thumbnail: thumbnail.url,
    },
    {
      new: true,
    }
  );

  if (!user) {
    throw new ApiError(400, "Something Went Wrong while Updating Video");
  }

  return res
    .status(200)
    .json(new ApiResponse(201, user, "Video Updated Successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  //get id from url
  //check id
  //delete data using id from database
  //return res

  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(200, "Video Id not Found");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(400, "video not found");
  }

  await Video.findByIdAndDelete(videoId, {
    new: true,
  });

  await deleteVideoFromCloudinary(video?.videoFile);

  return res
    .status(200)
    .json(new ApiResponse(201, {}, "Video Deleted Successfully"));
});

const tooglePublishStatus = asyncHandler(async (req, res) => {
  //get id from url
  //check id
  //get user from id
  //check status and change accouding
  //save in database
  //return res

  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(200, "Video Id Not Found");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(200, "Video Not Found");
  }

  video.isPublished = video.isPublished !== true ? true : false;

  await video.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, video, "isPublish is updated"));
});

export {
  getAllVideo,
  publishVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  tooglePublishStatus,
};
