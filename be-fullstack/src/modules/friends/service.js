import friendRepository from "./repository.js";
import userRepository from "../users/repository.js";
import { redisClient } from "../../../redis/redis.js";

class FriendService {
  // ========================
  // FRIEND REQUEST
  // ========================
  async sendRequest(requesterId, addresseeId) {
    if (requesterId === addresseeId) {
      throw new Error("You cannot send a friend request to yourself");
    }

    const recipient = await userRepository.findById(addresseeId);
    if (!recipient) {
      throw new Error("Recipient not found");
    }

    const blockedRelationship = await friendRepository.findBlockedRelationship(requesterId, addresseeId);

    if (blockedRelationship) {
      if (blockedRelationship.requester_id === requesterId) {
        throw new Error("You have blocked this user");
      }
      throw new Error("This user has blocked you");
    }

    const existing = await friendRepository.getFriendshipStatus(requesterId, addresseeId);

    if (existing) {
      if (existing.status === "PENDING") {
        throw new Error("A friend request is already pending");
      }
      if (existing.status === "ACCEPTED") {
        throw new Error("You are already friends");
      }
      if (existing.status === "BLOCKED") {
        throw new Error("Cannot send request");
      }
    }

    await this.invalidateFriendsCache(requesterId);
    await this.invalidateFriendsCache(addresseeId);

    return friendRepository.sendRequest(requesterId, addresseeId);
  }

  // ========================
  // ACCEPT REQUEST
  // ========================
  async acceptRequest(userId, friendshipId) {
    const request = await friendRepository.findPendingRequest(friendshipId);

    if (!request) {
      throw new Error("Request not found");
    }

    if (request.addressee_id !== userId) {
      throw new Error("Unauthorized");
    }

    await Promise.all([
      this.invalidateFriendsCache(request.requester_id),
      this.invalidateFriendsCache(request.addressee_id),
    ]);

    return friendRepository.acceptRequest(friendshipId);
  }

  // ========================
  // REMOVE / DECLINE
  // ========================
  async declineOrRemoveFriendship(userId, friendshipId) {
    await friendRepository.removeFriendship(friendshipId);
    await this.invalidateFriendsCache(userId);
  }

  // ========================
  // GET FRIENDS (CACHE)
  // ========================
  async getFriends(userId, options = {}) {
    const cacheKey = `friends:${userId}:${JSON.stringify(options)}`;

    try {
      const cached = await redisClient.get(cacheKey);

      if (cached) {
        console.log(`✅ CACHE HIT: ${cacheKey}`);
        return JSON.parse(cached);
      }
    } catch (err) {
      console.warn("⚠️ Redis GET error:", err.message);
    }

    console.log(`❌ CACHE MISS: ${cacheKey}`);

    const friends = await friendRepository.getFriends(userId, options);

    try {
      await redisClient.setEx(cacheKey, 300, JSON.stringify(friends));
    } catch (err) {
      console.warn("⚠️ Redis SET error:", err.message);
    }

    return friends;
  }

  // ========================
  // CACHE INVALIDATION
  // ========================
  async invalidateFriendsCache(userId) {
    try {
      for await (const key of redisClient.scanIterator({
        MATCH: `friends:${userId}:*`,
      })) {
        await redisClient.del(key);
      }

      console.log(`🗑️ Cache cleared for user ${userId}`);
    } catch (err) {
      console.warn("⚠️ Redis DEL error:", err.message);
    }
  }

  // ========================
  // BLOCK / UNBLOCK
  // ========================
  async blockUser(blockerId, blockedUserId) {
    if (!blockedUserId) {
      throw new Error("Blocked user ID is required");
    }

    if (String(blockerId) === String(blockedUserId)) {
      throw new Error("Cannot block yourself");
    }

    const blockedUser = await userRepository.findById(blockedUserId);
    if (!blockedUser) {
      throw new Error("User not found");
    }

    const existing = await friendRepository.findBlockedRelationship(blockerId, blockedUserId);

    if (existing?.requester_id === blockerId) {
      return existing;
    }

    await Promise.all([this.invalidateFriendsCache(blockerId), this.invalidateFriendsCache(blockedUserId)]);

    return friendRepository.blockUser(blockerId, blockedUserId);
  }

  async unblockUser(blockerId, blockedUserId) {
    const unblocked = await friendRepository.unblockUser(blockerId, blockedUserId);

    if (!unblocked) {
      throw new Error("Blocked user not found");
    }

    await Promise.all([this.invalidateFriendsCache(blockerId), this.invalidateFriendsCache(blockedUserId)]);

    return unblocked;
  }

  // ========================
  // OTHER
  // ========================
  async getPendingRequests(userId, options = {}) {
    return friendRepository.getPendingRequestsWithId(userId, options);
  }

  async getBlockedUsers(userId, options = {}) {
    return friendRepository.getBlockedUsers(userId, options);
  }

  async getRelationshipStatuses(userId, otherUserIds = []) {
    return friendRepository.getRelationshipStatuses(userId, otherUserIds);
  }

  async getSuggestions(userId, options = {}) {
    return friendRepository.getSuggestions(userId, options);
  }
}

export default new FriendService();
