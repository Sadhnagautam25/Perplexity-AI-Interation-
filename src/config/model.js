import dotenv from "dotenv";
dotenv.config();
import { ChatGroq } from "@langchain/groq";

export const model = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: "llama-3.3-70b-versatile",
  temperature: 0.7,
  maxTokens: 1024, // Response ki length control karne ke liye
});
