import layOutModel from "../models/layout.model.js";
import { catchAsyncError } from "../utils/catchAsyncError.js";
import cloudinary from "cloudinary";
import ErrorHandler from "../utils/errorHandler.js";
// create layout

export const createLayout = catchAsyncError(async (req, res, next) => {
  try {
    const { type } = req.body;
    const isTypeExist = await layOutModel.findOne({ type });
    if (isTypeExist) {
      return next(new ErrorHandler(400, `${type} already exist`));
    }
    if (type === "Banner") {
      const { image, title, subTitle } = req.body;
      const myCloud = await cloudinary.v2.uploader.upload(image, {
        folder: "layout",
      });
      const banner = {
        type: "Banner",
        banner: {
          image: {
            public_id: myCloud.public_id,
            url: myCloud.secure_url,
          },
          title: title,
          subTitle: subTitle,
        },
      };
      await layOutModel.create(banner);
    }

    if (type === "FAQ") {
      const { faq } = req.body;
      const faqItems = await Promise.all(
        faq.map(async (item) => {
          return { question: item.question, answer: item.answer };
        })
      );
      await layOutModel.create({ type: "FAQ", faq: faqItems });
    }
    if (type === "Categories") {
      const { categories } = req.body;
      const categoriesItems = await Promise.all(
        categories.map(async (item) => {
          return {
            title: item.title,
          };
        })
      );
      await layOutModel.create({
        type: "Categories",
        categories: categoriesItems,
      });
    }

    res
      .status(201)
      .json({ success: true, message: "Layout created successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Edit layout

export const editLayout = catchAsyncError(async (req, res, next) => {
  try {
    const { type, title, subTitle, image } = req.body;


    if (type === "Banner") {
      const bannerData = await layOutModel.findOne({ type: "Banner" });
      const { image, title, subTitle } = req.body;

      const data = image.startsWith("https")
        ? bannerData
        : await cloudinary.v2.uploader.upload(image, {
            folder: "layout",
          });
      const banner = {
        type: "Banner",
        banner: {
          image: {
            public_id: image.startsWith("https")
              ? bannerData.banner.image.public_id
              : data?.public_id,
            url: image.startsWith("https")
              ? bannerData.banner.image.url
              : data?.secure_url,
          },
          title: title,
          subTitle: subTitle,
        },
      };
      await layOutModel.findByIdAndUpdate(bannerData._id, banner);
    }

    if (type === "FAQ") {
      const { faq } = req.body;
      const FaqItem = await layOutModel.findOne({ type: "FAQ" });

      const faqItems = await Promise.all(
        faq.map(async (item) => {
          return { question: item.question, answer: item.answer };
        })
      );
      await layOutModel.findByIdAndUpdate(FaqItem._id, {
        type: "FAQ",
        faq: faqItems,
      });
    }
    if (type === "Categories") {
      const { categories } = req.body;
      const categoryData = await layOutModel.findOne({ type: "Categories" });

      const categoriesItems = await Promise.all(
        categories.map(async (item) => {
          return {
            title: item.title,
          };
        })
      );
      await layOutModel.findByIdAndUpdate(categoryData._id, {
        type: "Categories",
        categories: categoriesItems,
      });
    }

    res
      .status(201)
      .json({ success: true, message: "Layout updated successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// get lay out by type

export const getLayoutByType = catchAsyncError(async (req, res, next) => {
  try {
    const { type } = req.params;
    // console.log("hello get data")
    // console.log(type);
    const layout = await layOutModel.findOne({ type });

    res.status(201).json({ success: true, layout });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});
