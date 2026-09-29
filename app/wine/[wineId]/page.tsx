import type { Metadata } from "next";
import { WineFeedView } from "@/components/wine-feed-view";

export const metadata: Metadata = {
  title: "Wine",
};

export default function WinePage() {
  return <WineFeedView />;
}
