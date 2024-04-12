import orderModel from "../models/order.model.js";
import { catchAsyncError } from "../utils/catchAsyncError.js";

export const newOrder = catchAsyncError(async (data, res) => {
  const order = await orderModel.create(data);

  res.status(201).json({ success: true, order });
});
// get all orders

export const getAllOrdersService = async (res) => {
  const orders = await orderModel.find().sort({ createdAt: -1 });
  res.status(201).json({
    success: true,
    orders,
  });
};
