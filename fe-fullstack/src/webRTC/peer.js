const DEFAULT_ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
  { urls: "stun:stun3.l.google.com:19302" },
  { urls: "stun:stun4.l.google.com:19302" },
];

const parseIceServersEnv = () => {
  const raw = import.meta?.env?.VITE_WEBRTC_ICE_SERVERS;
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      console.warn("VITE_WEBRTC_ICE_SERVERS must be a JSON array.");
      return null;
    }
    return parsed;
  } catch (error) {
    console.warn("Failed to parse VITE_WEBRTC_ICE_SERVERS as JSON.", error);
    return null;
  }
};

export const createPeer = (options = {}) => {
  const envIceServers = parseIceServersEnv();
  const iceServers =
    options?.iceServers ||
    envIceServers ||
    DEFAULT_ICE_SERVERS;

  return new RTCPeerConnection({
    iceServers,
    iceCandidatePoolSize: 10,
  });
};
