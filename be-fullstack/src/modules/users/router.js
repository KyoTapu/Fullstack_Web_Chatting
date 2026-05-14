import express from "express";
import userController from "./controller.js";
import { protect } from "../../utils/jwt.js";

const router = express.Router();

router.patch("/profile", protect, userController.updateProfile.bind(userController));
router.post("/register", userController.register.bind(userController));
router.get("/", userController.getAll.bind(userController));
router.get("/search", userController.getByName.bind(userController));
router.get("/:id", userController.getById.bind(userController));
router.delete("/:id", userController.delete.bind(userController));

export default router;
