"use client";
import { useState } from "react";

type Props = {
  einsatzId: number;
};

export default function NachunterschriftFreigabe({
  einsatzId,
}: Props) {
      const [grund, setGrund] = useState("");
      const [freigabeBestaetigt, setFreigabeBestaetigt] = useState(false);
      const [rechnungNichtVersendet, setRechnungNichtVersendet] = useState(false);
      const [speichert, setSpeichert] = useState(false);
      const [erfolg, setErfolg] = useState(false);
      const [fehler, setFehler] = useState("");
      async function freigabeVorbereiten() {
      if (
  einsatzId !== 15 ||
  speichert ||
      grund.trim().length < 10 ||
      grund.trim().length > 500 ||
      !freigabeBestaetigt ||
      !rechnungNichtVersendet
    ) {
      return;
    }
        const bestaetigt = window.confirm(
        
    `ACHTUNG: Möchten Sie die nachträgliche Unterschrift für Einsatz ${einsatzId} verbindlich freigeben? Bei Bestätigung wird die Freigabe tatsächlich gespeichert.`    );

    if (!bestaetigt) {
      return;
    }

setSpeichert(true);
setFehler("");
setErfolg(false);

try {
  const apiAdresse = `/api/nachunterschrift-freigaben/${einsatzId}`;

  const antwort = await fetch(apiAdresse, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    einsatzId,
    grund: grund.trim(),
    freigabeBestaetigt: true,
    rechnungNichtVersendetBestaetigt: true,
  }),
});

const daten = await antwort.json();

if (!antwort.ok) {
  setFehler(daten.fehler || "Die Freigabe wurde abgelehnt.");
  return;
}

setErfolg(true);

} catch {
  setFehler("Die Freigabe konnte nicht verarbeitet werden.");
} finally {
  setSpeichert(false);
}
  }
  return (
    
    <div className="mt-6 rounded-lg border border-slate-300 p-4">
      <h2 className="text-lg font-bold">
        Nachträgliche Unterschrift freigeben
      </h2>

      <p className="mt-2 text-sm">
        Freigabe für Einsatz-ID: {einsatzId}
      </p>
            {erfolg && (
        <p className="mt-4 font-semibold text-green-700">
          Die nachträgliche Freigabe wurde erfolgreich gespeichert.
        </p>
      )}
            {fehler && (
        <p className="mt-4 font-semibold text-red-700" role="alert">
          {fehler}
        </p>
      )}
            <label
        htmlFor="freigabe-grund"
        className="mt-4 block font-semibold"
      >
        Begründung für die nachträgliche Freigabe
      </label>

      <textarea
        id="freigabe-grund"
        value={grund}
        onChange={(event) => setGrund(event.target.value)}
        maxLength={500}
        rows={4}
        placeholder="Warum wird die nachträgliche Unterschrift erlaubt?"
        className="mt-2 w-full rounded-lg border border-slate-300 p-3"
      />
            <label className="mt-4 flex items-start gap-3">
        <input
          type="checkbox"
          checked={freigabeBestaetigt}
          onChange={(event) =>
            setFreigabeBestaetigt(event.target.checked)
          }
          className="mt-1 h-5 w-5"
        />

        <span className="text-sm text-slate-700">
          Ich bestätige ausdrücklich, dass ich die nachträgliche
          Unterschrift für Einsatz {einsatzId} freigeben möchte.
        </span>
      </label>
            <label className="mt-4 flex items-start gap-3">
        <input
          type="checkbox"
          checked={rechnungNichtVersendet}
          onChange={(event) =>
            setRechnungNichtVersendet(event.target.checked)
          }
          className="mt-1 h-5 w-5"
        />

        <span className="text-sm text-slate-700">
          Ich habe geprüft und bestätige ausdrücklich,
          dass die zugehörige Rechnung noch nicht versendet wurde.
        </span>
      </label>
            <button
        type="button"
        onClick={freigabeVorbereiten}
        disabled={
  einsatzId !== 15 ||
  speichert ||
    erfolg ||
  grund.trim().length < 10 ||
  grund.trim().length > 500 ||
  !freigabeBestaetigt ||
  !rechnungNichtVersendet
}
        className="mt-6 rounded-lg bg-slate-700 px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        Nachträgliche Freigabe verbindlich erteilen
      </button>
    </div>
  );
}