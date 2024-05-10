import express from "express";
import { authorizeRoles, isAuthenticated } from "../middleware/auth.js";
import { createOrder, getAllOrders } from "../controllers/order.controller.js";
import { updateAccessToken } from "../controllers/user.controller.js";
import { newPay, sendStripekey } from "../controllers/payment.controller.js";
const OrderRouter = express.Router();

OrderRouter.post(
  "/create-order",
  updateAccessToken,
  isAuthenticated,
  createOrder
);
OrderRouter.get(
  "/get-orders",
  updateAccessToken,
  isAuthenticated,
  authorizeRoles("admin"),
  getAllOrders
);

OrderRouter.get("/payment/stripePublishkey", sendStripekey);
OrderRouter.post("/payment", updateAccessToken, isAuthenticated, newPay);

export default OrderRouter;
