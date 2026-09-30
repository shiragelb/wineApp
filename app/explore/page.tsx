import type { Metadata } from "next";
import { Suspense } from "react";
import { ExploreView } from "@/components/explore-view";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";

export const metadata: Metadata = {
  title: "Explore",
};

export default function ExplorePage() {
  return (
    <Suspense
      fallback={
        <>
          <PageHeader backHref="/" eyebrow="Cellar" title="Explore" />
          <div className="px-4 py-5">
            <EmptyState title="Opening the filter" body="Loading matching bottles…" />
          </div>
        </>
      }
    >
      <ExploreView />
    </Suspense>
  );
}
