import express from "express";
import { protect } from "../../middleware/auth.js";
import {
  getMyGroups,
  getGroupDetails,
  createGroupHandler,
  addMembersHandler,
  deleteGroupHandler,
  renameGroupHandler,
  leaveGroupHandler,
} from "./controller.js";

const router = express.Router();

router.use(protect);

router.get("/", getMyGroups);
router.post("/", createGroupHandler);
router.get("/:id", getGroupDetails);
router.patch("/:id", renameGroupHandler);
router.delete("/:id", deleteGroupHandler);
router.post("/:id/leave", leaveGroupHandler);
router.post("/:id/members", addMembersHandler);

export default router;
