import mongoose from "mongoose";

export const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("MONGO_URI not set in environment");

  try {
    await mongoose.connect(uri);
    console.log(`✅ MongoDB connected: ${mongoose.connection.host}`);
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err);
    process.exit(1);
  }
};