import React, { useState, useEffect } from "react";
import { X, UserPlus } from "lucide-react";
import { Avatar } from "../ui/Avatar";

export const GroupMembersModal = ({
  isOpen,
  onClose,
  groupId,
  currentUserId,
  groupData,
  onAddMembers,
  friends = [],
  defaultAddMode = false,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAdding(defaultAddMode);
      setSearchTerm("");
    }
  }, [isOpen, defaultAddMode]);

  const selectedGroup = groupData;

  if (!isOpen || !selectedGroup) return null;

  const currentUserRole = selectedGroup.members?.find((m) => m.id === currentUserId)?.role;
  const canAdd = currentUserRole === "OWNER" || currentUserRole === "ADMIN";

  const handleAddMember = async (userId) => {
    setLoadingAction(true);
    try {
      await onAddMembers(groupId, [userId]);
      setSearchTerm("");
    } catch (err) {
      alert(err.message || "Could not add member");
    } finally {
      setLoadingAction(false);
    }
  };

  const existingMemberIds = selectedGroup.members?.map((m) => m.id) || [];
  const q = searchTerm.trim().toLowerCase();
  const friendCandidates = friends.filter((f) => {
    const uid = f.id;
    if (existingMemberIds.includes(uid)) return false;
    const label = (f.full_name || f.username || "").toLowerCase();
    if (!q) return true;
    return label.includes(q) || (f.username || "").toLowerCase().includes(q);
  });

  const roleLabel = (role) => {
    if (role === "OWNER") return "Owner";
    if (role === "ADMIN") return "Admin";
    return "Member";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-background p-6 shadow-lg">
        <div className="flex items-center justify-between border-b pb-3 border-stone-200">
          <h2 className="text-xl font-semibold text-stone-800">
            {isAdding ? "Add from friends" : "Group members"}
          </h2>
          <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-stone-100">
            <X className="h-5 w-5 text-stone-500" />
          </button>
        </div>

        <div className="mt-4 min-h-[300px] max-h-[400px] overflow-y-auto">
          {isAdding ? (
            <div>
              <p className="text-xs text-stone-500 mb-2">Only friends can be added to this group.</p>
              <input
                type="text"
                placeholder="Filter friends…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-md border border-stone-300 px-3 py-2 outline-none focus:border-primary"
              />
              <div className="mt-4 space-y-2">
                {friendCandidates.length === 0 && (
                  <p className="text-sm text-stone-400">No friends to add.</p>
                )}
                {friendCandidates.map((f) => {
                  const uid = f.id;
                  return (
                    <div
                      key={uid}
                      className="flex items-center justify-between rounded-lg p-2 hover:bg-stone-50"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar src={f.avatar_url} alt={f.username} size="sm" />
                        <span className="text-sm font-medium text-stone-700 truncate">
                          {f.full_name || f.username}
                        </span>
                      </div>
                      <button
                        type="button"
                        disabled={loadingAction}
                        onClick={() => handleAddMember(uid)}
                        className="rounded bg-primary px-3 py-1 text-xs text-white hover:bg-primary/90 disabled:opacity-50 shrink-0"
                      >
                        Add
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedGroup.members?.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 rounded-lg p-2 hover:bg-stone-50"
                >
                  <Avatar src={member.avatar_url} alt={member.username} size="sm" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-stone-700 truncate">
                      {member.full_name || member.username}
                    </p>
                    <p className="text-xs text-stone-500">{roleLabel(member.role)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 flex justify-end gap-3 border-t pt-4 border-stone-200">
          {isAdding ? (
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="rounded-lg border border-stone-300 px-4 py-2 text-stone-700 hover:bg-stone-50"
            >
              Back
            </button>
          ) : (
            canAdd && (
              <button
                type="button"
                onClick={() => setIsAdding(true)}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary/90"
              >
                <UserPlus className="h-4 w-4" />
                Add members
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
};
