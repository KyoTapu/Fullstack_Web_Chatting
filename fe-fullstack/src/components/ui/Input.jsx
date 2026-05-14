function Input({ label, error, icon, ...props }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</label>
      <div className="relative group">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-accent transition-colors">
            {icon}
          </div>
        )}
        <input
          {...props}
          className={`w-full rounded-xl border bg-gray-50/50 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 transition-all
            ${icon ? "pl-10" : ""}
            ${error ? "border-red-300 focus:border-red-400 focus:ring-red-100" : "border-gray-200 focus:border-accent focus:ring-accent/20"}`}
        />
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

export default Input;