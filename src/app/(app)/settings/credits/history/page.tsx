"use client";

import { Download, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { CreditTransaction } from "@/lib/types";

// Human labels for ledger rows.
const ACTION_LABELS: Record<string, string> = {
  generate_post: "Post generated",
  generate_post_variant: "Post variant generated",
  improve_post: "Post improved (AI)",
  clone_viral_structure: "Viral structure cloned",
  refresh_market_data: "Market data refreshed",
  analyze_competitor: "Competitor analyzed",
  detect_trends: "Trends detected",
  detect_buying_signals: "Buying signals scanned",
  find_prospects: "Prospects found",
  enrich_lead_email: "Lead enriched (email)",
  enrich_lead_phone: "Lead enriched (phone)",
  enrich_lead_full: "Lead enriched (full)",
  calculate_lead_score: "Lead score calculated",
  generate_message: "Message generated",
  ai_chat_message: "AI chat message",
  ai_market_analysis: "AI market analysis",
  ai_prospect_search: "AI prospect search",
  ai_weekly_report: "AI weekly report",
  geo_scan: "AI Visibility scan",
  geo_competitor_scan: "AI Visibility competitor scan",
};

function labelFor(tx: CreditTransaction): string {
  if (tx.type === "trial") return "Trial credits added";
  if (tx.type === "purchase") return "Credits purchased";
  if (tx.type === "monthly_renewal") return "Monthly renewal";
  return (tx.action && ACTION_LABELS[tx.action]) || "Credit usage";
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });

export default function CreditHistoryPage() {
  const [tx, setTx] = useState<CreditTransaction[] | null>(null);

  useEffect(() => {
    fetch("/api/credits", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setTx(d.transactions ?? []))
      .catch(() => setTx([]));
  }, []);

  function exportCsv() {
    if (!tx) return;
    const rows = [
      ["Date", "Action", "Credits", "Balance"],
      ...tx.map((t) => [fmtDate(t.createdAt), labelFor(t), String(t.credits), String(t.balanceAfter)]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "loglead-credit-history.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Credit history</h1>
          <span className="lead-rule" />
          <p className="mt-2 text-muted">Every credit added or spent, in real time.</p>
        </div>
        <button onClick={exportCsv} disabled={!tx} className="btn-secondary !px-3 !py-2 text-[13px] disabled:opacity-50">
          <Download size={14} /> Export CSV
        </button>
      </div>

      <section className="overflow-hidden rounded-[12px] border-[0.5px] border-line bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-[13px]">
            <thead>
              <tr className="border-b-[0.5px] border-line text-[11px] uppercase tracking-wide text-muted">
                <th className="px-5 py-3 font-semibold">Date</th>
                <th className="px-5 py-3 font-semibold">Action</th>
                <th className="px-5 py-3 text-right font-semibold">Credits</th>
                <th className="px-5 py-3 text-right font-semibold">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y-[0.5px] divide-line">
              {tx === null ? (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-muted">
                    <Loader2 size={16} className="mx-auto animate-spin" />
                  </td>
                </tr>
              ) : tx.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-faint">No transactions yet.</td>
                </tr>
              ) : (
                tx.map((t) => (
                  <tr key={t.id} className="transition hover:bg-surface-hover">
                    <td className="num whitespace-nowrap px-5 py-3 text-muted">{fmtDate(t.createdAt)}</td>
                    <td className="px-5 py-3 text-ink">{labelFor(t)}</td>
                    <td className={`num px-5 py-3 text-right font-semibold ${t.credits >= 0 ? "text-success" : "text-danger"}`}>
                      {t.credits >= 0 ? `+${t.credits}` : t.credits}
                    </td>
                    <td className="num px-5 py-3 text-right text-ink">{t.balanceAfter}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
