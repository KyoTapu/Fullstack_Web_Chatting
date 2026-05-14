import mongoose from "mongoose";

export const connectMongo = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected: " + process.env.MONGO_URI);
  } catch (err) {
    console.error("❌ MongoDB error:", err);
    process.exit(1);
  }
};
