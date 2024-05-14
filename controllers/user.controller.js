import userModel from "../models/user.model.js";
import { catchAsyncError } from "../utils/catchAsyncError.js";
import jwt from "jsonwebtoken";
import ejs from "ejs";
import sendMail from "../utils/sendMail.js";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

import {
  accessTokenOptions,
  refressTokenOptions,
  sendToken,
} from "../utils/jwt.js";
import redis from "../utils/redis.js";
import cloudinary from "cloudinary";
import {
  getAllUserService,
  getUserById,
  updateUserRoleService,
} from "../services/user.services.js";
import ErrorHandler from "../utils/errorHandler.js";

import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// tocken creation  for user

export const createActivationToken = (user) => {
  const activationCode = Math.floor(1000 + Math.random() * 9000).toString();

  const token = jwt.sign(
    {
      user,
      activationCode,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "5m",
    }
  );

  return { token, activationCode };
};

// user operation for all types of operations in

// user registration and opt send by mail

export const registerUser = catchAsyncError(async (req, res, next) => {
  const { name, email, password } = req.body;
  const isEmailExist = await userModel.findOne({ email });

  if (isEmailExist) {
    return next(new ErrorHandler(400, "Email already exists"));
  }

  const user = {
    name: name,
    email: email,
    password: password,
  };

  const activationToken = createActivationToken(user);

  const activationCode = activationToken.activationCode;
  const data = { user: { name: user.name }, activationCode };

  const html = await ejs.renderFile(
    path.join(__dirname, "../mails/activation-mail.ejs"),
    data
  );
  try {
    await sendMail({
      email: user.email,
      subject: "Activate your account",
      template: "activation-mail.ejs",
      data,
    });

    res.status(201).json({
      success: "true",
      message: `Please check your mail: ${user.email} to activate your account`,
      activationToken: activationToken.token,
    });
  } catch (error) {
    return next(new ErrorHandler(500, error.message));
  }
});

// activate user

export const activateUser = catchAsyncError(async (req, res, next) => {
  try {
    const { activation_token, activation_code } = req.body;
    const newUser = jwt.verify(activation_token, process.env.JWT_SECRET);

    if (newUser.activationCode !== activation_code) {
      return next(new ErrorHandler(400, "Invalid activation code"));
    }

    const { name, email, password } = newUser.user;
    const existUser = await userModel.findOne({ email });

    if (existUser) {
      return next(new ErrorHandler(400, "Email already exists"));
    }

    const user = await userModel.create({ name, email, password });

    res.status(201).json({
      success: "true",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// login user through activation token and refresh token

export const loginUser = catchAsyncError(async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return next(new ErrorHandler(400, "Please enter email and password"));
    }

    const user = await userModel.findOne({ email }).select("+password");
    if (!user) {
      return next(new ErrorHandler(400, "Invalid email or password"));
    }

    const isPasswordMatched = await user.comparePassword(password);
    if (!isPasswordMatched) {
      return next(new ErrorHandler(400, "Invalid email or password"));
    }

    sendToken(user, 200, res);
    // return res.status(200).json({success: true, message: "Login successful"})
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export const logOutUser = catchAsyncError(async (req, res, next) => {
  try {
    res.cookie("access_token", "", {
      maxAge: 1,
    });

    res.cookie("refresh_token", "", {
      maxAge: 1,
    });

    redis.del(req.user._id);
    res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// update access token
export const updateAccessToken = catchAsyncError(async (req, res, next) => {
  try {
    const refresh_token = req.cookies.refresh_token;
    const decoded = jwt.verify(refresh_token, process.env.REFRESH_TOKEN);

    const message = "Could not refresh token, please login again";

    if (!decoded) {
      return next(new ErrorHandler(400, message));
    }

    const session = await redis.get(decoded.id);
    if (!session) {
      return next(
        new ErrorHandler(400, "Please login to access this resourse")
      );
    }

    const user = JSON.parse(session);
    const access_token = jwt.sign({ id: user._id }, process.env.ACCESS_TOKEN, {
      expiresIn: "5m",
    });

    const refreshToken = jwt.sign({ id: user._id }, process.env.REFRESH_TOKEN, {
      expiresIn: "3d",
    });

    req.user = user;
    res.cookie("access_token", access_token, accessTokenOptions);
    res.cookie("refresh_token", refreshToken, refressTokenOptions);

    await redis.set(user._id, JSON.stringify(user), "EX", 604800); // 7 days expiry
    // res.status(200).json({
    //   status: "success",
    //   access_token,
    // });
    next();
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// get user info

export const getUserInfo = catchAsyncError(async (req, res, next) => {
  try {
    const userId = req.user._id;
    getUserById(userId, res);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// social auth
export const socialAuth = catchAsyncError(async (req, res, next) => {
  try {
    const { email, name, avatar } = req.body;
    const user = await userModel.findOne({ email });
    if (!user) {
      const newUser = await userModel.create({ email, name, avatar });
      sendToken(newUser, 200, res);
    } else {
      sendToken(user, 200, res);
    }
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// user information updatation

// export const updateUserInfo = catchAsyncError(async (req, res, next) => {
//   try {
//     let { name, email } = req.body;
//     const userId = req.user._id;
//     const user = await userModel.findById(userId);

//     if (user && email) {
//       const isEmailExist = await userModel.findOne({ email });
//       if (isEmailExist) {
//         return next(new ErrorHandler(400,"email is already exist "));
//       }
//       user.email = email;
//     }
//     if (name && user) {
//       user.name = name;
//     }

//     await user?.save();

//     await redis.set(userId, JSON.stringify(user));
//     res.status(201).json({
//       success: true,
//       user,
//     });
//   } catch (error) {
//     return res.status(500).json({ success: false, error: error.message });
//   }
// });

export const updateUserInfo = catchAsyncError(async (req, res, next) => {
  try {
    let { name } = req.body;
    const userId = req.user._id;
    const user = await userModel.findById(userId);

    if (!user) {
      return next(new ErrorHandler(400, "User not found"));
    }

    user.name = name;
    await userModel.findByIdAndUpdate(userId, { name });

    await redis.set(userId, JSON.stringify(user));
    return res.status(200).json({ success: true, user });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export const updatePassword = catchAsyncError(async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await userModel.findById(req.user._id).select("+password");

    if (!oldPassword || !newPassword) {
      return next(
        new ErrorHandler(400, "please enter the old and new password")
      );
    }

    if (oldPassword === newPassword) {
      return next(
        new ErrorHandler(400, "old password and new password are not same")
      );
    }

    if (user.password === undefined) {
      return next(new ErrorHandler(400, "Invalid user"));
    }

    const isPasswordMatched = await user.comparePassword(oldPassword);
    if (!isPasswordMatched) {
      return res
        .status(400)
        .json({ success: false, message: "old password is wrong" });
    }

    user.password = newPassword;
    await user.save();
    await redis.set(req.user._id, JSON.stringify(user));

    return res.status(200).json({ success: true, user });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// update profile picture

export const updateProfileAvatar = catchAsyncError(async (req, res, next) => {
  try {
    const { avatar } = req.body;

    const userId = req.user._id;
    const user = await userModel.findById(userId);
    if (avatar && user) {
      if (user.avatar.public_id) {
        await cloudinary.v2.uploader.destroy(user.avatar.public_id);
      }
      const myCloud = await cloudinary.v2.uploader.upload(avatar, {
        folder: "avatars",
        width: 150,
      });

      user.avatar = {
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
      };
    }
    await user.save();
    await redis.set(userId, JSON.stringify(user));
    return res.status(200).json({ success: true, user });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// get all users -- admin

export const getAllUsers = catchAsyncError(async (req, res, next) => {
  try {
    getAllUserService(res);
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// update user role -- admin
export const updateUserRole = catchAsyncError(async (req, res, next) => {
  try {
    const { id, role } = req.body;
    updateUserRoleService(res, id, role);
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// delete user -- admin
export const deleteUser = catchAsyncError(async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await userModel.findById(id);
    if (!user) {
      return next(new ErrorHandler(400, "User not found"));
    }

    await user.deleteOne({ id });
    await redis.del(id);
    return res
      .status(200)
      .json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});
