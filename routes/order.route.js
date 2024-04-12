import express from "express";
import { authorizeRoles, isAuthenticated } from "../middleware/auth.js";
import { createOrder, getAllOrders } from "../controllers/order.controller.js";
const OrderRouter = express.Router();

OrderRouter.post("/create-order", isAuthenticated, createOrder);
OrderRouter.get(
  "/get-orders",
  isAuthenticated,
  authorizeRoles("admin"),
  getAllOrders
);

export default OrderRouter;
