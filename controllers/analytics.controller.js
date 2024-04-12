import CourseModel from "../models/course.model.js";
import orderModel from "../models/order.model.js";
import userModel from "../models/user.model.js";
import { generateLast12MonthData } from "../utils/analytics.generator.js";
import { catchAsyncError } from "../utils/catchAsyncError.js";

// get users analytics -- admin
export const getUsersAnalytics = catchAsyncError(async (req, res, next) => {
  try {
    const users = await generateLast12MonthData(userModel);
    res.status(200).json({ success: true, users });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});
// get courses analytics -- admin
export const getCoursesAnalytics = catchAsyncError(async (req, res, next) => {
  try {
    const courses = await generateLast12MonthData(CourseModel);
    res.status(200).json({ success: true, courses });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});
// get order analytics -- admin
export const getOrdersAnalytics = catchAsyncError(async (req, res, next) => {
  try {
    const orders = await generateLast12MonthData(orderModel);
    res.status(200).json({ success: true, orders });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});
