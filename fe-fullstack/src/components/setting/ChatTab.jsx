import SectionCard from "./SectionCard";
import Toggle from "./Toggle";

export default function ChatTab({ settings, onToggle }) {
  return (
    <>
      <h2 className="text-xl font-semibold text-textPrimary">Chat & Calls</h2>
      <p className="text-sm text-textMuted">Customize your messaging experience</p>

      <SectionCard>
        <Toggle
          label="Press Enter to send messages"
          enabled={settings.pressEnterToSendMessages}
          onChange={() => onToggle("chat", "pressEnterToSendMessages")}
        />
        <Toggle
          label="Show typing indicators"
          enabled={settings.showTypingIndicators}
          onChange={() => onToggle("chat", "showTypingIndicators")}
        />
        <Toggle
          label="Enable voice calls"
          enabled={settings.enableVoiceCalls}
          onChange={() => onToggle("chat", "enableVoiceCalls")}
        />
        <Toggle
          label="Enable video calls"
          enabled={settings.enableVideoCalls}
          onChange={() => onToggle("chat", "enableVideoCalls")}
        />
        <Toggle
          label="Auto-download media"
          enabled={settings.autoDownloadMedia}
          onChange={() => onToggle("chat", "autoDownloadMedia")}
        />

        <div className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-textMuted">
          When "Press Enter to send messages" is off, you can send with Ctrl+Enter or Cmd+Enter.
        </div>
      </SectionCard>
    </>
  );
}
