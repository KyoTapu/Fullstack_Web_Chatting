import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "./AuthContext";
import { useSettings } from "./SettingsContext";
import { createPeer } from "../webRTC/peer";
import { connectSocket, disconnectSocket } from "../socket/socket";

const CallContext = createContext(null);
const DEFAULT_AVATAR_URL = "/ezicon.png";
const DEFAULT_MEDIA_STATE = {
  audioEnabled: true,
  videoEnabled: true,
};
const DEFAULT_END_META = null;
const DEFAULT_REMOTE_TRACK_STATE = {
  audioAvailable: false,
  videoAvailable: false,
};

const MEDIA_REQUESTS_BY_MODE = {
  video: [
    { audio: true, video: true },
    { audio: true, video: false },
    { audio: false, video: true },
  ],
  audio: [{ audio: true, video: false }],
};

const normalizeProfile = (rawProfile, fallbackId) => {
  const id = rawProfile?.id || rawProfile?.userId || rawProfile?.user_id || fallbackId || null;

  return {
    id,
    name:
      rawProfile?.name ||
      rawProfile?.display_name ||
      rawProfile?.full_name ||
      rawProfile?.username ||
      (id ? `User #${id} ` : "Unknown contact"),
    avatarUrl: rawProfile?.avatarUrl || rawProfile?.avatar_url || rawProfile?.profile?.avatar_url || DEFAULT_AVATAR_URL,
  };
};

export const CallProvider = ({ children }) => {
  const { accessToken, user } = useAuth();
  const {
    settings: {
      privacy: { showOnlineStatus },
    },
  } = useSettings();
  const userId = user?.id;
  const localProfile = useMemo(
    () =>
      normalizeProfile(
        {
          id: user?.id,
          username: user?.username,
          full_name: user?.profile?.full_name,
          avatar_url: user?.profile?.avatar_url,
        },
        user?.id,
      ),
    [user],
  );

  const peerRef = useRef(null);
  const incomingCallRef = useRef(null);
  const pendingIceCandidatesRef = useRef([]);
  const remoteDescriptionReadyRef = useRef(false);
  const remoteMediaStreamRef = useRef(null);
  const disconnectTimerRef = useRef(null);

  const [socket, setSocket] = useState(null);
  const [callState, setCallState] = useState("idle");
  const [callEndMeta, setCallEndMeta] = useState(DEFAULT_END_META);
  const [lastCallVideo, setLastCallVideo] = useState(true);
  const [incomingCall, setIncomingCall] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [remoteTracks, setRemoteTracks] = useState(DEFAULT_REMOTE_TRACK_STATE);
  const [activePeerId, setActivePeerId] = useState(null);
  const [peerProfile, setPeerProfile] = useState(null);
  const [localMediaState, setLocalMediaState] = useState(DEFAULT_MEDIA_STATE);
  const [remoteMediaState, setRemoteMediaState] = useState(DEFAULT_MEDIA_STATE);
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    incomingCallRef.current = incomingCall;
  }, [incomingCall]);

  const resetPeerState = useCallback(() => {
    if (disconnectTimerRef.current) {
      clearTimeout(disconnectTimerRef.current);
      disconnectTimerRef.current = null;
    }

    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }

    pendingIceCandidatesRef.current = [];
    remoteDescriptionReadyRef.current = false;
    remoteMediaStreamRef.current = null;
    setRemoteStream(null);
    setRemoteTracks(DEFAULT_REMOTE_TRACK_STATE);
  }, []);

  const finishCall = useCallback(
    ({ reason = "ended", by = "system" } = {}) => {
      resetPeerState();

      setLocalStream((prevStream) => {
        if (prevStream) prevStream.getTracks().forEach((track) => track.stop());
        return null;
      });

      setIncomingCall(null);
      setActivePeerId(null);
      setRemoteMediaState(DEFAULT_MEDIA_STATE);
      setLocalMediaState(DEFAULT_MEDIA_STATE);
      setCallEndMeta({
        reason,
        by,
        endedAt: Date.now(),
        peerId: peerProfile?.id || null,
        peerProfile: peerProfile || null,
        video: Boolean(lastCallVideo),
      });
      setCallState("ended");
    },
    [resetPeerState, peerProfile, lastCallVideo],
  );

  const syncLocalMediaState = useCallback((stream) => {
    const audioTracks = stream?.getAudioTracks?.() || [];
    const videoTracks = stream?.getVideoTracks?.() || [];

    setLocalMediaState({
      audioEnabled: audioTracks.some((track) => track.enabled),
      videoEnabled: videoTracks.some((track) => track.enabled),
    });
  }, []);

  const getCurrentStreamMediaState = useCallback((stream) => {
    const audioTracks = stream?.getAudioTracks?.() || [];
    const videoTracks = stream?.getVideoTracks?.() || [];

    return {
      audioEnabled: audioTracks.some((track) => track.enabled),
      videoEnabled: videoTracks.some((track) => track.enabled),
    };
  }, []);

  useEffect(() => {
    if (!accessToken || !userId) {
      disconnectSocket();
      return;
    }

    const nextSocket = connectSocket(accessToken);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSocket(nextSocket);

    const registerUser = () => {
      nextSocket.emit("register", userId);
    };

    if (nextSocket.connected) {
      registerUser();
    }

    nextSocket.on("connect", registerUser);

    return () => {
      nextSocket.off("connect", registerUser);
      setSocket(null);
      disconnectSocket();
    };
  }, [accessToken, userId]);

  useEffect(() => {
    if (!socket || !userId) return;

    socket.emit("set_online_visibility", {
      visible: showOnlineStatus,
    });
  }, [showOnlineStatus, socket, userId]);

  const getMediaStream = useCallback(
    async ({ video = true } = {}) => {
      if (!navigator.mediaDevices?.getUserMedia) {
        console.error("Camera and microphone are unavailable. getUserMedia requires a secure origin.");
        return null;
      }

      const requests = video ? MEDIA_REQUESTS_BY_MODE.video : MEDIA_REQUESTS_BY_MODE.audio;
      const errors = [];

      for (const constraints of requests) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia(constraints);

          setLocalStream((prevStream) => {
            if (prevStream) {
              prevStream.getTracks().forEach((track) => track.stop());
            }
            return stream;
          });
          syncLocalMediaState(stream);
          return stream;
        } catch (error) {
          errors.push({ constraints, error });
          console.warn("Failed to get local media with constraints", constraints, error);
        }
      }

      console.error("Failed to get local stream", errors);
      return null;
    },
    [syncLocalMediaState],
  );

  const addLocalTracksAndReceivers = useCallback((peer, stream, { video = true } = {}) => {
    if (!peer || !stream) return;

    const audioTracks = stream.getAudioTracks();
    const videoTracks = stream.getVideoTracks();
    const hasTransceiver = (kind) =>
      peer.getTransceivers().some((transceiver) => {
        return transceiver.sender?.track?.kind === kind || transceiver.receiver?.track?.kind === kind;
      });

    stream.getTracks().forEach((track) => {
      peer.addTrack(track, stream);
    });

    if (!audioTracks.length && !hasTransceiver("audio")) {
      peer.addTransceiver("audio", { direction: "recvonly" });
    }

    if (video && !videoTracks.length && !hasTransceiver("video")) {
      peer.addTransceiver("video", { direction: "recvonly" });
    }
  }, []);

  const getRemoteIceCandidate = useCallback((payload) => {
    if (!payload) return null;
    return payload.candidate || payload;
  }, []);

  const flushPendingIceCandidates = useCallback(async () => {
    if (!peerRef.current || !remoteDescriptionReadyRef.current) return;

    while (pendingIceCandidatesRef.current.length > 0) {
      const candidate = pendingIceCandidatesRef.current.shift();
      if (!candidate) continue;
      try {
        await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error("Failed to add queued ICE candidate", error);
      }
    }
  }, []);

  const queueOrAddIceCandidate = useCallback(async (candidate) => {
    if (!candidate) return;

    if (!peerRef.current || !remoteDescriptionReadyRef.current || !peerRef.current.remoteDescription) {
      pendingIceCandidatesRef.current.push(candidate);
      return;
    }

    try {
      await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error("Failed to add ICE candidate", error);
    }
  }, []);

  const setPeerRemoteDescription = useCallback(
    async (sessionDescription) => {
      if (!peerRef.current || !sessionDescription) return false;

      try {
        await peerRef.current.setRemoteDescription(sessionDescription);
        remoteDescriptionReadyRef.current = true;
        await flushPendingIceCandidates();
        return true;
      } catch (error) {
        console.error("Failed to set remote description", error);
        return false;
      }
    },
    [flushPendingIceCandidates],
  );

  const setupPeerConnection = useCallback(
    (targetId) => {
      if (peerRef.current) {
        peerRef.current.close();
        peerRef.current = null;
      }
      if (disconnectTimerRef.current) {
        clearTimeout(disconnectTimerRef.current);
        disconnectTimerRef.current = null;
      }
      remoteDescriptionReadyRef.current = false;
      remoteMediaStreamRef.current = null;
      setRemoteStream(null);

      const peer = createPeer();
      peerRef.current = peer;

      const syncRemoteTrackState = () => {
        const stream = remoteMediaStreamRef.current;
        const audioTracks = stream?.getAudioTracks?.() || [];
        const videoTracks = stream?.getVideoTracks?.() || [];

        setRemoteTracks({
          audioAvailable: audioTracks.some((track) => track.readyState === "live"),
          videoAvailable: videoTracks.some((track) => track.readyState === "live"),
        });
      };

      peer.ontrack = (event) => {
        console.debug("[webrtc] ontrack", {
          kind: event?.track?.kind,
          id: event?.track?.id,
          streams: event?.streams?.length || 0,
        });
        const [streamFromEvent] = event.streams || [];

        if (!remoteMediaStreamRef.current) {
          remoteMediaStreamRef.current = new MediaStream();
        }

        const remoteMediaStream = remoteMediaStreamRef.current;
        const incomingTracks = streamFromEvent?.getTracks?.()?.length ? streamFromEvent.getTracks() : [event.track];

        incomingTracks.forEach((track) => {
          if (!track || remoteMediaStream.getTracks().some((currentTrack) => currentTrack.id === track.id)) return;

          remoteMediaStream.addTrack(track);
          track.onunmute = syncRemoteTrackState;
          track.onmute = syncRemoteTrackState;
          track.onended = syncRemoteTrackState;
        });

        if (!remoteMediaStream.getTracks().length && event.track) {
          remoteMediaStream.addTrack(event.track);
        }

        // Use a fresh MediaStream reference so React re-attaches when audio/video
        // tracks arrive in separate ontrack events.
        setRemoteStream(new MediaStream(remoteMediaStream.getTracks()));
        syncRemoteTrackState();
      };

      peer.onicecandidate = (event) => {
        if (!event.candidate || !socket || !targetId) return;
        console.debug("[webrtc] local ice candidate", event.candidate?.candidate);
        socket.emit("ice_candidate", {
          toUserId: targetId,
          candidate: event.candidate,
        });
      };

      peer.onicecandidateerror = (event) => {
        console.warn("[webrtc] ice candidate error", event);
      };

      peer.oniceconnectionstatechange = () => {
        console.debug("[webrtc] iceConnectionState", peer.iceConnectionState);
      };

      peer.onicegatheringstatechange = () => {
        console.debug("[webrtc] iceGatheringState", peer.iceGatheringState);
      };

      peer.onsignalingstatechange = () => {
        console.debug("[webrtc] signalingState", peer.signalingState);
      };

      peer.onconnectionstatechange = () => {
        console.debug("[webrtc] connectionState", peer.connectionState);
        if (peer.connectionState === "connected") {
          if (disconnectTimerRef.current) {
            clearTimeout(disconnectTimerRef.current);
            disconnectTimerRef.current = null;
          }
          setCallState("connected");
        }

        if (peer.connectionState === "failed") {
          console.warn("Peer connection failed");
          finishCall({ reason: "connection_failed", by: "system" });
        }

        if (peer.connectionState === "disconnected") {
          if (disconnectTimerRef.current) return;

          // disconnected can be transient (Wi‑Fi hiccups, route changes).
          // Give it a short grace period before ending the call.
          disconnectTimerRef.current = setTimeout(() => {
            disconnectTimerRef.current = null;
            if (!peerRef.current) return;
            if (peerRef.current.connectionState === "connected") return;
            finishCall({ reason: "connection_lost", by: "system" });
          }, 12_000);
        }
      };

      return peer;
    },
    [socket, finishCall],
  );

  const cleanupCall = useCallback(() => {
    resetPeerState();

    setLocalStream((prevStream) => {
      if (prevStream) prevStream.getTracks().forEach((track) => track.stop());
      return null;
    });

    setPeerProfile(null);
    setLocalMediaState(DEFAULT_MEDIA_STATE);
    setRemoteMediaState(DEFAULT_MEDIA_STATE);
    setCallState("idle");
    setCallEndMeta(DEFAULT_END_META);
    setIncomingCall(null);
    setActivePeerId(null);
  }, [resetPeerState]);

  const emitMediaState = useCallback(
    (nextState, targetId = activePeerId) => {
      if (!socket || !targetId) return;
      socket.emit("call_media_toggle", {
        toUserId: targetId,
        media: nextState,
      });
    },
    [socket, activePeerId],
  );

  useEffect(() => {
    if (!socket) return undefined;

    const onIncomingCall = ({ from, offer, profile, media, isVideoCall }) => {
      const normalizedProfile = normalizeProfile(profile, from);
      setIncomingCall({
        from,
        offer,
        profile: normalizedProfile,
        media: {
          ...DEFAULT_MEDIA_STATE,
          ...(media || {}),
        },
        isVideoCall: Boolean(isVideoCall),
      });
      setPeerProfile(normalizedProfile);
      setRemoteMediaState({
        ...DEFAULT_MEDIA_STATE,
        ...(media || {}),
      });
      setActivePeerId(from);
      setCallState("ringing");
    };

    const onCallAccepted = async (payload) => {
      if (!peerRef.current) return;

      const answer = payload?.answer || payload;
      const calleeProfile = payload?.profile;
      const media = payload?.media;

      if (calleeProfile) {
        setPeerProfile((prev) => normalizeProfile(calleeProfile, prev?.id || activePeerId));
      }

      if (media) {
        setRemoteMediaState({
          ...DEFAULT_MEDIA_STATE,
          ...media,
        });
      }

      const applied = await setPeerRemoteDescription(answer);
      if (!applied) {
        cleanupCall();
        return;
      }
      setCallState("connected");
    };

    const onIceCandidate = async (payload) => {
      await queueOrAddIceCandidate(getRemoteIceCandidate(payload));
    };

    const onCallMediaToggle = ({ media }) => {
      if (!media) return;
      setRemoteMediaState((prev) => ({
        ...prev,
        ...media,
      }));
    };

    const onCallUnavailable = () => {
      finishCall({ reason: "unavailable", by: "system" });
    };

    const onCallEnded = (payload = {}) => {
      const reason = payload?.reason || "ended_by_peer";
      finishCall({ reason, by: "peer" });
    };

    const onGetOnlineUsers = (users) => {
      setOnlineUsers(users);
    };

    socket.on("incoming_call", onIncomingCall);
    socket.on("call_accepted", onCallAccepted);
    socket.on("ice_candidate", onIceCandidate);
    socket.on("call_media_toggle", onCallMediaToggle);
    socket.on("call_unavailable", onCallUnavailable);
    socket.on("call_ended", onCallEnded);
    socket.on("getOnlineUsers", onGetOnlineUsers);

    return () => {
      socket.off("incoming_call", onIncomingCall);
      socket.off("call_accepted", onCallAccepted);
      socket.off("ice_candidate", onIceCandidate);
      socket.off("call_media_toggle", onCallMediaToggle);
      socket.off("call_unavailable", onCallUnavailable);
      socket.off("call_ended", onCallEnded);
      socket.off("getOnlineUsers", onGetOnlineUsers);
    };
  }, [
    socket,
    activePeerId,
    cleanupCall,
    finishCall,
    queueOrAddIceCandidate,
    setPeerRemoteDescription,
    getRemoteIceCandidate,
  ]);

  const startCall = useCallback(
    async (targetId, options = { video: true }, targetProfile = null) => {
      if (!socket || !targetId) return;

      setLastCallVideo(Boolean(options?.video));
      const normalizedTargetProfile = normalizeProfile(targetProfile, targetId);
      pendingIceCandidatesRef.current = [];
      setActivePeerId(targetId);
      setPeerProfile(normalizedTargetProfile);
      setIncomingCall(null);
      setCallState("calling");
      setCallEndMeta(DEFAULT_END_META);

      const peer = setupPeerConnection(targetId);
      const stream = await getMediaStream(options);
      if (!stream) {
        cleanupCall();
        return;
      }

      const localMedia = getCurrentStreamMediaState(stream);
      setLocalMediaState(localMedia);
      emitMediaState(localMedia, targetId);

      addLocalTracksAndReceivers(peer, stream, options);

      try {
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);

        socket.emit("call_user", {
          toUserId: targetId,
          offer,
          isVideoCall: Boolean(options?.video),
          media: localMedia,
          profile: localProfile,
        });
      } catch (error) {
        console.error("Failed to start call", error);
        finishCall({ reason: "start_failed", by: "system" });
      }
    },
    [
      socket,
      localProfile,
      getMediaStream,
      cleanupCall,
      finishCall,
      getCurrentStreamMediaState,
      setupPeerConnection,
      emitMediaState,
      addLocalTracksAndReceivers,
    ],
  );

  const acceptCall = useCallback(async () => {
    const currentIncomingCall = incomingCallRef.current;
    if (!socket || !currentIncomingCall) return;

    setLastCallVideo(Boolean(currentIncomingCall.isVideoCall));
    setActivePeerId(currentIncomingCall.from);
    setPeerProfile(normalizeProfile(currentIncomingCall.profile, currentIncomingCall.from));

    const peer = setupPeerConnection(currentIncomingCall.from);

    const applied = await setPeerRemoteDescription(currentIncomingCall.offer);
    if (!applied) {
      finishCall({ reason: "accept_failed", by: "system" });
      return;
    }

    const stream = await getMediaStream({
      video: Boolean(currentIncomingCall.isVideoCall),
    });
    if (!stream) {
      cleanupCall();
      return;
    }

    const localMedia = getCurrentStreamMediaState(stream);
    setLocalMediaState(localMedia);

    addLocalTracksAndReceivers(peer, stream, {
      video: Boolean(currentIncomingCall.isVideoCall),
    });

    try {
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);

      socket.emit("answer_call", {
        toUserId: currentIncomingCall.from,
        answer,
        media: localMedia,
        profile: localProfile,
      });

      emitMediaState(localMedia, currentIncomingCall.from);
      setCallState("connected");
      setCallEndMeta(DEFAULT_END_META);
      setRemoteMediaState({
        ...DEFAULT_MEDIA_STATE,
        ...(currentIncomingCall.media || {}),
      });
    } catch (error) {
      console.error("Failed to accept call", error);
      finishCall({ reason: "accept_failed", by: "system" });
    }
  }, [
    socket,
    localProfile,
    getMediaStream,
    cleanupCall,
    finishCall,
    getCurrentStreamMediaState,
    setPeerRemoteDescription,
    setupPeerConnection,
    emitMediaState,
    addLocalTracksAndReceivers,
  ]);

  const endCall = useCallback(() => {
    if (socket && activePeerId) {
      socket.emit("end_call", { toUserId: activePeerId });
    }
    finishCall({ reason: "ended_by_you", by: "you" });
  }, [socket, activePeerId, finishCall]);

  const redial = useCallback(async () => {
    const targetId = callEndMeta?.peerId || peerProfile?.id;
    if (!targetId) return;
    const video = Boolean(callEndMeta?.video ?? lastCallVideo);
    await startCall(targetId, { video }, callEndMeta?.peerProfile || peerProfile);
  }, [callEndMeta, peerProfile, lastCallVideo, startCall]);

  useEffect(() => {
    if (!socket) return undefined;

    const onSocketDisconnect = () => {
      if (callState === "idle" || callState === "ended") return;
      finishCall({ reason: "socket_disconnected", by: "system" });
    };

    socket.on("disconnect", onSocketDisconnect);
    return () => {
      socket.off("disconnect", onSocketDisconnect);
    };
  }, [socket, callState, finishCall]);

  const toggleMic = useCallback(() => {
    if (!localStream) return;
    const audioTracks = localStream.getAudioTracks();

    if (!audioTracks.length) {
      setLocalMediaState((prev) => ({
        ...prev,
        audioEnabled: false,
      }));
      return;
    }

    const nextAudioEnabled = !audioTracks[0].enabled;
    audioTracks.forEach((track) => {
      track.enabled = nextAudioEnabled;
    });

    setLocalMediaState((prev) => {
      const nextState = {
        ...prev,
        audioEnabled: nextAudioEnabled,
      };
      emitMediaState(nextState);
      return nextState;
    });
  }, [localStream, emitMediaState]);

  const toggleCamera = useCallback(() => {
    if (!localStream) return;
    const videoTracks = localStream.getVideoTracks();

    if (!videoTracks.length) {
      setLocalMediaState((prev) => ({
        ...prev,
        videoEnabled: false,
      }));
      return;
    }

    const nextVideoEnabled = !videoTracks[0].enabled;
    videoTracks.forEach((track) => {
      track.enabled = nextVideoEnabled;
    });

    setLocalMediaState((prev) => {
      const nextState = {
        ...prev,
        videoEnabled: nextVideoEnabled,
      };
      emitMediaState(nextState);
      return nextState;
    });
  }, [localStream, emitMediaState]);

  const value = useMemo(
    () => ({
      socket,
      callState,
      callEndMeta,
      incomingCall,
      activePeerId,
      peerProfile,
      localProfile,
      localStream,
      remoteStream,
      remoteTracks,
      localMediaState,
      remoteMediaState,
      onlineUsers,
      startCall,
      acceptCall,
      endCall,
      redial,
      cleanupCall,
      toggleMic,
      toggleCamera,
      setCallState,
      setIncomingCall,
    }),
    [
      socket,
      callState,
      callEndMeta,
      incomingCall,
      activePeerId,
      peerProfile,
      localProfile,
      localStream,
      remoteStream,
      remoteTracks,
      localMediaState,
      remoteMediaState,
      onlineUsers,
      startCall,
      acceptCall,
      endCall,
      redial,
      cleanupCall,
      toggleMic,
      toggleCamera,
    ],
  );

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useCallContext = () => useContext(CallContext);
