"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  countryFlag,
  explorePath,
  formatGrapeLabel,
  parseGrapeShares,
  wineTypeMeta,
  type GrapeShare,
} from "@/lib/wine-meta";

function TagPill({
  href,
  children,
  className,
}: {
  href?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const classes = cn(
    "inline-flex max-w-full items-center truncate rounded-full px-2.5 py-1 text-[11px] font-medium tracking-wide",
    className
  );
  if (!href) return <span className={classes}>{children}</span>;
  return (
    <Link href={href} prefetch={true} className={cn(classes, "hover:opacity-90")}>
      {children}
    </Link>
  );
}

export function WineOriginHeader({
  country,
  countryCode,
  region,
  winery,
  className,
}: {
  country?: string | null;
  countryCode?: string | null;
  region?: string | null;
  winery?: string | null;
  className?: string;
}) {
  const parts = [
    country
      ? {
          key: "country",
          label: country,
          href: explorePath({ region: country }),
        }
      : null,
    region
      ? {
          key: "region",
          label: region,
          href: explorePath({ region }),
        }
      : null,
    winery
      ? {
          key: "winery",
          label: winery,
          href: explorePath({ winery }),
        }
      : null,
  ].filter(Boolean) as { key: string; label: string; href: string }[];

  if (parts.length === 0) return null;
  const flag = countryFlag(countryCode);

  return (
    <p className={cn("text-xs leading-relaxed text-muted-foreground", className)}>
      {flag ? (
        <span className="mr-1" aria-hidden>
          {flag}
        </span>
      ) : null}
      {parts.map((part, index) => (
        <span key={part.key}>
          {index > 0 ? <span> • </span> : null}
          <Link href={part.href} prefetch={true} className="hover:text-foreground">
            {part.label}
          </Link>
        </span>
      ))}
    </p>
  );
}

export function WineAttributeTags({
  wineType,
  grapes,
  grapeShares,
  winery,
  region,
  className,
  showWinery = false,
  showRegion = false,
}: {
  wineType?: string | null;
  grapes?: string | GrapeShare[] | null;
  grapeShares?: GrapeShare[];
  winery?: string | null;
  region?: string | null;
  className?: string;
  showWinery?: boolean;
  showRegion?: boolean;
}) {
  const shares = grapeShares?.length ? grapeShares : parseGrapeShares(grapes);
  const typeMeta = wineTypeMeta(wineType);
  const grapeLabel = formatGrapeLabel(shares);
  const primaryGrape = shares[0]?.grape;

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {typeMeta ? (
        <TagPill href={explorePath({ type: typeMeta.id })} className={typeMeta.colorClass}>
          {typeMeta.label}
        </TagPill>
      ) : null}
      {grapeLabel ? (
        <TagPill
          href={primaryGrape ? explorePath({ grape: primaryGrape }) : undefined}
          className="bg-secondary text-secondary-foreground"
        >
          {grapeLabel}
        </TagPill>
      ) : null}
      {showWinery && winery ? (
        <TagPill href={explorePath({ winery })} className="bg-muted text-muted-foreground">
          {winery}
        </TagPill>
      ) : null}
      {showRegion && region ? (
        <TagPill href={explorePath({ region })} className="bg-muted text-muted-foreground">
          {region}
        </TagPill>
      ) : null}
    </div>
  );
}
