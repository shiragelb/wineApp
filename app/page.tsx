import { Suspense } from "react";
import { CellarHomeView } from "@/components/cellar-home-view";

export default function HomePage() {
  return (
    <Suspense>
      <CellarHomeView />
    </Suspense>
  );
}
