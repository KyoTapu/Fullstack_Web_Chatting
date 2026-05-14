import friendService from "./service.js";

class FriendController {
  parsePagination(query) {
    const hasQueryPagination = query.page !== undefined || query.limit !== undefined;
    const keyword = String(query.keyword || query.search || "").trim();
    const paginated =
      String(query.paginated || "").toLowerCase() === "true" || hasQueryPagination || Boolean(keyword);
    const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit, 10) || 20));
    return { paginated, page, limit, keyword };
  }

  async sendRequest(req, res) {
    try {
      const requesterId = req.userId;
      const { receiverId } = req.body;

      if (!receiverId) {
        return res.status(400).json({ message: "receiverId is required" });
      }

      const request = await friendService.sendRequest(requesterId, receiverId);
      res.status(201).json({ message: "Friend request sent", data: request });
    } catch (error) {
      if (
        error.message.includes("You cannot send")
        || error.message.includes("not found")
        || error.message.includes("already")
        || error.message.includes("blocked")
      ) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Internal server error", error: error.message });
    }
  }

  async acceptRequest(req, res) {
    try {
      const userId = req.userId;
      // Note: we're using friendshipId from body based on the plan, or req.params
      const friendshipId = req.body.friendshipId;

      if (!friendshipId) {
        return res.status(400).json({ message: "friendshipId is required" });
      }

      const accepted = await friendService.acceptRequest(userId, friendshipId);
      res.status(200).json({ message: "Friend request accepted", data: accepted });
    } catch (error) {
      if (error.message.includes("not found") || error.message.includes("Unauthorized")) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Internal server error", error: error.message });
    }
  }

  async removeFriendship(req, res) {
    try {
      const userId = req.userId;
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ message: "Friendship ID is required" });
      }

      await friendService.declineOrRemoveFriendship(userId, id);
      res.status(200).json({ message: "Friendship/Request removed successfully" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error: error.message });
    }
  }

  async getFriends(req, res) {
    try {
      const userId = req.userId;
      const { paginated, page, limit, keyword } = this.parsePagination(req.query);
      const friends = await friendService.getFriends(userId, { paginated, page, limit, keyword });

      if (!paginated) {
        return res.status(200).json({ data: friends });
      }

      return res.status(200).json({
        data: friends.data,
        pagination: friends.pagination,
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error: error.message });
    }
  }

  async getPendingRequests(req, res) {
    try {
      const userId = req.userId;
      const { paginated, page, limit } = this.parsePagination(req.query);
      const requests = await friendService.getPendingRequests(userId, { paginated, page, limit });

      if (!paginated) {
        return res.status(200).json({ data: requests });
      }

      return res.status(200).json({
        data: requests.data,
        pagination: requests.pagination,
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error: error.message });
    }
  }

  async getBlockedUsers(req, res) {
    try {
      const userId = req.userId;
      const { paginated, page, limit, keyword } = this.parsePagination(req.query);
      const blockedUsers = await friendService.getBlockedUsers(userId, { paginated, page, limit, keyword });

      if (!paginated) {
        return res.status(200).json({ data: blockedUsers });
      }

      return res.status(200).json({
        data: blockedUsers.data,
        pagination: blockedUsers.pagination,
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error: error.message });
    }
  }

  async blockUser(req, res) {
    try {
      const blockerId = req.userId;
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ message: "User ID is required" });
      }

      const blocked = await friendService.blockUser(blockerId, id);
      res.status(200).json({ message: "User blocked successfully", data: blocked });
    } catch (error) {
      if (
        error.message.includes("required")
        || error.message.includes("not found")
        || error.message.includes("yourself")
        || error.message.includes("blocked")
      ) {
        return res.status(400).json({ message: error.message });
      }

      res.status(500).json({ message: "Internal server error", error: error.message });
    }
  }

  async unblockUser(req, res) {
    try {
      const blockerId = req.userId;
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ message: "User ID is required" });
      }

      await friendService.unblockUser(blockerId, id);
      res.status(200).json({ message: "User unblocked successfully" });
    } catch (error) {
      if (error.message.includes("not found")) {
        return res.status(404).json({ message: error.message });
      }

      res.status(500).json({ message: "Internal server error", error: error.message });
    }
  }

  async getRelationshipStatuses(req, res) {
    try {
      const userId = req.userId;
      const raw = req.query.userIds || "";
      const otherUserIds = String(raw)
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);

      if (otherUserIds.length === 0) {
        return res.status(200).json({ data: [] });
      }

      const data = await friendService.getRelationshipStatuses(userId, otherUserIds);
      res.status(200).json({ data });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error: error.message });
    }
  }

  async getSuggestions(req, res) {
    try {
      const userId = req.userId;
      const limit = req.query.limit;
      const suggestions = await friendService.getSuggestions(userId, { limit });
      res.status(200).json({ data: suggestions });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error: error.message });
    }
  }
}

export default new FriendController();
