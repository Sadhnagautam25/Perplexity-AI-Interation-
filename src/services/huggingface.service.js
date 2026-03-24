import * as HF from "@huggingface/inference";
import dotenv from "dotenv";
dotenv.config();

// Initialize SDK
const hf = new HF.HfInference(process.env.HF_API_KEY);

export default async function generateHF(prompt) {
  try {
    console.log("🎨 HF SDK: Requesting Black Forest Labs (Flux)...");

    // Flux ya SDXL models aaj kal zyada stable hain providers ke liye
    const response = await hf.textToImage({
      model: "black-forest-labs/FLUX.1-schnell", // Best available free model
      inputs: prompt,
      parameters: {
        num_inference_steps: 4, // Schnell model fast hai
      },
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    return `data:image/png;base64,${buffer.toString("base64")}`;
  } catch (error) {
    // Agar Flux busy hai toh fallback to Standard SDXL
    try {
      console.log("🔄 Flux busy, trying SDXL...");
      const response = await hf.textToImage({
        model: "stabilityai/stable-diffusion-xl-base-1.0",
        inputs: prompt,
      });
      const buffer = Buffer.from(await response.arrayBuffer());
      return `data:image/png;base64,${buffer.toString("base64")}`;
    } catch (innerError) {
      console.error("❌ All HF Models Failed:", innerError.message);
      throw innerError; // Phir Stability AI (Main Fallback) chalega
    }
  }
}
