import React from "react";

const sizeMap = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
};

export const Avatar = ({ src, alt, size = "md" }) => {
  return (
    <div
      className={`relative overflow-hidden rounded-full bg-stone-300 ${sizeMap[size]}`}
    >
      <img src={src} alt={alt} className="h-full w-full object-cover" />
    </div>
  );
};
