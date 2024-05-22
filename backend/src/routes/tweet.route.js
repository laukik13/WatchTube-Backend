import { Router } from "express";
import { createTweet, deleteTweets, getUserTweets, updateTweets } from "../controllers/tweet.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/createTweet").post(createTweet);

router.route("/getUserTweet/:userId").get(getUserTweets);

router.route("/updateTweet/:tweetId").patch(updateTweets);

router.route("/deleteTweet/:tweetId").delete(deleteTweets);


export default router;

