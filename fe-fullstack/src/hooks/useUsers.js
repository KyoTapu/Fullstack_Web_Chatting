import { useState, useCallback } from "react";
import { getUsersApi, searchUsersApi } from "../api/users.api";
import { useAuth } from "../context/AuthContext";

export const useUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const fetchUsers = useCallback(async ({ keyword = "", page = 1, limit = 10 } = {}) => {
    try {
      setLoading(true);
      setError(null);

      const response = keyword
        ? await searchUsersApi({ keyword, page, limit })
        : await getUsersApi({ page, limit });

      const rawData = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response?.data?.data)
        ? response.data.data
        : [];

      const filteredUsers = rawData.filter((u) => {
        if (!user) return true;
        const candidateId = u.id || u._id || u.user_id;
        return String(candidateId) !== String(user.id);
      });

      const formattedUsers = filteredUsers.map((u) => ({
        id: u.id || u._id || u.user_id,
        username: u.username,
        email: u.email,
        short_description: u.short_description,
        avatar_url: u.profile?.avatar_url || u.avatar_url || null,
        presence: "offline",
        statusLabel: "offline",
      }));

      setUsers(formattedUsers);
    } catch (err) {
      console.error(err);
      if (err?.message?.toLowerCase().includes("user not found")) {
        setUsers([]);
        setError(null);
        return;
      }
      setError(err.message);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  return {
    users,
    loading,
    error,
    fetchUsers,
  };
};
