import { Phone, PhoneOff } from "lucide-react";

const buildReasonLabel = (callEndMeta) => {
  const reason = String(callEndMeta?.reason || "").toLowerCase();
  if (!reason) return "Call is ended";
  if (reason.includes("peer_disconnected")) return "Ended call";
  if (reason.includes("ended_by_peer")) return "Disconnected";
  if (reason.includes("ended_by_you")) return "You have ended the call";
  if (reason.includes("socket_disconnected")) return "Disconnected";
  if (reason.includes("connection")) return "Kết nối cuộc gọi bị gián đoạn.";
  if (reason.includes("unavailable")) return "Unavailable";
  return "The call is ended.";
};

const getPeerName = (callEndMeta, peerProfile) =>
  callEndMeta?.peerProfile?.name || peerProfile?.name || "Unknown contact";

const CallEnded = ({ callEndMeta, peerProfile, onRedial, onClose }) => {
  const endedPeerName = getPeerName(callEndMeta, peerProfile);
  const reasonLabel = buildReasonLabel(callEndMeta);

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-stone-950/80 px-4">
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="p-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-stone-100 text-stone-700">
            <PhoneOff size={22} />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-stone-900">Call ended</h2>
          <p className="mt-1 text-sm text-stone-600">{endedPeerName}</p>
          <p className="mt-3 text-sm text-stone-500">{reasonLabel}</p>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onRedial}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-400"
            >
              <Phone size={16} />
              Call Again
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallEnded;
