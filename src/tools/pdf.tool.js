import { summarizePDF } from "../services/pdf.service.js";

export async function pdfTool(filePath) {
  try {
    const summary = await summarizePDF(filePath);
    return summary;
  } catch (error) {
    return "Error summarizing PDF";
  }
}