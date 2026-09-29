import type { Metadata } from "next";
import { FeedView } from "@/components/feed-view";

export const metadata: Metadata = {
  title: "Friends",
};

export default function FeedPage() {
  return <FeedView />;
}
