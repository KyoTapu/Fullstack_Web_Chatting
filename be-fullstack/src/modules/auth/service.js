import bcrypt from "bcryptjs";
import { generateAccessToken, generateRefreshToken } from "../../utils/jwt.js";
import userRepository from "../users/repository.js";

export const loginService = async ({ email, password }) => {
  const user = await userRepository.findByEmail(email);

  if (!user) {
    throw new Error("Invalid credentials");
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);

  if (!isMatch) {
    throw new Error("Invalid credentials");
  }

  const normalizedUserId = user.id || user.user_id;
  const payload = { userId: normalizedUserId };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  return {
    accessToken,
    refreshToken,
    user: {
      id: normalizedUserId,
      username: user.username,
      email: user.email,
      profile: user.profile,
    },
  };
};

export const getMeService = async (userId) => {
  const user = await userRepository.findById(userId);
  console.log("user", user);
  if (!user) {
    throw new Error("User not found");
  }

  return {
    id: user.id || user.user_id,
    username: user.username,
    email: user.email,
    profile: user.profile,
    created_at: user.created_at,
  };
};
