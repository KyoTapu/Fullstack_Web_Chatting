import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChatHeader } from "./ChatHeader";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import MessageDetailsModal from "./MessageDetailsModal";
import { Avatar } from "../ui/Avatar";
import useChat, { MESSAGE_DELETE_WINDOW_MS, MESSAGE_EDIT_WINDOW_MS } from "../../hooks/useChat";
import { useAuth } from "../../context/AuthContext";
import { useSettings } from "../../context/SettingsContext";
import { MessageSkeleton } from "../skeleton/MessageSkeleton";
import { MessageCircle } from "lucide-react";
import { getSocket } from "../../socket/socket";
import StartChat from "./StartChat";

const chatBackgroundStyle = {
  backgroundColor: "var(--app-chat-bg-end)",
  backgroundImage:
    "linear-gradient(180deg, var(--app-chat-bg-start) 0%, var(--app-chat-bg-end) 100%)",
};

const normalizeMentionValue = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "")
    .toLowerCase();

const buildMentionCandidate = (member) => {
  if (!member) return null;

  const label =
    member.profile?.full_name ||
    member.full_name ||
    member.username ||
    member.name ||
    "Member";
  const mentionValue = normalizeMentionValue(member.username || label);

  if (!mentionValue) return null;

  return {
    id: member.user_id || member.id || member._id || mentionValue,
    label,
    value: mentionValue,
  };
};

export const ChatWindow = ({
  conversation,
  groupMembers = [],
  groupMemberCount,
  onGroupOpenMembers,
  onGroupMenuAddMember,
  onGroupMenuRename,
  onGroupMenuDelete,
  onGroupMenuLeave,
  onBlockUser,
  onUnblockUser,
  groupCanAddMember,
  groupCanRename,
  groupCanDelete,
  groupCanLeave,
  directBlockState = { status: "none" },
}) => {
  const { user: currentUser } = useAuth();
  const {
    settings: {
      appearance: { showAvatarsInChat },
    },
  } = useSettings();
  const {
    messages,
    handleSend,
    handleSendFile,
    handleUpdateMessage,
    handleRecallMessage,
    handleToggleReaction,
    loadMessageDetails,
    loading,
    sending,
    setMessages,
    formatMessage,
  } = useChat(conversation);

  const messagesEndRef = useRef(null);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [editingMessage, setEditingMessage] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsMessage, setDetailsMessage] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");

  const convId = conversation?._id || conversation?.id;
  const isGroup = conversation?.type === "group";
  const currentUserId = currentUser?.id || currentUser?._id;
  const isDirectBlocked = !isGroup && directBlockState?.status && directBlockState.status !== "none";

  const mentionCandidates = useMemo(() => {
    const pool = isGroup ? groupMembers : [conversation?.friend].filter(Boolean);
    const seen = new Set();

    return pool
      .filter((member) => String(member?.user_id || member?.id || member?._id) !== String(currentUserId))
      .map(buildMentionCandidate)
      .filter((candidate) => {
        if (!candidate) return false;
        const key = candidate.value.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }, [conversation?.friend, currentUserId, groupMembers, isGroup]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  useEffect(() => {
    setTypingUsers(new Set());
    setEditingMessage(null);
    setDetailsOpen(false);
    setDetailsMessage(null);
    setDetailsError("");
  }, [convId]);

  const resolveMessageUser = useMemo(() => {
    return (message) => {
      if (!message) return null;

      const messageUserId = String(message.userId);
      if (messageUserId === String(currentUserId)) {
        return {
          name:
            currentUser?.profile?.full_name ||
            currentUser?.full_name ||
            currentUser?.username ||
            "You",
          avatarUrl: currentUser?.profile?.avatar_url || currentUser?.avatar_url || "/ezicon.png",
        };
      }

      if (isGroup) {
        const member = groupMembers.find(
          (candidate) => String(candidate.user_id || candidate.id || candidate._id) === messageUserId,
        );

        if (member) {
          return {
            name: member.profile?.full_name || member.full_name || member.username || "Member",
            avatarUrl: member.profile?.avatar_url || member.avatar_url || member.avatarUrl || "/ezicon.png",
          };
        }
      }

      const friend = conversation?.friend;
      if (friend) {
        return {
          name:
            friend.profile?.full_name ||
            friend.full_name ||
            friend.display_name ||
            friend.username ||
            "Friend",
          avatarUrl: friend.profile?.avatar_url || friend.avatar_url || friend.avatarUrl || "/ezicon.png",
        };
      }

      return null;
    };
  }, [conversation?.friend, currentUser?.avatar_url, currentUser?.full_name, currentUser?.profile?.avatar_url, currentUser?.profile?.full_name, currentUser?.username, currentUserId, groupMembers, isGroup]);

  const isMessageEditable = (message) => {
    if (!message) return false;
    if (String(message.userId) !== String(currentUserId)) return false;
    if (message.pending || message.isRecalled || message.type !== "text") return false;

    const deadline = message.editWindowEndsAt
      ? new Date(message.editWindowEndsAt).getTime()
      : new Date(message.createdAt).getTime() + MESSAGE_EDIT_WINDOW_MS;

    return !Number.isNaN(deadline) && Date.now() <= deadline;
  };

  const isMessageRecallable = (message) =>
    Boolean(
      message &&
      String(message.userId) === String(currentUserId) &&
      !message.pending &&
      !message.isRecalled &&
      (() => {
        const deadline = message.deleteWindowEndsAt
          ? new Date(message.deleteWindowEndsAt).getTime()
          : new Date(message.createdAt).getTime() + MESSAGE_DELETE_WINDOW_MS;

        return !Number.isNaN(deadline) && Date.now() <= deadline;
      })(),
    );

  const dispatchConversationUpdated = () => {
    if (!convId) return;
    window.dispatchEvent(
      new CustomEvent("chat:conversation-updated", {
        detail: { conversationId: String(convId) },
      }),
    );
  };

  const openMessageDetails = async (message) => {
    if (!message?._id) return;

    setDetailsOpen(true);
    setDetailsMessage(message);
    setDetailsError("");
    setDetailsLoading(true);

    try {
      const nextDetails = await loadMessageDetails(message._id);
      setDetailsMessage(nextDetails || message);
    } catch (error) {
      setDetailsError(error.message || "Could not load message details.");
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleStartEdit = (message) => {
    if (!isMessageEditable(message)) return;
    setEditingMessage(message);
  };

  const handleSubmitEdit = async (messageId, payload) => {
    try {
      const updatedMessage = await handleUpdateMessage(messageId, payload);
      if (updatedMessage) {
        if (String(detailsMessage?._id) === String(updatedMessage._id)) {
          setDetailsMessage(updatedMessage);
        }
      }
      return updatedMessage;
    } catch (error) {
      window.alert(error.message || "Could not update this message.");
      throw error;
    }
  };

  const handleRecall = async (message) => {
    if (!isMessageRecallable(message)) return;
    if (!window.confirm("Delete this message for everyone in the conversation?")) return;

    try {
      const updatedMessage = await handleRecallMessage(message._id);
      if (updatedMessage) {
        if (String(editingMessage?._id) === String(updatedMessage._id)) {
          setEditingMessage(null);
        }
        if (String(detailsMessage?._id) === String(updatedMessage._id)) {
          setDetailsMessage(updatedMessage);
        }
      }
    } catch (error) {
      window.alert(error.message || "Could not delete this message.");
    }
  };

  const handleTyping = (isTyping) => {
    const socket = getSocket();
    if (socket && convId) {
      socket.emit("typing", { conversationId: convId, userId: currentUser?.id || currentUser?._id, isTyping });
    }
  };

  useEffect(() => {
    if (!convId) return;
    const socket = getSocket();
    if (!socket) return;

    const handler = (message) => {
      if (String(message.conversationId) !== String(convId)) return;

      const incoming = formatMessage(message);
      setMessages((prev) => {
        const exists = prev.some((m) => String(m._id) === String(incoming?._id));
        if (exists) return prev;

        return [...prev, incoming];
      });
      dispatchConversationUpdated();
      setTypingUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(String(message.senderId || message.userId));
        return newSet;
      });
    };

    const messageUpdatedHandler = (message) => {
      if (String(message.conversationId) !== String(convId)) return;

      const incoming = formatMessage(message);
      if (!incoming) return;

      setMessages((prev) =>
        prev.map((existingMessage) =>
          String(existingMessage._id) === String(incoming._id)
            ? {
                ...existingMessage,
                ...incoming,
                pending: false,
              }
            : existingMessage,
        ),
      );
      dispatchConversationUpdated();

      if (String(editingMessage?._id) === String(incoming._id) && !isMessageEditable(incoming)) {
        setEditingMessage(null);
      }

      if (String(detailsMessage?._id) === String(incoming._id)) {
        setDetailsMessage(incoming);
      }
    };

    const typingHandler = ({ conversationId, userId, isTyping }) => {
      if (String(conversationId) !== String(convId)) return;
      if (String(userId) === String(currentUser?.id || currentUser?._id)) return;

      setTypingUsers((prev) => {
        const newSet = new Set(prev);
        if (isTyping) newSet.add(String(userId));
        else newSet.delete(String(userId));
        return newSet;
      });
    };

    socket.on("receive_message", handler);
    socket.on("message_updated", messageUpdatedHandler);
    socket.on("typing", typingHandler);

    return () => {
      socket.off("receive_message", handler);
      socket.off("message_updated", messageUpdatedHandler);
      socket.off("typing", typingHandler);
    };
  }, [convId, currentUser, detailsMessage?._id, editingMessage?._id, formatMessage, setMessages]);

  if (!convId) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-surface text-center px-6 text-textPrimary">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-background text-primary">
          <MessageCircle />
        </div>
        <h2 className="text-lg font-semibold text-textPrimary">No conversation selected</h2>
        <p className="mt-2 max-w-sm text-sm text-textMuted">
          Choose a conversation from the sidebar to start chatting with your friends.
        </p>
      </div>
    );
  }

  return (
    <section className="flex h-full min-w-0 flex-1 flex-col overflow-hidden bg-chatPanel">
      <ChatHeader
        conversation={conversation}
        groupMembers={isGroup ? groupMembers : []}
        memberCount={isGroup ? groupMemberCount : undefined}
        onOpenMembers={isGroup ? onGroupOpenMembers : undefined}
        onMenuAddMember={isGroup ? onGroupMenuAddMember : undefined}
        onMenuRename={isGroup ? onGroupMenuRename : undefined}
        onMenuDelete={isGroup ? onGroupMenuDelete : undefined}
        onMenuLeave={isGroup ? onGroupMenuLeave : undefined}
        onBlockUser={!isGroup ? onBlockUser : undefined}
        onUnblockUser={!isGroup ? onUnblockUser : undefined}
        canAddMember={isGroup ? !!groupCanAddMember : false}
        canRename={isGroup ? !!groupCanRename : false}
        canDelete={isGroup ? !!groupCanDelete : false}
        canLeave={isGroup ? !!groupCanLeave : false}
        directBlockState={directBlockState}
      />

      <div
        className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden px-6 py-4 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
        style={chatBackgroundStyle}
      >
        {loading && <MessageSkeleton />}

        {!loading && messages.length === 0 && <div className="text-center text-sm text-textMuted"><StartChat/></div>}

        {messages.map((msg, index) => {
          const isOwn = String(msg.userId) === String(currentUser?.id || currentUser?._id);

          const user = !isOwn && showAvatarsInChat ? resolveMessageUser(msg) : null;

          const prev = messages[index - 1];
          const next = messages[index + 1];

          const isFirstInSequence = prev?.userId !== msg.userId;
          const isLastInSequence = next?.userId !== msg.userId;

          return (
            <MessageBubble
              key={msg._id || msg.id}
              message={msg}
              user={user}
              isOwn={isOwn}
              isFirstInSequence={isFirstInSequence}
              isLastInSequence={isLastInSequence}
              currentUserId={currentUserId}
              canEdit={isMessageEditable(msg)}
              canRecall={isMessageRecallable(msg)}
              onEdit={handleStartEdit}
              onRecall={handleRecall}
              onViewDetails={openMessageDetails}
              onToggleReaction={handleToggleReaction}
            />
          );
        })}

        {typingUsers.size > 0 && (
          <div className="mb-4 flex w-full gap-2 justify-start">
            <div className="flex-shrink-0 w-8 flex flex-col justify-end">
              {Array.from(typingUsers).slice(0, 1).map((id) => {
                 let tUser = null;
                 if (isGroup) {
                   const member = groupMembers.find((m) => String(m.user_id || m.id) === id);
                   tUser = member ? { name: member.username, avatarUrl: member.profile?.avatar_url || member.avatar_url || member.avatarUrl } : null;
                 } else {
                   const f = conversation?.friend;
                   tUser = f ? { name: f.username || f.full_name, avatarUrl: f.profile?.avatar_url || f.avatar_url || f.avatarUrl } : null;
                 }
                 return tUser ? <Avatar key={id} src={tUser.avatarUrl} alt={tUser.name || "User"} size="sm" /> : null;
              })}
            </div>
            <div className="flex max-w-[85%] md:max-w-[70%] flex-col items-start">
              <div className="relative px-3.5 py-2.5 text-[15px] rounded-[18px] bg-[#E4E6EB] text-black">
                <div className="flex gap-1 items-center h-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-stone-500 animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-stone-500 animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-stone-500 animate-bounce"></span>
                </div>
              </div>
              {typingUsers.size > 1 && (
                <div className="text-[10px] text-stone-500 mt-1 ml-1">{typingUsers.size} people are typing...</div>
              )}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="flex-shrink-0 border-t border-border bg-chatPanel px-6 py-3">
        {isDirectBlocked ? (
          <div className="mb-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {directBlockState.status === "blocked_by_me"
              ? "You blocked this user. Unblock them to continue chatting."
              : "You cannot send messages because this user has blocked you."}
          </div>
        ) : null}

        <MessageInput
          onSend={handleSend}
          onUpdateMessage={handleSubmitEdit}
          onSendFile={handleSendFile}
          onTyping={handleTyping}
          sending={sending}
          mentionCandidates={mentionCandidates}
          editingMessage={editingMessage}
          onCancelEdit={() => setEditingMessage(null)}
          placeholder={
            conversation?.type === "group"
              ? `Message #${conversation?.name || "group"}`
              : `Message ${conversation?.friend?.username || "user"}`
          }
          disabled={isDirectBlocked}
          disabledReason={
            directBlockState.status === "blocked_by_me"
              ? "Unblock this user to send a message."
              : directBlockState.status === "blocked_by_them"
              ? "This user has blocked you."
              : ""
          }
          key={convId}
        />
      </div>

      <MessageDetailsModal
        open={detailsOpen}
        message={detailsMessage}
        sender={resolveMessageUser(detailsMessage)}
        loading={detailsLoading}
        error={detailsError}
        onClose={() => {
          setDetailsOpen(false);
          setDetailsError("");
        }}
        onRetry={() => openMessageDetails(detailsMessage)}
      />
    </section>
  );
};
