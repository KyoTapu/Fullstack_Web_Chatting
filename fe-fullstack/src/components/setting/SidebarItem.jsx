export default function SidebarItem({ children, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl px-3 py-2.5 text-left transition"
      style={{
        backgroundColor: active ? "var(--app-primary)" : "transparent",
        color: active ? "var(--app-chat-bubble-own-text)" : "var(--app-text)",
        boxShadow: active ? "0 6px 16px rgba(0, 0, 0, 0.12)" : "none",
      }}
    >
      {children}
    </button>
  );
}