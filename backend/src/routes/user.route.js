import { Router } from "express";
import { changeAvatar, changeCoverImage, changePassword, getCurrentUser, getUserChannelProfile, getWatchHistory, loginUser, logoutUser, refreshAccessToken, updateCurrentUser, userRegister } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(upload.fields([
    {
        name: "avatar",
        maxCount: 1
    },
    {
        name: "coverImage",
        maxCount: 1
    }
]),userRegister);

router.route("/login").post(loginUser);

router.route("/logout").post(verifyJWT,logoutUser)

router.route("/refresh-token").post(refreshAccessToken);

router.route("/changePassword").post(verifyJWT,changePassword);

router.route("/getUser").get(verifyJWT,getCurrentUser);

router.route("/updateUser").patch(verifyJWT,updateCurrentUser);

router.route("/avatar").patch(verifyJWT,upload.single("avatar"),changeAvatar);

router.route("/coverImage").patch(verifyJWT,upload.single("coverImage"),changeCoverImage);

router.route("/channel/:username").get(verifyJWT,getUserChannelProfile);

router.route("/watchHistory").get(verifyJWT,getWatchHistory);

export default router
