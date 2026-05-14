import express from "express";
import { protect } from "../../middleware/auth.js";
import { uploadChatFile } from "../../middleware/upload.js";
import {
  sendDirectMessage,
  sendGroupMessage,
  sendDirectFile,
  sendGroupFile,
  getMessages,
  editMessage,
  recallMessage,
  getMessageDetails,
  toggleMessageReaction,
} from "./controller.js";

const router = express.Router();

router.post("/direct", protect, sendDirectMessage);
router.post("/group", protect, sendGroupMessage);
router.post("/direct/file", protect, uploadChatFile, sendDirectFile);
router.post("/group/file", protect, uploadChatFile, sendGroupFile);
router.get("/item/:messageId", protect, getMessageDetails);
router.patch("/:messageId", protect, editMessage);
router.post("/:messageId/recall", protect, recallMessage);
router.post("/:messageId/reactions", protect, toggleMessageReaction);
router.get("/:conversationId", protect, getMessages);

export default router;
