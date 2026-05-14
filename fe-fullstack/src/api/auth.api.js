import { http } from "./http";

export const loginApi = (payload) =>
  http("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const refreshApi = () =>
  http("/auth/refresh", {
    method: "POST",
  });

export const logoutApi = () =>
  http("/auth/logout", {
    method: "POST",
  });

export const registerApi = (payload) =>
  http("/users/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const getMeApi = (token) => http("/auth/me", {}, token);
