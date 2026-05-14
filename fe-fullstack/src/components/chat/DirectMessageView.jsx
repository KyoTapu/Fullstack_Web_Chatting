import React, { useState, useRef, useEffect } from "react";
import { Phone, Video, Info } from "lucide-react";
import { Avatar } from "../ui/Avatar";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import { users } from "../../data/chatData";
import { mockDmMessages } from "../../data/dmConversation";
import { useCall } from "../../hooks/useCall";
import { usePresence } from "../../context/PresenceContext";

const chatBackgroundStyle = {
  backgroundColor: "var(--app-chat-bg-end)",
  backgroundImage:
    "linear-gradient(180deg, var(--app-chat-bg-start) 0%, var(--app-chat-bg-end) 100%)",
};

export const DirectMessageView = ({
  friend,
  initialMessages = mockDmMessages,
}) => {
  const [chatMessages, setChatMessages] = useState(initialMessages);
  const messagesEndRef = useRef(null);
  const me = users.find((u) => u.isMe);
  const { startCall } = useCall();
  const { isUserOnline } = usePresence();
  const friendProfile = {
    id: friend?.id || friend?._id,
    name: friend?.name || friend?.username,
    avatarUrl: friend?.avatarUrl || friend?.avatar_url,
  };
  const friendId = friend?.id || friend?._id;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleSend = (content) => {
    if (!me) return;
    const now = new Date();
    const time = now.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
    const newMessage = {
      id: `dm-m-${Date.now()}`,
      userId: me.id,
      content,
      time,
    };
    setChatMessages((prev) => [...prev, newMessage]);
  };

  const isOnline = isUserOnline(friend.id || friend._id) || friend.isOnline === true;

  return (
    <section className="flex h-full flex-1 flex-col overflow-hidden bg-chatPanel">
      <header className="flex flex-shrink-0 items-center justify-between border-b border-border bg-chatPanel px-6 py-3">
        <div className="flex w-full items-center justify-start gap-3">
          <Avatar
            src={friend.avatarUrl}
            alt={friend.name}
            size="md"
          />
          <div className="flex min-w-0 flex-col items-start">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-semibold text-primary">
                {friend.name}
              </span>
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${
                  isOnline ? "bg-emerald-500" : "bg-stone-400"
                }`}
                title={isOnline ? "Online" : "Offline"}
              />
            </div>
            {friend.title && (
              <p className="truncate text-xs text-textMuted">{friend.title}</p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-textMuted transition-colors hover:bg-hover hover:text-textPrimary"
            title="Voice call"
            onClick={() => friendId && startCall(friendId, { video: false }, friendProfile)}
          >
            <Phone className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-textMuted transition-colors hover:bg-hover hover:text-textPrimary"
            title="Video call"
            onClick={() => friendId && startCall(friendId, { video: true }, friendProfile)}
          >
            <Video className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-textMuted transition-colors hover:bg-hover hover:text-textPrimary"
            title="Profile details"
          >
            <Info className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div
        className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 py-4 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
        style={chatBackgroundStyle}
      >
        {chatMessages.map((msg, index) => {
          const user =
            msg.userId === "system"
              ? undefined
              : users.find((u) => u.id === msg.userId);
          const isOwn = Boolean(user?.isMe);
          const prev = chatMessages[index - 1];
          const prevUserId = prev?.userId;
          const showAvatar = msg.userId !== prevUserId;

          return (  
            <MessageBubble
              key={msg.id}
              message={msg}
              user={user}
              isOwn={isOwn}
              showAvatar={showAvatar}
            />
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex-shrink-0 border-t border-border bg-chatPanel px-6 py-3">
        <MessageInput
          onSend={handleSend}
          placeholder={`Message @${friend.name}`}
        />
      </div>
    </section>
  );
};
