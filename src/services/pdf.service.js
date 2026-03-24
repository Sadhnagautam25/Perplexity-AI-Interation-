import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import { model } from "../config/model.js";

export async function pdfToolService(buffer) {
  try {
    // ✅ buffer ko Uint8Array me convert karo
    const dataBuffer = new Uint8Array(buffer);

    const loadingTask = pdfjs.getDocument({
      data: dataBuffer,
      useSystemFonts: true,
      isEvalSupported: false,
    });

    const pdfDocument = await loadingTask.promise;
    let fullText = "";

    const maxPages = Math.min(pdfDocument.numPages, 10);

    for (let i = 1; i <= maxPages; i++) {
      const page = await pdfDocument.getPage(i);
      const textContent = await page.getTextContent();

      const pageText = textContent.items.map((item) => item.str).join(" ");

      fullText += pageText + "\n";
    }

    if (!fullText.trim()) {
      return "❌ PDF Error: No text found (maybe scanned PDF)";
    }

    // 🤖 AI summary
    const response = await model.invoke([
      {
        role: "system",
        content: "Summarize the following PDF text into clean bullet points.",
      },
      {
        role: "user",
        content: fullText.slice(0, 5000),
      },
    ]);

    return response.content;
  } catch (err) {
    console.error("PDF Logic Error:", err.message);
    return `❌ PDF Error: ${err.message}`;
  }
}
