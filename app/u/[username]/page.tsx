import type { Metadata } from "next";
import { PublicProfileView } from "@/components/public-profile-view";

export const metadata: Metadata = {
  title: "Cellar",
};

export default function PublicProfilePage() {
  return <PublicProfileView />;
}
