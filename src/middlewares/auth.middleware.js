import dotenv from "dotenv";
dotenv.config();
import jwt from "jsonwebtoken";
import userModel from "../models/user.model.js";
import { redis } from "../config/cache.js";

export async function IdentifyUser(req, res, next) {
  try {
    const { token } = req.cookies;

    // 1️⃣ token exist check
    if (!token) {
      const error = new Error("Authentication token missing");
      error.status = 401;
      return next(error);
    }

    const isTokenBlacklisted = await redis.get(token);

    if (isTokenBlacklisted) {
      const error = new Error("Token Invalid");
      error.status = 401;
      return next(error);
    }

    // 2️⃣ token verify
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3️⃣ user find
    const user = await userModel.findById(decoded.id);

    if (!user) {
      const error = new Error("User not found");
      error.status = 401;
      return next(error);
    }

    // 4️⃣ user attach to request
    req.user = user;

    next();
  } catch (error) {
    error.status = 401;
    next(error);
  }
}
