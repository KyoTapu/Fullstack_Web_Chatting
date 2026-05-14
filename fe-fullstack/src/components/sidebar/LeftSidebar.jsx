import { MessageCircle, Users, Calendar, Settings, CircleUserRound } from "lucide-react";
import { IconButton } from "../ui/IconButton";
import { Link } from "react-router-dom";

export const LeftSidebar = ({ active }) => {
  return (
    <aside
      className="hidden h-full w-20 flex-shrink-0 flex-col items-center justify-between border-r border-border py-6 text-white lg:flex"
      style={{
        background:
          "linear-gradient(180deg, var(--app-primary) 0%, var(--app-primary-soft) 100%)",
      }}
    >
      {/* ===== Top ===== */}
      <div className="flex flex-col items-center gap-6">
        {/* Avatar → Profile */}
        <Link
          to="/profile"
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/20 bg-white/15 text-white font-semibold backdrop-blur-sm transition hover:bg-white/20"
        >
          <CircleUserRound />
        </Link>

        <nav className="flex flex-col items-center gap-4">
          {/* Chat */}
          <Link to="/">
            <IconButton icon={MessageCircle} active={active === "chat"} tooltip="Chat" />
          </Link>

          {/* Friends / Team */}
          <Link to="/friends">
            <IconButton icon={Users} active={active === "team"} tooltip="Friends" />
          </Link>
        </nav>
      </div>

      {/* ===== Bottom ===== */}
      <div className="flex flex-col items-center gap-4">
        <span className="h-px w-8 rounded-full bg-white/25" />

        {/* Settings → /settings */}
        <Link to="/settings">
          <IconButton icon={Settings} active={active === "settings"} tooltip="Settings" />
        </Link>
      </div>
    </aside>
  );
};
