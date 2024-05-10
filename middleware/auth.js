import jwt from "jsonwebtoken";

import { catchAsyncError } from "../utils/catchAsyncError.js";
import redis from "../utils/redis.js";
import ErrorHandler from "../utils/errorHandler.js";

// authenticated user
// export const isAuthenticated = catchAsyncError(async (req, res, next) => {
//   // console.log(req.cookies)
//   const access_token = req.cookies.access_token;
//   if (!access_token) {
//     return next(new ErrorHandler(400, "access token not found"));
//   }

//   const decoded = jwt.verify(access_token, process.env.ACCESS_TOKEN);

//   if (!decoded) {
//     return next(new ErrorHandler(400, "Access token is not valid(decode)"));
//   }

//   const user = await redis.get(decoded.id);
//   if (!user) {
//     return next(new ErrorHandler(400, "Please login first"));
//   }

//   req.user = JSON.parse(user);
//   next();
// });

// // user role validation

// export const authorizeRoles = (...roles) => {
//   return (req, res, next) => {
//     if (!roles.includes(req.user.role))
//       return next(
//         new ErrorHandler(403, `${req.user.role} is not allowed for this role`)
//       );
//     next();
//   };
// };


export const isAuthenticated = catchAsyncError(async (req, res, next) => {
  console.log("1 ", req.cookies)
  const access_token = req.cookies.access_token;
  if (!access_token) {
    return next(new ErrorHandler(400, "access token not found"));
  }

  const decoded = jwt.verify(access_token, process.env.ACCESS_TOKEN);

  if (!decoded) {
    return next(new ErrorHandler(400, "Access token is not valid(decode)"));
  }

  const user = await redis.get(decoded.id);
  if (!user) {
    return next(new ErrorHandler(400, "Please login first"));
  }

  req.user = JSON.parse(user);
  next();
});



// user role validation

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role))
      return next(
        new ErrorHandler(403, `${req.user.role} is not allowed for this role`)
      );
    next();
  };
};
