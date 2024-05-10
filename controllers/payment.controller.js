import { catchAsyncError } from "../utils/catchAsyncError.js";
import dotenv from "dotenv";
import ErrorHandler from "../utils/errorHandler.js";
dotenv.config();
import Stripe from "stripe";

const stripe = Stripe(process.env.STRIPE_SECTRET_KEY);

export const sendStripekey = catchAsyncError(async (req, res) => {
  res.status(200).json({
    publishablekey: process.env.STRIPE_PUBLIC_KEY,
  });
});

export const newPay = catchAsyncError(async (req, res, next) => {
  const amount = req.body.amount;

  try {
    const newPayment = await stripe.paymentIntents.create({
      amount: amount,
      currency: "USD",
      metadata: {
        company: "E-Learning",
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.status(201).json({
      success: true,
      client_secret: newPayment.client_secret,
    });
  } catch (e) {
    return next(new ErrorHandler(500, e.message));
  }
});
