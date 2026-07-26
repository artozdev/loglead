import Link from "next/link";
import type { Plan } from "@/lib/types";

const Icon = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3 1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8z" />
    <path d="M19 14l.8 1.9L22 17l-2.2.9L19 20l-.8-1.9L16 17l2.2-.9z" />
  </svg>
);

// Header entry point to Loger, the CMO IA. Active on Pro, locked otherwise.
export default function AIAgentButton({ plan }: { plan: Plan }) {
  if (plan === "pro") {
    return (
      <Link
        href="/cmo-ia"
        aria-label="Loger — ton CMO IA"
        title="Loger, ton CMO IA"
        className="flex h-9 w-9 items-center justify-center rounded-[10px] text-primary transition hover:bg-primary/5"
      >
        {Icon}
      </Link>
    );
  }
  return (
    <button
      type="button"
      disabled
      title="CMO IA — réservé à l'offre Pro"
      aria-label="CMO IA — réservé à l'offre Pro"
      className="flex h-9 w-9 cursor-not-allowed items-center justify-center rounded-[10px] text-gray-300"
    >
      {Icon}
    </button>
  );
}
