"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";

export default function UnterschriftPage() {
const params = useParams<{ einsatzId: string }>();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zeichnet, setZeichnet] = useState(false);

  const [einsatz, setEinsatz] = useState<{
  id: number;
  datum: string;
  startzeit: string;
  endzeit: string;
  status: string;
    nachtraeglichFreigegeben: boolean;
  klient: {
    vorname: string;
    nachname: string;
  };
  hatUnterschrift: boolean;
} | null>(null);

const [ladefehler, setLadefehler] = useState("");

const [stundenBestaetigt, setStundenBestaetigt] = useState(false);

useEffect(() => {
  let aktiv = true;

  async function einsatzLaden() {
    try {
      const response = await fetch(
        `/api/einsaetze/${params.einsatzId}/unterschrift`,
        { cache: "no-store" }
      );

      if (!response.ok) {
        throw new Error("Einsatzdaten konnten nicht geladen werden.");
      }

      const daten = await response.json();

      if (aktiv) {
        setEinsatz(daten);
      }
    } catch {
      if (aktiv) {
        setLadefehler("Einsatzdaten konnten nicht geladen werden.");
      }
    }
  }

  einsatzLaden();

  return () => {
    aktiv = false;
  };
}, [params.einsatzId]);

  function positionErmitteln(
    event: React.PointerEvent<HTMLCanvasElement>
  ) {
    const canvas = canvasRef.current;

    if (!canvas) {
      return { x: 0, y: 0 };
    }

    const rect = canvas.getBoundingClientRect();

return {
  x: (event.clientX - rect.left) * (canvas.width / rect.width),
  y: (event.clientY - rect.top) * (canvas.height / rect.height),
};

  }

  function zeichnenStarten(
    event: React.PointerEvent<HTMLCanvasElement>
  ) {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const context = canvas.getContext("2d");

    if (!context) return;

    const position = positionErmitteln(event);

    context.beginPath();
    context.moveTo(position.x, position.y);

    setZeichnet(true);
    canvas.setPointerCapture(event.pointerId);
  }

  function zeichnen(
    event: React.PointerEvent<HTMLCanvasElement>
  ) {
    if (!zeichnet) return;

    const canvas = canvasRef.current;

    if (!canvas) return;

    const context = canvas.getContext("2d");

    if (!context) return;

    const position = positionErmitteln(event);

    context.lineWidth = 2;
    context.lineCap = "round";
    context.strokeStyle = "#000000";

    context.lineTo(position.x, position.y);
    context.stroke();
  }

  function zeichnenBeenden() {
    setZeichnet(false);
  }

  function loeschen() {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const context = canvas.getContext("2d");

    if (!context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
  }
  async function speichern() {
      if (!einsatz || ladefehler || einsatz.hatUnterschrift) {
    alert("Dieser Einsatz ist nicht zur Unterschrift bereit.");
    return;
  }

    if (
    einsatz.status === "GEPRUEFT" &&
    !einsatz.nachtraeglichFreigegeben
  ) {
    alert("Dieser geprüfte Einsatz wurde nicht zur nachträglichen Unterschrift freigegeben.");
    return;
  }

  if (!stundenBestaetigt) {
    alert("Bitte lassen Sie die betreute Person zuerst die Einsatzzeiten bestätigen.");
    return;
  }

  const canvas = canvasRef.current;

  if (!canvas) return;

    const context = canvas.getContext("2d");

if (!context) {
  alert("Das Unterschriftenfeld ist nicht verfügbar.");
  return;
}

  const bilddaten = context.getImageData(
  0,
  0,
  canvas.width,
  canvas.height
);

const hatZeichnung = bilddaten.data.some(
  (wert, index) => index % 4 === 3 && wert !== 0
);

if (!hatZeichnung) {
  alert("Bitte zuerst eine Unterschrift zeichnen.");
  return;
}

  const unterschrift = canvas.toDataURL("image/png");


const response = await fetch(`/api/einsaetze/${params.einsatzId}/unterschrift`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
body: JSON.stringify({
  unterschrift,
  stundenBestaetigt,
  bestaetigteEinsatzdaten: {
    datum: einsatz.datum,
    startzeit: einsatz.startzeit,
    endzeit: einsatz.endzeit,
  },
}),

});
if (response.ok) {
  alert("Unterschrift erfolgreich gespeichert.");
  window.location.href = `/organisationen/1/einsaetze/meine`;
} else {
  alert("Fehler beim Speichern der Unterschrift.");
}
}

  return (
    <main className="min-h-screen bg-slate-100 p-4">
      <div className="mx-auto max-w-2xl rounded-xl bg-white p-6 shadow">
        <h1 className="text-2xl font-bold text-slate-900">
          Unterschrift
        </h1>

        <p className="mt-2 text-slate-600">
          Bitte unterschreiben Sie im folgenden Feld.
        </p>

{ladefehler && (
  <p className="mt-4 text-red-600">
    {ladefehler}
  </p>
)}

{einsatz && (
  <div className="mt-4 rounded-lg bg-blue-50 p-4">
    <p className="font-bold text-slate-900">
      Bitte prüfen Sie diese Einsatzdaten:
    </p>

    <p className="mt-2">
      Klient: {einsatz.klient.vorname} {einsatz.klient.nachname}
    </p>

    <p>
      Datum: {new Date(einsatz.datum).toLocaleDateString("de-DE")}
    </p>

    <p>
      Uhrzeit:{" "}
      {new Date(einsatz.startzeit).toLocaleTimeString("de-DE", {
        hour: "2-digit",
        minute: "2-digit",
      })}
      {" – "}
      {new Date(einsatz.endzeit).toLocaleTimeString("de-DE", {
        hour: "2-digit",
        minute: "2-digit",
      })}
    </p>

    <p className="mt-2 text-sm">
      Einsatz-ID: {einsatz.id}
    </p>
        {einsatz.status === "GEPRUEFT" && (
      <p className="mt-3 font-semibold text-slate-900">
        {einsatz.nachtraeglichFreigegeben
          ? "Nachträgliche Unterschrift durch den Inhaber freigegeben."
          : "Nachträgliche Unterschrift noch nicht freigegeben."}
      </p>
    )}
  </div>
)}

<label className="mt-6 flex items-start gap-3 rounded-lg border border-slate-300 p-4">
  <input
    type="checkbox"
    checked={stundenBestaetigt}
    onChange={(event) => setStundenBestaetigt(event.target.checked)}
    className="mt-1 h-5 w-5"
  />
  <span className="text-sm text-slate-700">
    Ich habe die oben angezeigten Einsatzdaten und Uhrzeiten geprüft.
    Mit meiner persönlichen Unterschrift bestätige ich,
    dass die angegebenen Leistungen zu diesen Zeiten erbracht wurden.
  </span>
</label>

        <canvas
          ref={canvasRef}
          width={700}
          height={300}
          onPointerDown={zeichnenStarten}
          onPointerMove={zeichnen}
          onPointerUp={zeichnenBeenden}
          onPointerCancel={zeichnenBeenden}
          className="mt-6 h-[300px] w-full touch-none rounded-lg border-2 border-slate-300 bg-white"
        />

        <button
          type="button"
          onClick={loeschen}
          className="mt-4 rounded-lg bg-slate-200 px-5 py-3 font-semibold text-slate-900"
        >
          Unterschrift löschen
        </button>
<button
  type="button"
  onClick={speichern}
  disabled={
    !einsatz ||
    Boolean(ladefehler) ||
    einsatz.hatUnterschrift ||
    (einsatz.status === "GEPRUEFT" &&
      !einsatz.nachtraeglichFreigegeben) ||
    !stundenBestaetigt
  }
  className="ml-2 rounded-lg bg-green-600 px-5 py-3 font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-40"
>
  Unterschrift speichern
</button>
      </div>
    </main>
  );
}