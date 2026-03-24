import chatModel from "../models/chat.model.js";
import messageModel from "../models/message.model.js";
import { agent } from "../agent/agent.js";
import { model } from "../config/model.js";
import { tvly } from "../tools/web.tool.js";
import { generateImage } from "../tools/image.tool.js";
import uploadFile from "../services/storage.service.js";
import { pdfToolService } from "../services/pdf.service.js";
import { sendEmail } from "../services/mail.service.js";

const hasKeyword = (text, keywords) => keywords.some((k) => text.includes(k));

// user query message krega and AI us message ke accordng reply krega 1️⃣

export async function userMessage(req, res, next) {
  try {
    const { message, chatId } = req.body;
    const file = req.file;
    const userId = req.user.id;

    if (!message && !file) {
      return res
        .status(400)
        .json({ success: false, message: "Required fields missing" });
    }

    let currentChatId = chatId;
    let isNewChat = false;

    // 1. SESSION MANAGEMENT
    if (!chatId || chatId === "null" || chatId === "undefined") {
      const newChat = await chatModel.create({
        userId,
        title: message ? message.slice(0, 20) + "..." : "New Chat",
      });
      currentChatId = newChat._id;
      isNewChat = true;
    }

    // 2. SAVE USER MESSAGE
    if (message) {
      await messageModel.create({
        chatId: currentChatId,
        content: message,
        role: "user",
      });
    }

    // 3. 🧠 SMART HISTORY (Limit 6)
    const rawHistory = await messageModel
      .find({ chatId: currentChatId })
      .sort({ createdAt: -1 })
      .limit(6);

    const filteredHistory = rawHistory.reverse().filter((msg) => {
      const content = msg.content.toLowerCase();
      return (
        !content.startsWith("data:image") &&
        !content.includes("✅ email sent") &&
        !content.includes("📄 **pdf summary") &&
        msg.content.length < 600
      );
    });

    const formattedMessages = [
      {
        role: "system",
        content:
          "You are a helpful AI. If the user asks for news, provide text only. For emails, generate a professional Subject and HTML Body.",
      },
      ...filteredHistory.map((msg) => ({
        role: msg.role === "ai" ? "assistant" : "user",
        content: msg.content,
      })),
    ];

    // 4. INTENT DETECTION
    const currentInput = message?.toLowerCase() || "";

    // Strict Image Detection: Sirf tabhi jab user 'create' ya 'generate' bole
    const isImageRequest =
      /\b(generate|create|draw|make|imagine)\b.*\b(image|photo|picture|art|drawing)\b/i.test(
        currentInput,
      );

    const isEmailRequest =
      (currentInput.includes("email") &&
        (currentInput.includes("send") || currentInput.includes("draft"))) ||
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/.test(currentInput);

    const isSummaryRequest =
      /\b(summarize|summary|explain|points|shorten|main idea)\b/i.test(
        currentInput,
      ) &&
      (currentInput.includes("pdf") ||
        currentInput.includes("document") ||
        currentInput.includes("this"));

    const isWebQuery =
      /\b(latest|news|today|weather|price|current status)\b/i.test(
        currentInput,
      );

    let aiReply = "";

    // 5. EXECUTION BRANCHES (Updated Priority)

    // --- BRANCH A: EMAIL (Highest Priority if Email exists) ---
    if (isEmailRequest) {
      const emailTo = currentInput.match(
        /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/,
      )?.[0];

      if (emailTo) {
        const response = await model.invoke([
          {
            role: "system",
            content:
              "Draft a professional email based on user intent. Format exactly like this -> Subject: <text> HTML Body: <html>",
          },
          ...formattedMessages,
        ]);

        const subject =
          response.content.match(/Subject:\s*(.*)/i)?.[1] || "Notification";
        const htmlContent =
          response.content.match(/HTML Body:\s*([\s\S]*)/i)?.[1] ||
          response.content;

        const isSent = await sendEmail({
          to: emailTo,
          subject: subject,
          html: htmlContent,
        });
        aiReply = isSent
          ? `✅ Email sent to ${emailTo}`
          : "❌ Email failed to send.";
      } else {
        aiReply =
          "Please provide a valid email address so I can send the email! 📧";
      }
    }

    // --- BRANCH B: PDF / SUMMARY ---
    else if (file || isSummaryRequest) {
      if (file && file.mimetype === "application/pdf") {
        const rawPdfText = await pdfToolService(file.buffer);
        const summaryResponse = await model.invoke([
          { role: "system", content: "Summarize the text in 5 clear points." },
          { role: "user", content: `Text: ${rawPdfText.slice(0, 3000)}` },
        ]);
        aiReply = `📄 **PDF Summary:**\n\n${summaryResponse.content}`;
      } else if (isSummaryRequest && !file) {
        aiReply = "Please upload a PDF first so I can summarize it for you! 😊";
      } else if (file) {
        const uploadedFile = await uploadFile({
          buffer: file.buffer,
          fileName: file.originalname,
        });
        aiReply = uploadedFile.url;
      }
    }

    // --- BRANCH C: IMAGE (Lower priority than specific tasks) ---
    else if (isImageRequest) {
      let imagePrompt = currentInput
        .replace(
          /\b(generate|create|draw|make|imagine|image|photo|picture|a|an|the|of|show|me|send)\b/gi,
          "",
        )
        .trim();

      if (!imagePrompt || imagePrompt.length < 3) {
        aiReply = "🎨 I'd love to create an image! What should I draw?";
      } else {
        try {
          aiReply = await generateImage(imagePrompt);
        } catch (err) {
          aiReply = "⚠️ Image service is busy.";
        }
      }
    }

    // --- BRANCH D: WEB SEARCH ---
    else if (isWebQuery) {
      try {
        const search = await tvly.search(message);
        const context = search.results
          .slice(0, 1)
          .map((r) => r.content)
          .join("\n\n");
        const resp = await model.invoke([
          { role: "system", content: `Context: ${context}` },
          ...formattedMessages,
        ]);
        aiReply = resp.content;
      } catch (err) {
        const response = await agent.invoke({ messages: formattedMessages });
        aiReply = response.messages.at(-1)?.content;
      }
    }

    // --- BRANCH E: NORMAL CHAT ---
    else {
      const response = await agent.invoke({ messages: formattedMessages });
      aiReply = response.messages.at(-1)?.content || "I'm here to help!";
    }

    // 6. SAVE AI RESPONSE
    if (aiReply) {
      await messageModel.create({
        chatId: currentChatId,
        content: aiReply,
        role: "ai",
      });
    }

    return res.status(201).json({
      success: true,
      reply: aiReply,
      chatId: currentChatId,
      isNewChat: isNewChat,
    });
  } catch (error) {
    console.error("Controller Error:", error.message);
    res
      .status(200)
      .json({ success: true, reply: "⚠️ Connection busy. Please try again." });
  }
}

// user apni sari chat history fatch krega using userId 2️⃣

export async function fetchAllChats(req, res, next) {
  try {
    // 1. Get user from auth middleware
    const userId = req.user?.id;

    // 2. Validate user
    if (!userId) {
      const error = new Error("Unauthorized: User not found");
      error.statusCode = 401;
      throw error;
    }

    // 3. Fetch chats
    const chats = await chatModel
      .find({ userId })
      .sort({ createdAt: -1 }) // latest first
      .lean();

    // 4. If no chats found
    if (!chats || chats.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No chats available",
        chats: [],
      });
    }

    // 5. Success response
    return res.status(200).json({
      success: true,
      message: "Chats fetched successfully",
      count: chats.length,
      chats,
    });
  } catch (error) {
    console.error("History Error", error);
    return next(error);
  }
}

// user apni kisi bhi chat pr click krta h toh us particular chat ke message display hote h 3️⃣

export async function getChatMessage(req, res, next) {
  try {
    // 1. Get user from auth middleware
    const userId = req.user?.id;

    if (!userId) {
      const error = new Error("Unauthorized: User not found");
      error.statusCode = 401;
      throw error;
    }

    // 2. Get chatId from params
    const { chatId } = req.params;

    if (!chatId) {
      const error = new Error("Chat ID is required");
      error.statusCode = 400;
      throw error;
    }

    // 3. Validate chat belongs to user (important 🔥)
    const chat = await chatModel.findOne({ _id: chatId, userId });

    if (!chat) {
      const error = new Error("Chat not found or access denied");
      error.statusCode = 404;
      throw error;
    }

    // 4. Fetch messages
    const messages = await messageModel
      .find({ chatId })
      .sort({ createdAt: 1 }) // oldest first
      .lean();

    // 5. If no messages
    if (!messages || messages.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No messages found",
        data: {
          chatId,
          messages: [],
        },
      });
    }

    // 6. Success response (no count, better structure)
    return res.status(200).json({
      success: true,
      message: "Messages fetched successfully",
      data: {
        chatId,
        messages,
      },
    });
  } catch (error) {
    return next(error); // global error middleware
  }
}

// user delete a particular chat and also chat belong messages 4️⃣

export async function chatDelete(req, res, next) {
  try {
    // 1. Get user from auth middleware
    const userId = req.user?.id;

    if (!userId) {
      const error = new Error("Unauthorized: User not found");
      error.statusCode = 401;
      throw error;
    }

    // 2. Get chatId
    const { chatId } = req.params;

    if (!chatId) {
      const error = new Error("Chat ID is required");
      error.statusCode = 400;
      throw error;
    }

    // 3. Check chat belongs to this user 🔥
    const chat = await chatModel.findOne({ _id: chatId, userId });

    if (!chat) {
      const error = new Error("Chat not found or access denied");
      error.statusCode = 404;
      throw error;
    }

    // 4. Delete messages first (child data)
    await messageModel.deleteMany({ chatId });

    // 5. Delete chat
    await chatModel.findByIdAndDelete(chatId);

    // 6. Success response
    return res.status(200).json({
      success: true,
      message: "Chat deleted successfully",
    });
  } catch (error) {
    return next(error); // global error middleware
  }
}

// user apni chat ka title change kr skta h 5️⃣
export async function chatTitleRename(req, res, next) {
  try {
    // 1. Get user from auth middleware
    const userId = req.user?.id;

    if (!userId) {
      const error = new Error("Unauthorized: User not found");
      error.statusCode = 401;
      throw error;
    }

    // 2. Get data
    const { chatId } = req.params;
    const { title } = req.body;

    // 3. Validate inputs
    if (!chatId) {
      const error = new Error("Chat ID is required");
      error.statusCode = 400;
      throw error;
    }

    if (!title || title.trim() === "") {
      const error = new Error("Title is required");
      error.statusCode = 400;
      throw error;
    }

    // 4. Check ownership 🔥
    const chat = await chatModel.findOne({ _id: chatId, userId });

    if (!chat) {
      const error = new Error("Chat not found or access denied");
      error.statusCode = 404;
      throw error;
    }

    // 5. Update title
    chat.title = title.trim();
    await chat.save();

    // 6. Success response
    return res.status(200).json({
      success: true,
      message: "Chat title updated successfully",
      data: {
        chat,
      },
    });
  } catch (error) {
    return next(error); // global error middleware
  }
}

// user apni sari chat clear krage 6️⃣

export async function clearAllChats(req, res, next) {
  try {
    // 1. Get user from auth middleware
    const userId = req.user?.id;

    if (!userId) {
      const error = new Error("Unauthorized: User not found");
      error.statusCode = 401;
      throw error;
    }

    // 2. Find all chats of this user
    const chats = await chatModel.find({ userId }).select("_id").lean();

    // 3. If no chats found
    if (!chats || chats.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No chats to delete",
      });
    }

    // 4. Extract chat IDs
    const chatIds = chats.map((chat) => chat._id);

    // 5. Delete all related messages
    await messageModel.deleteMany({
      chatId: { $in: chatIds },
    });

    // 6. Delete all chats
    await chatModel.deleteMany({ userId });

    // 7. Success response
    return res.status(200).json({
      success: true,
      message: "All chats deleted successfully",
    });
  } catch (error) {
    return next(error); // global error middleware
  }
}
