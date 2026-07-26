"use client";

import { useEffect, useState } from "react";

export default function FeedbackModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      setSent(true);
      setTimeout(() => {
        setSent(false);
        setText("");
        onClose();
      }, 1300);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        aria-label="Fermer"
        onClick={onClose}
        className="absolute inset-0 modal-overlay backdrop-blur-sm"
      />
      <div className="relative w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-pop">
        {sent ? (
          <div className="py-6 text-center">
            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-success/10 text-success">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m5 12 5 5 9-11" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            <p className="font-display text-lg font-semibold">Merci pour ton retour</p>
            <p className="text-sm text-muted">On lit tout, promis.</p>
          </div>
        ) : (
          <form onSubmit={send} className="space-y-4">
            <div>
              <h2 className="font-display text-lg font-semibold">Un retour à partager ?</h2>
              <p className="text-sm text-muted">
                Dis-nous ce qui marche, ce qui coince, ou ce qui te manque.
              </p>
            </div>
            <textarea
              autoFocus
              rows={4}
              className="input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Ton message…"
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={onClose} className="btn-ghost">
                Annuler
              </button>
              <button type="submit" disabled={busy || !text.trim()} className="btn-primary">
                Envoyer le retour
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
