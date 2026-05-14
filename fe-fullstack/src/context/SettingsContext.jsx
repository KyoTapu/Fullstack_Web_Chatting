import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { updateUserProfileApi } from "../api/users.api";
import { useAuth } from "./AuthContext";
import { DEFAULT_THEME_KEY, THEME_MAP } from "../data/themes";

const SETTINGS_STORAGE_KEY = "chat-app-settings";

export const SETTINGS_TABS = [
  { key: "privacy", label: "Privacy & Security" },
  { key: "notifications", label: "Notifications" },
  { key: "appearance", label: "Appearance" },
  { key: "chat", label: "Chat & Calls" },
  { key: "blocked", label: "Blocked Users" },
  { key: "logout", label: "Log out" },
];

const SettingsContext = createContext(null);

const normalizeThemeKey = (themeKey) =>
  THEME_MAP[themeKey] ? themeKey : DEFAULT_THEME_KEY;

const buildDefaultSettings = (themeKey = DEFAULT_THEME_KEY) => ({
  privacy: {
    showOnlineStatus: true,
    sendReadReceipts: true,
    allowFriendRequests: true,
    allowMessagesFromNonFriends: false,
  },
  notifications: {
    messageNotifications: true,
    mentionNotifications: true,
    callNotifications: true,
    soundEffects: true,
    desktopNotifications: false,
    notificationVolume: 70,
  },
  appearance: {
    theme: normalizeThemeKey(themeKey),
    compactMode: false,
    showAvatarsInChat: true,
  },
  chat: {
    pressEnterToSendMessages: true,
    showTypingIndicators: true,
    enableVoiceCalls: true,
    enableVideoCalls: true,
    autoDownloadMedia: false,
  },
});

const getSettingsStorageKey = (userId) =>
  userId ? `${SETTINGS_STORAGE_KEY}:${userId}` : SETTINGS_STORAGE_KEY;

const mergeSettings = (parsed, themeKey) => {
  const defaultSettings = buildDefaultSettings(themeKey);

  return {
    privacy: { ...defaultSettings.privacy, ...parsed?.privacy },
    notifications: {
      ...defaultSettings.notifications,
      ...parsed?.notifications,
    },
    appearance: {
      ...defaultSettings.appearance,
      ...parsed?.appearance,
      theme: normalizeThemeKey(themeKey),
    },
    chat: { ...defaultSettings.chat, ...parsed?.chat },
  };
};

const readStoredSettings = (userId, themeKey) => {
  const defaultSettings = buildDefaultSettings(themeKey);

  if (typeof window === "undefined") return defaultSettings;
  if (!userId) return defaultSettings;

  try {
    const raw = window.localStorage.getItem(getSettingsStorageKey(userId));
    if (!raw) return defaultSettings;

    return mergeSettings(JSON.parse(raw), themeKey);
  } catch (error) {
    console.error("Failed to parse saved settings:", error);
    return defaultSettings;
  }
};

export const SettingsProvider = ({ children }) => {
  const { user, updateProfile } = useAuth();
  const userId = user?.id ?? null;
  const profileTheme = normalizeThemeKey(user?.profile?.theme);
  const themeRequestIdRef = useRef(0);

  const [activeTab, setActiveTab] = useState("privacy");
  const [settings, setSettings] = useState(() =>
    buildDefaultSettings(profileTheme),
  );

  useEffect(() => {
    setSettings(readStoredSettings(userId, profileTheme));
  }, [profileTheme, userId]);

  useEffect(() => {
    if (typeof window === "undefined" || !userId) return;

    window.localStorage.setItem(
      getSettingsStorageKey(userId),
      JSON.stringify(settings),
    );
  }, [settings, userId]);

  useEffect(() => {
    if (typeof document === "undefined") return;

    if (!userId) {
      delete document.documentElement.dataset.theme;
      document.documentElement.style.removeProperty("color-scheme");
      return;
    }

    const themeKey = normalizeThemeKey(settings.appearance.theme);
    const theme = THEME_MAP[themeKey] ?? THEME_MAP[DEFAULT_THEME_KEY];

    document.documentElement.dataset.theme = theme.key;
    document.documentElement.style.colorScheme = theme.colorScheme;
  }, [settings.appearance.theme, userId]);

  const toggleSetting = (section, key) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: !prev[section][key],
      },
    }));
  };

  const updateSetting = (section, key, value) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
  };

  const updateTheme = async (themeKey) => {
    const nextTheme = normalizeThemeKey(themeKey);
    const previousTheme = normalizeThemeKey(settings.appearance.theme);

    setSettings((prev) => ({
      ...prev,
      appearance: {
        ...prev.appearance,
        theme: nextTheme,
      },
    }));

    updateProfile?.({ theme: nextTheme });

    if (!userId) return;

    const requestId = themeRequestIdRef.current + 1;
    themeRequestIdRef.current = requestId;

    try {
      const response = await updateUserProfileApi({ theme: nextTheme });

      if (themeRequestIdRef.current !== requestId) return;

      if (response?.data?.profile) {
        updateProfile?.(response.data.profile);
      }
    } catch (error) {
      if (themeRequestIdRef.current !== requestId) return;

      console.error("Failed to persist theme setting:", error);

      setSettings((prev) => ({
        ...prev,
        appearance: {
          ...prev.appearance,
          theme: previousTheme,
        },
      }));

      updateProfile?.({ theme: previousTheme });
    }
  };

  const resetSettings = () => {
    setSettings(buildDefaultSettings(profileTheme));
    setActiveTab("privacy");
  };

  const value = useMemo(
    () => ({
      activeTab,
      setActiveTab,
      settings,
      toggleSetting,
      updateSetting,
      updateTheme,
      resetSettings,
      tabs: SETTINGS_TABS,
    }),
    [activeTab, profileTheme, settings],
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);

  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }

  return context;
};
