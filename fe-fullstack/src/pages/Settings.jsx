import { useMemo } from "react";
import { LeftSidebar } from "../components/sidebar/LeftSidebar";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import { THEMES } from "../data/themes";
import NotificationsTab from "../components/setting/NotificationsTab";
import SidebarItem from "../components/setting/SidebarItem";
import LogoutTab from "../components/setting/LogoutTab";
import AppearanceTab from "../components/setting/AppearanceTab";
import PrivacyTab from "../components/setting/PrivacyTab";
import ChatTab from "../components/setting/ChatTab";
import BlockedTab from "../components/setting/BlockedTab";

export default function Settings() {
  const {
    activeTab,
    setActiveTab,
    tabs,
    settings,
    toggleSetting,
    updateSetting,
    updateTheme,
  } = useSettings();
  const { logout } = useAuth();

  const currentTheme = useMemo(
    () =>
      THEMES.find((theme) => theme.key === settings.appearance.theme) ??
      THEMES[0],
    [settings.appearance.theme],
  );

  return (
    <div className="flex h-screen bg-background text-textPrimary">
      <LeftSidebar active="settings" />

      <main className="flex flex-1 flex-col bg-background">
        <header className="flex flex-col gap-1 border-b border-border px-6 py-4">
          <h1 className="text-lg font-semibold">Settings</h1>
          <p className="text-sm text-textMuted">
            Manage your account preferences
          </p>
        </header>

        <div className="flex flex-1 overflow-hidden">
          <aside
            className="w-[260px] border-r border-border px-4 py-6"
            style={{
              background:
                "linear-gradient(180deg, var(--app-surface-soft) 0%, var(--app-surface) 100%)",
            }}
          >
            <nav className="space-y-1 text-sm">
              {tabs.map(({ key, label }) => (
                <SidebarItem
                  key={key}
                  active={activeTab === key}
                  onClick={() => setActiveTab(key)}
                >
                  {label}
                </SidebarItem>
              ))}
            </nav>
          </aside>

          <section className="flex-1 overflow-y-auto px-8 py-8">
            <div
              className={`mx-auto space-y-6 ${
                activeTab === "appearance" ? "max-w-6xl" : "max-w-3xl"
              }`}
            >
              {activeTab === "appearance" && (
                <AppearanceTab
                  settings={settings.appearance}
                  currentTheme={currentTheme}
                  onToggle={toggleSetting}
                  onThemeChange={updateTheme}
                />
              )}
              {activeTab === "privacy" && (
                <PrivacyTab settings={settings.privacy} onToggle={toggleSetting} />
              )}
              {activeTab === "notifications" && (
                <NotificationsTab
                  settings={settings.notifications}
                  onToggle={toggleSetting}
                  onUpdateSetting={updateSetting}
                />
              )}
              {activeTab === "chat" && (
                <ChatTab settings={settings.chat} onToggle={toggleSetting} />
              )}
              {activeTab === "blocked" && <BlockedTab />}
              {activeTab === "logout" && <LogoutTab onLogout={logout} />}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
