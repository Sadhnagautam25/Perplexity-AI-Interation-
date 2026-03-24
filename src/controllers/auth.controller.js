import dotenv from "dotenv";
dotenv.config();
import userModel from "../models/user.model.js";
import uploadFile from "../services/storage.service.js";
import jwt from "jsonwebtoken";
import { sendEmail } from "../services/mail.service.js";
import { genrateToken } from "../utils/genrateToken.js";
import { redis } from "../config/cache.js";

export async function registerController(req, res, next) {
  try {
    console.log("👉 Register controller hit");
    const { username, email, password, bio } = req.body;

    // check user already exists
    const isAlreadyExists = await userModel.findOne({ email });

    if (isAlreadyExists) {
      const error = new Error("User already exists, try another email");
      error.statusCode = 409;
      return next(error);
    }

    let userprofile;

    // upload profile image if provided
    if (req.file) {
      const uploaded = await uploadFile({
        buffer: req.file.buffer,
        fileName: "profile",
        folder: "/perplexity/userProfile",
      });

      userprofile = uploaded.url;
    }

    // create user
    const user = await userModel.create({
      username,
      email,
      password,
      bio,
      profile: userprofile || undefined,
    });

    console.log("👉 User created:", user.email);

    // create verification token
    const verificationToken = jwt.sign(
      { email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "10m" },
    );

    console.log("👉 Verification token generated");

    // dynamic base url (ngrok / localhost)
    const verifyURL = `${process.env.BASE_URL}/api/auth/verify-email?token=${verificationToken}`;

    console.log("👉 Verify URL:", verifyURL);

    console.log("👉 Sending email to:", email);

    // send email
    const result = await sendEmail({
      to: email,
      subject: "Verify your email - Perplexity 🤖",
      html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,Helvetica,sans-serif;">

  <div style="width:100%;padding:40px 0;">
    
    <div style="max-width:600px;margin:auto;background:#ffffff;border-radius:10px;
                padding:40px;text-align:center;box-shadow:0 4px 12px rgba(0,0,0,0.08);">

      <h2 style="color:#4f8cff;margin-bottom:10px;">
        Welcome to Perplexity 🤖
      </h2>

      <p style="color:#555;font-size:15px;line-height:1.6;">
        Your account has been created successfully.
      </p>

      <p style="color:#555;font-size:15px;line-height:1.6;">
        Please verify your email address to activate your account.
      </p>

      <a href="${verifyURL}" 
         style="
           display:inline-block;
           margin-top:25px;
           padding:14px 28px;
           background:#4f8cff;
           color:#ffffff;
           text-decoration:none;
           border-radius:6px;
           font-weight:bold;
           font-size:15px;
         ">
         Verify Email
      </a>

      <p style="margin-top:30px;color:#888;font-size:13px;">
        If you didn’t create this account, you can safely ignore this email.
      </p>

      <hr style="margin:30px 0;border:none;border-top:1px solid #eee;">

      <p style="font-size:12px;color:#999;">
        © 2026 Perplexity. All rights reserved.
      </p>

    </div>

  </div>

</body>
</html>
      `,
    });

    console.log("👉 Email send result:", result);

    res.status(201).json({
      success: true,
      message: [
        "Registration Successful ✅",
        "Your account has been created successfully.",
        "Please verify your email address to activate your account.",
      ],
      user: {
        username: user.username,
        email: user.email,
        verified: user.verified,
        profile: user.profile,
        bio: user.bio,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function loginController(req, res, next) {
  try {
    const { email, password } = req.body;

    // find user
    const user = await userModel.findOne({ email }).select("+password");

    if (!user) {
      const error = new Error("Invalid Credentials");
      error.statusCode = 401;
      return next(error);
    }

    // check password
    const isMatchPassword = await user.verifyPassword(password);

    if (!isMatchPassword) {
      const error = new Error("Invalid Credentials");
      error.statusCode = 401;
      return next(error);
    }

    // check email verification
    if (!user.verified) {
      const error = new Error(
        "Account not verified. Please verify your email before logging in.",
      );
      error.statusCode = 403;
      return next(error);
    }

    // generate token
    const token = genrateToken(user);

    // send cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
    });

    // response
    res.status(200).json({
      success: true,
      message: "Login successful ✅",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profile: user.profile,
        bio: user.bio,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getMeController(req, res, next) {
  try {
    const userId = req.user.id;

    const user = await userModel.findById(userId);

    if (!user) {
      const error = new Error("User not found");
      error.status = 401;
      return next(error);
    }

    res.status(200).json({
      success: true,
      message: "User fetched successfully",
      user,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateProfileController(req, res, next) {
  try {
    const userId = req.user._id;

    const { username, bio } = req.body;

    const updateData = {};

    // update username if provided
    if (username) {
      updateData.username = username;
    }

    // update bio if provided
    if (bio) {
      updateData.bio = bio;
    }

    // update profile image if uploaded
    if (req.file) {
      const uploaded = await uploadFile({
        buffer: req.file.buffer,
        fileName: "profile",
        folder: "/perplexity/userProfile",
      });

      updateData.profile = uploaded.url;
    }

    const updatedUser = await userModel.findByIdAndUpdate(userId, updateData, {
      new: true,
    });

    res.status(200).json({
      success: true,
      message: "Profile updated successfully ✅",
      user: {
        id: updatedUser._id,
        username: updatedUser.username,
        bio: updatedUser.bio,
        profile: updatedUser.profile,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function logoutController(req, res, next) {
  const { token } = req.cookies;

  res.clearCookie("token");

  await redis.set(token, Date.now().toString());

  res.status(200).json({
    success: true,
    message: "Logged out successfully ✅",
  });
}

export async function verifyEmailController(req, res, next) {
  try {
    const { token } = req.query;

    // ❌ token missing
    if (!token) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?invalid=true`);
    }

    let decoded;

    try {
      // 🔐 verify token
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      // ❌ expired or invalid token
      return res.redirect(`${process.env.FRONTEND_URL}/login?expired=true`);
    }

    const user = await userModel.findOne({ email: decoded.email });

    // ❌ user not found
    if (!user) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?invalid=true`);
    }

    // 👉 already verified
    if (user.verified) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?verified=true`);
    }

    // ✅ verify user
    user.verified = true;
    await user.save();

    return res.redirect(`${process.env.FRONTEND_URL}/login?verified=true`);
  } catch (error) {
    next(error);
  }
}

export async function resendVerificationEmail(req, res) {
  try {
    const { email } = req.body;

    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.verified) {
      return res.status(400).json({ message: "Already verified" });
    }

    // 👇 new token (10 min expiry)
    const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, {
      expiresIn: "10m",
    });

    const verifyURL = `${process.env.BASE_URL}/api/auth/verify-email?token=${token}`;

    // 👇 send email
    await sendEmail({
      to: email,
      subject: "Verify your email",
      html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,Helvetica,sans-serif;">

  <div style="width:100%;padding:40px 0;">
    
    <div style="max-width:600px;margin:auto;background:#ffffff;border-radius:10px;
                padding:40px;text-align:center;box-shadow:0 4px 12px rgba(0,0,0,0.08);">

      <h2 style="color:#4f8cff;margin-bottom:10px;">
        Welcome to Perplexity 🤖
      </h2>

      <p style="color:#555;font-size:15px;line-height:1.6;">
        Your account has been created successfully.
      </p>

      <p style="color:#555;font-size:15px;line-height:1.6;">
        Please verify your email address to activate your account.
      </p>

      <a href="${verifyURL}" 
         style="
           display:inline-block;
           margin-top:25px;
           padding:14px 28px;
           background:#4f8cff;
           color:#ffffff;
           text-decoration:none;
           border-radius:6px;
           font-weight:bold;
           font-size:15px;
         ">
         Verify Email
      </a>

      <p style="margin-top:30px;color:#888;font-size:13px;">
        If you didn’t create this account, you can safely ignore this email.
      </p>

      <hr style="margin:30px 0;border:none;border-top:1px solid #eee;">

      <p style="font-size:12px;color:#999;">
        © 2026 Perplexity. All rights reserved.
      </p>

    </div>

  </div>

</body>
</html>
      `,
    });

    res.json({ success: true, message: "Email resent successfully 📩" });
  } catch (error) {
    res.status(500).json({ message: "Error resending email" });
  }
}
