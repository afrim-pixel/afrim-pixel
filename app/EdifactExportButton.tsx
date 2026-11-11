"use client";

import { useState } from "react";

export default function EdifactExportButton() {
  const [busy, setBusy] = useState(false);
  const [meldung, setMeldung] = useState<string | null>(null);

  async function exportieren() {
    setBusy(true);
    setMeldung(null);

    try {
      const antwort = await fetch("/api/abrechnung/edifact");
      if (!antwort.ok) {
        const daten = await antwort.json().catch(() => null);
        throw new Error(
          daten?.error ?? "Export fehlgeschlagen."
        );
      }

      const blob = await antwort.blob();
      const disposition = antwort.headers.get("Content-Disposition") ?? "";
      const match = /filename="([^"]+)"/.exec(disposition);
      const dateiname = match?.[1] ?? "dakota-nutzdaten.txt";

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = dateiname;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      const anzahl = antwort.headers.get("X-Edifact-Rechnungen");
      setMeldung(
        anzahl
          ? `Nutzdatendatei mit ${anzahl} Rechnung(en) heruntergeladen.`
          : "Nutzdatendatei heruntergeladen."
      );
    } catch (fehler) {
      setMeldung(
        fehler instanceof Error
          ? fehler.message
          : "Export fehlgeschlagen."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={exportieren}
        disabled={busy}
        className="rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy
          ? "Export wird erstellt…"
          : "dakota.le Nutzdaten exportieren (§ 302 SGB V)"}
      </button>
      {meldung && (
        <p className="mt-3 text-sm text-slate-700">{meldung}</p>
      )}
    </div>
  );
}
