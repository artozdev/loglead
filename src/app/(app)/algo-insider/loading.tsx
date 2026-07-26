export default function Loading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-7 w-56 animate-pulse rounded-lg bg-line" />
        <div className="mt-2 h-4 w-96 max-w-full animate-pulse rounded bg-line/70" />
      </div>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-10 w-28 animate-pulse rounded-xl bg-line" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card space-y-3">
            <div className="h-9 w-9 animate-pulse rounded-lg bg-line" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-line" />
            <div className="h-3 w-full animate-pulse rounded bg-line/70" />
            <div className="h-3 w-5/6 animate-pulse rounded bg-line/70" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-line/70" />
          </div>
        ))}
      </div>
    </div>
  );
}
