import React from "react";
import { ChevronDown, Circle, Search, Users,Plus } from "lucide-react";
import { Avatar } from "../ui/Avatar";
import { Pagination } from "../ui/Pagination";
import { useAuth } from "../../context/AuthContext";
import { useCallContext } from "../../context/CallProvider";
import { CreateGroupModal } from "../groups/CreateGroupModal";
import { GroupMembersModal } from "../groups/GroupMembersModal";

const DIRECTS_PER_PAGE = 5;
const GROUPS_PER_PAGE = 6;

const SectionHeader = ({ label, count = 0, isOpen = true, onToggle, onAdd }) => (
  <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wide text-stone-500">
    <button
      type="button"
      onClick={onToggle}
      className="flex items-center gap-1.5 rounded px-1 py-0.5 transition-colors hover:bg-stone-100"
    >
      <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? "rotate-0" : "-rotate-90"}`} />
      <span>{label}</span>
      <span className="rounded-full bg-stone-200 px-1.5 py-0.5 text-[10px] leading-none text-stone-600">
        {count}
      </span>
    </button>

    {onAdd ? (
      <button
        type="button"
        onClick={onAdd}
        className="rounded p-1 transition-colors hover:bg-stone-200"
        title="Create group"
        aria-label="Create group"
      >
        <Plus  size={16}/>
      </button>
    ) : null}
  </div>
);

const getSafePagination = (pagination, fallbackPage = 1) => {
  const total = Number.parseInt(pagination?.total, 10) || 0;
  const page = Math.max(1, Number.parseInt(pagination?.page, 10) || fallbackPage || 1);
  const limit = Math.max(1, Number.parseInt(pagination?.limit, 10) || DIRECTS_PER_PAGE);
  const totalPages = Math.max(1, Number.parseInt(pagination?.totalPages, 10) || Math.ceil(total / limit));

  return {
    total,
    page,
    limit,
    totalPages,
  };
};

export const GroupSidebar = ({
  groups = [],
  groupsPagination = null,
  groupsLoading = false,
  loadGroups,
  refreshConversations,
  createGroup,
  loadGroupDetails,
  selectedGroup,
  addMembers,
  friends = [],
  directs = [],
  directsLoading = false,
  directsPagination = null,
  directsPage = 1,
  onDirectPageChange,
  activeConvId,
  onSelectGroup,
  onSelectDM,
  mobile = false,
}) => {
  const { user } = useAuth();
  const { onlineUsers = [] } = useCallContext() || {};
  const currentUserId = user?.id;
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [memberModalGroupId, setMemberModalGroupId] = React.useState(null);
  const [query, setQuery] = React.useState("");
  const [groupPage, setGroupPage] = React.useState(1);
  const [groupsOpen, setGroupsOpen] = React.useState(true);
  const [directsOpen, setDirectsOpen] = React.useState(true);

  const handleOpenMembersModal = async (event, groupId) => {
    event.stopPropagation();
    await loadGroupDetails(groupId);
    setMemberModalGroupId(groupId);
  };

  const formatTime = (time) => {
    if (!time) return "";
    const date = new Date(time);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    return isToday
      ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : date.toLocaleDateString();
  };

  const normalizedQuery = query.trim().toLowerCase();
  const isSearching = normalizedQuery.length > 0;
  const normalizedGroupQuery = query.trim();

  React.useEffect(() => {
    if (!loadGroups) return;
    const keyword = normalizedGroupQuery || "";
    const groupOptions = keyword
      ? { paginated: false, keyword }
      : { paginated: true, page: groupPage, limit: GROUPS_PER_PAGE, keyword: "" };
    void loadGroups(groupOptions).catch(() => {});

    if (refreshConversations) {
      const directOptions = keyword
        ? { paginated: false, keyword, type: "direct" }
        : { paginated: true, page: directsPage, limit: DIRECTS_PER_PAGE, type: "direct" };
      void refreshConversations(directOptions).catch(() => {});
    }
  }, [loadGroups, refreshConversations, groupPage, directsPage, normalizedGroupQuery]);

  const directMeta = getSafePagination(directsPagination, directsPage);
  const groupsMeta = getSafePagination(groupsPagination, 1);
  const displayedDirects = directs;

  const totalDirects = isSearching ? directs.length : directMeta.total;
  const totalDirectPages = isSearching ? 1 : directMeta.totalPages;
  const safeDirectPage = isSearching ? 1 : directMeta.page;
  const showingDirectFrom = totalDirects === 0 ? 0 : (safeDirectPage - 1) * directMeta.limit + 1;
  const showingDirectTo = totalDirects === 0
    ? 0
    : Math.min(showingDirectFrom + displayedDirects.length - 1, totalDirects);
  const totalGroups = isSearching ? groups.length : (groupsMeta.total || groups.length);
  const totalGroupPages = isSearching ? 1 : groupsMeta.totalPages;
  const safeGroupPage = isSearching ? 1 : Math.min(groupPage, totalGroupPages);
  const showingGroupFrom = totalGroups === 0 ? 0 : (safeGroupPage - 1) * groupsMeta.limit + 1;
  const showingGroupTo = totalGroups === 0 ? 0 : Math.min(showingGroupFrom + groups.length - 1, totalGroups);

  const handleDirectPageChange = (page) => {
    onDirectPageChange?.(page);
  };

  const handleGroupPageChange = (page) => {
    setGroupPage(page);
  };

  return (
    <aside
      className={`h-full w-72 min-w-0 flex-shrink-0 flex-col overflow-hidden border-r border-stone-200 bg-background px-4 py-4 ${
        mobile ? "flex" : "hidden lg:flex"
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-primary">Conversations</span>
        <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-stone-500">
          {totalGroups + totalDirects}
        </span>
      </div>

      <div className="mb-4">
        <label
          htmlFor="conversation-search"
          className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-stone-500"
        >
          Quick search
        </label>
        <div className="flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-2.5 py-2 focus-within:border-primary/40">
          <Search className="h-4 w-4 text-stone-400" />
          <input
            id="conversation-search"
            type="text"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setGroupPage(1);
            }}
            placeholder="Group or person..."
            className="w-full bg-transparent text-sm text-stone-700 outline-none placeholder:text-stone-400"
          />
        </div>
      </div>

      <div className="mb-4 flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
        <div className="flex min-h-0 flex-col space-y-2">
          <SectionHeader
            label="Groups"
            count={totalGroups}
            isOpen={groupsOpen}
            onToggle={() => setGroupsOpen((prev) => !prev)}
            onAdd={() => setIsCreateModalOpen(true)}
          />

          {groupsOpen ? (
            <>
              <div className="mt-1 max-h-[28vh] min-h-[90px] space-y-1 overflow-y-auto overflow-x-hidden pr-1">
                {groupsLoading ? (
                  <div className="rounded-md px-2 py-2 text-xs text-gray-400">Loading groups...</div>
                ) : null}

                {!groupsLoading && groups.length === 0 ? (
                  <div className="rounded-md px-2 py-2 text-xs text-gray-400">
                    {normalizedGroupQuery ? "No groups match your search" : "No groups yet"}
                  </div>
                ) : null}

                {!groupsLoading
                  ? groups.map((group) => {
                      const id = group.id || group._id;
                      const memberCount = Array.isArray(group.members) ? group.members.length : 0;

                      return (
                        <div key={id} className="relative group">
                          <button
                            type="button"
                            onClick={() => onSelectGroup?.(group)}
                            className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${
                              activeConvId === id ? "bg-white text-primary shadow-sm" : "text-stone-600 hover:bg-stone-100"
                            }`}
                          >
                            <Users className="h-4 w-4 flex-shrink-0 text-stone-400" />
                            <div className="min-w-0 flex-1 text-left">
                              <p className="truncate">{group.name || "Group"}</p>
                              <p className="text-[11px] text-stone-400">{memberCount} members</p>
                            </div>

                            <div className="ml-auto flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                              <span
                                role="button"
                                title="Members"
                                onClick={(event) => handleOpenMembersModal(event, id)}
                                className="flex h-5 w-5 items-center justify-center rounded text-stone-400 hover:bg-stone-200 hover:text-primary"
                              >
                                <Users className="h-3.5 w-3.5" />
                              </span>
                            </div>
                          </button>
                        </div>
                      );
                    })
                  : null}
              </div>
              {!isSearching && totalGroupPages > 1 ? (
                <div className="mt-2 border-t border-stone-200 pt-2">
                  <p className="mb-2 text-[10px] uppercase tracking-wide text-stone-400">
                    Showing {showingGroupFrom}-{showingGroupTo} of {totalGroups}
                  </p>
                  <Pagination
                    currentPage={safeGroupPage}
                    totalPages={totalGroupPages}
                    onPageChange={handleGroupPageChange}
                    maxPageButtons={3}
                    className="justify-end"
                  />
                </div>
              ) : null}
            </>
          ) : null}
        </div>

        <div className="min-h-0 flex flex-1 flex-col space-y-2 overflow-hidden">
          <SectionHeader
            label="Direct messages"
            count={totalDirects}
            isOpen={directsOpen}
            onToggle={() => setDirectsOpen((prev) => !prev)}
          />

          {directsOpen ? (
            <div className="mt-1 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
              <div className="min-h-0 min-w-0 flex-1 space-y-1 overflow-y-auto overflow-x-hidden pr-1">
                {directsLoading ? (
                  <div className="rounded-md px-2 py-2 text-xs text-gray-400">Loading conversations...</div>
                ) : null}

                {!directsLoading && displayedDirects.length === 0 ? (
                  <div className="rounded-md px-2 py-2 text-xs text-gray-400">
                    {isSearching
                      ? "No conversations match your search"
                      : "No conversations yet"}
                  </div>
                ) : null}

                {displayedDirects.map((dm) => {
                  const dmId = dm._id || dm.id;
                  const friend = dm.friend || {};
                  const displayName = friend.full_name || friend.username || "Unknown";
                  const lastMessage = dm.last_message_content || "No messages yet";
                  const isOnline = onlineUsers.includes(String(friend.user_id || friend.id || friend._id));

                  return (
                    <button
                      type="button"
                      key={dmId}
                      onClick={() => onSelectDM?.(dm)}
                      className={`flex w-full min-w-0 max-w-full items-center gap-2 overflow-hidden rounded-lg px-3 py-2 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${
                        activeConvId === dmId ? "bg-blue-50 text-primary" : "text-stone-600 hover:bg-stone-100"
                      }`}
                    >
                      <Avatar src={friend.avatar_url || "./ezicon.png"} alt={displayName} size="sm" />
                      <div className="flex min-w-0 flex-1 flex-col items-start">
                        <span className="w-full truncate text-left font-medium">{displayName}</span>
                        <span className="line-clamp-1 w-full text-left text-xs text-gray-400">
                          {lastMessage}
                        </span>
                      </div>
                      <span className="whitespace-nowrap text-[10px] text-gray-400">
                        {formatTime(dm.last_message_at)}
                      </span>
                      <Circle
                        className={`h-2.5 w-2.5 ${isOnline ? "text-emerald-400" : "text-stone-300"}`}
                        fill="currentColor"
                      />
                    </button>
                  );
                })}
              </div>

              {!isSearching && totalDirectPages > 1 ? (
                <div className="shrink-0 border-t border-stone-200 pt-2">
                  <p className="mb-2 text-[10px] uppercase tracking-wide text-stone-400">
                    Showing {showingDirectFrom}-{showingDirectTo} of {totalDirects}
                  </p>
                  <Pagination
                    currentPage={safeDirectPage}
                    totalPages={totalDirectPages}
                    onPageChange={handleDirectPageChange}
                    maxPageButtons={3}
                    className="justify-end"
                  />
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <CreateGroupModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateGroup={createGroup}
      />

      <GroupMembersModal
        isOpen={Boolean(memberModalGroupId)}
        onClose={() => setMemberModalGroupId(null)}
        groupId={memberModalGroupId}
        currentUserId={currentUserId}
        groupData={selectedGroup}
        onAddMembers={addMembers}
        friends={friends}
        defaultAddMode={false}
      />
    </aside>
  );
};
