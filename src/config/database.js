import mongoose from "mongoose";

export async function connectToDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Server connected to DB 🎉");
  } catch (error) {
    console.error("Database connection failed ❌", error.message);
    process.exit(1);
  }
} 

export default connectToDB;