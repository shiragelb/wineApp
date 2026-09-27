export function EmptyState({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/60 px-5 py-10 text-center">
      <h2 className="text-xl tracking-tight text-foreground">{title}</h2>
      <p className="mx-auto mt-2 max-w-[16rem] text-sm leading-relaxed text-muted-foreground">
        {body}
      </p>
    </div>
  );
}
