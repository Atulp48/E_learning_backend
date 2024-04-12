import CourseModel from "../models/course.model.js";
import { catchAsyncError } from "../utils/catchAsyncError.js";

// create course
export const createCourse = catchAsyncError(async (data, res) => {
  const course = await CourseModel.create(data);

  res.status(201).json({ success: true, course });
});

// get all users

export const getAllCoursesService = async (res) => {
  const courses = await CourseModel.find().sort({ createdAt: -1 });
  res.status(201).json({
    success: true,
    courses,
  });
};
