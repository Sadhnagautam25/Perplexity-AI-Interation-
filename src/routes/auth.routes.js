import express from "express";
import {
  loginValidator,
  registerValidator,
} from "../validators/auth.validator.js";
import {
  getMeController,
  loginController,
  logoutController,
  registerController,
  resendVerificationEmail,
  updateProfileController,
  verifyEmailController,
} from "../controllers/auth.controller.js";
import upload from "../middlewares/upload.middleware.js";
import { IdentifyUser } from "../middlewares/auth.middleware.js";

const authRouter = express.Router();

// authRouter => prifix => /api/auth

// create register route 1️⃣
// api name => /api/auth/register
// api method => POST
// status => 201

authRouter.post(
  "/register",
  upload.single("profile"),
  registerValidator,
  registerController,
);

// create login route 2️⃣
// api name => /api/auth/login
// api method => POST
// status => 200

authRouter.post("/login", loginValidator, loginController);

// create getMe route 3️⃣
// api name => /api/auth/get-me
// api method => GET
// status => 200

authRouter.get("/get-me", IdentifyUser, getMeController);

// create update profile route 4️⃣
// api name => /api/auth/update-profile
// api method => PUT
// status => 200

authRouter.put(
  "/update-profile",
  upload.single("profile"),
  IdentifyUser,
  updateProfileController,
);

// create  logout route 5️⃣
// api name => /api/auth/logout
// api method => GET
// status => 200

authRouter.get('/logout', IdentifyUser, logoutController)

// create email verify route 6️⃣
// api name => /api/auth/verify-email
// api method => GET
// status => 200

authRouter.get("/verify-email", verifyEmailController);


// create email ResendVerify route 7️⃣
// api name => /api/auth/resend-verification
// api method => POST
// status => 201

authRouter.post("/resend-verification", resendVerificationEmail);

export default authRouter;
