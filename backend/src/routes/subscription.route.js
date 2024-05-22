import { Router } from "express";
import {
  getSubscribedChannels,
  getUserChannelSubscribers,
  toggleSubscription,
} from "../controllers/subscription.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/subscribe/:channelId").post(toggleSubscription);

router.route("/getSubscriberList/:channelId").get(getUserChannelSubscribers);

router.route("/getSubscribedChannels/:subscriberId").get(getSubscribedChannels);

export default router;
