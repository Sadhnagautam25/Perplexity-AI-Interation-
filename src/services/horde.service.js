import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const HORDE_CONFIG = {
  baseUrl: "https://aihorde.net/api/v2",
  apiKey: process.env.AI_HORDE_API_KEY || "0000000000", // Default '0000000000' for guest
};

export default async function generateHorde(prompt) {
  try {
    // 1. Request Generation
    const response = await axios.post(
      `${HORDE_CONFIG.baseUrl}/generate/async`,
      {
        prompt: prompt,
        params: {
          n: 1,
          steps: 20,
          width: 512,
          height: 512,
          sampler_name: "k_euler_a",
          cfg_scale: 7.5,
        },
        models: ["stable_diffusion"], // Aap specific model choose kar sakte hain
      },
      {
        headers: {
          apikey: HORDE_CONFIG.apiKey,
          "Content-Type": "application/json",
          "Client-Agent": "MyAIApp:1.0:Contact@Email.com", // Horde requires a client-agent
        },
      },
    );

    const { id } = response.data;
    let resultImage = null;

    // 2. Polling Logic (Maximum 20 attempts, 3 seconds apart)
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 3000));

      // Check status and get generations
      const check = await axios.get(
        `${HORDE_CONFIG.baseUrl}/generate/status/${id}`,
      );

      if (check.data.done) {
        // AI Horde status response mein 'generations' array hota hai
        resultImage = check.data.generations?.[0]?.img;
        break;
      }

      console.log(`Waiting... ${check.data.wait_time || 0}s remaining`);
    }

    if (!resultImage) {
      throw new Error("Generation timed out or failed on AI Horde");
    }

    return resultImage; // Ye direct image URL ya Base64 string return karega
  } catch (error) {
    console.error("Horde API Error:", error.response?.data || error.message);
    throw new Error("Failed to generate image via AI Horde");
  }
}
