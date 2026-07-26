"use client";

import { useState } from "react";

const TEMPLATE =
  "First Name,Last Name,Company,Title,Profile URL,Email\n" +
  "Camille,Rousseau,GrowthLab,Founder,https://linkedin.com/in/camille,camille@growthlab.io\n";

export default function LeadImportModal({
  onClose,
  onImported,
}: {
  onClose: () => void;
  onImported: () => void;
}) {
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<number | null>(null);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileName(f.name);
    const reader = new FileReader();
    reader.onload = () => setText(String(reader.result || ""));
    reader.readAsText(f);
  }

  async function run() {
    if (!text.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/leads/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv: text }),
      });
      const d = await res.json();
      if (res.ok) {
        setResult(d.imported);
        onImported();
      }
    } finally {
      setBusy(false);
    }
  }

  const templateHref = "data:text/csv;charset=utf-8," + encodeURIComponent(TEMPLATE);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button aria-label="Fermer" onClick={onClose} className="absolute inset-0 modal-overlay backdrop-blur-sm" />
      <div className="relative w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-pop">
        <h2 className="font-display text-lg font-semibold">Importer des leads (CSV)</h2>
        <p className="mt-1 text-sm text-muted">
          Compatible avec l&apos;export LinkedIn Sales Navigator. Colonnes
          reconnues : prénom, nom, entreprise, poste, URL, email.
        </p>

        {result !== null ? (
          <div className="mt-5 rounded-xl bg-success/5 px-4 py-5 text-center">
            <p className="font-display text-lg font-semibold text-success">
              <span className="num">{result}</span> lead{result > 1 ? "s" : ""} importé{result > 1 ? "s" : ""}
            </p>
            <button onClick={onClose} className="btn-primary mt-3 !py-2 text-sm">Fermer</button>
          </div>
        ) : (
          <>
            <label className="mt-4 flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-line bg-canvas px-4 py-6 text-sm text-muted hover:border-primary/40">
              <input type="file" accept=".csv,text/csv" onChange={onFile} className="hidden" />
              {fileName || "Choisis un fichier .csv"}
            </label>
            <a href={templateHref} download="loglead-template-leads.csv" className="mt-2 inline-block text-xs font-medium text-primary">
              Télécharger le template
            </a>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={onClose} className="btn-ghost">Annuler</button>
              <button onClick={run} disabled={busy || !text.trim()} className="btn-primary">
                {busy ? "Import…" : "Importer"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
