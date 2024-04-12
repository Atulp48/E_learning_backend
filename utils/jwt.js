import redis from "./redis.js";

// parse enviroment variables to inegrates with fallback
const accessTokenExpires = process.env.ACCESS_TOKEN_EXPIRES || "300";
const refreshTokenExpires = process.env.REFRESH_TOKEN_EXPIRES || "1200";

// options for cookies
export const accessTokenOptions = {
  expires: new Date(Date.now() + accessTokenExpires * 60 * 60 * 1000),
  maxAge: accessTokenExpires * 60 * 60 * 1000,
  httpOnly: true,
  sameSite: "lax",
};

export const refressTokenOptions = {
  expires: new Date(Date.now() + accessTokenExpires * 24 * 60 * 60 * 1000),
  maxAge: refreshTokenExpires * 24 * 60 * 60 * 1000,
  httpOnly: true,
  sameSite: "lax",
};

export const sendToken = (user, statusCode, res) => {
  const accessToken = user.SignAccessToken();
  const refreshToken = user.SignRefreshToken();

  // upload session to redis
  redis.set(user._id, JSON.stringify(user));

  // only set secure to ture in production
  if (process.env.NODE_ENV === "production") {
    accessTokenOptions.secure = true;
  }

  res.cookie("access_token", accessToken, accessTokenOptions);
  res.cookie("refresh_token", refreshToken, refressTokenOptions);

  res.status(statusCode).json({
    success: true,
    user,
    accessToken,
  });
};
