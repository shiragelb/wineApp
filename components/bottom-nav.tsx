"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Plus, User } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs: {
  href: string;
  label: string;
  icon: typeof Home;
  featured?: boolean;
}[] = [
  { href: "/", label: "Feed", icon: Home },
  { href: "/upload", label: "Upload", icon: Plus, featured: true },
  { href: "/profile", label: "Profile", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md border-t border-border/80 bg-background/92 backdrop-blur-md"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="grid grid-cols-3 px-2 pt-1.5 pb-2">
        {tabs.map((tab) => {
          const isActive =
            tab.href === "/"
              ? pathname === "/"
              : pathname.startsWith(tab.href);
          const Icon = tab.icon;

          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                prefetch={true}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] font-medium tracking-wide transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span
                  className={cn(
                    "flex size-10 items-center justify-center rounded-full transition-colors",
                    tab.featured &&
                      "bg-primary text-primary-foreground shadow-sm",
                    tab.featured && isActive && "bg-primary",
                    !tab.featured && isActive && "bg-primary/8"
                  )}
                >
                  <Icon
                    className={cn(
                      "size-5",
                      tab.featured && "size-[22px] stroke-[2.25]"
                    )}
                    aria-hidden
                  />
                </span>
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
