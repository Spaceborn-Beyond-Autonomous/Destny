import mongoose from "mongoose";
import env from "./env.js";

export const connectDatabase = async () => {
  mongoose.set("strictQuery", true);

  await mongoose.connect(env.mongodbUri);

  mongoose.connection.on("connected", () => {
    console.log("MongoDB connected");
  });

  mongoose.connection.on("error", (error) => {
    console.error("MongoDB error:", error.message);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("MongoDB disconnected");
  });
};

export const disconnectDatabase = async () => {
  await mongoose.connection.close();
};
