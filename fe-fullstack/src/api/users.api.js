import { http } from "./http";

export const getUsersApi = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return http(`/users?${query}`);
};

export const searchUsersApi = (params = {}) => {
  const { keyword, page = 1, limit = 10 } = params;
  if (!keyword) return getUsersApi({ page, limit });
  const query = new URLSearchParams({ keyword, page, limit }).toString();
  return http(`/users/search?${query}`);
};

export const getUserByIdApi = (id) => {
  return http(`/users/${id}`);
};

export const updateUserProfileApi = (data) => {
  return http("/users/profile", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
};
