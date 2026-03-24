import { createAgent, tool } from "langchain";
import { model } from "../config/model.js";
import { emailTool } from "../tools/email.tool.js";
import { webSearchTool } from "../tools/web.tool.js";
import { generateImage } from "../tools/image.tool.js";

export const imageToolWrapped = tool(
  async ({ prompt }) => {
    return await generateImage(prompt);
  },
  {
    name: "imageTool",
    description: "Generate image ONLY when user says 'generate image <prompt>'",
    schema: {
      prompt: "string",
    },
  },
);
export const agent = createAgent({
  model,
  tools: [emailTool, webSearchTool, imageToolWrapped],
});
