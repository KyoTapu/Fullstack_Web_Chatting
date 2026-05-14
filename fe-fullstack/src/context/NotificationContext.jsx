import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Bell, MessageCircle, PhoneCall, X } from "lucide-react";
import { getMyConversationsApi } from "../api/conversation.api";
import { useAuth } from "./AuthContext";
import { useSettings } from "./SettingsContext";
import { useCallContext } from "./CallProvider";

const NotificationContext = createContext(null);
const TOAST_TIMEOUT_MS = 5000;
const MAX_TOASTS = 4;
const CALL_RING_CYCLE_MS = 2400;
const CALL_RING_PREVIEW_MS = 5200;

const getNotificationPermission = () => {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }

  return window.Notification.permission;
};

const normalizeConversation = (conversation, currentUserId) => {
  const id = String(conversation?._id || conversation?.id || "");
  const members = Array.isArray(conversation?.members) ? conversation.members : [];
  const friend =
    conversation?.friend ||
    members.find((member) => String(member?.id || member?.user_id) !== String(currentUserId)) ||
    null;
  const type = conversation?.type || "direct";
  const title =
    type === "group"
      ? conversation?.name || "Group"
      : friend?.full_name || friend?.username || "Direct message";

  return {
    id,
    type,
    title,
    friend,
    members,
  };
};

const buildMessagePreview = (message) => {
  if (!message) return "You have a new message.";

  if (message.type === "image") {
    return message.content?.trim()
      ? `Sent a photo: ${message.content.trim()}`
      : "Sent a photo.";
  }

  if (message.type === "file") {
    return message.fileName ? `Sent a file: ${message.fileName}` : "Sent a file.";
  }

  return message.content?.trim() || "You have a new message.";
};

const normalizeMentionToken = (value) =>
  String(value || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "")
    .toLowerCase();

const createMentionNeedles = (user) => {
  const values = [user?.username, user?.profile?.full_name, user?.full_name]
    .filter(Boolean)
    .flatMap((value) => {
      const rawValue = `@${String(value).trim().toLowerCase()}`;
      const normalizedValue = `@${normalizeMentionToken(value)}`;
      return rawValue === normalizedValue ? [rawValue] : [rawValue, normalizedValue];
    });

  return Array.from(new Set(values));
};

const messageMentionsUser = (message, currentUserId, mentionNeedles) => {
  const mentions = Array.isArray(message?.mentions) ? message.mentions : [];
  const normalizedCurrentUserId = String(currentUserId || "");

  const hasStructuredMention = mentions.some((mention) => {
    const mentionUserId = String(
      mention?.userId || mention?.id || mention?._id || "",
    );
    return mentionUserId && mentionUserId === normalizedCurrentUserId;
  });

  if (hasStructuredMention) {
    return true;
  }

  const preview = buildMessagePreview(message).toLowerCase();
  return mentionNeedles.some((needle) => preview.includes(needle));
};

const clampVolume = (volume = 70) => Math.min(Math.max(volume, 0), 100) / 100;

const scheduleTone = (
  context,
  frequency,
  startAt,
  duration,
  { type = "sine", gainValue = 0.05 } = {},
) => {
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startAt);
  gain.gain.setValueAtTime(0.0001, startAt);

  oscillator.connect(gain);
  gain.connect(context.destination);

  gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, gainValue), startAt + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

  oscillator.start(startAt);
  oscillator.stop(startAt + duration);
};

const playNotificationSound = (_kind, volume = 70) => {
  if (typeof window === "undefined") return;

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;

  try {
    const context = new AudioContextClass();
    const normalizedVolume = clampVolume(volume);
    const now = context.currentTime;
    const peakGain = Math.max(0.0001, normalizedVolume * 0.26);

    // Brighter two-step chime, closer to Messenger than a plain beep.
    scheduleTone(context, 820, now, 0.14, { type: "sine", gainValue: peakGain * 0.95 });
    scheduleTone(context, 1120, now + 0.11, 0.22, {
      type: "triangle",
      gainValue: peakGain * 1.15,
    });
    scheduleTone(context, 1480, now + 0.125, 0.14, {
      type: "sine",
      gainValue: peakGain * 0.5,
    });

    window.setTimeout(() => {
      context.close().catch(() => {});
    }, 500);
  } catch (error) {
    console.warn("Notification sound is unavailable:", error);
  }
};

const createCallSoundController = (volume = 70) => {
  if (typeof window === "undefined") return null;

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;

  try {
    const context = new AudioContextClass();
    let stopped = false;
    let timeoutId = null;
    let currentVolume = volume;

    const ringOnce = () => {
      if (stopped) return;

      const peakGain = Math.max(0.0001, clampVolume(currentVolume) * 0.23);
      const startAt = context.currentTime + 0.02;

      // Two-pulse ringtone with a pause, so it feels like a real incoming call.
      scheduleTone(context, 784, startAt, 0.24, {
        type: "triangle",
        gainValue: peakGain * 0.95,
      });
      scheduleTone(context, 988, startAt + 0.2, 0.3, {
        type: "triangle",
        gainValue: peakGain * 1.05,
      });
      scheduleTone(context, 880, startAt + 0.98, 0.22, {
        type: "triangle",
        gainValue: peakGain * 0.78,
      });
      scheduleTone(context, 1108, startAt + 1.16, 0.28, {
        type: "triangle",
        gainValue: peakGain,
      });

      timeoutId = window.setTimeout(ringOnce, CALL_RING_CYCLE_MS);
    };

    context.resume().catch(() => {});
    ringOnce();

    return {
      updateVolume(nextVolume) {
        currentVolume = nextVolume;
      },
      stop() {
        if (stopped) return;
        stopped = true;

        if (timeoutId) {
          window.clearTimeout(timeoutId);
          timeoutId = null;
        }

        context.close().catch(() => {});
      },
    };
  } catch (error) {
    console.warn("Call ringtone is unavailable:", error);
    return null;
  }
};

const playCallSoundPreview = (volume = 70) => {
  const controller = createCallSoundController(volume);
  if (!controller) return;

  window.setTimeout(() => {
    controller.stop();
  }, CALL_RING_PREVIEW_MS);
};

const getToastMeta = (kind) => {
  switch (kind) {
    case "call":
      return {
        icon: PhoneCall,
        accent: "bg-emerald-500/12 text-emerald-600",
      };
    case "mention":
      return {
        icon: Bell,
        accent: "bg-amber-500/12 text-amber-600",
      };
    default:
      return {
        icon: MessageCircle,
        accent: "bg-primary/12 text-primary",
      };
  }
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const {
    settings: {
      notifications: {
        messageNotifications,
        mentionNotifications,
        callNotifications,
        soundEffects,
        desktopNotifications,
        notificationVolume,
      },
    },
  } = useSettings();
  const { socket, incomingCall, callState } = useCallContext();
  const [toasts, setToasts] = useState([]);
  const [desktopPermission, setDesktopPermission] = useState(getNotificationPermission);

  const conversationsRef = useRef(new Map());
  const toastTimersRef = useRef(new Map());
  const recentEventIdsRef = useRef(new Map());
  const lastIncomingCallKeyRef = useRef(null);
  const callSoundControllerRef = useRef(null);

  const currentUserId = user?.id;

  const dismissToast = useCallback((id) => {
    const timeoutId = toastTimersRef.current.get(id);
    if (timeoutId) {
      window.clearTimeout(timeoutId);
      toastTimersRef.current.delete(id);
    }

    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showDesktopNotification = useCallback(
    ({ title, body, icon }) => {
      if (
        desktopPermission !== "granted" ||
        !desktopNotifications ||
        typeof document === "undefined" ||
        !document.hidden
      ) {
        return;
      }

      try {
        const notification = new window.Notification(title, {
          body,
          icon: icon || "/ezicon.png",
        });

        notification.onclick = () => {
          window.focus();
          notification.close();
        };
      } catch (error) {
        console.warn("Desktop notification failed:", error);
      }
    },
    [desktopNotifications, desktopPermission],
  );

  const pushToast = useCallback(
    ({ kind = "message", title, body, icon }) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      setToasts((prev) => [{ id, kind, title, body, icon }, ...prev].slice(0, MAX_TOASTS));

      const timeoutId = window.setTimeout(() => {
        dismissToast(id);
      }, TOAST_TIMEOUT_MS);

      toastTimersRef.current.set(id, timeoutId);
    },
    [dismissToast],
  );

  const stopCallSound = useCallback(() => {
    if (!callSoundControllerRef.current) return;

    callSoundControllerRef.current.stop();
    callSoundControllerRef.current = null;
  }, []);

  const ensureCallSound = useCallback(() => {
    if (callSoundControllerRef.current) {
      callSoundControllerRef.current.updateVolume(notificationVolume);
      return;
    }

    callSoundControllerRef.current = createCallSoundController(notificationVolume);
  }, [notificationVolume]);

  const notify = useCallback(
    ({ kind = "message", title, body, icon }) => {
      pushToast({ kind, title, body, icon });

      if (soundEffects && kind !== "call") {
        playNotificationSound(kind, notificationVolume);
      }

      showDesktopNotification({ title, body, icon });
    },
    [pushToast, showDesktopNotification, soundEffects, notificationVolume],
  );

  const requestDesktopPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setDesktopPermission("unsupported");
      return "unsupported";
    }

    const permission = await window.Notification.requestPermission();
    setDesktopPermission(permission);
    return permission;
  }, []);

  const sendTestNotification = useCallback(async (kind = "message") => {
    if (desktopNotifications && desktopPermission === "default") {
      const permission = await requestDesktopPermission();
      if (permission === "denied" || permission === "unsupported") {
        return permission;
      }
    }

    const testPayloads = {
      message: {
        kind: "message",
        title: "Notifications are working",
        body: "You will now receive in-app alerts based on your settings.",
      },
      mention: {
        kind: "mention",
        title: "You were mentioned",
        body: `${user?.username || "Someone"} mentioned you in General chat.`,
      },
      call: {
        kind: "call",
        title: "Incoming voice call",
        body: "Demo caller is calling you right now.",
      },
    };

    const nextPayload = testPayloads[kind] || testPayloads.message;

    notify({
      ...nextPayload,
      icon: "/ezicon.png",
    });

    if (kind === "call" && soundEffects) {
      playCallSoundPreview(notificationVolume);
    }

    return desktopPermission;
  }, [
    desktopNotifications,
    desktopPermission,
    notify,
    notificationVolume,
    requestDesktopPermission,
    soundEffects,
    user?.username,
  ]);

  useEffect(() => {
    if (!socket || !currentUserId) return undefined;

    let cancelled = false;

    const syncConversations = async () => {
      try {
        const response = await getMyConversationsApi();
        const raw = response?.data?.data || response?.data || response || [];
        if (!Array.isArray(raw) || cancelled) return;

        const nextMap = new Map();
        raw.forEach((conversation) => {
          const normalized = normalizeConversation(conversation, currentUserId);
          if (!normalized.id) return;

          nextMap.set(normalized.id, normalized);
          socket.emit("join_conversation", normalized.id);
        });
        conversationsRef.current = nextMap;
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to sync notification conversations:", error);
        }
      }
    };

    syncConversations();
    const intervalId = window.setInterval(syncConversations, 20000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [socket, currentUserId]);

  useEffect(() => {
    if (!socket || !currentUserId) return undefined;

    const mentionNeedles = createMentionNeedles(user);

    const handleReceiveMessage = (message) => {
      const senderId = String(message?.senderId || message?.userId || "");
      if (!senderId || senderId === String(currentUserId)) return;

      const eventId = String(message?.id || message?._id || `${message?.conversationId}-${message?.createdAt}`);
      if (recentEventIdsRef.current.has(eventId)) return;
      recentEventIdsRef.current.set(eventId, Date.now());

      window.setTimeout(() => {
        recentEventIdsRef.current.delete(eventId);
      }, 30000);

      const preview = buildMessagePreview(message);
      const isMentioned = messageMentionsUser(message, currentUserId, mentionNeedles);
      const shouldNotify = messageNotifications || (mentionNotifications && isMentioned);
      if (!shouldNotify) return;

      const conversationId = String(message?.conversationId || "");
      const conversation = conversationsRef.current.get(conversationId);
      const sender =
        conversation?.members?.find((member) => String(member?.id || member?.user_id) === senderId) ||
        (conversation?.friend && String(conversation.friend?.id) === senderId ? conversation.friend : null);
      const senderName = sender?.full_name || sender?.username || "Someone";
      const icon = sender?.avatar_url || "/ezicon.png";

      let title = `New message from ${senderName}`;
      if (conversation?.type === "group") {
        title = isMentioned
          ? `${senderName} mentioned you in ${conversation.title}`
          : `${senderName} in ${conversation.title}`;
      }

      notify({
        kind: isMentioned ? "mention" : "message",
        title,
        body: preview,
        icon,
      });
    };

    socket.on("receive_message", handleReceiveMessage);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
    };
  }, [
    socket,
    user,
    currentUserId,
    messageNotifications,
    mentionNotifications,
    notify,
  ]);

  useEffect(() => {
    if (!incomingCall || callState !== "ringing" || !callNotifications) return;

    const key = `${incomingCall.from}-${incomingCall.offer?.type || "offer"}`;
    if (lastIncomingCallKeyRef.current === key) return;
    lastIncomingCallKeyRef.current = key;

    const callerName = incomingCall.profile?.name || "Someone";
    const callLabel = incomingCall.isVideoCall ? "video call" : "voice call";

    const timeoutId = window.setTimeout(() => {
      notify({
        kind: "call",
        title: `Incoming ${callLabel}`,
        body: `${callerName} is calling you.`,
        icon: incomingCall.profile?.avatarUrl || "/ezicon.png",
      });
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [incomingCall, callState, callNotifications, notify]);

  useEffect(() => {
    if (!incomingCall || callState !== "ringing") {
      lastIncomingCallKeyRef.current = null;
    }
  }, [incomingCall, callState]);

  useEffect(() => {
    if (!incomingCall || callState !== "ringing" || !callNotifications || !soundEffects) {
      stopCallSound();
      return;
    }

    ensureCallSound();

    return () => {
      if (callState !== "ringing") {
        stopCallSound();
      }
    };
  }, [
    incomingCall,
    callNotifications,
    callState,
    ensureCallSound,
    soundEffects,
    stopCallSound,
  ]);

  useEffect(() => {
    const toastTimers = toastTimersRef.current;

    return () => {
      stopCallSound();
      toastTimers.forEach((timeoutId) => window.clearTimeout(timeoutId));
      toastTimers.clear();
    };
  }, [stopCallSound]);

  const value = useMemo(
    () => ({
      notifications: toasts,
      desktopPermission,
      requestDesktopPermission,
      sendTestNotification,
      dismissNotification: dismissToast,
    }),
    [toasts, desktopPermission, requestDesktopPermission, sendTestNotification, dismissToast],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}

      <div className="pointer-events-none fixed right-4 top-4 z-[120] flex w-full max-w-sm flex-col gap-3">
        {toasts.map((toast) => {
          const meta = getToastMeta(toast.kind);
          const Icon = meta.icon;

          return (
            <div
              key={toast.id}
              className="pointer-events-auto overflow-hidden rounded-2xl border border-border bg-surface/95 shadow-xl backdrop-blur"
            >
              <div className="flex items-start gap-3 p-4">
                <div className={`mt-0.5 rounded-xl p-2 ${meta.accent}`}>
                  <Icon className="h-4 w-4" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-textPrimary">{toast.title}</p>
                  <p className="mt-1 line-clamp-3 text-sm text-textMuted">{toast.body}</p>
                </div>

                <button
                  type="button"
                  onClick={() => dismissToast(toast.id)}
                  className="rounded-full p-1 text-textMuted transition hover:bg-background hover:text-textPrimary"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }

  return context;
};
