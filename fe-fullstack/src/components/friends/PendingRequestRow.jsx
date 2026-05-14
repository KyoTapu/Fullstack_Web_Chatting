import React from "react";

export const PendingRequestRow = ({
  request,
  onAccept,
  onDecline,
}) => {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3 shadow-sm transition hover:bg-hover">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 overflow-hidden rounded-full">
          <img
            src={request.avatar_url || "ezicon.png"}
            alt={request.username}
            className="h-full w-full object-cover"
          />
        </div>

        <div>
          <p className="text-sm font-semibold text-textPrimary">
            {request.full_name || request.username}
          </p>
          <p className="text-xs text-textMuted">
            {request.short_description || request.email}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onAccept && onAccept(request.friendship_id)}
          className="rounded-xl bg-primary px-4 py-1.5 text-xs font-medium transition hover:bg-opacity-90"
          style={{ color: "var(--app-chat-bubble-own-text)" }}
        >
          Accept
        </button>
        <button
          type="button"
          onClick={() => onDecline && onDecline(request.friendship_id)}
          className="rounded-xl border border-border bg-background px-4 py-1.5 text-xs font-medium text-textPrimary transition hover:bg-hover"
        >
          Decline
        </button>
      </div>
    </div>
  );
};
