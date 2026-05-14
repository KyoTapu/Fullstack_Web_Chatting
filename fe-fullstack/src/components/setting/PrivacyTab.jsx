import SectionCard from "./SectionCard";
import Toggle from "./Toggle";

export default function PrivacyTab({ settings, onToggle }) {
  return (
    <>
      <h2 className="text-xl font-semibold text-textPrimary">Privacy & Security</h2>
      <p className="text-sm text-textMuted">Control how others see you</p>

      <SectionCard>
        <Toggle
          label="Show online status"
          enabled={settings.showOnlineStatus}
          onChange={() => onToggle("privacy", "showOnlineStatus")}
        />
        <Toggle
          label="Send read receipts"
          enabled={settings.sendReadReceipts}
          onChange={() => onToggle("privacy", "sendReadReceipts")}
        />
        <Toggle
          label="Allow friend requests"
          enabled={settings.allowFriendRequests}
          onChange={() => onToggle("privacy", "allowFriendRequests")}
        />
        <Toggle
          label="Allow messages from non-friends"
          enabled={settings.allowMessagesFromNonFriends}
          onChange={() => onToggle("privacy", "allowMessagesFromNonFriends")}
        />
      </SectionCard>
    </>
  );
}


