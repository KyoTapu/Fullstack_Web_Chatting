import { Palette } from "lucide-react";
import SectionCard from "./SectionCard";
import Toggle from "./Toggle";
import { THEMES } from "../../data/themes";

export default function AppearanceTab({
  settings,
  currentTheme,
  onToggle,
  onThemeChange,
}) {
  return (
    <>
      <h2 className="text-xl font-semibold text-textPrimary">Appearance</h2>
      <p className="text-sm text-textMuted">
        Customize how the app looks and feels across the chat experience
      </p>

      <div className="space-y-6">
        <SectionCard>
          <div className="space-y-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full bg-hover px-3 py-1 text-xs font-medium text-textPrimary">
                  <Palette className="h-3.5 w-3.5 text-primary" />
                  Theme studio
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-textPrimary">
                    {currentTheme.name} theme is active
                  </h3>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-textMuted">
                    Your theme now follows your account, so the same colors stay with you when you sign in on another device.
                  </p>
                </div>
              </div>

              <div className="inline-flex items-center gap-2 rounded-2xl border border-border bg-background px-3 py-2 text-sm text-textMuted">
                <span className="font-medium text-textPrimary">Current palette</span>
                <div className="flex gap-2">
                  {currentTheme.colors.map((color) => (
                    <span
                      key={color}
                      className="h-5 w-5 rounded-full border border-border"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {THEMES.map((theme) => (
                <button
                  key={theme.key}
                  type="button"
                  onClick={() => onThemeChange(theme.key)}
                  className={`flex items-center gap-3 rounded-2xl border px-4 py-3 transition ${
                    currentTheme.key === theme.key
                      ? "border-primary bg-background shadow-sm"
                      : "border-border bg-background hover:border-primary hover:bg-hover"
                  }`}
                >
                  <span className="flex gap-1.5">
                    {theme.colors.map((color) => (
                      <span
                        key={color}
                        className="h-4 w-4 rounded-full border border-border"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </span>
                  <span className="text-sm font-medium text-textPrimary">{theme.name}</span>
                </button>
              ))}
            </div>
          </div>
        </SectionCard>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_320px]">
          <SectionCard>
            <div className="rounded-[30px] border border-border bg-background p-4 sm:p-5">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-2xl text-sm font-semibold text-white shadow-sm"
                    style={{ backgroundColor: currentTheme.colors[2] }}
                  >
                    EZ
                  </div>
                  <div>
                    <p className="text-base font-semibold text-textPrimary">Messenger Preview</p>
                    <p className="text-sm text-textMuted">
                      A cleaner snapshot of the chat layout with the current theme.
                    </p>
                  </div>
                </div>

                <div className="hidden items-center gap-2 rounded-full border border-border bg-surface px-3 py-2 text-xs text-textMuted sm:flex">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  Synced to account
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[230px_minmax(0,1fr)]">
                <div className="rounded-[28px] bg-surface p-3 shadow-sm ring-1 ring-border">
                  <div className="mb-3 rounded-2xl bg-background px-3 py-2 text-sm text-textMuted ring-1 ring-border">
                    Search messages
                  </div>

                  <div className="space-y-2.5">
                    {[
                      {
                        name: "Design team",
                        note: "Typing now...",
                        active: true,
                      },
                      {
                        name: "Nguyen Anh",
                        note: "Sent a new concept preview",
                      },
                      {
                        name: "Product sync",
                        note: "Meeting moved to 3:00 PM",
                      },
                    ].map((item) => (
                      <div
                        key={item.name}
                        className={`rounded-2xl px-3 py-3 transition ${
                          item.active
                            ? "text-white shadow-sm"
                            : "bg-background text-textPrimary ring-1 ring-border"
                        }`}
                        style={
                          item.active
                            ? { backgroundColor: currentTheme.colors[2] }
                            : undefined
                        }
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-10 w-10 rounded-2xl ${
                              item.active ? "bg-white/20" : "bg-surface"
                            }`}
                          />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{item.name}</p>
                            <p
                              className={`truncate text-xs ${
                                item.active ? "text-white/80" : "text-textMuted"
                              }`}
                            >
                              {item.note}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[28px] bg-surface p-4 shadow-sm ring-1 ring-border">
                  <div className="mb-4 flex items-center justify-between rounded-3xl bg-background px-4 py-3 ring-1 ring-border">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-11 w-11 rounded-2xl"
                        style={{ backgroundColor: currentTheme.colors[2] }}
                      />
                      <div>
                        <p className="text-sm font-semibold text-textPrimary">Design team</p>
                        <p className="text-xs text-textMuted">4 members online</p>
                      </div>
                    </div>

                    <div
                      className="rounded-full px-3 py-1 text-xs font-medium text-white"
                      style={{ backgroundColor: currentTheme.colors[2] }}
                    >
                      Active
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="max-w-[72%] rounded-[22px] rounded-bl-md bg-background px-4 py-3 text-sm leading-6 text-textPrimary ring-1 ring-border">
                      Morning. Can we make the settings page feel cleaner and more like Messenger?
                    </div>
                    <div
                      className="ml-auto max-w-[72%] rounded-[22px] rounded-br-md px-4 py-3 text-sm leading-6 text-white shadow-sm"
                      style={{ backgroundColor: currentTheme.colors[2] }}
                    >
                      Yes. The selected theme stays with the user account, not just this browser.
                    </div>
                    <div className="max-w-[66%] rounded-[22px] rounded-bl-md bg-background px-4 py-3 text-sm leading-6 text-textMuted ring-1 ring-border">
                      Great. Keep the friend list and chat area synced too.
                    </div>
                  </div>

                  <div className="mt-4 rounded-3xl bg-background px-4 py-3 ring-1 ring-border">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-textMuted">Write a message...</span>
                      <div
                        className="rounded-full px-4 py-2 text-sm font-medium text-white"
                        style={{ backgroundColor: currentTheme.colors[2] }}
                      >
                        Send
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>

          <div className="space-y-6">
            <SectionCard>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-textPrimary">
                    <Palette className="h-4 w-4 text-primary" />
                    Current palette
                  </div>
                  <p className="mt-2 text-sm leading-6 text-textMuted">
                    {currentTheme.description}
                  </p>
                </div>

                <div className="space-y-3">
                  {[
                    { label: "Canvas", value: currentTheme.colors[0] },
                    { label: "Surface", value: currentTheme.colors[1] },
                    { label: "Accent", value: currentTheme.colors[2] },
                  ].map((swatch) => (
                    <div
                      key={swatch.label}
                      className="flex items-center gap-3 rounded-2xl bg-background px-3 py-3 ring-1 ring-border"
                    >
                      <div
                        className="h-12 w-12 rounded-2xl ring-1 ring-border"
                        style={{ backgroundColor: swatch.value }}
                      />
                      <div>
                        <p className="text-sm font-medium text-textPrimary">{swatch.label}</p>
                        <p className="text-xs uppercase tracking-[0.12em] text-textMuted">
                          {swatch.value}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </SectionCard>

            <SectionCard>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-textPrimary">Appearance extras</p>
                  <p className="mt-1 text-sm leading-6 text-textMuted">
                    Small chat display options that stay with your account settings on this device.
                  </p>
                </div>

                <Toggle
                  label="Compact mode"
                  enabled={settings.compactMode}
                  onChange={() => onToggle("appearance", "compactMode")}
                />
                <Toggle
                  label="Show avatars in chat"
                  enabled={settings.showAvatarsInChat}
                  onChange={() => onToggle("appearance", "showAvatarsInChat")}
                />
              </div>
            </SectionCard>
          </div>
        </div>
      </div>
    </>
  );
}
