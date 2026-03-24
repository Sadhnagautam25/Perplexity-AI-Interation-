import dotenv from "dotenv";
dotenv.config();
import nodemailer from "nodemailer";

const transpoter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    type: "OAuth2",
    user: process.env.GOOGLE_USER,
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
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
    const mailOption = {
      from: process.env.GOOGLE_USER,
      to,
      subject,
      html,
      text,
    };

    const details = await transpoter.sendMail(mailOption);
    console.log("✅ Email sent:", details.response);

    return true; // ✅ success
  } catch (error) {
    console.log("❌ Email error:", error.message);
    return false; // ❌ fail
  }
}
