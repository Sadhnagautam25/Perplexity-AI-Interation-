import SibApiV3Sdk from "sib-api-v3-sdk";
import dotenv from "dotenv";

dotenv.config();

const client = SibApiV3Sdk.ApiClient.instance;

// ✅ API KEY attach karo here
client.authentications["api-key"].apiKey = process.env.BREVO_API_KEY;

export const emailApi = new SibApiV3Sdk.TransactionalEmailsApi();

console.log("BREVO KEY:", process.env.BREVO_API_KEY);
