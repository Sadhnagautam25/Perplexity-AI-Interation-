import dotenv from "dotenv";
dotenv.config();

import jwt from "jsonwebtoken";

export function genrateToken(user) {
  return jwt.sign(
    { id: user._id, username: user.username, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "2d" },
  );
}
