let refreshPromise = null;

const API_BASE_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

const setStoredAccessToken = (token) => {
  if (!token) return;
  localStorage.setItem("accessToken", token);
  window.dispatchEvent(new CustomEvent("auth:token_updated", { detail: { accessToken: token } }));
};

const clearStoredAccessToken = () => {
  localStorage.removeItem("accessToken");
  window.dispatchEvent(new Event("auth:logged_out"));
};

const buildHeaders = (optionsHeaders = {}, token, body) => {
  const headers = { ...optionsHeaders };

  // Let browser set multipart boundary automatically for FormData.
  if (!(body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

const refreshAccessToken = async () => {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Refresh token expired");

        const data = await res.json();
        if (!data?.accessToken) throw new Error("No access token returned from refresh endpoint");

        setStoredAccessToken(data.accessToken);
        return data.accessToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

const isAuthErrorResponse = async (res) => {
  if (!res) return false;
  if (res.status === 401) return true;
  if (res.status !== 403) return false;

  // Some endpoints currently return 403 for expired/invalid JWT.
  const errorData = await res.clone().json().catch(() => ({}));
  const message = String(errorData?.message || "").toLowerCase();
  return message.includes("token") || message.includes("unauthorized");
};

export const http = async (url, options = {}, accessToken) => {
  let token = accessToken || localStorage.getItem("accessToken");

  const makeRequest = async (nextToken) => {
    const headers = buildHeaders(options.headers || {}, nextToken, options.body);
    return fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers,
      credentials: "include",
    });
  };

  let res = await makeRequest(token);

  const shouldRefresh = url !== "/auth/refresh" && (await isAuthErrorResponse(res));

  // Refresh token on auth errors (401 and compatible 403 auth responses)
  if (shouldRefresh) {
    try {
      token = await refreshAccessToken();
      res = await makeRequest(token);
    } catch {
      clearStoredAccessToken();
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
      throw new Error("Session expired. Please log in again.");
    }
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Request failed with status ${res.status}`);
  }

  if (res.status === 204) return null;

  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return null;
  }

  return res.json().catch(() => null);
};
