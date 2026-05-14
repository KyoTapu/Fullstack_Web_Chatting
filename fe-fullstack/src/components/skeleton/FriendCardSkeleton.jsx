import React from "react";

export const FriendCardSkeleton = () => {
  return (
    <div className="flex flex-col rounded-2xl border border-stone-100 bg-background p-4 shadow-md animate-pulse">
      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div className="relative h-14 w-14">
          <div className="h-full w-full rounded-full bg-stone-200" />
        </div>

        <div className="h-8 w-8 rounded-full bg-stone-200" />
      </div>

      {/* Info */}
      <div className="mb-3 space-y-2">
        <div className="h-4 w-32 rounded bg-stone-200" />
        <div className="h-3 w-40 rounded bg-stone-200" />
        <div className="h-3 w-28 rounded bg-stone-200" />

        <div className="mt-2 flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-stone-200" />
          <div className="h-5 w-16 rounded-full bg-stone-200" />
        </div>
      </div>

      {/* Actions */}
      <div className="mt-auto flex items-center gap-2">
        <div className="h-9 flex-1 rounded-xl bg-stone-200" />
        <div className="h-9 w-9 rounded-xl bg-stone-200" />
      </div>
    </div>
  );
};
