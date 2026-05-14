import bcrypt from "bcrypt";
import userRepository from "./repository.js";

class UserService {
  /**
   * Register new user
   */
  async register(data) {
    const { username, email, password } = data;

    if (!username || !email || !password) {
      throw new Error("Missing required fields");
    }

    // Check existing email
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error("Email already exists");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const createdUser = await userRepository.create({
      username,
      email,
      password_hash: hashedPassword,
    });

    return this._sanitizeUser(createdUser);
  }

  /**
   * Get all active users (Paginated)
   */
  async getAllUsers({ page = 1, limit = 10 } = {}) {
    const result = await userRepository.getAll({ page, limit });
    // console.log("🚀 ~ UserService ~ getAllUsers ~ result:", result)
    
    return {
      data: result.data.map((u) => this._sanitizeUser(u)),
      pagination: result.pagination,
    };
  }

  /**
   * Get user by ID
   */
  async getUserById(id) {
    if (!id) throw new Error("User ID is required");

    const user = await userRepository.findById(id);

    if (!user) {
      throw new Error("User not found");
    }

    return this._sanitizeUser(user);
  }

  async getUserByName(name, { page = 1, limit = 10 } = {}) {
    if (!name) throw new Error("Username is required");

    const result = await userRepository.findByName(name, { page, limit });
    console.log("🚀 ~ UserService ~ getUserByName ~ result:", result)
    
    return {
      data: result.data.map((u) => this._sanitizeUser(u)),
      pagination:result.pagination
    };
  }
 

  /**
   * Update user profile
   */
  async updateProfile(userId, data) {
    if (!userId) throw new Error("User ID is required");

    const updatedProfile = await userRepository.updateProfile(userId, data);

    if (!updatedProfile) {
      throw new Error("User profile not found");
    }

    // Sau khi update profile, lấy lại user full để return
    return this.getUserById(userId);
  }

  /**
   * Soft delete user
   */
  async deleteUser(id) {
    if (!id) throw new Error("User ID is required");

    const deleted = await userRepository.softDelete(id);

    if (!deleted) {
      throw new Error("User not found");
    }

    return { message: "User deleted successfully" };
  }

  /**
   * Private helper: remove sensitive fields
   */
  _sanitizeUser(user) {
    const { password_hash, user_id, ...safeUser } = user;
    return {
      ...safeUser,
      id: safeUser.id || user_id,
    };
  }
}

export default new UserService();
