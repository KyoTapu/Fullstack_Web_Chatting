import { useState, useCallback, useRef } from "react";
import {
  getFriendsApi,
  getSuggestionsApi,
  getPendingRequestsApi,
  getBlockedUsersApi,
  acceptFriendRequestApi,
  removeFriendshipApi,
  sendFriendRequestApi,
  blockUserApi,
  unblockUserApi,
} from "../api/friends.api";

const DEFAULT_PAGINATION = {
  total: 0,
  page: 1,
  limit: 20,
  totalPages: 1,
  hasNextPage: false,
  hasPrevPage: false,
};

const normalizePagination = (pagination, fallbackLength = 0, fallbackLimit = 20) => {
  if (!pagination || typeof pagination !== "object") {
    const total = fallbackLength;
    const limit = Math.max(1, Number.parseInt(fallbackLimit, 10) || 20);
    return {
      total,
      page: 1,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      hasNextPage: false,
      hasPrevPage: false,
    };
  }

  const total = Number.parseInt(pagination.total, 10) || 0;
  const page = Math.max(1, Number.parseInt(pagination.page, 10) || 1);
  const limit = Math.max(1, Number.parseInt(pagination.limit, 10) || 20);
  const totalPages = Math.max(1, Number.parseInt(pagination.totalPages, 10) || Math.ceil(total / limit));

  return {
    total,
    page,
    limit,
    totalPages,
    hasNextPage: Boolean(pagination.hasNextPage ?? page < totalPages),
    hasPrevPage: Boolean(pagination.hasPrevPage ?? page > 1),
  };
};

const parseArrayPayload = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  return [];
};

const parsePaginationPayload = (response) => {
  if (response?.pagination) return response.pagination;
  if (response?.data?.pagination) return response.data.pagination;
  return null;
};

const normalizeFriend = (friend) => ({
  ...friend,
  presence: friend?.presence || "offline",
  statusLabel: friend?.statusLabel || "offline",
});

export const useFriends = () => {
  const [friends, setFriends] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [friendsPagination, setFriendsPagination] = useState(DEFAULT_PAGINATION);
  const [pendingPagination, setPendingPagination] = useState(DEFAULT_PAGINATION);
  const [blockedPagination, setBlockedPagination] = useState(DEFAULT_PAGINATION);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const friendsQueryRef = useRef({ paginated: false, page: 1, limit: 20 });
  const pendingQueryRef = useRef({ paginated: false, page: 1, limit: 20 });
  const blockedQueryRef = useRef({ paginated: false, page: 1, limit: 20 });

  const fetchFriends = useCallback(async (options = {}) => {
    const nextOptions = {
      ...friendsQueryRef.current,
      ...options,
    };
    friendsQueryRef.current = nextOptions;

    try {
      setLoading(true);
      setError(null);

      const res = await getFriendsApi(nextOptions);
      const rawFriends = parseArrayPayload(res);
      const mapped = rawFriends.map(normalizeFriend);

      setFriends(mapped);
      setFriendsPagination(normalizePagination(parsePaginationPayload(res), mapped.length, nextOptions.limit));

      return {
        data: mapped,
        pagination: normalizePagination(parsePaginationPayload(res), mapped.length, nextOptions.limit),
      };
    } catch (err) {
      console.error(err);
      setError(err.message);
      setFriends([]);
      setFriendsPagination(DEFAULT_PAGINATION);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSuggestions = useCallback(async (options = {}) => {
    try {
      setLoading(true);
      setError(null);
      const res = await getSuggestionsApi(options);
      const rawSuggestions = parseArrayPayload(res);
      const mapped = rawSuggestions.map(normalizeFriend);
      setSuggestions(mapped);
      return { data: mapped };
    } catch (err) {
      console.error(err);
      setError(err.message);
      setSuggestions([]);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPendingRequests = useCallback(async (options = {}) => {
    const nextOptions = {
      ...pendingQueryRef.current,
      ...options,
    };
    pendingQueryRef.current = nextOptions;

    try {
      setLoading(true);
      setError(null);

      const res = await getPendingRequestsApi(nextOptions);
      const rawRequests = parseArrayPayload(res);

      setPendingRequests(rawRequests);
      setPendingPagination(normalizePagination(parsePaginationPayload(res), rawRequests.length, nextOptions.limit));

      return {
        data: rawRequests,
        pagination: normalizePagination(parsePaginationPayload(res), rawRequests.length, nextOptions.limit),
      };
    } catch (err) {
      console.error(err);
      setError(err.message);
      setPendingRequests([]);
      setPendingPagination(DEFAULT_PAGINATION);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const acceptRequest = async (friendshipId) => {
    try {
      await acceptFriendRequestApi(friendshipId);
      await Promise.all([
        fetchFriends(friendsQueryRef.current),
        fetchPendingRequests(pendingQueryRef.current),
      ]);
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const declineRequest = async (friendshipId) => {
    try {
      await removeFriendshipApi(friendshipId);
      await fetchPendingRequests(pendingQueryRef.current);
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const sendRequest = async (receiverId) => {
    try {
      await sendFriendRequestApi(receiverId);
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const fetchBlockedUsers = useCallback(async (options = {}) => {
    const nextOptions = {
      ...blockedQueryRef.current,
      ...options,
    };
    blockedQueryRef.current = nextOptions;

    try {
      setLoading(true);
      setError(null);

      const res = await getBlockedUsersApi(nextOptions);
      const rawBlockedUsers = parseArrayPayload(res);

      setBlockedUsers(rawBlockedUsers);
      setBlockedPagination(normalizePagination(parsePaginationPayload(res), rawBlockedUsers.length, nextOptions.limit));

      return {
        data: rawBlockedUsers,
        pagination: normalizePagination(parsePaginationPayload(res), rawBlockedUsers.length, nextOptions.limit),
      };
    } catch (err) {
      console.error(err);
      setError(err.message);
      setBlockedUsers([]);
      setBlockedPagination(DEFAULT_PAGINATION);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const blockUser = async (userId) => {
    try {
      const res = await blockUserApi(userId);
      await Promise.all([
        fetchFriends(friendsQueryRef.current).catch(() => {}),
        fetchBlockedUsers(blockedQueryRef.current).catch(() => {}),
        fetchPendingRequests(pendingQueryRef.current).catch(() => {}),
      ]);
      return res?.data || res;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const unblockUser = async (userId) => {
    try {
      await unblockUserApi(userId);
      await fetchBlockedUsers(blockedQueryRef.current);
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  return {
    friends,
    pendingRequests,
    blockedUsers,
    friendsPagination,
    pendingPagination,
    blockedPagination,
    loading,
    error,
    fetchFriends,
    fetchPendingRequests,
    fetchBlockedUsers,
    acceptRequest,
    declineRequest,
    sendRequest,
    blockUser,
    unblockUser,
    suggestions,
    fetchSuggestions,
  };
};
