import type { Metadata } from "next";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = {
  title: "Profile",
};

const stats = [
  { label: "Tickets", value: "—" },
  { label: "Following", value: "—" },
  { label: "Followers", value: "—" },
];

export default function ProfilePage() {
  return (
    <>
      <PageHeader
        eyebrow="Your cellar"
        title="Profile"
        description="Public handle, avatar, and the tickets you hang. Auth arrives in the next slice."
      />
      <div className="space-y-6 px-4 py-5">
        <section className="flex items-center gap-4">
          <div
            aria-hidden
            className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground"
          >
            HT
          </div>
          <div className="min-w-0">
            <h2 className="text-xl leading-none tracking-tight">guest</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Not signed in · preview profile
            </p>
          </div>
        </section>

        <dl className="grid grid-cols-3 divide-x divide-border rounded-2xl border border-border bg-card">
          {stats.map((stat) => (
            <div key={stat.label} className="px-2 py-3 text-center">
              <dt className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                {stat.label}
              </dt>
              <dd className="mt-1 text-lg font-semibold tabular-nums">{stat.value}</dd>
            </div>
          ))}
        </dl>

        <EmptyState
          title="No tickets yet"
          body="When you hang a bottle, it will show up here in a photo grid."
        />
      </div>
    </>
  );
}
