import React from "react";

export const TextInput = ({
  leftIcon,
  className,
  ...props
}) => {
  return (
    <div
      className={`flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 ${className ?? ""}`}
    >
      {leftIcon && (
        <span className="text-stone-400" aria-hidden="true">
          {leftIcon}
        </span>
      )}
      <input
        {...props}
        className="flex-1 border-none bg-transparent text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none"
      />
    </div>
  );
};
