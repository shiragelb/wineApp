import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function PageHeader({
  eyebrow,
  title,
  description,
  backHref,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  backHref?: string;
  children?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/90 px-5 pt-[max(0.85rem,env(safe-area-inset-top))] pb-3 backdrop-blur-md">
      {backHref ? (
        <Link
          href={backHref}
          prefetch={true}
          className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-primary"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          Back
        </Link>
      ) : null}
      {eyebrow ? (
        <p className="text-[11px] font-medium tracking-[0.18em] text-primary/80 uppercase">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="mt-1 text-[1.85rem] leading-none tracking-tight text-foreground">
        {title}
      </h1>
      {description ? (
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      ) : null}
      {children}
    </header>
  );
}
