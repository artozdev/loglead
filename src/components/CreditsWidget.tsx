"use client";

import {
  Info,
  Loader2,
  RotateCcw,
  ShoppingCart,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  CREDIT_MAX,
  CREDIT_MIN,
  CREDIT_STEP,
  QUICK_PACKS,
  creditColor,
  creditsPrice,
  normalizeCredits,
} from "@/lib/credits";
import type { CreditTransaction } from "@/lib/types";

type CreditState = {
  balance: number;
  quota: number;
  plan: string;
  renewAt: string | null;
  transactions: CreditTransaction[];
};

type Insufficient = { needed: number; balance: number; action?: string };

const COLOR: Record<"ok" | "warn" | "danger", string> = {
  ok: "#64748B",
  warn: "#F59E0B",
  danger: "#EF4444",
};

export default function CreditsWidget() {
  const [data, setData] = useState<CreditState | null>(null);
  const [modal, setModal] = useState(false);
  const [insuffic, setInsuffic] = useState<Insufficient | null>(null);
  const [bannerHidden, setBannerHidden] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/credits", { cache: "no-store" });
      if (!res.ok) return;
      const d = await res.json();
      setData({
        balance: d.balance ?? 0,
        quota: d.quota ?? 0,
        plan: d.plan ?? "",
        renewAt: d.renewAt ?? null,
        transactions: d.transactions ?? [],
      });
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void load();
    const onChange = () => void load();
    const onInsuffic = (e: Event) => {
      const detail = (e as CustomEvent).detail as Insufficient;
      setInsuffic(detail);
      void load();
    };
    const onFocus = () => void load();
    const onOpen = () => setModal(true);
    window.addEventListener("loglead:credits-changed", onChange);
    window.addEventListener("loglead:insufficient-credits", onInsuffic as EventListener);
    window.addEventListener("loglead:open-credits", onOpen);
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("loglead:credits-changed", onChange);
      window.removeEventListener("loglead:insufficient-credits", onInsuffic as EventListener);
      window.removeEventListener("loglead:open-credits", onOpen);
      window.removeEventListener("focus", onFocus);
    };
  }, [load]);

  // Low-credit banner visibility (dismissed for 24h via localStorage).
  useEffect(() => {
    if (!data || data.quota <= 0) return setBannerHidden(true);
    const low = data.balance / data.quota < 0.2;
    if (!low) return setBannerHidden(true);
    const until = Number(localStorage.getItem("loglead_lowcredit_dismiss") ?? 0);
    setBannerHidden(Date.now() < until);
  }, [data]);

  if (!data) return null;
  const level = creditColor(data.balance, data.quota || 1);
  const color = COLOR[level];

  return (
    <>
      {/* Header badge */}
      <button
        onClick={() => setModal(true)}
        title="Vos crédits"
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[13px] font-semibold transition hover:bg-surface-hover ${
          level === "danger" ? "credit-pulse" : ""
        }`}
        style={{ color, borderColor: `${color}55` }}
      >
        <Zap size={14} strokeWidth={2} fill="currentColor" />
        <span className="num">{data.balance.toLocaleString("fr-FR")}</span>
      </button>

      {modal && <CreditsModal data={data} onClose={() => setModal(false)} onRefresh={load} />}

      {insuffic && (
        <InsufficientModal
          info={insuffic}
          onClose={() => setInsuffic(null)}
          onBuy={() => {
            setInsuffic(null);
            setModal(true);
          }}
        />
      )}

      {!bannerHidden &&
        createPortal(
          <div className="fixed left-1/2 top-3 z-[60] flex -translate-x-1/2 items-center gap-3 rounded-full border px-4 py-2 text-[13px] shadow-pop"
            style={{ background: "#FFF7ED", borderColor: "#FED7AA", color: "#92400E" }}
          >
            <Zap size={14} fill="currentColor" />
            <span>You&apos;re running low on credits ({data.balance.toLocaleString("fr-FR")} remaining)</span>
            <button
              onClick={() => setModal(true)}
              className="rounded-full bg-[#92400E] px-2.5 py-1 text-[12px] font-semibold text-white"
            >
              Buy credits
            </button>
            <button
              onClick={() => {
                localStorage.setItem("loglead_lowcredit_dismiss", String(Date.now() + 24 * 3600 * 1000));
                setBannerHidden(true);
              }}
              aria-label="Fermer"
              className="text-[#92400E]/70 hover:text-[#92400E]"
            >
              <X size={15} />
            </button>
          </div>,
          document.body,
        )}
    </>
  );
}

// ---------------------------------------------------------------------------
// "Vos crédits" modal — balance gauge + recharge
// ---------------------------------------------------------------------------
function CreditsModal({
  data,
  onClose,
  onRefresh,
}: {
  data: CreditState;
  onClose: () => void;
  onRefresh: () => Promise<void>;
}) {
  const [amount, setAmount] = useState(5000);
  const [buying, setBuying] = useState(false);
  const [custom, setCustom] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const price = creditsPrice(amount);
  const R = 78;
  const C = 2 * Math.PI * R;
  const ratio = data.quota > 0 ? Math.min(1, data.balance / data.quota) : 1;

  const renewLabel = data.renewAt
    ? new Date(data.renewAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })
    : null;

  function pick(v: number) {
    setAmount(normalizeCredits(v));
    setCustom("");
  }

  async function buy() {
    if (buying) return;
    setBuying(true);
    try {
      const res = await fetch("/api/credits/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credits: amount }),
      });
      const d = await res.json();
      if (res.ok && d.url) {
        window.location.href = d.url; // Stripe Checkout, or demo success redirect
      } else {
        setBuying(false);
      }
    } catch {
      setBuying(false);
    }
    void onRefresh();
  }

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button className="absolute inset-0 modal-overlay backdrop-blur-sm" aria-label="Fermer" onClick={onClose} />
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-line bg-surface shadow-pop">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Zap size={15} fill="currentColor" />
            </span>
            <h2 className="font-display text-base font-semibold text-ink">Vos crédits</h2>
            <Link href="/settings/credits/history" className="ml-1 text-muted hover:text-ink" title="En savoir plus">
              <Info size={15} />
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/settings/credits/history" className="rounded-lg border border-line px-2.5 py-1 text-[12px] font-medium text-ink hover:bg-surface-hover">
              Utilisation
            </Link>
            <button onClick={onClose} className="text-muted hover:text-ink" aria-label="Fermer"><X size={18} /></button>
          </div>
        </div>

        {/* Gauge */}
        <div className="flex flex-col items-center px-5 pt-6">
          <div className="relative h-44 w-44">
            <svg viewBox="0 0 180 180" className="h-full w-full -rotate-90">
              <defs>
                <linearGradient id="credit-gauge" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#0051FF" />
                  <stop offset="1" stopColor="#0085FF" />
                </linearGradient>
              </defs>
              <circle cx="90" cy="90" r={R} fill="none" stroke="var(--color-line, #EEF2F7)" strokeWidth="12" />
              <circle
                cx="90" cy="90" r={R} fill="none" stroke="url(#credit-gauge)" strokeWidth="12" strokeLinecap="round"
                strokeDasharray={C} strokeDashoffset={C * (1 - ratio)}
                style={{ transition: "stroke-dashoffset 500ms ease" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="num text-[52px] font-bold leading-none text-ink">{data.balance.toLocaleString("fr-FR")}</span>
              <span className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-muted">Crédits restants</span>
            </div>
          </div>
          {renewLabel && (
            <p className="mt-3 flex items-center gap-1 text-[12px] text-muted">
              <Info size={12} /> Vos crédits se renouvellent le {renewLabel}
            </p>
          )}
        </div>

        {/* Recharge */}
        <div className="border-t border-line px-5 py-5">
          <h3 className="text-[14px] font-semibold text-ink">Recharger votre solde de crédits</h3>
          <p className="mt-1 text-[12px] text-muted">
            Les crédits achetés n&apos;expirent jamais.{" "}
            <Link href="/settings/credits/history" className="text-primary hover:underline">En savoir plus →</Link>
          </p>

          <input
            type="range"
            min={CREDIT_MIN}
            max={CREDIT_MAX}
            step={CREDIT_STEP}
            value={amount}
            onChange={(e) => { setAmount(Number(e.target.value)); setCustom(""); }}
            className="credit-slider mt-4 w-full"
          />
          <div className="mt-1 flex justify-between text-[10px] text-faint">
            <span>500</span><span>5 000</span><span>30 000</span><span>50 000</span>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {QUICK_PACKS.map((p) => (
              <button
                key={p}
                onClick={() => pick(p)}
                className={`rounded-lg border px-3 py-1.5 text-[13px] font-medium transition ${
                  amount === p && !custom ? "border-2 border-primary bg-primary/5 text-primary" : "border-line text-ink hover:border-primary/40"
                }`}
              >
                {p.toLocaleString("fr-FR")}
              </button>
            ))}
            <input
              ref={inputRef}
              value={custom}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "");
                setCustom(v);
                if (v) setAmount(normalizeCredits(Number(v)));
              }}
              inputMode="numeric"
              placeholder="Autre"
              className="w-20 rounded-lg border border-line bg-canvas px-3 py-1.5 text-[13px] text-ink outline-none focus:border-primary"
            />
          </div>

          <p className="mt-3 text-[13px] text-muted">
            Vous paierez <span className="font-semibold text-ink">{price.toLocaleString("fr-FR")} €</span>
          </p>

          <div className="mt-3 flex items-center gap-2">
            <Link href="/settings/credits/history" className="btn-secondary !px-3 !py-2 text-[12px]">
              <RotateCcw size={13} /> Historique
            </Link>
            <button onClick={buy} disabled={buying} className="btn-primary flex-1 !py-2 text-[13px] disabled:opacity-60">
              {buying ? <Loader2 size={15} className="animate-spin" /> : <ShoppingCart size={14} />}
              Acheter {amount.toLocaleString("fr-FR")} crédits
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ---------------------------------------------------------------------------
// Insufficient-credits blocking modal
// ---------------------------------------------------------------------------
function InsufficientModal({
  info,
  onClose,
  onBuy,
}: {
  info: Insufficient;
  onClose: () => void;
  onBuy: () => void;
}) {
  return createPortal(
    <div className="fixed inset-0 z-[75] flex items-center justify-center p-4">
      <button className="absolute inset-0 modal-overlay backdrop-blur-sm" aria-label="Fermer" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-line bg-surface p-5 shadow-pop">
        <div className="flex items-start justify-between">
          <h2 className="flex items-center gap-2 font-display text-base font-semibold text-ink">
            <Zap size={17} className="text-danger" fill="currentColor" /> Not enough credits
          </h2>
          <button onClick={onClose} className="text-muted hover:text-ink" aria-label="Fermer"><X size={18} /></button>
        </div>
        <p className="mt-3 text-[13px] text-muted">
          You need <span className="font-semibold text-ink">{info.needed}</span> credits for this action.
          You currently have <span className="font-semibold text-ink">{info.balance}</span> credits remaining.
        </p>
        <p className="mt-2 text-[13px] text-muted">
          Buy more credits or upgrade your plan to get more monthly credits.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button onClick={onBuy} className="btn-primary !py-2 text-[13px]">Buy credits →</button>
          <Link href="/pricing" className="btn-secondary !py-2 text-center text-[13px]">Upgrade my plan →</Link>
        </div>
      </div>
    </div>,
    document.body,
  );
}
