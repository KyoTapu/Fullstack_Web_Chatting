import React, { useEffect, useMemo, useRef, useState } from "react";
import { Paperclip, Send } from "lucide-react";
import EmojiChat from "./EmojiChat";
import { useSettings } from "../../context/SettingsContext";

const findMentionMatch = (text, caretIndex) => {
  const beforeCaret = text.slice(0, caretIndex);
  return beforeCaret.match(/(^|\s)@([^\s@]*)$/);
};

const MENTION_TOKEN_PATTERN = /(^|[\s])@([A-Za-z0-9._-]+)/g;

export const MessageInput = ({
  onSend,
  onUpdateMessage,
  onSendFile,
  sending,
  onTyping,
  mentionCandidates = [],
  placeholder = "Type a message...",
  editingMessage = null,
  onCancelEdit,
  disabled = false,
  disabledReason = "",
}) => {
  const [value, setValue] = useState("");
  const [activeMentionIndex, setActiveMentionIndex] = useState(0);
  const [dismissedMentionKey, setDismissedMentionKey] = useState(null);
  const {
    settings: {
      chat: { pressEnterToSendMessages },
    },
  } = useSettings();
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const shouldRestoreFocusRef = useRef(false);
  const isEditing = Boolean(editingMessage?._id);

  const focusTextarea = () => {
    requestAnimationFrame(() => {
      if (!textareaRef.current || sending) return;

      textareaRef.current.focus();
      const nextLength = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(nextLength, nextLength);
    });
  };

  useEffect(() => {
    if (isEditing) {
      setValue(editingMessage?.content || "");
      setActiveMentionIndex(0);
      setDismissedMentionKey(null);

      requestAnimationFrame(() => {
        if (!textareaRef.current) return;
        const nextLength = (editingMessage?.content || "").length;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(nextLength, nextLength);
      });
      return;
    }

    setValue("");
    setActiveMentionIndex(0);
    setDismissedMentionKey(null);
  }, [editingMessage, isEditing]);

  useEffect(() => {
    if (!sending && shouldRestoreFocusRef.current) {
      shouldRestoreFocusRef.current = false;
      focusTextarea();
    }
  }, [sending]);

  const mentionState = useMemo(() => {
    const textarea = textareaRef.current;
    const caretIndex = textarea?.selectionStart ?? value.length;
    const match = findMentionMatch(value, caretIndex);
    if (!match) return null;

    const query = (match[2] || "").toLowerCase();
    const filtered = mentionCandidates.filter((candidate) => {
      const valueText = String(candidate.value || "").toLowerCase();
      const labelText = String(candidate.label || "").toLowerCase();
      return valueText.includes(query) || labelText.includes(query);
    });

    if (!filtered.length) return null;

    const mentionKey = `${match.index}-${caretIndex}-${query}`;
    if (dismissedMentionKey === mentionKey) return null;

    return {
      caretIndex,
      query,
      mentionStart: caretIndex - match[2].length - 1,
      mentionKey,
      options: filtered.slice(0, 6),
    };
  }, [dismissedMentionKey, mentionCandidates, value]);

  const insertMention = (candidate) => {
    if (!candidate || !mentionState) return;

    const nextValue = `${value.slice(0, mentionState.mentionStart)}@${candidate.value} ${value.slice(mentionState.caretIndex)}`;
    const nextCaret = mentionState.mentionStart + candidate.value.length + 2;

    setValue(nextValue);
    setActiveMentionIndex(0);
    setDismissedMentionKey(null);
    onTyping?.(true);

    requestAnimationFrame(() => {
      if (!textareaRef.current) return;
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(nextCaret, nextCaret);
    });
  };

  const extractMentions = (text) => {
    const candidateMap = new Map(
      mentionCandidates.map((candidate) => [
        String(candidate.value || "").toLowerCase(),
        candidate,
      ]),
    );
    const mentions = [];
    const seen = new Set();

    for (const match of text.matchAll(MENTION_TOKEN_PATTERN)) {
      const mentionValue = String(match[2] || "").toLowerCase();
      const candidate = candidateMap.get(mentionValue);
      if (!candidate) continue;

      const mentionId = String(candidate.id || candidate.value);
      if (seen.has(mentionId)) continue;
      seen.add(mentionId);

      mentions.push({
        userId: mentionId,
        value: candidate.value,
        label: candidate.label,
      });
    }

    return mentions;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || sending || disabled) return;
    shouldRestoreFocusRef.current = true;

    const payload = {
      content: trimmed,
      mentions: extractMentions(trimmed),
    };

    if (isEditing && editingMessage?._id) {
      await onUpdateMessage?.(editingMessage._id, payload);
      onCancelEdit?.();
    } else {
      await onSend?.(payload);
    }

    setValue("");
    onTyping?.(false);
  };

  const handleInputChange = (e) => {
    setValue(e.target.value);
    setActiveMentionIndex(0);
    setDismissedMentionKey(null);
    if (!disabled) {
      onTyping?.(true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      onTyping?.(false);
    }, 2000);
  };

  const handleEmojiClick = (emojiData) => {
    setValue((prev) => prev + emojiData.emoji);
  };

  const handleKeyDown = (e) => {
    if (mentionState?.options?.length) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveMentionIndex((prev) => (prev + 1) % mentionState.options.length);
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveMentionIndex((prev) => (prev - 1 + mentionState.options.length) % mentionState.options.length);
        return;
      }

      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        insertMention(mentionState.options[activeMentionIndex] || mentionState.options[0]);
        return;
      }

      if (e.key === "Escape") {
        e.preventDefault();
        setActiveMentionIndex(0);
        setDismissedMentionKey(mentionState.mentionKey);
        return;
      }
    }

    const shouldSendWithShortcut =
      !pressEnterToSendMessages && (e.ctrlKey || e.metaKey);

    if (
      e.key === "Enter" &&
      !e.shiftKey &&
      (pressEnterToSendMessages || shouldSendWithShortcut)
    ) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handlePickFile = () => {
    if (sending || isEditing || disabled) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    if (!disabled) {
      onSendFile?.(selectedFile);
    }
    e.target.value = "";
  };

  const handleCancelEdit = () => {
    setValue("");
    setActiveMentionIndex(0);
    setDismissedMentionKey(null);
    onTyping?.(false);
    onCancelEdit?.();
    focusTextarea();
  };

  const effectivePlaceholder = disabled
    ? disabledReason || "You cannot send messages right now."
    : isEditing
    ? "Edit your message..."
    : placeholder;

  return (
    <form onSubmit={handleSubmit} className="relative rounded-2xl border border-border bg-chatInput px-3 py-2 shadow-sm">
      {isEditing ? (
        <div className="mb-2 flex items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          <div className="min-w-0">
            <p className="font-semibold">Editing message</p>
            <p className="truncate text-amber-800/80">You can update the content and save it.</p>
          </div>

          <button
            type="button"
            onClick={handleCancelEdit}
            className="rounded-full border border-amber-300 px-3 py-1 font-medium transition hover:bg-amber-100"
          >
            Cancel
          </button>
        </div>
      ) : null}

      {mentionState?.options?.length ? (
        <div className="absolute bottom-full left-3 right-3 z-20 mb-2 overflow-hidden rounded-2xl border border-border bg-surface shadow-xl">
          <div className="border-b border-border px-3 py-2 text-xs font-medium uppercase tracking-wide text-textMuted">
            Mention someone
          </div>
          <div className="max-h-64 overflow-y-auto py-1">
            {mentionState.options.map((candidate, index) => {
              const isActive = index === activeMentionIndex;
              return (
                <button
                  key={candidate.id || candidate.value}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    insertMention(candidate);
                  }}
                  className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left transition ${
                    isActive ? "bg-background" : "hover:bg-background"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-textPrimary">{candidate.label}</p>
                    <p className="truncate text-xs text-textMuted">@{candidate.value}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="flex w-full min-w-0 items-center gap-2 px-2 py-2">
        <EmojiChat handleEmojiClick={handleEmojiClick} disabled={disabled || sending} />

        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-full text-textMuted transition hover:bg-hover hover:text-textPrimary disabled:opacity-50"
          onClick={handlePickFile}
          disabled={sending || isEditing || disabled}
        >
          <Paperclip className="h-4 w-4" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
          disabled={sending}
        />

        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={effectivePlaceholder}
          disabled={sending || disabled}
          className="min-w-0 flex-1 resize-none bg-transparent text-sm text-textPrimary placeholder:text-textMuted focus:outline-none disabled:opacity-50"
        />

        <button
          type="submit"
          onMouseDown={(e) => e.preventDefault()}
          disabled={sending || disabled || !value.trim()}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-chatBubbleOwn text-chatBubbleOwnText shadow-sm transition disabled:opacity-50"
        >
          {sending ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </div>
    </form>
  );
};
