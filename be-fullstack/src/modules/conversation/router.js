import express from "express";
import { protect } from "../../middleware/auth.js";
import {
  createDirect,
  createGroup,
  getMyConversations
} from "./controller.js";

const router = express.Router();

router.post("/direct", protect, createDirect);
router.post("/group", protect, createGroup);
router.get("/", protect, getMyConversations);

export default router;