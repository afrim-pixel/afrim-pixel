import { prisma } from "../../../../lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { sessionErfordern } from "../../../../lib/auth";
import VersandButton from "./VersandButton";
import BezahltButton from "./BezahltButton";

export default async function RechnungenPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const organisationId = Number(id);

  const session = await sessionErfordern();

  if (
    session.organisationId !== organisationId ||
    session.rolle !== "ADMIN_INHABER"
  ) {
    notFound();
  }

  const rechnungen = await prisma.rechnung.findMany({
    where: {
      klient: {
        organisationId,
      },
    },
    include: {
      klient: true,
    },
    orderBy: [
  { bezahlt: "asc" },
  { rechnungsdatum: "desc" },
],

  });


  async function versandartSpeichern(formData: FormData) {
  "use server";

  const aktuelleSession = await sessionErfordern();

  if (
    aktuelleSession.organisationId !== organisationId ||
    aktuelleSession.rolle !== "ADMIN_INHABER"
  ) {
    throw new Error("Keine Berechtigung.");
  }

  const rechnungId = Number(formData.get("rechnungId"));
  const versandart = formData.get("versandart");

  if (!Number.isSafeInteger(rechnungId) || rechnungId <= 0) {
    throw new Error("Ungültige Rechnungs-ID.");
  }

  if (
    versandart !== "POST" &&
    versandart !== "EMAIL" &&
    versandart !== "DAKOTA"
  ) {
    throw new Error("Ungültige Versandart.");
  }

  const ergebnis = await prisma.rechnung.updateMany({
    where: {
      id: rechnungId,
      klient: {
        organisationId,
      },
      versendetAm: {
        not: null,
      },
      versandart: null,
    },
    data: {
      versandart,
    },
  });

  if (ergebnis.count !== 1) {
    throw new Error(
      "Rechnung nicht gefunden oder Versandart bereits hinterlegt."
    );
  }

  redirect(`/organisationen/${organisationId}/rechnung`);
}

  async function alsVersendetMarkieren(formData: FormData) {
  "use server";

  const aktuelleSession = await sessionErfordern();

  if (
    aktuelleSession.organisationId !== organisationId ||
    aktuelleSession.rolle !== "ADMIN_INHABER"
  ) {
    throw new Error("Keine Berechtigung.");
  }

  const rechnungId = Number(formData.get("rechnungId"));

  const versandart = formData.get("versandart");

if (
  versandart !== "POST" &&
  versandart !== "EMAIL" &&
  versandart !== "DAKOTA"
) {
  throw new Error("Bitte eine gültige Versandart auswählen.");
}

  if (!Number.isSafeInteger(rechnungId) || rechnungId <= 0) {
    throw new Error("Ungültige Rechnungs-ID.");
  }

  const ergebnis = await prisma.rechnung.updateMany({
    where: {
      id: rechnungId,
      klient: {
        organisationId,
      },
      versendetAm: null,
    },
    data: {
  versendetAm: new Date(),
  versandart: versandart,
},
  });

  if (ergebnis.count !== 1) {
    throw new Error(
      "Rechnung nicht gefunden oder bereits als versendet markiert."
    );
  }

  redirect(`/organisationen/${organisationId}/rechnung`);
}

async function alsBezahltMarkieren(formData: FormData) {
  "use server";

  const aktuelleSession = await sessionErfordern();

  if (
    aktuelleSession.organisationId !== organisationId ||
    aktuelleSession.rolle !== "ADMIN_INHABER"
  ) {
    throw new Error("Keine Berechtigung.");
  }

  const rechnungId = Number(formData.get("rechnungId"));

  if (!Number.isSafeInteger(rechnungId) || rechnungId <= 0) {
    throw new Error("Ungültige Rechnungs-ID.");
  }

  const datumText = formData.get("bezahltAm");

  const heute = new Date().toLocaleDateString("sv-SE", {
  timeZone: "Europe/Berlin",
});

if (typeof datumText === "string" && datumText > heute) {
  throw new Error(
    "Das Zahlungsdatum darf nicht in der Zukunft liegen."
  );
}

if (
  typeof datumText !== "string" ||
  !/^\d{4}-\d{2}-\d{2}$/.test(datumText) ||
  !Number.isFinite(new Date(datumText + "T12:00:00").getTime()) ||
  new Date(datumText + "T12:00:00").toLocaleDateString("sv-SE") !== datumText
) {
  throw new Error("Bitte ein gültiges Zahlungsdatum auswählen.");
}
  const ergebnis = await prisma.rechnung.updateMany({
    where: {
      id: rechnungId,
      klient: {
        organisationId,
      },
      bezahlt: false,
    },
    data: {
      bezahlt: true,
      bezahltAm: new Date(datumText + "T12:00:00"),
    },
  });

  if (ergebnis.count !== 1) {
    throw new Error(
      "Rechnung nicht gefunden oder bereits bezahlt."
    );
  }

  redirect(`/organisationen/${organisationId}/rechnung`);
}
  const offeneForderungen = rechnungen
    .filter((rechnung) => !rechnung.bezahlt)
    .reduce(
      (summe, rechnung) => summe + Number(rechnung.gesamtbetrag),
      0
    );

    const anzahlOffen = rechnungen.filter(
    (rechnung) => !rechnung.bezahlt
  ).length;

  const anzahlBezahlt = rechnungen.filter(
    (rechnung) => rechnung.bezahlt
  ).length;

  const anzahlNichtVersendet = rechnungen.filter(
  (rechnung) => !rechnung.versendetAm
).length;

const anzahlVersendet = rechnungen.filter(
  (rechnung) => rechnung.versendetAm !== null
).length;

  const bezahlteForderungen = rechnungen
  .filter((rechnung) => rechnung.bezahlt)
  .reduce(
    (summe, rechnung) => summe + Number(rechnung.gesamtbetrag),
    0
  );

  const gesamtwertRechnungen = rechnungen.reduce(
  (summe, rechnung) => summe + Number(rechnung.gesamtbetrag),
  0
);

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mt-4 rounded-lg bg-white p-4 shadow">
    <h2 className="mb-4 text-xl font-bold text-slate-900">
  Rechnungsübersicht
</h2>

<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
  <div className="rounded-lg bg-red-50 p-4">
  <p className="text-sm font-semibold text-red-700">
    Offene Forderungen gesamt
  </p>

  <p className="mt-2 text-2xl font-bold text-red-600">
    {offeneForderungen.toFixed(2).replace(".", ",")} €
  </p>
</div>



<div className="mt-4 rounded-lg bg-green-50 p-4">
  <p className="text-sm font-semibold text-green-700">
    Bezahlte Rechnungen gesamt
  </p>

  <p className="mt-2 text-2xl font-bold text-green-600">
    {bezahlteForderungen.toFixed(2).replace(".", ",")} €
  </p>
</div>

<div className="mt-4 rounded-lg bg-slate-100 p-4">
  <p className="text-sm font-semibold text-slate-700">
    Gesamtwert aller Rechnungen
  </p>

  <p className="mt-2 text-2xl font-bold text-slate-900">
    {gesamtwertRechnungen.toFixed(2).replace(".", ",")} €
  </p>
</div>

</div>


<div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
<p className="rounded-lg bg-slate-100 p-3 text-sm font-semibold text-slate-700">
  Offene Rechnungen: {anzahlOffen}
</p>

<p className="rounded-lg bg-slate-100 p-3 text-sm font-semibold text-slate-700">
  Bezahlte Rechnungen: {anzahlBezahlt}
</p>

<p className="rounded-lg bg-slate-100 p-3 text-sm font-semibold text-orange-600">
  Nicht versendete Rechnungen: {anzahlNichtVersendet}
</p>

<p className="rounded-lg bg-slate-100 p-3 text-sm font-semibold text-green-600">
  Versendete Rechnungen: {anzahlVersendet}
</p>

</div>

</div>

        <Link
          href={`/organisationen/${organisationId}`}
          className="mt-4 inline-block rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white"
        >
          ← Zurück zum Hauptmenü
        </Link>

        <div className="mt-8 space-y-4">
<h2 className="text-xl font-bold text-slate-900">
  Rechnungsliste ({rechnungen.length})
</h2>

           {rechnungen.length === 0 ? (
            <p className="text-slate-500">
              Noch keine Rechnungen vorhanden.
            </p>
          ) : (
            rechnungen.map((rechnung) => (
<div
  key={rechnung.id}
  className={`rounded-xl border-2 p-6 shadow ${
    rechnung.bezahlt ? "bg-white" : "bg-red-50"
  } ${
    rechnung.versendetAm ? "border-transparent" : "border-orange-400"
  }`}
>
                <div className="flex items-center justify-between gap-6">
                  <div>
                    <p className="text-lg font-bold text-slate-900">
                      {rechnung.rechnungsnummer}
                    </p>

                    <p className="mt-1 text-slate-700">
                      {rechnung.klient.vorname} {rechnung.klient.nachname}
                    </p>

                    <p className="mt-1 text-sm text-slate-600">
                      Rechnungsdatum:{" "}
                      {rechnung.rechnungsdatum.toLocaleDateString("de-DE")}
                    </p>

                    <p className="mt-1 text-sm text-slate-600">
                      Betrag:{" "}
                      {Number(rechnung.gesamtbetrag).toFixed(2).replace(".", ",")} €
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-700">
  Offener Betrag:{" "}
  {rechnung.bezahlt
    ? "0,00"
    : Number(rechnung.gesamtbetrag).toFixed(2).replace(".", ",")} €
</p>

<p className="mt-1 text-sm text-slate-600">
  Versandstatus:{" "}
  {rechnung.versendetAm ? (
    <span className="font-semibold text-green-600">
      Versendet am{" "}
      {rechnung.versendetAm.toLocaleDateString("de-DE")} um{" "}
      {rechnung.versendetAm.toLocaleTimeString("de-DE", {
        hour: "2-digit",
        minute: "2-digit",
      })}
    </span>
  ) : (
    <span className="font-semibold text-red-600">
      Nicht versendet
    </span>
  )}
</p>

<p className="mt-1 text-sm text-slate-600">
  Versandart:{" "}
  {rechnung.versandart === "POST"
    ? "Post"
    : rechnung.versandart === "EMAIL"
    ? "E-Mail"
    : rechnung.versandart === "DAKOTA"
    ? "Dakota"
    : "Noch nicht hinterlegt"}
</p>

                  </div>

                  <div className="flex flex-col items-start gap-1">
                    <span
                      className={`h-4 w-4 rounded-full ${
                        rechnung.bezahlt ? "bg-green-500" : "bg-red-500"
                      }`}
                    />

                    <span className="font-semibold text-slate-700">
                      {rechnung.bezahlt ? "Bezahlt" : "Offen"}
                    </span>
                    {rechnung.bezahlt && rechnung.bezahltAm && (
  <span className="text-sm text-slate-600">
    Bezahlt am:{" "}
    {rechnung.bezahltAm.toLocaleDateString("de-DE")}
  </span>
)}
                  </div>

    {!rechnung.versendetAm && (
  <form action={alsVersendetMarkieren}>
    <input
      type="hidden"
      name="rechnungId"
      value={rechnung.id}
    />
  <VersandButton />

  </form>
)}
{rechnung.versendetAm && !rechnung.versandart && (
  <form
    action={versandartSpeichern}
    className="flex items-center gap-2"
  >
    <input
      type="hidden"
      name="rechnungId"
      value={rechnung.id}
    />

    <select
      name="versandart"
      required
      defaultValue=""
      className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
    >
      <option value="" disabled>
        Versandart auswählen
      </option>
      <option value="POST">Post</option>
      <option value="EMAIL">E-Mail</option>
      <option value="DAKOTA">Dakota</option>
    </select>

    <button
      type="submit"
      className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white"
    >
      Versandart speichern
    </button>
  </form>
)}

                  {!rechnung.bezahlt && (
  <form action={alsBezahltMarkieren}>
    <input
      type="hidden"
      name="rechnungId"
      value={rechnung.id}
    />
 <BezahltButton rechnungsnummer={rechnung.rechnungsnummer} />
  
  </form>
)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}