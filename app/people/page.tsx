import type { Metadata } from "next";
import { PeopleSearchView } from "@/components/people-search-view";

export const metadata: Metadata = {
  title: "Find people",
};

export default function PeoplePage() {
  return <PeopleSearchView />;
}
