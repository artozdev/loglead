import Link from "next/link";

// Visual breadcrumb. Pair with breadcrumbSchema() JSON-LD on the page.
export default function Breadcrumb({ trail }: { trail: { name: string; path: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex flex-wrap items-center gap-1.5 text-[13px] text-slate-500">
        {trail.map((t, i) => {
          const last = i === trail.length - 1;
          return (
            <li key={t.path} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-slate-300">/</span>}
              {last ? (
                <span className="font-medium text-slate-700">{t.name}</span>
              ) : (
                <Link href={t.path} className="transition hover:text-slate-800">
                  {t.name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
