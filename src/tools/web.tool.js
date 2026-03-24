import dotenv from 'dotenv'
dotenv.config()
import * as z from "zod";
import { tool } from "langchain";
import { tavily } from "@tavily/core";

export const tvly = tavily({
  apiKey: process.env.TAVILY_API_KEY,
});

export const webSearchTool = tool(
  async ({ query }) => {
    const res = await tvly.search({ query, max_results: 5 });

    return res.results
      ?.map((r, i) => `${i + 1}. ${r.title}\n${r.content}`)
      .join("\n\n") || "No results";
  },
  {
    name: "webSearch",
    description: "Search internet",
    schema: z.object({
      query: z.string(),
    }),
  }
);