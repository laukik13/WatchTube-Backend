import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { deleteImageFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);

    const accessToken = user.generateAccessToken();

    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;

    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while genrating access anf refresh token"
    );
  }
};

const userRegister = asyncHandler(async (req, res) => {
  //get user details from frontend
  //user feild is empty
  //check if user is already exist: username, email
  //check for image ,  avatar
  //upload on  cloudnary
  //create user and enter in db
  //remove password and refresh token filed from response
  //check for user crestion
  //return re

  const { username, email, fullName, password } = req.body;

  if (
    [username, fullName, email, password].some((feild) => feild?.trim() === "")
  ) {
    throw new ApiError(400, "All field are required");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;

  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  //    let coverImageLocalPath;
  //    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
  //     coverImageLocalPath = req.files.coverImage[0].path
  //    }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    password,
    email,
    username: username.toLowerCase().trim(),
  });

  const createUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createUser) {
    throw new ApiError(500, "Something went Wrong while register the user");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, createUser, "User Register Succcessfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  //get username and password from user
  //check username aor password
  //check user
  //check password
  //access amd refresh token
  //send cookie
  //return res

  const { email, username, password } = req.body;

  if (!username && !email) {
    throw new ApiError(400, "Username or email is required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(400, "User not Exsit");
  }

  const isPasswordValid = await user.ComparePassword(password);

  if (!isPasswordValid) {
    throw new ApiError(400, "Password is Invalid");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "user logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  //get user from req which is pass
  //update by id and set user undefined
  //clear cookie
  //return res

  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const option = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken",option)
    .clearCookie("refreshToken", option)
    .json(new ApiResponse(200, {}, "User logged out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  // get refresh token from cookie
  // check refresh token cookie
  // decode refresh token and get id
  // get user
  // check user
  // check refresh token from cookie !== user.refreshtoken
  // generate access/refresh cookie
  // send cookie
  // return res

  const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      user._id
    );

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          201,
          {
            accessToken,
            refreshToken: refreshToken,
          },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

const changePassword = asyncHandler(async (req, res) => {
  //get oldpass,newpass,confirmpass from user
  //check all feild empty or not
  //check newpass === confirmpass
  //check old password
  //save password
  //return res

  const { oldPassword, newPassword, confirmPassword } = req.body;

  if (!oldPassword && !newPassword && !confirmPassword) {
    throw new ApiError(400, "All fields are Empty");
  }

  if (newPassword !== confirmPassword) {
    throw new ApiError(400, "Plz Enter Right Confrim Password");
  }

  const user = await User.findById(req.user?._id);

  const isPasswordCorrect = await user.ComparePassword(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Old Password is Invalid");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(201, {}, "Password Changed Successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  
  return res.status(200).json(new ApiResponse(200, req.user));

});

const updateCurrentUser = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        email: email,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(201, user, "User Update Successfully"));
});

const changeAvatar = asyncHandler(async (req, res) => {
  //get avatar file path
  //check avatar file
  //upload avatar on cloudinary
  //get avatar url
  //update avatar
  //return res

  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar path is Invalid");
  }

 const isOldAvatarDeleted = await deleteImageFromCloudinary(req.user?.avatar);

  // console.log(req.user?.avatar);

 if(!isOldAvatarDeleted){
   throw new ApiError(400,"Something Went Wrong While Deleting Old Avatar")
 }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar is required");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(201, user, "Avatar Update Successfully"));
});

const changeCoverImage = asyncHandler(async (req, res) => {
  //get avatar file path
  //check avatar file
  //upload avatar on cloudinary
  //get avatar url
  //update avatar
  //return res

  const coverImgLocalPath = req.file?.path;

  if (!coverImgLocalPath) {
    throw new ApiError(400, "Avatar path is Invalid");
  }

  const isOldCoverImageDeleted = await deleteImageFromCloudinary(req.user?.coverImage);

  if(!isOldCoverImageDeleted){
    throw new ApiError(400,"Something Went Wrong While Deleting Old Avatar")
  }


  const coverImage = await uploadOnCloudinary(coverImgLocalPath);

  if (!coverImage) {
    throw new ApiError(400, "Avatar is required");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(201, user, "Avatar Update Successfully"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params

  if (!username?.trim()) {
    throw new ApiError(400, "username is Invalid");
  }

  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribeTo",
      },
    },
    {
      $addFields: {
        subscribeCount: {
          $size: "$subscribers",
        },
        subscribeToCount: {
          $size: "$subscribeTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscribe"] },
            then: true,
            else: false,
          },
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
        subscribeCount: 1,
        subscribeToCount: 1,
        isSubscribed: 1,
      },
    },
  ]);

  if (!channel?.length) {
    throw new ApiError(400, "channel does not exists");
  }

  return res.status(200).json(new ApiResponse(201, channel[0], ""));
});

const getWatchHistory = asyncHandler(async (req, res) => {
  //create user
  //match id
  //get watch history from videos
  //subpipline get owner
  //add selected details
  //get first element from []
  //return res

  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user?._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
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
        ],
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
    .json(new ApiResponse(200, user[0].watchHistory, "Watch History fetched"));
});

export {
  userRegister,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changePassword,
  getCurrentUser,
  updateCurrentUser,
  changeAvatar,
  changeCoverImage,
  getUserChannelProfile,
  getWatchHistory,
};

  