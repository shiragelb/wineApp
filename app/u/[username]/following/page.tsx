import type { Metadata } from "next";
import { FollowListView } from "@/components/follow-list-view";

export const metadata: Metadata = {
  title: "Following",
};

export default function FollowingPage() {
  return <FollowListView kind="following" />;
}
