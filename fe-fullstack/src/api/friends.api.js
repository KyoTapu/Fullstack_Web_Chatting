import { http } from "./http";

const buildQuery = (params = {}) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    query.set(key, String(value));
  });

  return query.toString();
};

export const getFriendsApi = (params = {}) => {
  const query = buildQuery(params);
  return http(`/friends${query ? `?${query}` : ""}`);
};

export const getSuggestionsApi = (params = {}) => {
  const query = buildQuery(params);
  return http(`/friends/suggestions${query ? `?${query}` : ""}`);
};

export const getPendingRequestsApi = (params = {}) => {
  const query = buildQuery(params);
  return http(`/friends/pending${query ? `?${query}` : ""}`);
};

export const getBlockedUsersApi = (params = {}) => {
  const query = buildQuery(params);
  return http(`/friends/blocked${query ? `?${query}` : ""}`);
};

export const getRelationshipStatusesApi = (userIds = []) => {
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return Promise.resolve({ data: [] });
  }

  const query = new URLSearchParams({ userIds: userIds.join(",") }).toString();
  return http(`/friends/relationships?${query}`);
};

export const sendFriendRequestApi = (receiverId) => {
  return http("/friends/request", {
    method: "POST",
    body: JSON.stringify({ receiverId }),
  });
};

export const acceptFriendRequestApi = (friendshipId) => {
  return http("/friends/accept", {
    method: "PUT",
    body: JSON.stringify({ friendshipId }),
  });
};

export const removeFriendshipApi = (friendshipId) => {
  return http(`/friends/remove/${friendshipId}`, {
    method: "DELETE",
  });
};

export const blockUserApi = (userId) => {
  return http(`/friends/block/${userId}`, {
    method: "POST",
  });
};

export const unblockUserApi = (userId) => {
  return http(`/friends/block/${userId}`, {
    method: "DELETE",
  });
};
