import express from "express";
import friendController from "./controller.js";
import { protect } from "../../utils/jwt.js";

const router = express.Router();

router.post("/request", protect, friendController.sendRequest.bind(friendController));
router.put("/accept", protect, friendController.acceptRequest.bind(friendController));
router.delete("/remove/:id", protect, friendController.removeFriendship.bind(friendController));
router.get("/blocked", protect, friendController.getBlockedUsers.bind(friendController));
router.post("/block/:id", protect, friendController.blockUser.bind(friendController));
router.delete("/block/:id", protect, friendController.unblockUser.bind(friendController));
router.get("/", protect, friendController.getFriends.bind(friendController));
router.get("/suggestions", protect, friendController.getSuggestions.bind(friendController));
router.get("/pending", protect, friendController.getPendingRequests.bind(friendController));
router.get("/relationships", protect, friendController.getRelationshipStatuses.bind(friendController));

export default router;
