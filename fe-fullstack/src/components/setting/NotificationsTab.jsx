import Toggle from "./Toggle";
import SectionCard from "./SectionCard";
import { useNotifications } from "../../context/NotificationContext";

export default function NotificationsTab({ settings, onToggle, onUpdateSetting }) {
  const {
    desktopPermission,
    requestDesktopPermission,
    sendTestNotification,
  } = useNotifications();

  const handleDesktopToggle = async () => {
    const enablingDesktopNotifications = !settings.desktopNotifications;
    onToggle("notifications", "desktopNotifications");

    if (enablingDesktopNotifications && desktopPermission === "default") {
      await requestDesktopPermission();
    }
  };

  const permissionLabel =
    desktopPermission === "granted"
      ? "Allowed"
      : desktopPermission === "denied"
        ? "Blocked"
        : desktopPermission === "unsupported"
          ? "Unsupported"
          : "Not granted";

  return (
    <>
      <h2 className="text-xl font-semibold text-textPrimary">Notifications</h2>
      <p className="text-sm text-textMuted">Choose how you get notified</p>

      <SectionCard>
        <div className="space-y-1">
          <p className="text-sm font-medium text-textPrimary">Alert types</p>
          <p className="text-sm text-textMuted">
            Control message alerts, mentions that call your attention, and incoming call alerts separately.
          </p>
        </div>

        <Toggle
          label="Message notifications"
          enabled={settings.messageNotifications}
          onChange={() => onToggle("notifications", "messageNotifications")}
        />
        <Toggle
          label="Mention notifications"
          enabled={settings.mentionNotifications}
          onChange={() => onToggle("notifications", "mentionNotifications")}
        />
        <Toggle
          label="Call notifications"
          enabled={settings.callNotifications}
          onChange={() => onToggle("notifications", "callNotifications")}
        />
        <Toggle
          label="Sound effects"
          enabled={settings.soundEffects}
          onChange={() => onToggle("notifications", "soundEffects")}
        />
        <Toggle
          label="Desktop notifications"
          enabled={settings.desktopNotifications}
          onChange={handleDesktopToggle}
        />

        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-textMuted">Notification volume</p>
              <p className="text-xs text-textMuted">
                Adjust how loud message and call notification sounds are.
              </p>
            </div>
            <span className="min-w-12 text-right text-sm font-medium text-textPrimary">
              {settings.notificationVolume}%
            </span>
          </div>

          <input
            type="range"
            min="0"
            max="200"
            step="1"
            value={settings.notificationVolume}
            disabled={!settings.soundEffects}
            onChange={(event) =>
              onUpdateSetting("notifications", "notificationVolume", Number(event.target.value))
            }
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-border accent-primary disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      </SectionCard>

      <SectionCard>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-textPrimary">Browser notification permission</p>
            <p className="mt-1 text-sm text-textMuted">Current status: {permissionLabel}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={requestDesktopPermission}
              disabled={desktopPermission === "unsupported"}
              className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium text-textPrimary transition hover:bg-surfaceSoft disabled:cursor-not-allowed disabled:opacity-50"
            >
              Allow desktop
            </button>
            <button
              type="button"
              onClick={sendTestNotification}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold transition hover:opacity-90"
              style={{ color: "var(--app-chat-bubble-own-text)" }}
            >
              Send test
            </button>
          </div>
        </div>

        {desktopPermission === "denied" ? (
          <p className="text-sm text-textMuted">
            Your browser is blocking notifications. You may need to re-enable them from site permissions.
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            onClick={() => sendTestNotification("message")}
            className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium text-textPrimary transition hover:bg-surfaceSoft"
          >
            Test message
          </button>
          <button
            type="button"
            onClick={() => sendTestNotification("mention")}
            className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium text-textPrimary transition hover:bg-surfaceSoft"
          >
            Test mention
          </button>
          <button
            type="button"
            onClick={() => sendTestNotification("call")}
            className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium text-textPrimary transition hover:bg-surfaceSoft"
          >
            Test call
          </button>
        </div>
      </SectionCard>
    </>
  );
}
