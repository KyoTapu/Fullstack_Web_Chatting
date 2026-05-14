import React from "react";

export const MessageSkeleton = ({ isOwn }) => {
  return (
    <div className={`flex items-end gap-2 mb-3 ${isOwn ? "justify-end" : "justify-start"}`}>
      {/* Avatar (left only) */}
      {!isOwn && <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse" />}

      {/* Bubble */}
      <div className={`flex flex-col gap-1 ${isOwn ? "items-end" : "items-start"}`}>
        <div className={`h-3 rounded bg-gray-200 animate-pulse ${isOwn ? "w-24" : "w-32"}`} />
        <div className={`h-3 rounded bg-gray-200 animate-pulse ${isOwn ? "w-32" : "w-40"}`} />
      </div>
    </div>
  );
};
