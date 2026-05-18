"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  function getPages(): (number | "...")[] {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  }

  return (
    <div className="flex items-center justify-center gap-1 py-3">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-card disabled:opacity-30 disabled:pointer-events-none transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      {getPages().map((page, i) =>
        page === "..." ? (
          <span key={`ellipsis-${i}`} className="px-2 text-xs text-muted-foreground">
            ...
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={cn(
              "min-w-[32px] rounded-lg px-2 py-1.5 text-sm font-medium transition-colors",
              page === currentPage
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-card"
            )}
          >
            {page}
          </button>
        )
      )}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-card disabled:opacity-30 disabled:pointer-events-none transition-colors"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

export { Pagination };
