import React from "react";

export const IconButton = ({
  icon: Icon,
  active,
  tooltip,
  onClick,
}) => (
  <button
    type="button"
    title={tooltip}
    onClick={onClick}
    className={`flex h-11 w-11 items-center justify-center rounded-2xl transition-colors
    ${
      active
        ? "bg-surface text-primary shadow-sm"
        : "text-white/80 hover:bg-white/15 hover:text-white"
    }`}
  >
    <Icon className="h-5 w-5" />
  </button>
);
