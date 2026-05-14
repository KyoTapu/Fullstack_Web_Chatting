import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Menu } from "lucide-react";
import { useLocation } from "react-router-dom";

import { LeftSidebar } from "../components/sidebar/LeftSidebar";
import { GroupSidebar } from "../components/sidebar/GroupSidebar";
import { ChatWindow } from "../components/chat/ChatWindow";
import { GroupMembersModal } from "../components/groups/GroupMembersModal";
import { RenameGroupModal } from "../components/groups/RenameGroupModal";

import { useConversations } from "../hooks/useConversations";
import { useGroups } from "../hooks/useGroups";
import { useFriends } from "../hooks/useFriends";
import { useAuth } from "../context/AuthContext";
import { getRelationshipStatusesApi } from "../api/friends.api";

import { getSocket } from "../socket/socket";

const DIRECTS_PER_PAGE = 5;

const normalizeMembers = (convOrGroup) => {
  const m = convOrGroup?.members;
  if (Array.isArray(m)) return m;
  return [];
};

const Home = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [membersModalAddMode, setMembersModalAddMode] = useState(false);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [directRelationship, setDirectRelationship] = useState(null);

  const {
    directs,
    loading: directsLoading,
    pagination: directsPagination,
    currentPage: directsPage,
    setCurrentPage: setDirectsPage,
    refreshConversations,
  } = useConversations({
    paginated: true,
    limit: DIRECTS_PER_PAGE,
    type: "direct",
  });
  const { friends, fetchFriends, fetchBlockedUsers, blockUser, unblockUser } = useFriends();
  const {
    groups,
    groupsPagination,
    loading: groupsLoading,
    createGroup,
    loadGroupDetails,
    loadGroups,
    selectedGroup,
    addMembers,
    renameGroup,
    deleteGroup,
    leaveGroup,
  } = useGroups();
  const { user } = useAuth();

  const location = useLocation();
  const [activeConv, setActiveConv] = useState(() => location.state?.conversation || null);

  useEffect(() => {
    if (!user) return;
    fetchFriends({ paginated: false });
    fetchBlockedUsers({ paginated: false }).catch(() => {});
  }, [user, fetchBlockedUsers, fetchFriends]);

  const handleSelectConversation = (conv) => {
    setActiveConv(conv);
  };

  const activeConvId = useMemo(() => activeConv?._id || activeConv?.id, [activeConv]);

  useEffect(() => {
    if (activeConv?.type === "group" && activeConvId) {
      loadGroupDetails(activeConvId);
    }
  }, [activeConvId, activeConv?.type, loadGroupDetails]);

  useEffect(() => {
    if (!activeConvId) return;

    const socket = getSocket();
    if (!socket) return;

    console.log("👉 Join room:", activeConvId);
    socket.emit("join_conversation", activeConvId);
  }, [activeConvId]);

  const loadDirectRelationship = useCallback(async () => {
    const friendId = activeConv?.friend?.id || activeConv?.friend?._id;
    if (!user?.id || activeConv?.type !== "direct" || !friendId) {
      setDirectRelationship(null);
      return null;
    }

    try {
      const res = await getRelationshipStatusesApi([friendId]);
      const rows = Array.isArray(res?.data) ? res.data : Array.isArray(res?.data?.data) ? res.data.data : [];
      const nextRelationship = rows[0] || null;
      setDirectRelationship(nextRelationship);
      return nextRelationship;
    } catch (error) {
      console.error("Load direct relationship error:", error);
      setDirectRelationship(null);
      return null;
    }
  }, [activeConv?.friend?._id, activeConv?.friend?.id, activeConv?.type, user?.id]);

  useEffect(() => {
    loadDirectRelationship().catch(() => {});
  }, [loadDirectRelationship]);
      
  const viewMode = useMemo(() => {
    if (!activeConv) return "group";
    return activeConv.type === "group" ? "group" : "dm";
  }, [activeConv]);

  const title = useMemo(() => {
    if (!activeConv) return "Select a conversation";

    if (activeConv.type === "group") {
      return activeConv.name || "Group";
    }

    return activeConv.friend?.full_name || activeConv.friend?.username || "Direct message";
  }, [activeConv]);

  const currentUserId = user?.id;

  const headerMembers = useMemo(() => {
    const fromSelected = normalizeMembers(selectedGroup);
    if (fromSelected.length) return fromSelected;
    return normalizeMembers(activeConv);
  }, [selectedGroup, activeConv]);

  const myRole = useMemo(() => {
    return headerMembers.find((m) => m.id === currentUserId)?.role;
  }, [headerMembers, currentUserId]);

  const canAddMember = myRole === "OWNER" || myRole === "ADMIN";
  const canRename = myRole === "OWNER";
  const canDelete = myRole === "OWNER";
  const canLeave = Boolean(activeConv?.type === "group" && myRole && myRole !== "OWNER");
  const directBlockState = useMemo(() => {
    if (String(directRelationship?.status || "").toUpperCase() !== "BLOCKED") {
      return { status: "none" };
    }

    return {
      status:
        String(directRelationship?.requester_id) === String(currentUserId)
          ? "blocked_by_me"
          : "blocked_by_them",
    };
  }, [currentUserId, directRelationship?.requester_id, directRelationship?.status]);

  const openMembersModal = useCallback(
    async (addMode = false) => {
      if (viewMode !== "group" || !activeConvId) return;
      await loadGroupDetails(activeConvId);
      setMembersModalAddMode(addMode);
      setIsMembersModalOpen(true);
    },
    [viewMode, activeConvId, loadGroupDetails]
  );

  const handleRename = async (name) => {
    if (!activeConvId) return;
    await renameGroup(activeConvId, name);
    setActiveConv((prev) => (prev && prev.type === "group" ? { ...prev, name } : prev));
  };

  const handleDeleteGroup = async () => {
    if (!activeConvId) return;
    if (!window.confirm("Delete this group for everyone? This cannot be undone.")) return;
    try {
      await deleteGroup(activeConvId);
      setActiveConv(null);
    } catch (err) {
      alert(err.message || "Could not delete group");
    }
  };

  const handleLeaveGroup = async () => {
    if (!activeConvId) return;
    if (!window.confirm("Leave this group conversation?")) return;

    try {
      await leaveGroup(activeConvId);
      setActiveConv(null);
    } catch (err) {
      alert(err.message || "Could not leave this group");
    }
  };

  const handleBlockUser = async () => {
    const friendId = activeConv?.friend?.id || activeConv?.friend?._id;
    if (!friendId) return;
    if (!window.confirm("Block this user? You will no longer be able to send messages to each other.")) return;

    try {
      await blockUser(friendId);
      await loadDirectRelationship();
      await refreshConversations();
    } catch (err) {
      alert(err.message || "Could not block this user.");
    }
  };

  const handleUnblockUser = async () => {
    const friendId = activeConv?.friend?.id || activeConv?.friend?._id;
    if (!friendId) return;

    try {
      await unblockUser(friendId);
      await loadDirectRelationship();
    } catch (err) {
      alert(err.message || "Could not unblock this user.");
    }
  };

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background text-stone-900">
      <div className="flex flex-shrink-0 items-center justify-between border-b border-stone-200 bg-primary px-4 py-3 text-sm text-stone-100 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex flex-col items-center">
          <span className="text-xs uppercase text-stone-300">
            {viewMode === "group" ? "Group" : "Direct"}
          </span>

          <span
            className="text-sm font-semibold cursor-pointer hover:underline"
            onClick={() => viewMode === "group" && openMembersModal(false)}
          >
            {title}
          </span>
        </div>

        <div className="h-9 w-9 rounded-full bg-background" />
      </div>

      <div className="flex min-h-0 flex-1">
        <LeftSidebar active="chat" />

        <GroupSidebar
          groups={groups}
          groupsPagination={groupsPagination}
          groupsLoading={groupsLoading}
          loadGroups={loadGroups}
          createGroup={createGroup}
          loadGroupDetails={loadGroupDetails}
          selectedGroup={selectedGroup}
          addMembers={addMembers}
          friends={friends}
          directs={directs}
          directsLoading={directsLoading}
          directsPagination={directsPagination}
          directsPage={directsPage}
          onDirectPageChange={setDirectsPage}
          refreshConversations={refreshConversations}
          activeConvId={activeConvId}
          onSelectGroup={handleSelectConversation}
          onSelectDM={handleSelectConversation}
        />

        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <ChatWindow
            conversation={activeConv}
            groupMembers={headerMembers}
            groupMemberCount={headerMembers.length}
            onGroupOpenMembers={() => openMembersModal(false)}
            onGroupMenuAddMember={() => openMembersModal(true)}
            onGroupMenuRename={() => setRenameModalOpen(true)}
            onGroupMenuDelete={handleDeleteGroup}
            onGroupMenuLeave={handleLeaveGroup}
            onBlockUser={handleBlockUser}
            onUnblockUser={handleUnblockUser}
            groupCanAddMember={canAddMember}
            groupCanRename={canRename}
            groupCanDelete={canDelete}
            groupCanLeave={canLeave}
            directBlockState={directBlockState}
          />
        </main>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <button type="button" onClick={() => setMobileOpen(false)} className="h-full flex-1 bg-black/30" />

          <div className="w-72 bg-primary text-white">
            <GroupSidebar
              groups={groups}
              groupsPagination={groupsPagination}
              groupsLoading={groupsLoading}
              loadGroups={loadGroups}
              createGroup={createGroup}
              loadGroupDetails={loadGroupDetails}
              selectedGroup={selectedGroup}
              addMembers={addMembers}
              friends={friends}
              directs={directs}
              directsLoading={directsLoading}
              directsPagination={directsPagination}
              directsPage={directsPage}
              onDirectPageChange={setDirectsPage}
              refreshConversations={refreshConversations}
              activeConvId={activeConvId}
              onSelectGroup={(conv) => {
                handleSelectConversation(conv);
                setMobileOpen(false);
              }}
              onSelectDM={(conv) => {
                handleSelectConversation(conv);
                setMobileOpen(false);
              }}
              mobile
            />
          </div>
        </div>
      )}

      <GroupMembersModal
        isOpen={isMembersModalOpen}
        onClose={() => {
          setIsMembersModalOpen(false);
          setMembersModalAddMode(false);
        }}
        groupId={viewMode === "group" && activeConvId ? activeConvId : null}
        currentUserId={currentUserId}
        groupData={selectedGroup}
        onAddMembers={addMembers}
        friends={friends}
        defaultAddMode={membersModalAddMode}
      />

      <RenameGroupModal
        isOpen={renameModalOpen}
        onClose={() => setRenameModalOpen(false)}
        currentName={
          activeConv?.type === "group" ? selectedGroup?.name || activeConv.name || "" : ""
        }
        onRename={handleRename}
      />
    </div>
  );
};

export default Home;
