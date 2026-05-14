import React, { useEffect, useRef, useState } from "react";
import { Info, Pencil, Smile, Undo2 } from "lucide-react";
import { Avatar } from "../ui/Avatar";

const REACTION_OPTIONS = ["👍", "❤️", "😂", "😮", "😢", "😡"];

const formatSize = (bytes) => {
  if (typeof bytes !== "number" || Number.isNaN(bytes) || bytes < 0) {
    return "";
  }

  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const MENTION_PATTERN = /(^|[\s])(@[A-Za-z0-9._-]+)/g;

const renderMessageWithMentions = (content, isOwn) => {
  const text = String(content || "");
  if (!text) return null;

  const parts = [];
  let lastIndex = 0;

  for (const match of text.matchAll(MENTION_PATTERN)) {
    const prefix = match[1] || "";
    const mention = match[2] || "";
    const matchIndex = match.index ?? 0;
    const mentionStart = matchIndex + prefix.length;

    if (mentionStart > lastIndex) {
      parts.push(text.slice(lastIndex, mentionStart));
    }

    parts.push(
      <span
        key={`${mention}-${mentionStart}`}
        className={`inline rounded-full px-1 py-0.5 text-[0.95em] font-semibold ${
          isOwn
            ? "bg-white/18 text-white"
            : "bg-sky-500/12 text-sky-700"
        }`}
      >
        {mention}
      </span>,
    );

    lastIndex = mentionStart + mention.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length ? parts : text;
};

const MessageContent = ({ message, isOwn }) => {
  const attachmentStyle = isOwn
    ? {
        backgroundColor: "rgba(255,255,255,0.10)",
        borderColor: "rgba(255,255,255,0.30)",
        color: "var(--app-chat-bubble-own-text)",
      }
    : {
        backgroundColor: "rgba(255,255,255,0.82)",
        borderColor: "var(--app-border)",
        color: "var(--app-chat-bubble-other-text)",
      };

  if (message.isRecalled) {
    return (
      <p className="whitespace-pre-wrap break-words text-sm italic opacity-80" style={{ wordBreak: "break-word" }}>
        {isOwn ? "You deleted a message." : "This message was deleted."}
      </p>
    );
  }

  if (message.type === "image" && message.fileUrl) {
    return (
      <a href={message.fileUrl} target="_blank" rel="noreferrer" className="block">
        <img
          src={message.fileUrl}
          alt={message.fileName || "sent image"}
          className="max-h-80 max-w-full rounded-lg object-cover"
        />
      </a>
    );
  }

  if (message.type === "file" && message.fileUrl) {
    return (
      <a
        href={message.fileUrl}
        target="_blank"
        rel="noreferrer"
        className="block rounded-lg border px-3 py-2 text-sm"
        style={attachmentStyle}
      >
        <p className="font-medium break-all">{message.fileName || message.content || "Attachment"}</p>
        {message.fileSize ? <p className="mt-0.5 text-xs opacity-80">{formatSize(message.fileSize)}</p> : null}
      </a>
    );
  }

  return (
    <p className="whitespace-pre-wrap break-words" style={{ wordBreak: "break-word" }}>
      {renderMessageWithMentions(message.content, isOwn)}
    </p>
  );
};

export const MessageBubble = ({
  message,
  user,
  isOwn,
  isFirstInSequence,
  isLastInSequence,
  currentUserId,
  canEdit = false,
  canRecall = false,
  onEdit,
  onRecall,
  onViewDetails,
  onToggleReaction,
}) => {
  const [reactionPickerOpen, setReactionPickerOpen] = useState(false);
  const reactionPickerRef = useRef(null);

  useEffect(() => {
    if (!reactionPickerOpen) return undefined;

    const handleClickOutside = (event) => {
      if (reactionPickerRef.current && !reactionPickerRef.current.contains(event.target)) {
        setReactionPickerOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [reactionPickerOpen]);

  const groupedReactions = Array.from(
    (Array.isArray(message.reactions) ? message.reactions : []).reduce((map, reaction) => {
      const emoji = String(reaction?.emoji || "");
      if (!emoji) return map;

      const current = map.get(emoji) || {
        emoji,
        count: 0,
        reactedByMe: false,
      };

      current.count += 1;
      if (String(reaction?.userId) === String(currentUserId)) {
        current.reactedByMe = true;
      }

      map.set(emoji, current);
      return map;
    }, new Map()).values(),
  );

  if (message.dateLabel) {
    return (
      <div className="my-4 flex items-center justify-center text-[11px] font-medium tracking-wide text-textMuted">
        <span className="h-px flex-1 bg-border" />
        <span className="mx-3 uppercase">{message.dateLabel}</span>
        <span className="h-px flex-1 bg-border" />
      </div>
    );
  }

  const getRadiusClasses = () => {
    if (isOwn) {
      if (isFirstInSequence && isLastInSequence) return "rounded-[18px]";
      if (isFirstInSequence) return "rounded-tl-[18px] rounded-tr-[18px] rounded-bl-[18px] rounded-br-[4px]";
      if (isLastInSequence) return "rounded-tl-[18px] rounded-tr-[4px] rounded-bl-[18px] rounded-br-[18px]";
      return "rounded-tl-[18px] rounded-tr-[4px] rounded-bl-[18px] rounded-br-[4px]";
    }

    if (isFirstInSequence && isLastInSequence) return "rounded-[18px]";
    if (isFirstInSequence) return "rounded-tl-[18px] rounded-tr-[18px] rounded-br-[18px] rounded-bl-[4px]";
    if (isLastInSequence) return "rounded-tl-[4px] rounded-tr-[18px] rounded-br-[18px] rounded-bl-[18px]";
    return "rounded-tl-[4px] rounded-tr-[18px] rounded-br-[18px] rounded-bl-[4px]";
  };

  const bubbleBase = `relative px-3.5 py-2 text-[15px] shadow-sm ${getRadiusClasses()}`;
  const bubbleStyle = isOwn
    ? {
        backgroundColor: "var(--app-chat-bubble-own)",
        color: "var(--app-chat-bubble-own-text)",
      }
    : {
        backgroundColor: "var(--app-chat-bubble-other)",
        color: "var(--app-chat-bubble-other-text)",
        border: "1px solid var(--app-border)",
      };

  const canReact = Boolean(onToggleReaction && !message.pending && !message.isRecalled);
  const actionButtonClass =
    "flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface/95 text-textMuted shadow-sm transition hover:text-textPrimary hover:bg-background disabled:cursor-not-allowed disabled:opacity-40";
  const showActions = Boolean(canReact || onViewDetails || onEdit || onRecall);
  const statusBits = [message.time];

  if (message.pending) {
    statusBits.push("Sending...");
  } else if (message.isRecalled) {
    statusBits.push("Deleted");
  } else if (message.isEdited) {
    statusBits.push("Edited");
  }

  const renderActions = () => {
    if (!showActions || message.pending) return null;

    return (
      <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
        {canReact ? (
          <div className="relative" ref={reactionPickerRef}>
            <button
              type="button"
              onClick={() => setReactionPickerOpen((prev) => !prev)}
              className={actionButtonClass}
              title="React to message"
            >
              <Smile className="h-4 w-4" />
            </button>

            {reactionPickerOpen ? (
              <div className="absolute bottom-full right-0 z-20 mb-2 flex items-center gap-1 rounded-full border border-border bg-surface px-2 py-1 shadow-lg">
                {REACTION_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={async () => {
                      setReactionPickerOpen(false);
                      try {
                        await onToggleReaction?.(message._id || message.id, emoji);
                      } catch (error) {
                        window.alert(error.message || "Could not update reaction.");
                      }
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-base transition hover:bg-hover"
                    title={`React with ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {onViewDetails ? (
          <button
            type="button"
            onClick={() => onViewDetails(message)}
            className={actionButtonClass}
            title="View message details"
          >
            <Info className="h-4 w-4" />
          </button>
        ) : null}

        {canEdit && onEdit ? (
          <button
            type="button"
            onClick={() => onEdit(message)}
            className={actionButtonClass}
            title="Edit message"
          >
            <Pencil className="h-4 w-4" />
          </button>
        ) : null}

        {canRecall && onRecall ? (
          <button
            type="button"
            onClick={() => onRecall(message)}
            className={actionButtonClass}
            title="Delete message"
          >
            <Undo2 className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    );
  };

  return (
    <div className={`group flex w-full gap-2 ${isOwn ? "justify-end" : "justify-start"} ${isLastInSequence ? "mb-4" : "mb-[2px]"}`}>
      {!isOwn && (
        <div className="flex-shrink-0 w-8 flex flex-col justify-end">
          {isLastInSequence && user && (
            <Avatar src={user.avatarUrl} alt={user.name} size="sm" />
          )}
        </div>
      )}

      {isOwn ? renderActions() : null}

      <div className={`flex max-w-[85%] md:max-w-[70%] flex-col ${isOwn ? "items-end" : "items-start"}`}>
        {!isOwn && user && isFirstInSequence && (
          <div className="mb-1 ml-1 flex items-baseline gap-2 text-[11px] text-textMuted">
            <span className="font-medium">{user.name}</span>
          </div>
        )}

        <div className={bubbleBase} style={bubbleStyle} title={message.time}>
          <MessageContent message={message} isOwn={isOwn} />
        </div>

        <div className="mt-1 px-1 text-[11px] text-textMuted">
          {statusBits.join(" · ")}
        </div>

        {groupedReactions.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1 px-1">
            {groupedReactions.map((reaction) => (
              <button
                key={reaction.emoji}
                type="button"
                onClick={async () => {
                  if (!canReact) return;
                  try {
                    await onToggleReaction?.(message._id || message.id, reaction.emoji);
                  } catch (error) {
                    window.alert(error.message || "Could not update reaction.");
                  }
                }}
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs transition ${
                  reaction.reactedByMe
                    ? "border-sky-300 bg-sky-50 text-sky-700"
                    : "border-border bg-surface text-textPrimary hover:bg-hover"
                }`}
                title={reaction.reactedByMe ? "Remove your reaction" : "Add this reaction"}
              >
                <span>{reaction.emoji}</span>
                <span>{reaction.count}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {!isOwn ? renderActions() : null}
    </div>
  );
};
