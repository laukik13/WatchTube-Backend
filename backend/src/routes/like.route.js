import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getLikedvideo, toogleCommentLike, toogleTweetLike, toogleVideoLike } from "../controllers/like.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/videoLike/:videoId").post(toogleVideoLike);

router.route("/videoCommentLike/:commentId").post(toogleCommentLike);

router.route("/tweetLiked/:tweetId").post(toogleTweetLike);

router.route("/getLikedVideo").get(getLikedvideo);



export default router;
