import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const STABILITY_CONFIG = {
  // XL 1.0 best quality ke liye hai, aap 'stable-diffusion-v1-6' bhi use kar sakte hain cost kam karne ke liye
  engineId: "stable-diffusion-xl-1024-v1-0",
  apiKey: process.env.STABILITY_API_KEY,
  baseUrl: "https://api.stability.ai/v1/generation",
};

export default async function generateStability(prompt, options = {}) {
  try {
    const response = await axios.post(
      `${STABILITY_CONFIG.baseUrl}/${STABILITY_CONFIG.engineId}/text-to-image`,
      {
        text_prompts: [
          {
            text: prompt,
            weight: 1,
          },
          {
            text: options.negative_prompt || "blurry, bad quality, distorted",
            weight: -1, // Ye negative prompt ki tarah kaam karta hai
          },
        ],
        cfg_scale: options.cfg_scale || 7,
        height: options.height || 1024,
        width: options.width || 1024,
        steps: options.steps || 30,
        samples: 1,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${STABILITY_CONFIG.apiKey}`,
        },
      },
    );

    // Stability AI 'artifacts' array return karta hai
    const artifact = response.data?.artifacts?.[0];

    // Check if generation was filtered (Safety Filter)
    if (artifact?.finishReason === "CONTENT_FILTERED") {
      throw new Error(
        "Potential sensitive content detected. Try a different prompt.",
      );
    }

    const base64 = artifact?.base64;

    if (!base64) {
      throw new Error("No image data found in Stability response.");
    }

    return `data:image/png;base64,${base64}`;
  } catch (error) {
    // Detailed Error Logging
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;

    if (status === 401) {
      console.error("Invalid Stability API Key.");
    } else if (status === 402) {
      console.error("Out of Credits! Please refill your Stability account.");
    }

    throw new Error(`Stability AI Error (${status}): ${message}`);
  }
}
