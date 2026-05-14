import React, { useState, useRef, useEffect } from "react";
import {
  Hash,
  Users as UsersIcon,
  MoreVertical,
  UserPlus,
  Pencil,
  Trash2,
  PhoneCall,
  Video,
  LogOut,
  UserCheck,
  UserX,
} from "lucide-react";
import { Avatar } from "../ui/Avatar";
import { useCall } from "../../hooks/useCall";
import { useCallContext } from "../../context/CallProvider";

export const ChatHeader = ({
  conversation,
  groupMembers = [],
  memberCount,
  onOpenMembers,
  onMenuAddMember,
  onMenuRename,
  onMenuDelete,
  onMenuLeave,
  onBlockUser,
  onUnblockUser,
  canAddMember = false,
  canRename = false,
  canDelete = false,
  canLeave = false,
  directBlockState = { status: "none" },
}) => {
  const name = conversation?.name || conversation?.friend?.display_name || "Chat";
  const avatarUrl = conversation?.friend?.avatar_url;
  const isGroup = conversation?.type === "group";
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const { startCall } = useCall();
  const { onlineUsers = [] } = useCallContext() || {};
  const friendId = conversation?.friend?.id || conversation?.friend?._id;
  const friendProfile = {
    id: friendId,
    name: name || conversation?.friend?.username,
    avatarUrl: avatarUrl,
  };

  const isOnline = !isGroup && onlineUsers.includes(String(friendId));
  const isBlockedByMe = directBlockState?.status === "blocked_by_me";
  const isBlockedByThem = directBlockState?.status === "blocked_by_them";

  const members = Array.isArray(groupMembers) ? groupMembers : [];
  const count = typeof memberCount === "number" ? memberCount : members.length;
  const preview = members.slice(0, 3);
  const hasMenu = isGroup
    ? canAddMember || canRename || canDelete || canLeave
    : Boolean(friendId && (onBlockUser || onUnblockUser));

  useEffect(() => {
    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <header className="flex flex-shrink-0 items-center justify-between border-b border-border bg-surface px-6 py-3 text-textPrimary shadow-sm">
      <div className="flex min-w-0 items-center gap-3">
        {isGroup ? (
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-border bg-background text-textMuted">
            <Hash className="h-5 w-5" />
          </div>
        ) : (
          <Avatar src={avatarUrl} alt={name} size="md" />
        )}

        <div className="flex min-w-0 flex-col">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            {!isGroup ? (
              <div className={`h-2 w-2 flex-shrink-0 rounded-full ${isOnline ? "bg-emerald-500" : "bg-stone-400"}`} />
            ) : null}
            <span className="truncate">{name}</span>
          </div>
          <p className="text-xs text-textMuted">
            {isGroup
              ? "Group conversation"
              : isBlockedByMe
                ? "Blocked"
                : isBlockedByThem
                  ? "This user has blocked you"
                  : isOnline
                    ? "Online"
                    : "Offline"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isGroup && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="rounded-full bg-gray-400 p-[7px] mr-1"
                onClick={() => friendId && startCall(friendId, { video: false }, friendProfile)}
                title="Voice call"
              >
                <PhoneCall size={16} />
              </button>

              <button
                type="button"
                className="rounded-full bg-gray-400 p-[7px]"
                onClick={() => friendId && startCall(friendId, { video: true }, friendProfile)}
                title="Video call"
              >
                <Video size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-shrink-0 items-center gap-2">
        {isGroup ? (
          <>
            <button
              type="button"
              onClick={onOpenMembers}
              className="flex items-center gap-2 rounded-lg px-2 py-1 text-left transition hover:bg-hover"
            >
              <div className="flex items-center -space-x-2">
                {preview.map((m) => (
                  <Avatar key={m.id} src={m.avatar_url} alt={m.username || ""} size="sm" />
                ))}
              </div>
              <div className="flex items-center gap-1 text-xs text-textMuted">
                <UsersIcon className="h-4 w-4" />
                <span>
                  {count} {count === 1 ? "member" : "members"}
                </span>
              </div>
            </button>

            {hasMenu ? (
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  aria-label="Group options"
                  onClick={() => setMenuOpen((o) => !o)}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-textMuted transition hover:bg-hover hover:text-primary"
                >
                  <MoreVertical className="h-5 w-5" />
                </button>

                {menuOpen ? (
                  <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-border bg-surface py-1 shadow-lg">
                    {canAddMember ? (
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-textPrimary transition hover:bg-hover"
                        onClick={() => {
                          setMenuOpen(false);
                          onMenuAddMember?.();
                        }}
                      >
                        <UserPlus className="h-4 w-4" />
                        Add member
                      </button>
                    ) : null}
                    {canRename ? (
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-textPrimary transition hover:bg-hover"
                        onClick={() => {
                          setMenuOpen(false);
                          onMenuRename?.();
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                        Rename group
                      </button>
                    ) : null}
                    {canDelete ? (
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 transition hover:bg-red-50"
                        onClick={() => {
                          setMenuOpen(false);
                          onMenuDelete?.();
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete group
                      </button>
                    ) : null}
                    {canLeave ? (
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-amber-700 transition hover:bg-amber-50"
                        onClick={() => {
                          setMenuOpen(false);
                          onMenuLeave?.();
                        }}
                      >
                        <LogOut className="h-4 w-4" />
                        Leave group
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}
          </>
        ) : hasMenu ? (
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              aria-label="Conversation options"
              onClick={() => setMenuOpen((o) => !o)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-textMuted transition hover:bg-hover hover:text-primary"
            >
              <MoreVertical className="h-5 w-5" />
            </button>

            {menuOpen ? (
              <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-border bg-surface py-1 shadow-lg">
                {isBlockedByMe ? (
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-textPrimary transition hover:bg-hover"
                    onClick={() => {
                      setMenuOpen(false);
                      onUnblockUser?.();
                    }}
                  >
                    <UserCheck className="h-4 w-4" />
                    Unblock user
                  </button>
                ) : (
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 transition hover:bg-red-50"
                    onClick={() => {
                      setMenuOpen(false);
                      onBlockUser?.();
                    }}
                  >
                    <UserX className="h-4 w-4" />
                    Block user
                  </button>
                )}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </header>
  );
};
