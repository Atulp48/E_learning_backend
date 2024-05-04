import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  user: Object,
  rating: {
    type: String,
    default: 0,
  },
  comment: String,
  commentReplies: [Object],
});

const linkSchema = new mongoose.Schema({
  title: String,
  url: String,
});

const commentSchema = new mongoose.Schema({
  user: Object,
  question: String,
  questionReplies: [Object],
});

const courseDataSchema = new mongoose.Schema({
  videoUrl: String,
  title: String,
  videoSection: String,
  description: String,
  videoLength: Number,
  videoPlayer: Number,
  links: [linkSchema],
  suggestion: String,
  questions: [commentSchema],
});

const courseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    estiMatedPrice: {
      type: Number,
    },
    categories: {
      type: String,
      required:true
    },
    ThumbNail: {
      public_id: String,
      url: String,
    },
    tags: {
      type: String,
      required: true,
    },
    level: {
      type: String,
      required: true,
    },
    demoUrl: {
      type: String,
      required: true,
    },
    benifit: [{ title: String }],
    prerequisites: [{ title: String }],
    reviews: [reviewSchema],
    courseContent: [courseDataSchema],
    rating: {
      type: Number,
      default: 0,
    },
    purchased: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const CourseModel = new mongoose.model("Course", courseSchema);

export default CourseModel;
