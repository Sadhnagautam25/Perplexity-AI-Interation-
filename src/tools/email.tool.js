import * as z from "zod";
import { tool } from "langchain";
import { sendEmail } from "../services/mail.service.js";

export const emailTool = tool(sendEmail, {
  name: "emailTool",
  description: "Send email when user asks",
  schema: z.object({
    to: z.string(),
    subject: z.string(),
    html: z.string(),
  }),
});