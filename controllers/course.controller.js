import CourseModel from "../models/course.model.js";
import {
  createCourse,
  getAllCoursesService,
} from "../services/course.services.js";
import { catchAsyncError } from "../utils/catchAsyncError.js";
import cloudinary from "cloudinary";
import ErrorHandler from "../utils/errorHandler.js";
import mongoose from "mongoose";
import sendMail from "../utils/sendMail.js";
import ejs from "ejs";
import { fileURLToPath } from "url";
import path from "path";
import NotificationModel from "../models/notification.js";
import redis from "../utils/redis.js";
const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename);
import axios from "axios";

// upload course
export const uploadCourse = catchAsyncError(async (req, res, next) => {
  try {
    const data = req.body;
    const ThumbNail = data.ThumbNail;

    if (ThumbNail) {
      const myCloud = await cloudinary.v2.uploader.upload(ThumbNail, {
        folder: "courses",
      });

      data.ThumbNail = {
        public_id: myCloud.public_id,
        url: myCloud.url,
      };
    }

    createCourse(data, res, next);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// for edit operation of course

// export const editCourse = catchAsyncError(async (req, res, next) => {
//   try {
//     const data = req.body;
//     const ThumbNail = data.ThumbNail;

//     if (ThumbNail) {
//       await cloudinary.v2.uploader.destroy(ThumbNail.public_id);

//       const myCloud = await cloudinary.v2.uploader.upload(ThumbNail, {
//         folder: "courses",
//       });

//       data.ThumbNail = {
//         public_id: myCloud.public_id,
//         url: myCloud.secure_url,
//       };
//     }

//     const courseId = req.params.id;
//     const course = await CourseModel.findByIdAndUpdate(
//       courseId,
//       { $set: data },
//       { new: true }
//     );

//     res.status(201).json({ success: true, course });
//   } catch (e) {
//     return res.status(500).json({ success: false, message: e.message });
//   }
// });

export const editCourse = catchAsyncError(async (req, res, next) => {
  try {
    const data = req.body;
    // console.log(data);
    const Id = req.params.id;

    const ThumbNail = data.ThumbNail; 
    const courseData = await CourseModel.findById(Id);

    if (ThumbNail && ThumbNail.startsWith("https") !== 0) {
      await cloudinary.v2.uploader.destroy(courseData.ThumbNail.public_id);

      const myCloud = await cloudinary.v2.uploader.upload(ThumbNail, {
        folder: "courses",
      });

      data.ThumbNail = {
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
      };
    }

    if (ThumbNail && ThumbNail.startsWith("https") !== 0){
      data.ThumbNail = {
        public_id: courseData?.ThumbNail.public_id,
        url: courseData?.ThumbNail.secure_url,
      };
    }


    const course = await CourseModel.findByIdAndUpdate(
      Id,
      { $set: data },
      { new: true }
    );

    res.status(201).json({ success: true, course });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
});

// get single course -- without purchasing
export const getSingleCourse = catchAsyncError(async (req, res, next) => {
  try {
    const courseId = req.params.id;
    // console.log(courseId);

    const isCacheExist = await redis.get(courseId);
    if (isCacheExist) {
      const course = JSON.parse(isCacheExist);
      return res.status(200).json({
        success: true,
        course,
      });
    } else {
      const course = await CourseModel.findById(req.params.id).select(
        "-courseContent.videoUrl -courseContent.suggesstion -courseContent.questions -courseContent.links"
      );

      await redis.set(courseId, JSON.stringify(course), "EX", 604800);
      return res.status(200).json({ success: true, course });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});
// get all course -- without purchasing

export const getAllCourse = catchAsyncError(async (req, res, next) => {
  try {
    const courses = await CourseModel.find().select(
      "-courseContent.videoUrl -courseContent.suggestion -courseContent.questions -courseContent.links"
    );
    res.status(200).json({ success: true, courses });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// the following code is same work as above function but use redis data for chache mentained

// export const getAllCourse = catchAsyncError(async (req, res, next) => {
//   try {
//     const isCacheExist = await redis.get("allCourses");
//     if (isCacheExist) {
//       const courses = JSON.parse(isCacheExist);
//       return res.status(200).json({
//         success: true,
//         courses,
//       });
//     } else {
//       const courses = await CourseModel.find().select(
//         "-courseContent.videoUrl -courseContent.suggestion -courseContent.questions -courseContent.links"
//       );
//       await redis.set("allCourses", JSON.stringify(courses));
//       res.status(200).json({ success: true, courses });
//     }
//   } catch (error) {
//     return res.status(500).json({ success: false, message: error.message });
//   }
// });

// get course content only for valid user

export const getCourseByUser = catchAsyncError(async (req, res, next) => {
  try {
    const userCourseList = req.user.courses;
    const courseId = req.params.id;
    const courseExists = userCourseList.find(
      (course) => course.courseId.toString() === courseId
    );
    if (!courseExists) {
      return res.status(404).json({
        success: false,
        message: "You are not eligible to view this course",
      });
    }
    const course = await CourseModel.findById(courseId);
    const content = course.courseContent;
    res.status(200).json({ success: true, content });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// add questions in course

export const addQuestion = catchAsyncError(async (req, res, next) => {
  try {
    const { courseId, question, contentId } = req.body;
    // console.log(courseId,question,contentId,req.user)

    const course = await CourseModel.findById(courseId);
    if (!mongoose.Types.ObjectId.isValid(contentId)) {
      return res
        .status(404)
        .json({ success: false, message: "Invalid content id" });
    }

    const courseContent = course.courseContent.find((item) =>
      item._id.equals(contentId)
    );
    if (!courseContent) {
      return next(new ErrorHandler(400, "Invalid Content Id"));
    }

    const newQuestion = {
      user: req.user,
      question,
      questionReplies: [],
    };

    // add this question in our course content

    courseContent.questions.push(newQuestion);
    await NotificationModel.create({
      user: req.user._id,
      title: "New Question",
      message: `You have a new question in ${courseContent.title}`,
    });
    await course.save();
    res.status(200).json({ success: true, course });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// add answer in course question

export const addAnswer = catchAsyncError(async (req, res, next) => {
  try {
    const { courseId, contentId, questionId, answer } = req.body;
    const course = await CourseModel.findById(courseId);
    if (!mongoose.Types.ObjectId.isValid(contentId)) {
      return next(new ErrorHandler(400, "Invalid content id"));
    }
    const courseContent = course.courseContent.find((item) =>
      item._id.equals(contentId)
    );
    if (!courseContent) {
      return next(new ErrorHandler(400, "Invalid content id"));
    }

    const question = courseContent.questions.find((item) =>
      item._id.equals(questionId)
    );
    if (!question) {
      return next(new ErrorHandler(400, "Invalid question id"));
    }

    // crete new answer

    const newAnswer = {
      user: req.user,
      answer,
    };
    // add this answer in our course content
    question.questionReplies.push(newAnswer);
    await course.save();

    if (req.user._id === question.user._id) {
      // create a notification
      await NotificationModel.create({
        user: req.user._id,
        title: "New  Question Reply Received",
        message: `You have a new question reply in ${courseContent.title}`,
      });
    } else {
      const data = {
        name: question.user.name,
        title: courseContent.title,
      };

      const html = await ejs.renderFile(
        path.join(__dirname, "../mails/question-mail.ejs"),
        data
      );

      try {
        await sendMail({
          email: question.user.email,
          subject: "Question Replies!",
          template: "question-mail.ejs",
          data,
        });
      } catch (error) {
        return next(new ErrorHandler(500, error.message));
      }
    }
    res.status(200).json({ success: true, course });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// add review in course

export const addReview = catchAsyncError(async (req, res, next) => {
  try {
    const userCourseList = req.user.courses;
    const courseId = req.params.id;
    const courseExists = userCourseList.some(
      // (course) => course._id.toString() === courseId.toString()
      (course) => course.courseId.toString() === courseId.toString()
      // there are some modification
    );
    if (!courseExists) {
      return next(
        new ErrorHandler(
          400,
          "You are not eligible to add review for this course"
        )
      );
    }

    const course = await CourseModel.findById(courseId);

    const { review, rating } = req.body;
    const reviewData = {
      user: req.user,
      comment: review,
      rating,
    };
    course.reviews.push(reviewData);
    let avg = 0;
    course.reviews.forEach((rev) => (avg += Number(rev.rating)));
    if (course) {
      course.rating = avg / course.reviews.length;
    }
    await course.save();
    const notification = {
      title: "New Review Received",
      message: `${req.user.name} has added a review in ${course.name}`,
    };

    // create notification for admin
    return res.status(200).json({ success: true, course });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// reply api for reviews

export const addReplyToReview = catchAsyncError(async (req, res, next) => {
  try {
    const { comment, courseId, reviewId } = req.body;
    const course = await CourseModel.findById(courseId);

    if (!course) {
      return next(new ErrorHandler(404, "Invalid course id"));
    }
    const review = course.reviews.find(
      (rev) => rev._id.toString() === reviewId
    );
    if (!review) {
      return next(new ErrorHandler(404, "Invalid review id"));
    }
    const replyData = {
      user: req.user,
      comment,
    };
    if (!review.commentReplies) {
      review.commentReplies = [];
    }
    review.commentReplies.push(replyData);
    await course.save();
    return res.status(200).json({ success: true, course });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// get all courses -- admin

export const getAllCourses = catchAsyncError(async (req, res, next) => {
  try {
    getAllCoursesService(res);
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// delete course -- admin
export const deleteCourse = catchAsyncError(async (req, res, next) => {
  try {
    const { id } = req.params;
    const course = await CourseModel.findById(id);
    if (!course) {
      return next(new ErrorHandler(400, "Course not found"));
    }

    await course.deleteOne({ id });
    await redis.del(id);
    return res
      .status(200)
      .json({ success: true, message: "Course deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export const generateVideoUrl = catchAsyncError(async (req, res, next) => {
  try {
    const { videoId } = req.body;
    const response = await axios.post(
      `https://dev.vdocipher.com/api/videos/${videoId}/otp`,
      { tt: 300 },
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Apisecret ${process.env.VDOCIPHER_API_SECRET}`,
        },
      }
    );
    res.json(response.data);
  } catch (err) {
    return next(new ErrorHandler(400, error.message));
  }
});
