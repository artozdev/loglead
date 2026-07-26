"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PLANS, type Plan } from "@/lib/types";

export default function PlanSelector({ current }: { current: Plan }) {
  const router = useRouter();
  const [plan, setPlan] = useState(current);
  const [busy, setBusy] = useState(false);

  async function change(p: Plan) {
    if (p === plan) return;
    setBusy(true);
    setPlan(p);
    try {
      await fetch("/api/workspaces/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: p }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card space-y-3">
      <div>
        <h2 className="font-display text-lg font-semibold">Offre</h2>
        <p className="text-sm text-muted">
          Le CMO IA « Loger » est réservé à l&apos;offre Pro. (Démo : change de
          plan pour voir le verrouillage.)
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {PLANS.map((p) => (
          <button
            key={p.value}
            onClick={() => change(p.value)}
            disabled={busy}
            className={`chip cursor-pointer ${
              plan === p.value
                ? "border-primary bg-primary/10 text-primary"
                : "border-line text-muted"
            }`}
          >
            {p.label}
            {p.value === "pro" ? " · CMO IA" : ""}
          </button>
        ))}
      </div>
    </section>
  );
}
