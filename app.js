import express from "express";
import dotenv from "dotenv";
export const app = express();

import cors from "cors";

//bodyparser
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import { errors } from "./middleware/error.js";
import userRouter from "./routes/user.route.js";
import courseRouter from "./routes/course.route.js";
import OrderRouter from "./routes/order.route.js";
import { rateLimit } from 'express-rate-limit'
import NotificationRouter from "./routes/notification.route.js";
import analyticsRouter from "./routes/analytics.router.js";
import layoutRouter from "./routes/layout.router.js";
app.use(express.json({ limit: "50mb" }));

//cokie parser
app.use(cookieParser());

dotenv.config();

app.use(
  cors({
    origin: [process.env.ORIGIN],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);


const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
	standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
	// store: ... , // Redis, Memcached, etc. See below.
})

// Apply the rate limiting middleware to all requests.

    app.use("/api/v1", userRouter);
    app.use("/api/v1", courseRouter);
    app.use("/api/v1", OrderRouter);
    app.use("/api/v1", NotificationRouter);
    app.use("/api/v1", analyticsRouter);
    app.use("/api/v1", layoutRouter);
    // testing api
    app.get("/test", (req, res, next) => {
      res.status(200).json({ success: true, message: "API is working" });
    });

app.all("*", (req, res, next) => {
  const err = new Error(`Route ${req.originalUrl} not found`);
  err.statusCode = 404;
  next(err);
});

app.use(limiter)
app.use(errors);
