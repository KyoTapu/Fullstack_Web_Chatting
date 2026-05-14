import { http } from "./http";

const buildQuery = (params = {}) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    query.set(key, String(value));
  });

  return query.toString();
};

export const createGroupApi = (data) =>
  http("/groups", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const getMyGroupsApi = (params = {}) => {
  const query = buildQuery(params);
  return http(`/groups${query ? `?${query}` : ""}`, {
    method: "GET",
  });
};

export const getGroupDetailsApi = (id) =>
  http(`/groups/${id}`, {
    method: "GET",
  });

export const addGroupMembersApi = (id, members) =>
  http(`/groups/${id}/members`, {
    method: "POST",
    body: JSON.stringify({ members }),
  });

export const renameGroupApi = (id, name) =>
  http(`/groups/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ name }),
  });

export const deleteGroupApi = (id) =>
  http(`/groups/${id}`, {
    method: "DELETE",
  });

export const leaveGroupApi = (id) =>
  http(`/groups/${id}/leave`, {
    method: "POST",
  });
