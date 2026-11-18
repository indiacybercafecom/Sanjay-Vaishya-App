import React from 'react';

export function LoadingSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      <div className="h-7 w-48 rounded-lg skeleton-shimmer border border-[#262B38]" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: rows }).map((_, idx) => (
          <div
            key={idx}
            className="h-28 rounded-lg skeleton-shimmer border border-[#262B38]"
          />
        ))}
      </div>
    </div>
  );
}
