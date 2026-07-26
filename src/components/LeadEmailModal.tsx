"use client";

import { useState } from "react";
import type { Lead } from "@/lib/types";

const TEMPLATES: { label: string; subject: string; body: string }[] = [
  {
    label: "Commentaire LinkedIn",
    subject: "Suite à ton commentaire",
    body: "Bonjour {{prénom}},\n\nMerci pour ton commentaire sur notre post. J'ai pensé que ça pourrait t'intéresser d'échanger.\n\nDispo cette semaine ?",
  },
  {
    label: "Lead magnet téléchargé",
    subject: "Ton guide est-il utile ?",
    body: "Bonjour {{prénom}},\n\nTu as téléchargé notre guide ({{contenu_source}}). Une question est revenue souvent — je te la partage, dis-moi si c'est ton cas chez {{entreprise}}.",
  },
  {
    label: "Suit nos contenus",
    subject: "On se parle ?",
    body: "Bonjour {{prénom}},\n\nJ'ai vu que tu suis nos contenus. Si le sujet te parle pour {{entreprise}}, je serais ravi d'échanger 15 minutes.",
  },
  {
    label: "Réponse story / DM",
    subject: "Suite à ton message",
    body: "Bonjour {{prénom}},\n\nMerci pour ton message ! Pour te répondre plus en détail, voici un point rapide…",
  },
  {
    label: "Premier contact direct",
    subject: "Une idée pour {{entreprise}}",
    body: "Bonjour {{prénom}},\n\nJe te contacte directement : je pense qu'on peut t'aider chez {{entreprise}}. 2 lignes pour t'expliquer…",
  },
];

function fill(t: string, lead: Lead, sourceTitle?: string) {
  return t
    .replaceAll("{{prénom}}", lead.firstName)
    .replaceAll("{{entreprise}}", lead.company || "ton équipe")
    .replaceAll("{{contenu_source}}", sourceTitle || "notre contenu");
}

export default function LeadEmailModal({
  lead,
  sourceTitle,
  isPro,
  onClose,
  onSent,
}: {
  lead: Lead;
  sourceTitle?: string;
  isPro: boolean;
  onClose: () => void;
  onSent: () => void;
}) {
  const [subject, setSubject] = useState(fill(TEMPLATES[0].subject, lead, sourceTitle));
  const [body, setBody] = useState(fill(TEMPLATES[0].body, lead, sourceTitle));
  const [to, setTo] = useState(lead.email ?? "");
  const [drafting, setDrafting] = useState(false);

  function applyTemplate(i: number) {
    setSubject(fill(TEMPLATES[i].subject, lead, sourceTitle));
    setBody(fill(TEMPLATES[i].body, lead, sourceTitle));
  }

  async function aiDraft() {
    setDrafting(true);
    try {
      const res = await fetch(`/api/leads/${lead.id}/message`, { method: "POST" });
      const data = await res.json();
      if (res.ok && data.message) {
        setSubject(data.message.subject);
        setBody(data.message.body);
      }
    } finally {
      setDrafting(false);
    }
  }

  async function send() {
    const href = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(href, "_blank");
    await fetch(`/api/leads/${lead.id}/sent`, { method: "POST" });
    onSent();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button aria-label="Fermer" onClick={onClose} className="absolute inset-0 modal-overlay backdrop-blur-sm" />
      <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl border border-line bg-surface p-6 shadow-pop">
        <h2 className="font-display text-lg font-semibold">
          Email à {lead.firstName}
        </h2>

        <div className="mt-3 flex flex-wrap gap-2">
          {TEMPLATES.map((t, i) => (
            <button
              key={t.label}
              onClick={() => applyTemplate(i)}
              className="chip cursor-pointer border-line text-muted hover:border-gray-300"
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-3 overflow-y-auto">
          <div>
            <label className="label" htmlFor="to">À</label>
            <input id="to" className="input" value={to} onChange={(e) => setTo(e.target.value)} placeholder="email@prospect.com" />
          </div>
          <div>
            <label className="label" htmlFor="subj">Objet</label>
            <input id="subj" className="input" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="bd">Message</label>
            <textarea id="bd" rows={7} className="input" value={body} onChange={(e) => setBody(e.target.value)} />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          {isPro ? (
            <button onClick={aiDraft} disabled={drafting} className="btn-secondary">
              {drafting ? "Rédaction…" : "✨ Rédiger avec l'IA"}
            </button>
          ) : (
            <span className="text-xs text-muted">Rédaction IA : offre Pro</span>
          )}
          <div className="flex gap-2">
            <button onClick={onClose} className="btn-ghost">Annuler</button>
            <button onClick={send} disabled={!to} className="btn-primary">
              Envoyer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
