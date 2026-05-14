
export default function Toggle({ label, enabled, onChange }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-textMuted">{label}</span>
      <button
        type="button"
        onClick={onChange}
        className={`flex h-6 w-11 items-center rounded-full p-1 transition ${
          enabled ? "bg-primary" : "bg-border"
        }`}
      >
        <span
          className={`h-4 w-4 rounded-full bg-white shadow transition ${
            enabled ? "translate-x-5" : ""
          }`}
        />
      </button>
    </div>
  );
}

