"use client";

import { grapeBandColor, type GrapeShare } from "@/lib/wine-meta";
import { cn } from "@/lib/utils";

export function GrapeBlendBar({
  shares,
  className,
}: {
  shares: GrapeShare[];
  className?: string;
}) {
  if (shares.length === 0) return null;

  const known = shares.every((share) => typeof share.percentage === "number");
  const segments = known
    ? shares.map((share, index) => ({
        ...share,
        percentage: share.percentage as number,
        color: grapeBandColor(share.grape, index),
      }))
    : shares.map((share, index) => ({
        ...share,
        percentage: Math.round(100 / shares.length),
        color: grapeBandColor(share.grape, index),
      }));

  return (
    <div className={cn("space-y-2", className)}>
      <div
        className="flex h-8 overflow-hidden rounded-full border border-border/80 bg-muted shadow-[inset_0_1px_2px_rgba(40,20,10,0.12)]"
        role="img"
        aria-label={segments
          .map((segment) => `${segment.percentage}% ${segment.grape}`)
          .join(", ")}
      >
        {segments.map((segment) => (
          <div
            key={`${segment.grape}-${segment.percentage}`}
            className="relative flex min-w-0 items-center justify-center overflow-hidden text-[10px] font-semibold text-white transition-[flex-grow]"
            style={{
              flexGrow: Math.max(segment.percentage, 4),
              flexBasis: 0,
              background: `linear-gradient(180deg, color-mix(in oklab, ${segment.color} 88%, white), ${segment.color})`,
            }}
            title={`${segment.grape} ${segment.percentage}%`}
          >
            {segment.percentage >= 14 ? (
              <span className="truncate px-1 drop-shadow-sm">{segment.percentage}%</span>
            ) : null}
          </div>
        ))}
      </div>
      <ul className="flex flex-wrap gap-x-3 gap-y-1">
        {segments.map((segment) => (
          <li key={`legend-${segment.grape}`} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span
              className="size-2.5 rounded-full"
              style={{ backgroundColor: segment.color }}
              aria-hidden
            />
            <span>
              {segment.grape}
              {known ? ` · ${segment.percentage}%` : ""}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
