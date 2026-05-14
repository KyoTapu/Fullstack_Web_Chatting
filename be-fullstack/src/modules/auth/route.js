import express from "express";
import { login, refresh, logout,getMe} from "./controller.js";
import {protect} from "../../utils/jwt.js"
const router = express.Router();

router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/me", protect, getMe);
export default router;