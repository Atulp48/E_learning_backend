import express from "express";
import { authorizeRoles, isAuthenticated } from "../middleware/auth.js";
import {
  getCoursesAnalytics,
  getOrdersAnalytics,
  getUsersAnalytics,
} from "../controllers/analytics.controller.js";
import { updateAccessToken } from "../controllers/user.controller.js";

const analyticsRouter = express.Router();

analyticsRouter.get(
  "/get-users-analytics",
  updateAccessToken,
  isAuthenticated,
  authorizeRoles("admin"),
  getUsersAnalytics
);
analyticsRouter.get(
  "/get-orders-analytics",
  updateAccessToken,
  isAuthenticated,
  authorizeRoles("admin"),
  getOrdersAnalytics
);
analyticsRouter.get(
  "/get-courses-analytics",
  updateAccessToken,
  isAuthenticated,
  authorizeRoles("admin"),
  getCoursesAnalytics
);

export default analyticsRouter;
