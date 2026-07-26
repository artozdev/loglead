"use client";

import { useState } from "react";
import {
  LEAD_CHANNELS,
  type LeadChannel,
} from "@/lib/types";

type ContentRef = { id: string; title: string };

export default function LeadAddModal({
  contents,
  onClose,
  onAdded,
}: {
  contents: ContentRef[];
  onClose: () => void;
  onAdded: () => void;
}) {
  const [url, setUrl] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [channel, setChannel] = useState<LeadChannel>("manual");
  const [sourceContentId, setSourceContentId] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function analyze() {
    if (!url.trim()) return;
    setAnalyzing(true);
    try {
      const res = await fetch("/api/leads/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (data.ok && data.fields) {
        setFirstName(data.fields.firstName);
        setLastName(data.fields.lastName);
        setJobTitle(data.fields.jobTitle);
        setCompany(data.fields.company);
        setLinkedinUrl(url);
        if (channel === "manual") setChannel("linkedin");
      }
    } finally {
      setAnalyzing(false);
    }
  }

  async function add() {
    if (!firstName.trim()) return setError("Le prénom est requis.");
    if (!lastName.trim()) return setError("Le nom est requis.");
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return setError("Le format de l'email est invalide.");
    }
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email: email || null,
          phone: phone || null,
          company: company || undefined,
          jobTitle: jobTitle || undefined,
          linkedinUrl: linkedinUrl || undefined,
          channel,
          sourceContentId: sourceContentId || null,
          status: "new",
          notes: notes || undefined,
        }),
      });
      if (res.ok) {
        onAdded();
        onClose();
      } else {
        const d = await res.json();
        setError(d.error ?? "Ajout impossible.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button aria-label="Fermer" onClick={onClose} className="absolute inset-0 modal-overlay backdrop-blur-sm" />
      <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl border border-line bg-surface p-6 shadow-pop">
        <h2 className="font-display text-lg font-semibold">Ajouter un lead</h2>

        {/* Via URL */}
        <div className="mt-3 flex gap-2">
          <input
            className="input"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Colle une URL LinkedIn / Instagram à analyser"
          />
          <button onClick={analyze} disabled={analyzing} className="btn-secondary shrink-0">
            {analyzing ? "…" : "Analyser"}
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 overflow-y-auto">
          <div>
            <label className="label">Prénom <span className="text-danger">*</span></label>
            <input className="input" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="ex. Camille" />
          </div>
          <div>
            <label className="label">Nom <span className="text-danger">*</span></label>
            <input className="input" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="ex. Rousseau" />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="—" />
          </div>
          <div>
            <label className="label">Téléphone</label>
            <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="—" />
          </div>
          <div>
            <label className="label">SaaS/Entreprise</label>
            <input className="input" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="ex. GrowthLab" />
          </div>
          <div>
            <label className="label">Poste</label>
            <input className="input" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="ex. Founder" />
          </div>
          <div className="col-span-2">
            <label className="label">URL LinkedIn</label>
            <input className="input" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="linkedin.com/in/…" />
          </div>
          <div>
            <label className="label">Canal</label>
            <select className="input" value={channel} onChange={(e) => setChannel(e.target.value as LeadChannel)}>
              {LEAD_CHANNELS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Contenu source</label>
            <select className="input" value={sourceContentId} onChange={(e) => setSourceContentId(e.target.value)}>
              <option value="">—</option>
              {contents.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <label className="label">Note</label>
            <textarea rows={2} className="input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ajouter une note…" />
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-danger">{error}</p>}

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="btn-ghost">Annuler</button>
          <button onClick={add} disabled={saving} className="btn-primary">
            {saving ? "…" : "Ajouter le lead"}
          </button>
        </div>
      </div>
    </div>
  );
}
