import NotificationModel from "../models/notification.js";
import { catchAsyncError } from "../utils/catchAsyncError.js";
import cron from "node-cron";

// get all the notifications  --only for admin
export const getNotifications = catchAsyncError(async (req, res, next) => {
  try {
    const notifications = await NotificationModel.find().sort({
      createdAt: -1,
    });

    res.status(201).json({
      success: true,
      notifications,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// update notifications status -- admin
export const updateNotification = catchAsyncError(async (req, res, next) => {
  try {
    const notification = await NotificationModel.findById(req.params.id);
    if (!notification) {
      return next(new ErrorHandler(404, "Notification not found"));
    }
    notification.status ? (notification.status = "read") : notification.status;
    await notification.save();

    const notifications = await NotificationModel.find().sort({
      createdAt: -1,
    });
    return res.status(201).json({ success: true, notifications });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// delete notification -- admin
cron.schedule("0 0 0 * * *", async () => {
  const thrityDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  await NotificationModel.deleteMany({
    status: "read",
    createdAt: { $lt: thrityDaysAgo },
  });
});
