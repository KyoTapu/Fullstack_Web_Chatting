import React, { useEffect, useMemo, useRef, useState } from "react";
import { Check, LoaderCircle, Search, UserPlus, X } from "lucide-react";
import { useUsers } from "../../hooks/useUsers";
import { getRelationshipStatusesApi } from "../../api/friends.api";

export const AddFriendModal = ({ isOpen, onClose, sendRequest, friendIds = [] }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const { users, loading, error, fetchUsers } = useUsers();
  const [relationshipMap, setRelationshipMap] = useState({});
  const [checkingRelationships, setCheckingRelationships] = useState(false);
  const relationshipRequestRef = useRef(0);

  const skeletonCards = Array.from({ length: 6 }, (_, i) => i);

  const handleClose = () => {
    setSearchTerm("");
    setHasSearched(false);
    setRelationshipMap({});
    setCheckingRelationships(false);
    relationshipRequestRef.current += 1;
    onClose?.();
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const keyword = searchTerm.trim();
    if (!keyword) return;
    setHasSearched(true);
    fetchUsers({ keyword });
  };

  const handleAdd = async (userId) => {
    const relation = String(relationshipMap[userId] || "").toUpperCase();
    if (relation === "PENDING" || relation === "ACCEPTED" || relation === "BLOCKED") return;

    try {
      await sendRequest(userId);
      setRelationshipMap((prev) => ({ ...prev, [userId]: "PENDING" }));
    } catch (err) {
      const msg = (err?.message || "").toLowerCase();
      if (msg.includes("pending")) {
        setRelationshipMap((prev) => ({ ...prev, [userId]: "PENDING" }));
      } else if (msg.includes("already friends")) {
        setRelationshipMap((prev) => ({ ...prev, [userId]: "ACCEPTED" }));
      }
      console.error(err);
    }
  };

  const friendIdSet = useMemo(() => new Set(friendIds.map((id) => String(id))), [friendIds]);
  const filteredUsers = useMemo(
    () => users.filter((u) => !friendIdSet.has(String(u.id))),
    [users, friendIdSet],
  );
  const userIds = useMemo(() => filteredUsers.map((u) => u.id).filter(Boolean), [filteredUsers]);

  useEffect(() => {
    const loadRelationships = async () => {
      if (!isOpen || !hasSearched) {
        setCheckingRelationships(false);
        return;
      }

      if (userIds.length === 0) {
        setRelationshipMap({});
        setCheckingRelationships(false);
        return;
      }

      const requestId = relationshipRequestRef.current + 1;
      relationshipRequestRef.current = requestId;
      setCheckingRelationships(true);

      try {
        const res = await getRelationshipStatusesApi(userIds);
        const rows = Array.isArray(res?.data) ? res.data : Array.isArray(res?.data?.data) ? res.data.data : [];

        const nextMap = {};
        rows.forEach((row) => {
          const otherId = row?.other_user_id;
          const status = String(row?.status || "").toUpperCase();
          if (otherId) {
            nextMap[otherId] = status;
          }
        });

        if (relationshipRequestRef.current !== requestId) return;
        setRelationshipMap(nextMap);
      } catch (err) {
        if (relationshipRequestRef.current !== requestId) return;
        console.error("Load relationship status error:", err);
      } finally {
        if (relationshipRequestRef.current === requestId) {
          setCheckingRelationships(false);
        }
      }
    };

    loadRelationships();
  }, [isOpen, hasSearched, userIds]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="flex w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-border bg-surface text-textPrimary shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-primary">Add Friend</h2>
          <button
            onClick={handleClose}
            className="rounded-full p-2 text-textMuted transition hover:bg-hover hover:text-textPrimary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <form onSubmit={handleSearch} className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-[320px] md:w-[380px]">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-textMuted" />
              <input
                type="text"
                autoFocus
                placeholder="Search by username or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-border bg-background py-2 pl-10 pr-4 text-sm text-textPrimary outline-none transition placeholder:text-textMuted focus:border-primary focus:bg-surface"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !searchTerm.trim()}
              className="rounded-lg bg-primary px-3 py-2 text-xs font-medium transition hover:bg-opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              style={{ color: "var(--app-chat-bubble-own-text)" }}
            >
              Search
            </button>
          </form>

          <div className="grid h-80 auto-rows-max content-start items-start grid-cols-1 gap-3 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
            {loading || (hasSearched && checkingRelationships) ? (
              <>
                <div className="col-span-full flex items-center justify-center gap-2 py-2 text-sm text-textMuted">
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  <span>{loading ? "Searching..." : "Checking pending requests..."}</span>
                </div>
                {skeletonCards.map((idx) => (
                  <div key={idx} className="animate-pulse rounded-2xl border border-border bg-background p-4 shadow-sm">
                    <div className="mx-auto mb-3 h-14 w-14 rounded-full bg-hover" />
                    <div className="space-y-2">
                      <div className="h-3 rounded bg-hover" />
                      <div className="h-3 w-4/5 rounded bg-hover" />
                    </div>
                    <div className="mt-4 h-8 rounded-lg bg-hover" />
                  </div>
                ))}
              </>
            ) : error ? (
              <p className="col-span-full py-8 text-center text-sm text-red-500">{error}</p>
            ) : hasSearched && filteredUsers.length > 0 ? (
              filteredUsers.map((user) => {
                const relation = String(relationshipMap[user.id] || "").toUpperCase();
                const isPending = relation === "PENDING";
                const isAccepted = relation === "ACCEPTED";
                const isBlocked = relation === "BLOCKED";
                const isDisabled = isPending || isAccepted || isBlocked;
                const statusLabel = isPending
                  ? "Pending"
                  : isAccepted
                  ? "Already Friends"
                  : isBlocked
                  ? "Blocked"
                  : "Add";

                return (
                  <div
                    key={user.id}
                    className={`flex self-start flex-col items-center rounded-2xl border border-border bg-background p-4 text-center shadow-sm transition ${
                      isDisabled ? "cursor-not-allowed opacity-70" : "hover:shadow"
                    }`}
                  >
                    <img
                      src={user.avatar_url || "ezicon.png"}
                      alt={user.username}
                      className="mb-2 h-14 w-14 rounded-full object-cover"
                    />
                    <div className="mb-3 min-w-0">
                      <p className="truncate text-sm font-semibold text-textPrimary">{user.username}</p>
                      <p className="truncate text-xs text-textMuted">{user.email}</p>
                    </div>
                    <button
                      onClick={() => handleAdd(user.id)}
                      disabled={isDisabled}
                      className={`flex w-full items-center justify-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition ${
                        isDisabled ? "bg-hover text-textMuted" : "bg-primary hover:bg-opacity-90"
                      }`}
                      style={isDisabled ? undefined : { color: "var(--app-chat-bubble-own-text)" }}
                    >
                      {isDisabled ? (
                        <>
                          <Check className="h-3.5 w-3.5" /> {statusLabel}
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-3.5 w-3.5" /> {statusLabel}
                        </>
                      )}
                    </button>
                  </div>
                );
              })
            ) : hasSearched ? (
              <p className="col-span-full py-8 text-center text-sm text-textMuted">
                No users found.
              </p>
            ) : (
              <p className="col-span-full py-8 text-center text-sm text-textMuted">
                Type a name to search for friends
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
