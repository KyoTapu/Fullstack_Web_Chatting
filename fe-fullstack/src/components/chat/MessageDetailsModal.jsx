import React from "react";
import { X } from "lucide-react";
import { Avatar } from "../ui/Avatar";

const detailFormatter = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "medium",
  timeStyle: "short",
  hour12: false,
  timeZone: "Asia/Ho_Chi_Minh",
});

const formatDateTime = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return detailFormatter.format(date);
};

const formatSize = (bytes) => {
  if (typeof bytes !== "number" || Number.isNaN(bytes) || bytes < 0) {
    return "N/A";
  }

  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const DetailRow = ({ label, value }) => (
  <div className="rounded-2xl border border-border bg-background/80 px-4 py-3">
    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-textMuted">{label}</p>
    <p className="mt-1 text-sm text-textPrimary">{value || "N/A"}</p>
  </div>
);

export const MessageDetailsModal = ({
  open,
  message,
  sender,
  loading = false,
  error = "",
  onClose,
  onRetry,
}) => {
  if (!open) return null;

  const mentionsLabel = Array.isArray(message?.mentions) && message.mentions.length
    ? message.mentions
        .map((mention) => mention?.label || mention?.value || mention?.userId)
        .filter(Boolean)
        .join(", ")
    : "None";

  const status = loading
    ? "Loading..."
    : message?.pending
      ? "Sending"
      : message?.isRecalled
        ? "Deleted"
        : message?.isEdited
          ? "Edited"
          : "Sent";

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/40 px-4 py-6">
      <button type="button" aria-label="Close" className="absolute inset-0" onClick={onClose} />

      <div className="relative z-10 w-full max-w-xl overflow-hidden rounded-[28px] border border-border bg-surface shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-textMuted">Message details</p>
            <h2 className="mt-2 text-xl font-semibold text-textPrimary">Inspect this message</h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-textMuted transition hover:bg-background hover:text-textPrimary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          {loading ? (
            <div className="rounded-2xl border border-border bg-background/60 px-4 py-6 text-center text-sm text-textMuted">
              Loading message details...
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
              <p>{error}</p>
              {onRetry ? (
                <button
                  type="button"
                  onClick={onRetry}
                  className="mt-3 rounded-full border border-red-200 px-4 py-2 font-medium transition hover:bg-red-100"
                >
                  Try again
                </button>
              ) : null}
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 rounded-[24px] border border-border bg-background/70 px-4 py-4">
                <Avatar
                  src={sender?.avatarUrl || "/ezicon.png"}
                  alt={sender?.name || "Sender"}
                  size="lg"
                />
                <div className="min-w-0">
                  <p className="text-sm text-textMuted">Sender</p>
                  <p className="truncate text-base font-semibold text-textPrimary">
                    {sender?.name || "Unknown sender"}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <DetailRow label="Status" value={status} />
                <DetailRow label="Type" value={message?.type || "text"} />
                <DetailRow label="Sent at" value={formatDateTime(message?.createdAt)} />
                <DetailRow label="Edited at" value={message?.editedAt ? formatDateTime(message.editedAt) : "Not edited"} />
                <DetailRow label="Deleted at" value={message?.recalledAt ? formatDateTime(message.recalledAt) : "Not deleted"} />
                <DetailRow label="Mentions" value={mentionsLabel} />
                <DetailRow label="Attachment" value={message?.fileName || "No attachment"} />
                <DetailRow label="Attachment size" value={formatSize(message?.fileSize)} />
              </div>

              <div className="rounded-[24px] border border-border bg-background/70 px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-textMuted">Content</p>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm text-textPrimary">
                  {message?.content || "No content"}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageDetailsModal;
