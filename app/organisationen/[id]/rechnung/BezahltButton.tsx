"use client";

import { useState } from "react";

export default function BezahltButton({
  rechnungsnummer,
}: {
  rechnungsnummer: string;
}) {


  const [datumsfehler, setDatumsfehler] = useState("");

  const heute = new Date().toLocaleDateString("sv-SE", {
    timeZone: "Europe/Berlin",
  });

  return (
    <div className="flex flex-col items-start gap-2">
      <label className="text-sm text-slate-600">
        Tatsächliches Datum des Zahlungseingangs
      </label>

      <input
        type="date"
        name="bezahltAm"
        required
         max={heute}
         onInvalid={(event) => {
  const feld = event.currentTarget;

  if (feld.validity.rangeOverflow) {
    feld.setCustomValidity(
      "Das Zahlungsdatum darf nicht in der Zukunft liegen."
    );
  }
}}
onInput={(event) => {
  const feld = event.currentTarget;

  feld.setCustomValidity("");

  if (feld.validity.rangeOverflow) {
    setDatumsfehler(
      "Das Zahlungsdatum darf nicht in der Zukunft liegen."
    );
  } else {
    setDatumsfehler("");
  }
}}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />

      {datumsfehler && (
  <p className="text-sm font-medium text-red-600">
    {datumsfehler}
  </p>
)}

    <button
  type="submit"
  className="rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white"
  onClick={(event) => {
    const formular = event.currentTarget.form;

    if (!formular || !formular.reportValidity()) {
      event.preventDefault();
      return;
    }

    const datumsfeld = formular.elements.namedItem("bezahltAm");

const zahlungsdatum =
  datumsfeld instanceof HTMLInputElement
    ? datumsfeld.value
    : "";

const datumAnzeige = zahlungsdatum
  ? zahlungsdatum.split("-").reverse().join(".")
  : "";

const bestaetigt = window.confirm(
  "Ist die Zahlung für diese Rechnung tatsächlich eingegangen?\n\n" +
    "Rechnungsnummer: " + rechnungsnummer + "\n" +
    "Zahlungseingang am: " + datumAnzeige + "\n\n" +
    "Nur mit OK wird die Rechnung als bezahlt markiert."
);

    if (!bestaetigt) {
      event.preventDefault();
    }
  }}
>
  Als bezahlt markieren
</button>
    </div>
  );
}