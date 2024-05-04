import express from "express";
import { authorizeRoles, isAuthenticated } from "../middleware/auth.js";
import { updateAccessToken } from "../controllers/user.controller.js";
import {
  getNotifications,
  updateNotification,
} from "../controllers/notification.controller.js";
const NotificationRouter = express.Router();

NotificationRouter.get(
  "/get-all-notification",
  updateAccessToken,
  isAuthenticated,
  authorizeRoles("admin"),
  getNotifications
);
NotificationRouter.put(
  "/update-notification/:id",
  updateAccessToken,
  isAuthenticated,
  authorizeRoles("admin"),
  updateNotification
);
export default NotificationRouter;
