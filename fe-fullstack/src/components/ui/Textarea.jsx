

function Textarea({ label, ...props }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</label>
      <textarea
        rows={4}
        {...props}
        className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:bg-white focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all resize-none"
      />
    </div>
  );
}
export default Textarea;