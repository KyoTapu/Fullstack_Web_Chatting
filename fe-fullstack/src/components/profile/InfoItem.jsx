import React from "react";

export const InfoItem = ({ icon, label, value, copyable, link }) => {
  return (
    <div className="group flex cursor-default items-start gap-3 rounded-lg p-2 transition-colors hover:bg-background">
      <div className="mt-0.5 text-textMuted transition-colors group-hover:text-primary">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="mb-0.5 text-xs font-medium uppercase tracking-wide text-textMuted">
          {label}
        </p>
        <p
          className={`truncate text-sm font-medium text-textPrimary ${
            link ? "cursor-pointer text-primary hover:underline" : ""
          }`}
        >
          {value || "Not provided"}
        </p>
      </div>

      {copyable && value ? (
        <button
          onClick={() => navigator.clipboard.writeText(value)}
          className="rounded bg-background px-2 py-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100"
        >
          Copy
        </button>
      ) : null}
    </div>
  );
};
