import dotenv from "dotenv";
dotenv.config();
import nodemailer from "nodemailer";

const transpoter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    type: "OAuth2",
    user: process.env.GOOGLE_USER,
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

transpoter.verify((error, success) => {
  if (error) {
    console.log("SMTP ERROR FULL:", error);
  } else {
    console.log("SMTP WORKING");
  }
});

export async function sendEmail({ to, subject, html, text }) {
  try {
    console.log("👉 sendEmail called for:", to);
    const mailOption = {
      from: process.env.GOOGLE_USER,
      to,
      subject,
      html,
      text,
    };

    const details = await transpoter.sendMail(mailOption);

    console.log("👉 Nodemailer response:", details.response);
    return true; // ✅ success
  } catch (error) {
    console.log("❌ FULL EMAIL ERROR:", error);
    return false; // ❌ fail
  }
}
