import userService from "./service.js";

class UserController {
  /**
   * POST /users
   */
  async register(req, res, next) {
    try {
      const result = await userService.register(req.body);

      return res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /users
   */
  async getAll(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 8;

      const result = await userService.getAllUsers({ page, limit });

      return res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /users/:id
   */
  async getById(req, res, next) {
    try {
      const user = await userService.getUserById(req.params.id);

      return res.status(200).json({
        success: true,
        data: [user],
      });
    } catch (error) {
      next(error);
    }
  }
  async getByName(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const keyword = req.query.keyword || req.query.name;

      const result = await userService.getUserByName(keyword, {
        page,
        limit,
      });

      return res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
  }
  /**
   * PATCH /users/profile
   */
  async updateProfile(req, res, next) {
    try {
      const result = await userService.updateProfile(req.userId, req.body);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /users/:id
   */
  async delete(req, res, next) {
    try {
      const result = await userService.deleteUser(req.params.id);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new UserController();
