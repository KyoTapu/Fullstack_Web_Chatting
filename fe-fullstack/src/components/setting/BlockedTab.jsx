import { useEffect } from "react";
import SectionCard from "./SectionCard";
import { useFriends } from "../../hooks/useFriends";
import { Avatar } from "../ui/Avatar";

export default function BlockedTab() {
  const { blockedUsers, fetchBlockedUsers, unblockUser, loading, error } = useFriends();

  useEffect(() => {
    fetchBlockedUsers({ paginated: false }).catch(() => {});
  }, [fetchBlockedUsers]);

  return (
    <>
      <h2 className="text-xl font-semibold text-textPrimary">Blocked Users</h2>
      <p className="text-sm text-textMuted">Manage users you have blocked</p>

      <SectionCard>
        {loading ? <p className="text-sm text-textMuted">Loading blocked users...</p> : null}
        {error ? <p className="text-sm text-red-500">{error}</p> : null}

        {!loading && blockedUsers.length === 0 ? (
          <p className="text-sm text-textMuted">You haven’t blocked anyone yet.</p>
        ) : null}

        <div className="space-y-3">
          {blockedUsers.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-background px-4 py-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <Avatar src={user.avatar_url} alt={user.username} size="md" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-textPrimary">
                    {user.full_name || user.username}
                  </p>
                  <p className="truncate text-xs text-textMuted">{user.email}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={async () => {
                  try {
                    await unblockUser(user.id);
                  } catch (nextError) {
                    window.alert(nextError.message || "Could not unblock this user.");
                  }
                }}
                className="rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium text-textPrimary transition hover:bg-hover"
              >
                Unblock
              </button>
            </div>
          ))}
        </div>
      </SectionCard>
    </>
  );
}
