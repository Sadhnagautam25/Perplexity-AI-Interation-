import generateHF from "../services/huggingface.service.js";
import generateStability from "../services/stability.service.js";
import generateHorde from "../services/horde.service.js";

/**
 * Controller to manage multiple AI image generation services with fallbacks.
 * Strategy: Quality first (Stability) or Free first (HF/Horde)?
 * Current Order: HF -> Stability -> Horde
 */
export async function generateImage(prompt) {
  // Services ko priority order mein ek array mein rakhein
  const services = [
    { name: "Hugging Face", function: generateHF },
    { name: "Stability AI", function: generateStability },
    { name: "AI Horde", function: generateHorde },
  ];

  for (const service of services) {
    try {
      console.log(`🚀 Attempting: ${service.name}...`);

      const result = await service.function(prompt);

      if (result) {
        console.log(`✅ Success with ${service.name}!`);
        return result; // Image milte hi function yahan se return ho jayega
      }
    } catch (error) {
      console.error(`❌ ${service.name} failed:`, error.message);
      // Loop continue karega aur agle service par jayega
      continue;
    }
  }

  // Agar saare options fail ho jayein
  console.error("🚨 All image generation services failed.");
  return null;
}

export default generateImage;
