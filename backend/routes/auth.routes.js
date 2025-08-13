import express from "express";
import {
  getMe,
  login,
  logout,
  signup,
} from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/protectRoute.js";

const routes = express.Router();

routes.get("/me", protectRoute, getMe);
routes.post("/signup", signup);
routes.post("/login", login);
routes.post("/logout", logout);

export default routes;
