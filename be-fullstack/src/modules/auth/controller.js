import { loginService, getMeService } from "./service.js";
import jwt from "jsonwebtoken";
import { generateAccessToken } from "../../utils/jwt.js";
import dotenv from "dotenv";
dotenv.config();
export const login = async (req, res) => {
  try {
    const result = await loginService(req.body);
    const { rememberMe } = req.body;
    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
      maxAge: rememberMe
        ? Number(process.env.JWT_REFRESH_LONG_EXPIRES_IN)
        : Number(process.env.JWT_REFRESH_SHORT_EXPIRES_IN),
    });

    res.json({
      accessToken: result.accessToken,
      user: result.user,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const refresh = (req, res) => {
  const token = req.cookies.refreshToken;

  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_REFRESH_SECRET, (err, decoded) => {
    if (err) return res.sendStatus(403);

    const accessToken = generateAccessToken({ userId: decoded.userId });

    res.json({ accessToken });
  });
};

export const logout = (req, res) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: false,
    sameSite: "strict",
  });

  res.json({ message: "Logged out" });
};

export const getMe = async (req, res) => {
  try {
    const user = await getMeService(req.userId);

    res.json({
      success: true,
      data: user,
    });
  } catch (err) {
    res.status(404).json({
      success: false,
      message: err.message,
    });
  }
};
