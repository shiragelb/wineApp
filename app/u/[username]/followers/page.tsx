import type { Metadata } from "next";
import { FollowListView } from "@/components/follow-list-view";

export const metadata: Metadata = {
  title: "Followers",
};

export default function FollowersPage() {
  return <FollowListView kind="followers" />;
}
