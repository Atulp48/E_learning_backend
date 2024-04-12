import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const Mongo_URL = process.env.DB_URI || "";

const connectDb = async () => {
  mongoose.set("strictQuery", false);
  mongoose
    .connect(Mongo_URL)
    .then(() => {
      console.log("database connected successfully");
    })
    .catch((e) => {
      console.log(e);
    });
};

export default connectDb;
