import React, { useEffect, useMemo, useState } from "react";
import { Search, UserPlus } from "lucide-react";
import { LeftSidebar } from "../components/sidebar/LeftSidebar";
import { MiddleSidebar } from "../components/layout/MiddleSidebar";
import { FriendCard } from "../components/friends/FriendCard";
import { PendingRequestRow } from "../components/friends/PendingRequestRow";
import { useFriends } from "../hooks/useFriends";
import { useAuth } from "../context/AuthContext";
import { useCallContext } from "../context/CallProvider";
import { FriendCardSkeleton } from "../components/skeleton/FriendCardSkeleton";
import { AddFriendModal } from "../components/friends/AddFriendModal";
import { Pagination } from "../components/ui/Pagination";

const FRIENDS_PER_PAGE = 8;

const tabs = [
  { key: "all", label: "All" },
  { key: "online", label: "Online" },
  { key: "offline", label: "Offline" },
  { key: "suggestions", label: "Suggestions" },
  { key: "blocked", label: "Blocked" },
];

const Friends = () => {
  const {
    friends,
    pendingRequests,
    blockedUsers,
    friendsPagination,
    loading: friendsLoading,
    error: friendsError,
    fetchFriends,
    fetchPendingRequests,
    fetchBlockedUsers,
    acceptRequest,
    declineRequest,
    sendRequest,
    unblockUser,
    suggestions,
    fetchSuggestions,
  } = useFriends();

  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [appliedSearchTerm, setAppliedSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const { user } = useAuth();
  const { onlineUsers = [] } = useCallContext() || {};

  useEffect(() => {
    if (!user) return;
    fetchFriends({
      paginated: true,
      page: currentPage,
      limit: FRIENDS_PER_PAGE,
      keyword: appliedSearchTerm,
    });
  }, [user, currentPage, appliedSearchTerm, fetchFriends]);

  useEffect(() => {
    if (!user) return;
    fetchPendingRequests({ paginated: false });
  }, [user, fetchPendingRequests]);

  useEffect(() => {
    if (!user) return;
    fetchSuggestions({ limit: 15 }).catch(() => {});
  }, [user, fetchSuggestions]);

  useEffect(() => {
    if (!user) return;
    fetchBlockedUsers({ paginated: false }).catch(() => {});
  }, [user, fetchBlockedUsers]);

  const handleSubmit = (event) => {
    event.preventDefault();
    setCurrentPage(1);
    setAppliedSearchTerm(searchTerm.trim());
  };

  const displayedFriends = useMemo(() => {
    if (activeTab === "blocked") return blockedUsers;
    if (activeTab === "suggestions") return suggestions;
    
    if (activeTab === "online") {
      return friends.filter((friend) =>
        onlineUsers.includes(String(friend.id || friend._id || friend.user_id))
      );
    }
    
    if (activeTab === "offline") {
      return friends.filter((friend) =>
        !onlineUsers.includes(String(friend.id || friend._id || friend.user_id))
      );
    }

    return friends;
  }, [blockedUsers, friends, activeTab, onlineUsers]);

  const isSearching = appliedSearchTerm.trim() !== "";
  const isServerPaginationMode = (activeTab === "all" || isSearching) && activeTab !== "blocked";
  const noResults = !friendsLoading && displayedFriends.length === 0;

  const totalFilteredFriends = isServerPaginationMode
    ? friendsPagination.total
    : displayedFriends.length;
  const totalPages = isServerPaginationMode
    ? Math.max(1, friendsPagination.totalPages || 1)
    : 1;
  const safeCurrentPage = isServerPaginationMode
    ? Math.max(1, friendsPagination.page || currentPage)
    : 1;

  const showingFrom = totalFilteredFriends === 0
    ? 0
    : isServerPaginationMode
    ? (safeCurrentPage - 1) * (friendsPagination.limit || FRIENDS_PER_PAGE) + 1
    : 1;
  const showingTo = totalFilteredFriends === 0
    ? 0
    : isServerPaginationMode
    ? Math.min(showingFrom + displayedFriends.length - 1, totalFilteredFriends)
    : displayedFriends.length;

  return (
    <div className="flex h-screen bg-background text-textPrimary">
      <LeftSidebar active="team" />
      <MiddleSidebar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setCurrentPage(1);
        }}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onSubmitSearch={handleSubmit}
      />

      <main className="flex flex-1 flex-col bg-surface">
        <header className="flex flex-col gap-3 border-b border-border bg-surface px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-lg font-semibold text-primary">Friends</h1>

            <div className="mt-2 flex flex-wrap gap-2 text-sm">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => {
                    setActiveTab(tab.key);
                    setCurrentPage(1);
                  }}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    activeTab === tab.key
                      ? "bg-primary"
                      : "bg-hover text-textMuted hover:bg-background hover:text-textPrimary"
                  }`}
                  style={activeTab === tab.key ? { color: "var(--app-chat-bubble-own-text)" } : undefined}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="hidden max-w-xs flex-1 items-center gap-2 rounded-full border border-border bg-background px-3 py-2 text-sm md:flex"
          >
            <Search className="h-4 w-4 text-textMuted" />
            <input
              type="text"
              placeholder="Search friends..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full border-none bg-transparent text-sm text-textPrimary placeholder:text-textMuted focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-full bg-primary px-3 py-1 text-xs"
              style={{ color: "var(--app-chat-bubble-own-text)" }}
            >
              Search
            </button>
          </form>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-medium transition hover:bg-opacity-90"
            style={{ color: "var(--app-chat-bubble-own-text)" }}
          >
            <UserPlus className="h-4 w-4" />
            Add Friend
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {friendsLoading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <FriendCardSkeleton />
            </div>
          ) : null}

          {friendsError ? <p className="text-sm text-red-500">{friendsError}</p> : null}

          <section>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {noResults ? (
                <div className="col-span-full py-16 text-center">
                  <p className="text-lg font-semibold text-primary">
                    {activeTab === "blocked" ? "No blocked users" : activeTab === "suggestions" ? "No suggestions available" : "No friends found"}
                  </p>
                  {isSearching && activeTab !== "blocked" ? (
                    <p className="mt-2 text-sm text-textMuted">No results for "{appliedSearchTerm}"</p>
                  ) : null}
                </div>
              ) : (
                displayedFriends.map((friend) => (
                  activeTab === "blocked" ? (
                    <div
                      key={friend.id || friend._id || friend.user_id}
                      className="flex flex-col rounded-2xl border border-border bg-surface p-4 shadow-sm"
                    >
                      <div className="mb-3 flex items-center gap-3">
                        <img
                          src={friend.avatar_url || "ezicon.png"}
                          alt={friend.username}
                          className="h-14 w-14 rounded-full object-cover"
                        />
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-semibold text-textPrimary">
                            {friend.full_name || friend.username}
                          </h3>
                          <p className="truncate text-sm text-textMuted">{friend.email}</p>
                        </div>
                      </div>

                      <p className="mb-4 text-xs text-textMuted line-clamp-2">
                        {friend.short_description || "This user is currently blocked."}
                      </p>

                      <button
                        type="button"
                        onClick={() => unblockUser(friend.id).catch((error) => {
                          window.alert(error.message || "Could not unblock this user.");
                        })}
                        className="mt-auto rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-textPrimary transition hover:bg-hover"
                      >
                        Unblock
                      </button>
                    </div>
                  ) : activeTab === "suggestions" ? (
                    <FriendCard key={friend.id || friend._id || friend.user_id} friend={friend} isSearch={true} onAddFriend={() => sendRequest(friend.id || friend._id || friend.user_id).then(() => fetchSuggestions({limit: 15}))} />
                  ) : (
                    <FriendCard key={friend.id || friend._id || friend.user_id} friend={friend} isSearch={false} />
                  )
                ))
              )}
            </div>

            {!friendsLoading ? (
              <div className="mt-6 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-textMuted">
                  Showing {showingFrom}-{showingTo} of {totalFilteredFriends} friends
                </p>

                {isServerPaginationMode && totalPages > 1 ? (
                  <Pagination
                    currentPage={safeCurrentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                ) : null}
              </div>
            ) : null}
          </section>

          <section className="mt-10 space-y-3">
            <h2 className="text-sm font-semibold text-primary">Pending Requests</h2>

            <div className="space-y-2">
              {pendingRequests.length === 0 ? (
                <p className="text-xs text-textMuted">No pending requests</p>
              ) : (
                pendingRequests.map((request) => (
                  <PendingRequestRow
                    key={request.friendship_id}
                    request={request}
                    onAccept={acceptRequest}
                    onDecline={declineRequest}
                  />
                ))
              )}
            </div>
          </section>
        </div>
      </main>

      <AddFriendModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        sendRequest={sendRequest}
        friendIds={friends.map((friend) => friend.id || friend._id).filter(Boolean)}
      />
    </div>
  );
};

export default Friends;
