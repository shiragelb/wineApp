import { EmptyState } from "@/components/empty-state";

export function SetupNeeded({
  title = "Supabase is not connected",
  body = "Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local, then restart the app.",
}: {
  title?: string;
  body?: string;
}) {
  return (
    <div className="px-4 py-6">
      <EmptyState title={title} body={body} />
    </div>
  );
}
