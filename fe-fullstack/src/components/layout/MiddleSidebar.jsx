import React from "react";
import { Search } from "lucide-react";

const staticNavItems = [
  { id: "all", label: "All Friends" },
  { id: "online", label: "Online" },
  { id: "offline", label: "Offline" },
  { id: "suggestions", label: "Suggestions" },
  { id: "blocked", label: "Blocked" },
];

const quickAccess = [];

export const MiddleSidebar = ({
  activeTab = "all",
  onTabChange,
  searchTerm = "",
  onSearchChange,
  onSubmitSearch,
}) => {
  return (
    <aside
      className="hidden h-full w-72 flex-col border-r border-border px-4 py-4 lg:flex"
      style={{
        background:
          "linear-gradient(180deg, var(--app-surface-soft) 0%, var(--app-surface) 100%)",
      }}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex flex-col">
          <h2 className="text-sm font-semibold text-textPrimary">Friends</h2>
          <span className="text-xs text-textMuted">Manage your contacts</span>
        </div>
      </div>


      <div className="mb-6 space-y-1">
        {staticNavItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange?.(item.id)}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition ${
                isActive
                  ? "bg-primary shadow-sm"
                  : "text-textPrimary hover:bg-hover"
              }`}
              style={
                isActive
                  ? { color: "var(--app-chat-bubble-own-text)" }
                  : undefined
              }
            >
            <span>{item.label}</span>
            {item.badge ? (
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  item.badgeColor === "red"
                    ? "bg-red-100 text-red-600"
                    : "bg-background text-textMuted"
                }`}
              >
                {item.badge}
              </span>
            ) : null}
            </button>
          );
        })}
      </div>

      {quickAccess.length > 0 ? (
        <div className="mt-auto space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-textMuted">
            Quick Access
          </p>
          <div className="space-y-1.5">
            {quickAccess.map((q) => (
              <button
                key={q.id}
                type="button"
                className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-sm text-textPrimary transition hover:bg-hover"
              >
                <div className="relative h-9 w-9 overflow-hidden rounded-full">
                  <img
                    src={q.avatarUrl}
                    alt={q.name}
                    className="h-full w-full object-cover"
                  />
                  <span
                    className="absolute bottom-0 right-0 h-3 w-3 rounded-full ring-2"
                    style={{ boxShadow: "0 0 0 2px var(--app-surface)" }}
                  >
                    <span
                      className={`inline-block h-full w-full rounded-full ${q.presenceColor}`}
                    />
                  </span>
                </div>
                <span className="truncate text-sm">{q.name}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </aside>
  );
};
