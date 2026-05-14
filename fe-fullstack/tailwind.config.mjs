/** @type {import('tailwindcss').Config} */
const config = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--app-bg)",
        surface: "var(--app-surface)",
        surfaceSoft: "var(--app-surface-soft)",
        border: "var(--app-border)",

        primary: "var(--app-primary)",
        primarySoft: "var(--app-primary-soft)",

        textPrimary: "var(--app-text)",
        textMuted: "var(--app-text-muted)",

        hover: "var(--app-hover)",
        chatPanel: "var(--app-chat-panel)",
        chatInput: "var(--app-chat-input)",
        chatBubbleOwn: "var(--app-chat-bubble-own)",
        chatBubbleOwnText: "var(--app-chat-bubble-own-text)",
        chatBubbleOther: "var(--app-chat-bubble-other)",
        chatBubbleOtherText: "var(--app-chat-bubble-other-text)",
      },
    },
  },
  plugins: [],
};

export default config;
