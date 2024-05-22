import { Router } from "express";
import { upload } from "../middlewares/multer.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { deleteVideo, getAllVideo, getVideoById, publishVideo, tooglePublishStatus, updateVideo } from "../controllers/video.controller.js";

const router = Router();

router.route("/publishVideo").post(
  verifyJWT,
  upload.fields([
    {
      name: "videoFile",
      maxCount: 1,
    },
    {
      name: "thumbnail",
      maxCount: 1,
    },
  ]),
  publishVideo
);

router.route("/getVideo/:videoId").get(verifyJWT,getVideoById);

router.route("/updateVideo/:videoId").patch(verifyJWT,upload.single("thumbnail"),updateVideo);

router.route("/deleteVideo/:videoId").delete(verifyJWT,deleteVideo);

router.route("/isPublish/:videoId").get(verifyJWT,tooglePublishStatus);

router.route("/getAllVideos").get(verifyJWT,getAllVideo);

export default router
