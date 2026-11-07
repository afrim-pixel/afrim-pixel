"use client";

import { useState } from "react";

type Mitarbeiter = {
  id: number;
  vorname: string;
  nachname: string;
};

type Klient = {
  id: number;
  vorname: string;
  nachname: string;
};

type Zuweisung = {
  benutzerId: number;
  klientId: number;
};

export default function EinsatzForm({
  mitarbeiter,
  klienten,
  zuweisungen,
  action,
}: {
  mitarbeiter: Mitarbeiter[];
  klienten: Klient[];
  zuweisungen: Zuweisung[];
  action: (formData: FormData) => void | Promise<void>;
}) {
  const [benutzerId, setBenutzerId] = useState("");

  const erlaubteKlienten = benutzerId
    ? klienten.filter((klient) =>
        zuweisungen.some(
          (zuweisung) =>
            zuweisung.benutzerId === Number(benutzerId) &&
            zuweisung.klientId === klient.id
        )
      )
    : [];

  return (
    <form
      action={action}
      className="mt-8 rounded-xl bg-white p-6 shadow"
    >
      <h2 className="text-xl font-bold text-slate-900">
        Neuen Einsatz planen
      </h2>

      <div className="mt-6 grid gap-6">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Mitarbeiter
          </label>

          <select
            name="benutzerId"
            required
            value={benutzerId}
            onChange={(event) => setBenutzerId(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value="">
              Mitarbeiter auswählen
            </option>

            {mitarbeiter.map((eintrag) => (
              <option key={eintrag.id} value={eintrag.id}>
                {eintrag.vorname} {eintrag.nachname}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Klient
          </label>

          <select
            name="klientId"
            required
            defaultValue=""
            disabled={!benutzerId}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-100 disabled:text-slate-400"
          >
            <option value="">
              {benutzerId
                ? "Klient auswählen"
                : "Zuerst Mitarbeiter auswählen"}
            </option>

            {erlaubteKlienten.map((klient) => (
              <option key={klient.id} value={klient.id}>
                {klient.vorname} {klient.nachname}
              </option>
            ))}
          </select>

          {benutzerId && erlaubteKlienten.length === 0 && (
            <p className="mt-2 text-sm text-red-600">
              Diesem Mitarbeiter sind noch keine Klienten zugewiesen.
            </p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Datum
          </label>

          <input
            type="date"
            name="datum"
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Startzeit
            </label>

            <input
              type="time"
              name="startzeit"
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Endzeit
            </label>

            <input
              type="time"
              name="endzeit"
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>
        </div>

<div>
  <label className="mb-2 block text-sm font-medium text-slate-700">
    Kilometer
  </label>

  <input
    type="text"
    name="kilometer"
    inputMode="decimal"
    placeholder="z. B. 12,5"
    className="w-full rounded-lg border border-slate-300 px-3 py-2"
  />
</div>
<div>
  <label className="mb-2 block text-sm font-medium text-slate-700">
    Leistungsart
  </label>

  <select
    name="leistungsart"
    required
    defaultValue=""
    className="w-full rounded-lg border border-slate-300 px-3 py-2"
  >
    <option value="" disabled>
      Leistungsart auswählen
    </option>
    <option value="ENTLASTUNGSBETRAG_45B">
      § 45b SGB XI – Entlastungsbetrag
    </option>
    <option value="UMWANDLUNGSANSPRUCH_45A">
      § 45a SGB XI – Umwandlungsanspruch
    </option>
    <option value="PFLEGESACHLEISTUNG_36">
      § 36 SGB XI – Pflegesachleistungen
    </option>
    <option value="VERHINDERUNGSPFLEGE_39">
      § 39 SGB XI – Verhinderungspflege
    </option>
    <option value="SELBSTZAHLER">
      Selbstzahler
    </option>
  </select>
</div>
<label className="flex items-center gap-2 text-sm text-slate-700">
  <input
    type="checkbox"
    name="anfahrtspauschale"
  />
  Anfahrtspauschale berechnen
</label>

        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
        >
          Einsatz speichern
        </button>
      </div>
    </form>
  );
}