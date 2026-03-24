import express from "express";
import { IdentifyUser } from "../middlewares/auth.middleware.js";
import {
  chatDelete,
  chatTitleRename,
  clearAllChats,
  fetchAllChats,
  getChatMessage,
  userMessage,
} from "../controllers/chat.controller.js";
import upload from "../middlewares/upload.middleware.js";

const chatRouter = express.Router();

// user query message krega and AI us message ke accordng reply krega 1️⃣
// api name => /api/chats/message
// api method => POST
// api status => 201

chatRouter.post(
  "/message",
  IdentifyUser,
  upload.single("file"), // 👈 important
  userMessage,
);

// user apni sari chat history fatch krega using userId 2️⃣
// api name => /api/chats
// api method => GET 
// api status => 200

chatRouter.get("/", IdentifyUser, fetchAllChats);

// user apni kisi bhi chat pr click krta h toh us particular chat ke message display hote h 3️⃣
// api name => /api/chats/message/:chatId
// api method => GET
// api status => 200

chatRouter.get("/message/:chatId", IdentifyUser, getChatMessage);

// user delete a particular chat and also chat belong messages 4️⃣
// api name => /api/chats/delete/chat/:chatId
// api method => DELETE
// api status => 200

chatRouter.delete("/delete/chat/:chatId", IdentifyUser, chatDelete);

// user apni chat ka title change kr skta h 5️⃣
// api name => /api/chats/rename/chat/:chatId
// api method => PATCH
// api status => 200

chatRouter.patch("/rename/chat/:chatId", IdentifyUser, chatTitleRename);

// user apni sari chat clear krage 6️⃣
// api name => /api/chats/delete
// api method => DELETE
// api status => 200

chatRouter.delete("/delete", IdentifyUser, clearAllChats);

export default chatRouter;
