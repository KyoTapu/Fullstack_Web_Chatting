import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, MicOff, Phone, PhoneOff, Video, VideoOff } from "lucide-react";
import { useCall } from "../../hooks/useCall";
import CallEnded from "../../components/call/CallEnded";

const PREVIEW_MARGIN = 16;
const PREVIEW_FALLBACK_WIDTH = 176;
const PREVIEW_FALLBACK_HEIGHT = 248;
const DEFAULT_AVATAR_URL = "/ezicon.png";

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const AvatarFallback = ({ name, avatarUrl, sizeClass = "h-16 w-16" }) => {
  const initial = (name || "?").trim().charAt(0).toUpperCase();

  return (
    <div className="flex flex-col items-center gap-3">
      <img
        src={avatarUrl || DEFAULT_AVATAR_URL}
        alt={name || "Avatar"}
        onError={(event) => {
          event.currentTarget.src = DEFAULT_AVATAR_URL;
        }}
        className={`${sizeClass} rounded-full border border-stone-200 object-cover`}
      />
      <div className="text-xs font-semibold uppercase tracking-[0.15em] text-stone-500">{initial}</div>
    </div>
  );
};

const Call = () => {
  const {
    callState,
    callEndMeta,
    incomingCall,
    activePeerId,
    peerProfile,
    localProfile,
    acceptCall,
    localStream,
    remoteStream,
    remoteTracks,
    localMediaState,
    remoteMediaState,
    toggleMic,
    toggleCamera,
    endCall,
    redial,
    cleanupCall,
  } = useCall();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const previewRef = useRef(null);
  const dragRef = useRef({
    active: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
  });

  const [duration, setDuration] = useState(0);
  const [isDraggingPreview, setIsDraggingPreview] = useState(false);
  const [remotePlaybackBlocked, setRemotePlaybackBlocked] = useState(false);

  const [previewPos, setPreviewPos] = useState(() => {
    const maxX = Math.max(PREVIEW_MARGIN, window.innerWidth - PREVIEW_FALLBACK_WIDTH - PREVIEW_MARGIN);
    return {
      x: maxX,
      y: 80,
    };
  });

  useEffect(() => {
    if (localStream && localVideoRef.current) {
      const node = localVideoRef.current;
      node.srcObject = localStream;
      const playPromise = node.play?.();
      if (playPromise?.catch) {
        playPromise.catch((error) => {
          console.debug("Local video play() was blocked", error);
        });
      }
    }
  }, [localStream]);

  const playRemoteMedia = useCallback(async () => {
    const node = remoteVideoRef.current;
    if (!node) return;

    try {
      node.muted = false;
      node.volume = 1;
      await node.play?.();
      setRemotePlaybackBlocked(false);
    } catch (error) {
      setRemotePlaybackBlocked(true);
      console.warn("Remote media playback was blocked. User interaction is required.", error);
    }
  }, []);

  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      const node = remoteVideoRef.current;
      node.srcObject = remoteStream;
      playRemoteMedia();
    }
  }, [playRemoteMedia, remoteStream]);

  useEffect(() => {
    if (callState !== "connected") {
      return;
    }

    const timer = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);

    return () => {
      clearInterval(timer);
      setDuration(0);
    };
  }, [callState]);

  useEffect(() => {
    const onResize = () => {
      const node = previewRef.current;
      const width = node?.offsetWidth ?? PREVIEW_FALLBACK_WIDTH;
      const height = node?.offsetHeight ?? PREVIEW_FALLBACK_HEIGHT;
      const maxX = Math.max(PREVIEW_MARGIN, window.innerWidth - width - PREVIEW_MARGIN);
      const maxY = Math.max(PREVIEW_MARGIN, window.innerHeight - height - PREVIEW_MARGIN);

      setPreviewPos((prev) => ({
        x: clamp(prev.x, PREVIEW_MARGIN, maxX),
        y: clamp(prev.y, PREVIEW_MARGIN, maxY),
      }));
    };

    window.addEventListener("resize", onResize);
    onResize();
    return () => window.removeEventListener("resize", onResize);
  }, []);

  if (callState === "idle") return null;

  if (callState === "ended") {
    return <CallEnded callEndMeta={callEndMeta} peerProfile={peerProfile} onRedial={redial} onClose={cleanupCall} />;
  }

  const formatDuration = (seconds) => {
    const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
    const ss = String(seconds % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  };

  const statusLabel =
    {
      calling: "Calling...",
      ringing: "Incoming call",
      connected: "Connected",
    }[callState] || "Call in progress";

  const peerId = peerProfile?.id || incomingCall?.from || activePeerId;
  const peerLabel = peerProfile?.name || (peerId ? `User #${peerId}` : "Unknown contact");

  const hasAudioTrack = (localStream?.getAudioTracks()?.length || 0) > 0;
  const hasVideoTrack = (localStream?.getVideoTracks()?.length || 0) > 0;
  const isMicMuted = !localMediaState?.audioEnabled;
  const isCameraOff = !localMediaState?.videoEnabled;
  const isRemoteCameraOff = !remoteMediaState?.videoEnabled;
  const shouldShowRemoteVideo =
    Boolean(remoteStream) &&
    Boolean(remoteTracks?.videoAvailable) &&
    !isRemoteCameraOff;
  const shouldShowLocalVideo = Boolean(localStream) && !isCameraOff;
  const shouldShowRemoteAvatar =
    Boolean(remoteStream) &&
    Boolean(remoteTracks?.videoAvailable) &&
    isRemoteCameraOff;

  const handlePreviewPointerDown = (event) => {
    if (event.button !== 0 && event.pointerType !== "touch") return;

    const target = previewRef.current;
    if (!target) return;

    dragRef.current = {
      active: true,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: previewPos.x,
      originY: previewPos.y,
    };
    setIsDraggingPreview(true);

    target.setPointerCapture?.(event.pointerId);
  };

  const handlePreviewPointerMove = (event) => {
    if (!dragRef.current.active || dragRef.current.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - dragRef.current.startX;
    const deltaY = event.clientY - dragRef.current.startY;

    const node = previewRef.current;
    const width = node?.offsetWidth ?? PREVIEW_FALLBACK_WIDTH;
    const height = node?.offsetHeight ?? PREVIEW_FALLBACK_HEIGHT;
    const maxX = Math.max(PREVIEW_MARGIN, window.innerWidth - width - PREVIEW_MARGIN);
    const maxY = Math.max(PREVIEW_MARGIN, window.innerHeight - height - PREVIEW_MARGIN);

    setPreviewPos({
      x: clamp(dragRef.current.originX + deltaX, PREVIEW_MARGIN, maxX),
      y: clamp(dragRef.current.originY + deltaY, PREVIEW_MARGIN, maxY),
    });
  };

  const handlePreviewPointerUp = (event) => {
    if (dragRef.current.pointerId !== event.pointerId) return;
    dragRef.current.active = false;
    setIsDraggingPreview(false);

    const target = previewRef.current;
    target?.releasePointerCapture?.(event.pointerId);
  };

  return (
    <div className="fixed inset-0 z-[1000] overflow-hidden bg-background text-stone-900">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(96,86,74,0.16),_transparent_48%),radial-gradient(circle_at_bottom_right,_rgba(217,119,6,0.1),_transparent_40%)]" />

      <div className="relative flex h-full w-full flex-col px-4 py-5 sm:px-6 sm:py-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-stone-500">Call Session</p>
            <h2 className="text-xl font-semibold text-primary">{statusLabel}</h2>
            <p className="mt-1 text-sm text-stone-600">{peerLabel}</p>
          </div>

            <div className="flex items-center gap-2 rounded-full border border-stone-200 bg-white/90 px-3 py-1.5 text-sm text-stone-700 shadow-sm">
            <Video size={14} />
            <span>
              {callState === "connected"
                ? formatDuration(duration)
                : shouldShowRemoteVideo
                  ? "Video active"
                  : "Waiting video"}
            </span>
          </div>
        </div>

        <div className="relative min-h-0 flex-1 overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-[0_16px_32px_rgba(15,23,42,0.12)]">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className={`h-full w-full object-cover ${shouldShowRemoteVideo ? "opacity-100" : "opacity-0"}`}
          />

          {remotePlaybackBlocked && remoteStream && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/35 px-4">
              <button
                type="button"
                onClick={playRemoteMedia}
                className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-primary shadow-lg transition hover:bg-stone-100"
              >
                Bật âm thanh và video
              </button>
            </div>
          )}

          {!shouldShowRemoteVideo && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-stone-500">
              {shouldShowRemoteAvatar ? (
                <>
                  <AvatarFallback name={peerProfile?.name} avatarUrl={peerProfile?.avatarUrl} />
                  <p className="text-sm">Remote camera is turned off</p>
                </>
              ) : (
                <>
                  <div className="h-16 w-16 animate-pulse rounded-full border border-stone-200 bg-stone-100" />
                  <p className="text-sm">
                    {callState === "ringing" ? "Caller is waiting for your response" : "Connecting to remote stream..."}
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        <div
          ref={previewRef}
          className={`absolute z-20 h-[248px] w-[176px] overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-lg touch-none select-none ${
            isDraggingPreview ? "cursor-grabbing" : "cursor-grab"
          }`}
          style={{
            transform: `translate3d(${previewPos.x}px, ${previewPos.y}px, 0)`,
          }}
          onPointerDown={handlePreviewPointerDown}
          onPointerMove={handlePreviewPointerMove}
          onPointerUp={handlePreviewPointerUp}
          onPointerCancel={handlePreviewPointerUp}
        >
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className={`h-full w-full object-cover ${shouldShowLocalVideo ? "opacity-100" : "opacity-0"}`}
          />
          {!shouldShowLocalVideo && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-[11px] text-stone-500">
              <AvatarFallback name={localProfile?.name} avatarUrl={localProfile?.avatarUrl} sizeClass="h-14 w-14" />
              <span>{localStream ? "Camera is off" : "Local cam"}</span>
            </div>
          )}
          <div className="absolute inset-x-0 top-0 flex h-8 items-center justify-center bg-gradient-to-b from-black/25 to-transparent text-[11px] font-medium text-white">
            Kéo để di chuyển
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center px-4">
        <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-stone-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur-md">
          {callState === "ringing" && (
            <button
              onClick={acceptCall}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-400"
            >
              <Phone size={16} />
              Accept
            </button>
          )}

          <button
            onClick={endCall}
            className="inline-flex items-center gap-2 rounded-full bg-rose-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-500"
          >
            <PhoneOff size={16} />
            {callState === "ringing" ? "Reject" : "End Call"}
          </button>

          {callState === "connected" && (
            <>
              <button
                onClick={toggleMic}
                disabled={!hasAudioTrack}
                className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  isMicMuted
                    ? "border-amber-200 bg-amber-100 text-amber-700 hover:bg-amber-200"
                    : "border-stone-200 bg-stone-100 text-primary hover:bg-stone-200"
                }`}
                title={isMicMuted ? "Unmute microphone" : "Mute microphone"}
              >
                {isMicMuted ? <MicOff size={16} /> : <Mic size={16} />}
              </button>

              <button
                onClick={toggleCamera}
                disabled={!hasVideoTrack}
                className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  isCameraOff
                    ? "border-amber-200 bg-amber-100 text-amber-700 hover:bg-amber-200"
                    : "border-stone-200 bg-stone-100 text-primary hover:bg-stone-200"
                }`}
                title={isCameraOff ? "Turn camera on" : "Turn camera off"}
              >
                {isCameraOff ? <VideoOff size={16} /> : <Video size={16} />}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Call;
