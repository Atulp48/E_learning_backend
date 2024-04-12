import express from "express";
import { authorizeRoles, isAuthenticated } from "../middleware/auth.js";
import {
  getNotifications,
  updateNotification,
} from "../controllers/notification.controller.js";
const NotificationRouter = express.Router();

NotificationRouter.get(
  "/get-all-notification",
  isAuthenticated,
  authorizeRoles("admin"),
  getNotifications
);
NotificationRouter.put(
  "/update-notification/:id",
  isAuthenticated,
  authorizeRoles("admin"),
  updateNotification
);
export default NotificationRouter;
