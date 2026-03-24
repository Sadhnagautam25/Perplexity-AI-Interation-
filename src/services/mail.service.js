import dotenv from "dotenv";

dotenv.config();
import { emailApi } from "./brevo";

export async function sendEmail({ to, subject, html }) {
  try {
    const response = await emailApi.sendTransacEmail({
      sender: {
        email: process.env.SENDER_EMAIL,
        name: "Perplexity",
      },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    });

    console.log("✅ Email sent:", response);
    return true;
  } catch (error) {
    console.log("❌ Brevo error:", error.response?.body || error);
    return false;
  }
}
