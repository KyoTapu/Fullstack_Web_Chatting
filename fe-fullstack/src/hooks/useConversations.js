import { useCallback, useEffect, useMemo, useState } from "react";
import { getMyConversationsApi } from "../api/conversation.api";

const DEFAULT_PAGINATION = {
  total: 0,
  page: 1,
  limit: 20,
  totalPages: 1,
  hasNextPage: false,
  hasPrevPage: false,
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

const normalizeConversation = (conversation) => {
  const members = Array.isArray(conversation?.members) ? conversation.members : [];
  const friend = conversation?.friend || {};
  const normalizedType = String(conversation?.type || "").toLowerCase() === "dm"
    ? "direct"
    : String(conversation?.type || "").toLowerCase();

  return {
    ...conversation,
    type: normalizedType || conversation?.type,
    _id: conversation?._id || conversation?.id,
    members,
    friend: {
      ...friend,
      display_name: friend?.full_name || friend?.username || "Unknown",
      avatar_url: friend?.avatar_url || "/default-avatar.png",
    },
    last_message_content: conversation?.last_message_content || "No messages",
  };
};

export const useConversations = ({
  initialPage = 1,
  limit = 20,
  paginated = true,
  type = "",
} = {}) => {
  const [conversations, setConversations] = useState([]);
  const [pagination, setPagination] = useState({
    ...DEFAULT_PAGINATION,
    page: initialPage,
    limit,
  });
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadConversations = useCallback(async (options = {}) => {
    const nextPage = Math.max(1, Number.parseInt(options.page, 10) || currentPage || 1);
    const nextLimit = Math.max(1, Number.parseInt(options.limit, 10) || limit || 20);
    const nextPaginated = options.paginated ?? paginated;
    const keyword = String(options.keyword || options.search || "").trim();

    try {
      setLoading(true);
      setError(null);

      const res = await getMyConversationsApi({
        paginated: nextPaginated,
        page: nextPage,
        limit: nextLimit,
        type,
        keyword,
      });

      const raw = parseArrayPayload(res);
      const normalized = raw.map(normalizeConversation);
      const meta = normalizePagination(parsePaginationPayload(res), normalized.length, nextLimit);

      setConversations(normalized);
      setPagination(meta);

      return { data: normalized, pagination: meta };
    } catch (err) {
      console.error("Load conversations error:", err);
      setError(err.message || "Failed to load conversations");
      setConversations([]);
      setPagination({
        ...DEFAULT_PAGINATION,
        page: nextPage,
        limit: nextLimit,
      });
      return { data: [], pagination: DEFAULT_PAGINATION };
    } finally {
      setLoading(false);
    }
  }, [currentPage, limit, paginated, type]);

  useEffect(() => {
    loadConversations({ page: currentPage, limit, paginated, type });
  }, [currentPage, limit, paginated, type, loadConversations]);

  useEffect(() => {
    const handleConversationUpdated = (event) => {
      const detail = event?.detail || {};
      void loadConversations({
        page: currentPage,
        limit,
        paginated,
        type,
        keyword: detail.keyword,
      }).catch(() => {});
    };

    window.addEventListener("chat:conversation-updated", handleConversationUpdated);

    return () => {
      window.removeEventListener("chat:conversation-updated", handleConversationUpdated);
    };
  }, [currentPage, limit, paginated, type, loadConversations]);

  const directs = useMemo(
    () => conversations.filter((conversation) => String(conversation?.type || "").toLowerCase() === "direct"),
    [conversations]
  );

  return {
    conversations,
    directs,
    loading,
    error,
    pagination,
    currentPage,
    setCurrentPage,
    refreshConversations: loadConversations,
  };
};
