import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import {
  followUnfollowUser,
  getSuggestedUsers,
  getUserProfile,
  updateUser,
} from "../controllers/user.controller.js";

const routes = express.Router();

routes.get("/profile/:username", protectRoute, getUserProfile);
routes.get("/suggested", protectRoute, getSuggestedUsers);
routes.post("/follow/:id", protectRoute, followUnfollowUser);
routes.post("/update", protectRoute, updateUser);

export default routes;
