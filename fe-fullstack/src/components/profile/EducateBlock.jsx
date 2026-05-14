import React from "react";

export const EducateBlock = ({ education }) => {
  return (
    <div className="flex items-start justify-between border-b border-border py-3 last:border-b-0">
      <div>
        <h4 className="text-sm font-semibold text-textPrimary">{education.degree || "Untitled"}</h4>
        <p className="text-xs text-textMuted">
          {[education.school, education.year].filter(Boolean).join(" • ") || "No school details"}
        </p>
      </div>

      {education.status ? (
        <span className="ml-2 shrink-0 rounded border border-border bg-background px-2 py-1 text-xs text-textMuted">
          {education.status}
        </span>
      ) : null}
    </div>
  );
};
