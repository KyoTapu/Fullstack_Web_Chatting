import {http} from "./http";


const buildQuery = (params = {}) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    query.set(key, String(value));
  });

  return query.toString();
};

export const getMyConversationsApi = (params = {}) => {
  const query = buildQuery(params);
  return http(`/conversations${query ? `?${query}` : ""}`);
};
