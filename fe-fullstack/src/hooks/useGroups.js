import { useState, useCallback, useRef } from "react";
import {
  getMyGroupsApi,
  getGroupDetailsApi,
  createGroupApi,
  addGroupMembersApi,
  renameGroupApi,
  deleteGroupApi,
  leaveGroupApi,
} from "../api/groups.api";

const DEFAULT_PAGINATION = {
  total: 0,
  page: 1,
  limit: 6,
  totalPages: 1,
  hasNextPage: false,
  hasPrevPage: false,
};

const normalizeGroup = (group) => ({
  ...group,
  _id: group._id || group.id,
  type: group.type || "group",
  members: Array.isArray(group.members) ? group.members : [],
});

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

const normalizePagination = (pagination, fallbackLength = 0, fallbackLimit = 6) => {
  if (!pagination || typeof pagination !== "object") {
    const total = fallbackLength;
    const limit = Math.max(1, Number.parseInt(fallbackLimit, 10) || 6);
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
  const limit = Math.max(1, Number.parseInt(pagination.limit, 10) || 6);
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

export const useGroups = () => {
  const [groups, setGroups] = useState([]);
  const [groupsPagination, setGroupsPagination] = useState(DEFAULT_PAGINATION);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const groupsQueryRef = useRef({ paginated: true, page: 1, limit: DEFAULT_PAGINATION.limit, keyword: "" });

  const loadGroups = useCallback(async (options = {}) => {
    const nextOptions = {
      ...groupsQueryRef.current,
      ...options,
    };
    groupsQueryRef.current = nextOptions;

    setLoading(true);
    setError(null);
    try {
      const res = await getMyGroupsApi(nextOptions);
      const list = parseArrayPayload(res).map(normalizeGroup);
      const pagination = normalizePagination(
        parsePaginationPayload(res),
        list.length,
        nextOptions.limit
      );

      setGroups(list);
      setGroupsPagination(pagination);

      return { data: list, pagination };
    } catch (err) {
      setError(err?.response?.data?.message || err.message);
      setGroups([]);
      setGroupsPagination(DEFAULT_PAGINATION);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadGroupDetails = useCallback(async (id) => {
    try {
      const res = await getGroupDetailsApi(id);
      const rawGroup = res?.data?.data || res?.data || res;
      setSelectedGroup(normalizeGroup(rawGroup));
      return res?.data;
    } catch (err) {
      console.error(err);
      throw err;
    }
  }, []);

  const createGroup = async (name, members) => {
    await createGroupApi({ name, members });
    await loadGroups(groupsQueryRef.current);
  };

  const addMembers = async (groupId, memberIds) => {
    await addGroupMembersApi(groupId, memberIds);
    await loadGroupDetails(groupId);
  };

  const renameGroup = async (groupId, newName) => {
    await renameGroupApi(groupId, newName);
    if (selectedGroup?.id === groupId || selectedGroup?._id === groupId) {
      setSelectedGroup((prev) => (prev ? { ...prev, name: newName } : prev));
    }
    await loadGroups(groupsQueryRef.current);
  };

  const deleteGroup = async (groupId) => {
    await deleteGroupApi(groupId);
    if (selectedGroup?.id === groupId || selectedGroup?._id === groupId) {
      setSelectedGroup(null);
    }
    await loadGroups(groupsQueryRef.current);
  };

  const leaveGroup = async (groupId) => {
    await leaveGroupApi(groupId);
    if (selectedGroup?.id === groupId || selectedGroup?._id === groupId) {
      setSelectedGroup(null);
    }
    await loadGroups(groupsQueryRef.current);
  };

  return {
    groups,
    groupsPagination,
    loading,
    error,
    selectedGroup,
    loadGroups,
    loadGroupDetails,
    createGroup,
    addMembers,
    renameGroup,
    deleteGroup,
    leaveGroup,
    setSelectedGroup,
  };
};
