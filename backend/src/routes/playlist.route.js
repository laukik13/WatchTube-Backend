import { Router } from "express";
import {
  addVideoToPlaylist,
  createPlaylist,
  deletePlaylist,
  getPlaylistById,
  getUserPlaylist,
  removeVideoFromPlaylist,
  updatePlaylist,
} from "../controllers/playlist.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/createPlaylist").post(createPlaylist);

router.route("/getUserPlaylist/:userId").get(getUserPlaylist);

router.route("/addVideoToPlaylist/:playlistId/:videoId").patch(addVideoToPlaylist);

router.route("/getPlaylist/:playlistId").get(getPlaylistById);

router.route("/removeVideoFromPlaylist/:playlistId/:videoId").patch(removeVideoFromPlaylist);

router.route("/updatePlaylist/:playlistId").patch(updatePlaylist);

router.route("/deletePlaylist/:playlistId").delete(deletePlaylist);


export default router;
