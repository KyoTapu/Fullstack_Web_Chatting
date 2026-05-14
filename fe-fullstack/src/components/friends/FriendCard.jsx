import React from "react";
import { MessageSquare, Phone, MoreVertical, UserPlus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { createDirect } from "../../api/chat.api";
import { useCallContext } from "../../context/CallProvider";


export const FriendCard = ({ friend, isSearch, onAddFriend }) => {
  const { id } = friend;
  const { onlineUsers = [] } = useCallContext() || {};
  const [verticalOption, setVerticalOption] = useState(false);
  const isOnline = onlineUsers.includes(String(id || friend._id || friend.user_id));
  const presenceColorClass = isOnline ? "bg-emerald-500" : "bg-stone-400";
  const pillClass = isOnline 
    ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
    : "bg-stone-50 text-stone-600 border border-stone-200";
  const label = isOnline ? "Online" : "Offline";
  const navigate = useNavigate();

  const handleMessage = async () => {
    try {
      const res = await createDirect(friend._id || friend.id);
      const convId = res.data?.conversationId || res.conversationId;

      if (!convId) throw new Error("No conversationId returned");

      navigate(
        "/",
        {
          state: {
            conversation: {
              _id: convId,
              type: "direct",
              friend,
            },
          },
        },
      );
    } catch (err) {
      console.error("Create direct error:", err);
      window.alert(err.message || "Could not open this conversation.");
    }
  };

  return (
    <div className="relative flex flex-col rounded-2xl border border-border bg-surface p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="mb-3 flex items-start justify-between">
        <div className="relative h-14 w-14">
          <img
            src={friend.avatar_url || "ezicon.png"}
            className="h-full w-full rounded-full object-cover"
          />
          <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full">
            <span className={`inline-block h-full w-full rounded-full ${presenceColorClass}`} />
          </div>
        </div>

        <button
          type="button"
          onClick={() => setVerticalOption((prev) => !prev)}
          className="flex h-8 w-8 items-center justify-center rounded-full text-textMuted transition hover:bg-hover hover:text-textPrimary"
        >
          <MoreVertical className="h-4 w-4" />
        </button>

        {verticalOption ? (
          <div className="absolute right-0 top-10 z-10 overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
            <Link
              to={`/profile/${id}`}
              className="flex items-center gap-2 px-4 py-2 text-sm text-textPrimary transition hover:bg-hover"
            >
              <MessageSquare className="h-4 w-4" />
              <span>Profile</span>
            </Link>
          </div>
        ) : null}
      </div>

      <div className="mb-3">
        <h3 className="text-sm font-semibold text-textPrimary line-clamp-1 pr-3">{friend.username}</h3>
        <p className="text-sm font-medium text-textPrimary line-clamp-1 ">{friend.email}</p>
        <p className="text-xs text-textMuted line-clamp-1">{friend.short_description}</p>

        <div className="mt-2 flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${presenceColorClass}`} />
          <span
            className={`inline-flex items-center rounded-full px-2 py-1 text-[11px] font-medium capitalize ${pillClass}`}
          >
            {label}
          </span>
        </div>
      </div>

      <div className="mt-auto flex items-center gap-2">
        {isSearch ? (
          <button
            type="button"
            onClick={onAddFriend}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2 text-xs font-medium transition hover:bg-opacity-90"
            style={{ color: "var(--app-chat-bubble-own-text)" }}
          >
            <UserPlus className="h-4 w-4" />
            <span>Add Friend</span>
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={handleMessage}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2 text-xs font-medium transition hover:bg-opacity-90"
              style={{ color: "var(--app-chat-bubble-own-text)" }}
            >
              <MessageSquare className="h-4 w-4" />
              <span>Message</span>
            </button>
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background text-textMuted transition hover:bg-hover hover:text-textPrimary"
            >
              <Phone className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};
