import { createContext, useContext, useState, useEffect } from "react";
import { loginApi, refreshApi, getMeApi, logoutApi } from "../api/auth.api";
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [accessToken, setAccessToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔥 Restore session on reload
  useEffect(() => {
    const initAuth = async () => {
      try {
        // 1️⃣ Try token saved in localStorage first
        const savedToken = localStorage.getItem("accessToken");

        if (savedToken) {
          const me = await getMeApi(savedToken);

          if (me?.data) {
            // `getMeApi` may trigger refresh flow inside `http`, so always use the latest token in storage.
            const latestToken = localStorage.getItem("accessToken") || savedToken;
            setAccessToken(latestToken);
            setUser(me.data);
            return;
          }
        }

        const refresh = await refreshApi();
        if (!refresh?.accessToken) throw new Error("No refresh token");

        localStorage.setItem("accessToken", refresh.accessToken);
        setAccessToken(refresh.accessToken);

        const me = await getMeApi(refresh.accessToken);
        setUser(me.data);
      } catch {
        setUser(null);
        setAccessToken(null);
        localStorage.removeItem("accessToken");
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  useEffect(() => {
    const onTokenUpdated = (event) => {
      const nextToken = event?.detail?.accessToken;
      if (!nextToken) return;
      setAccessToken(nextToken);
    };

    const onLoggedOut = () => {
      setAccessToken(null);
      setUser(null);
    };

    window.addEventListener("auth:token_updated", onTokenUpdated);
    window.addEventListener("auth:logged_out", onLoggedOut);

    return () => {
      window.removeEventListener("auth:token_updated", onTokenUpdated);
      window.removeEventListener("auth:logged_out", onLoggedOut);
    };
  }, []);

  const login = async (payload) => {
    const data = await loginApi(payload);

    if (!data.accessToken) {
      throw new Error(data.message || "Login failed");
    }

    localStorage.setItem("accessToken", data.accessToken);
    setAccessToken(data.accessToken);
    setUser(data.user);
  };

  const logout = async () => {
    try {
      await logoutApi();
    } catch {
      // Ignore API error and still clear local client auth state.
    }
    setAccessToken(null);
    setUser(null);
    localStorage.removeItem("accessToken");
  };

  // Merge updated profile fields into the user state (optimistic update)
  const updateProfile = (newProfileData) => {
    setUser((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        profile: {
          ...prev.profile,
          ...newProfileData,
        },
      };
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        loading,
        login,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
