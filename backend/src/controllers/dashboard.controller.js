import mongoose from "mongoose";
import { Video } from "../models/vedio.models.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";


const getChannelStats = asyncHandler(async (req, res) => {

    const userId = req.user?._id

  if (!userId) {
    throw new ApiError(400, "User Id is Invalid");
  }

  const channelStat = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        foreignField: "channel",
        localField: "_id",
        as: "subcribers",
      },
    },
    {
      $lookup: {
        from: "videos",
        foreignField: "owner",
        localField: "_id",
        as: "videos",
        pipeline: [
          {
            $lookup: {
              from: "likes",
              foreignField: "video",
              localField: "_id",
              as: "likes",
            },
          },
        ],
      },
    },
    {
      $addFields: {
        totalSubcriber: {
          $size: {
            $ifNull: ["$subcribers", []],
          },
        },
        totalVideo: {
          $size: {
            $ifNull: ["$videos", []],
          },
        },
        totalLike: {
          $size: {
            $ifNull: ["$likes", []],
          },
        },
        totalViews: {
          $sum: "$views",
        },
      },
    },
    {
      $project: {
        username: 1,
        email: 1,
        fullName: 1,
        avatar: 1,
        coverImage: 1,
        totalVideo: 1,
        totalSubcriber: 1,
        totalLike: 1,
        totalViews: 1,
      },
    },
  ]);

return res.status(200).json(
    new ApiResponse(201,channelStat,"Channel Stats fetch successfully")
)

});

const getChannelVideos = asyncHandler(async(req,res)=>{
    
   const userId = req.user?._id

   if(!userId){
    throw new ApiError(400,"User Id is Invalid")
   }

   const videos = await User.aggregate([
    {
        $match:{
            _id: new mongoose.Types.ObjectId(userId),
        }
    },
  {
     $lookup: {
       from: "videos",
       localField: "_id",
       foreignField: "owner",
       as:"allChannleVideos",
       pipeline:[
         {
           $sort:{
             createdAt: -1
           }
         }
       ]
     }
  },{
    $project: {
    allChannleVideos:1,
      _id:0,
    }
  }
])

return res.status(200).json(
    new ApiResponse(201,videos,"Channel Video Fetch Successfully")
)

})

export {getChannelStats , getChannelVideos}
