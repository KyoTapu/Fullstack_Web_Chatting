import React, { useMemo } from "react";

export const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  maxPageButtons = 5,
  previousLabel = "Previous",
  nextLabel = "Next",
  className = "",
}) => {
  const safeTotalPages = Math.max(1, totalPages);
  const safeCurrentPage = Math.min(Math.max(1, currentPage), safeTotalPages);

  const paginationPages = useMemo(() => {
    const limit = Math.max(1, maxPageButtons);
    const half = Math.floor(limit / 2);
    let start = Math.max(1, safeCurrentPage - half);
    let end = Math.min(safeTotalPages, start + limit - 1);
    start = Math.max(1, end - limit + 1);

    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }, [safeCurrentPage, safeTotalPages, maxPageButtons]);

  if (safeTotalPages <= 1) return null;

  const handlePageChange = (page) => {
    if (typeof onPageChange !== "function" || page === safeCurrentPage) return;
    onPageChange(page);
  };

  return (
    <div className={`flex items-center gap-2 ${className}`.trim()}>
      <button
        type="button"
        onClick={() => handlePageChange(Math.max(1, safeCurrentPage - 1))}
        disabled={safeCurrentPage === 1}
        className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-textPrimary transition hover:bg-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        {previousLabel}
      </button>

      {paginationPages.map((page) => (
        <button
          key={page}
          type="button"
          onClick={() => handlePageChange(page)}
          className={`rounded-lg px-3 py-1.5 text-xs transition ${
            safeCurrentPage === page
              ? "bg-primary font-semibold"
              : "border border-border bg-background text-textPrimary hover:bg-hover"
          }`}
          style={safeCurrentPage === page ? { color: "var(--app-chat-bubble-own-text)" } : undefined}
          aria-current={safeCurrentPage === page ? "page" : undefined}
        >
          {page}
        </button>
      ))}

      <button
        type="button"
        onClick={() => handlePageChange(Math.min(safeTotalPages, safeCurrentPage + 1))}
        disabled={safeCurrentPage === safeTotalPages}
        className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-textPrimary transition hover:bg-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        {nextLabel}
      </button>
    </div>
  );
};

export default Pagination;
