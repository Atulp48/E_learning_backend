import { catchAsyncError } from "../utils/catchAsyncError.js";
import ErrorHandler from "../utils/errorHandler.js";
import path from "path";
import ejs from "ejs";

import { fileURLToPath } from "url";
import userModel from "../models/user.model.js";
import CourseModel from "../models/course.model.js";
import { getAllOrdersService, newOrder } from "../services/order.services.js";
import sendMail from "../utils/sendMail.js";
import NotificationModel from "../models/notification.js";
const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename);

// create order

export const createOrder = catchAsyncError(async (req, res, next) => {
  try {
    const { courseId, payment_info } = req.body;
    const user = await userModel.findById(req.user._id);
    // const couseExistInUser = user.courses.some(course => course._id.toString() === courseId);
    const couseExistInUser = user.courses.some(
      (course) => course.courseId.toString() === courseId
    );

    if (couseExistInUser) {
      return next(
        new ErrorHandler(400, "You have already purchased this course")
      );
    }

    const course = await CourseModel.findById(courseId);
    if (!course) {
      return next(new ErrorHandler(404, "Course not found"));
    }

    const data = {
      payment_info,
      courseId: course._id,
      userId: user._id,
    };

    const mailData = {
      order: {
        _id: course._id.toString().slice(0, 6),
        userName: user.name,
        name: course.name,
        price: course.price,
        date: new Date().toLocaleDateString("en-Us", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      },
    };

    const html = await ejs.renderFile(
      path.join(__dirname, "../mails/order-mail.ejs"),
      { order: mailData }
    );

    try {
      if (user) {
        await sendMail({
          email: user.email,
          subject: "Order Confirmation",
          template: "order-mail.ejs",
          data: mailData,
        });
      }
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }

    const val = {
      courseId: course._id,
    };

    user.courses.push(val);
    await user.save();

    await NotificationModel.create({
      user: user._id,
      title: "New Order",
      message: `You have a new order from ${course.name}`,
    });
    if (course) {
      course.purchased += 1;
    }
    await course.save();
    newOrder(data, res);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// get all orders -- admin

export const getAllOrders = catchAsyncError(async (req, res, next) => {
  try {
    getAllOrdersService(res);
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});
