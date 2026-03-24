import dotenv from "dotenv";
dotenv.config();
import SibApiV3Sdk from "@sendinblue/client";

const client = new SibApiV3Sdk.TransactionalEmailsApi();

client.setApiKey(
  SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY,
);

export async function sendEmail({ to, subject, html }) {
  try {
    const emailData = {
      sender: {
        email: process.env.SENDER_EMAIL,
      },
      to: [
        {
          email: to,
        },
      ],
      subject: subject,
      htmlContent: html,
    };

    const response = await client.sendTransacEmail(emailData);
    console.log("✅ Email sent:", response);
    return true;
  } catch (error) {
    console.log("❌ Brevo error:", error);
    return false;
  }
}
