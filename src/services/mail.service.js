import dotenv from "dotenv";
dotenv.config();
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({ to, subject, html, text }) {
  try {
    console.log("👉 Resend email called for:", to);

    const { data, error } = await resend.emails.send({
      from: "onboarding@resend.dev", // default testing domain
      to: [to],
      subject: subject,
      html: html,
      text: text,
    });

    if (error) {
      console.log("❌ Resend error:", error);
      return false;
    }

    console.log("✅ Email sent via Resend:", data);
    return true;
  } catch (error) {
    console.log("❌ FULL EMAIL ERROR:", error);
    return false;
  }
}
