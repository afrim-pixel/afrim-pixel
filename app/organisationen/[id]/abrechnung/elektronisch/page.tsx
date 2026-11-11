import { prisma } from "@/lib/prisma";
import { sessionErfordern } from "@/lib/auth";
import { notFound } from "next/navigation";

export default async function ElektronischeAbrechnungPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await sessionErfordern();
  if (Number(session.organisationId) !== Number(id) || session.rolle !== "ADMIN_INHABER") {
    notFound();
  }
  const rechnungen = await prisma.rechnung.findMany({
  where: {
    klient: {
      organisationId: Number(id),
    },
  },
  orderBy: {
    rechnungsdatum: "desc",
  },
  select: {
    id: true,
    rechnungsnummer: true,
    rechnungsdatum: true,
    leistungsmonat: true,
    leistungsart: true,
    gesamtbetrag: true,
    klientId: true,
    klient: {
      select: {
        id: true,
        vorname: true,
        nachname: true,
        istTestklient: true,
        versichertennummer: true,
        kassenIk: true,
        pflegekasse: true,
      },
    },
    abrechnungsbuchungen: {
      select: {
        betrag: true,
        einsatz: {
          select: {
            id: true,
            datum: true,
            status: true,
            leistungsart: true,
            klientId: true,
            unterschriebenAm: true,
            benutzer: {
              select: {
                beschaeftigtennummer: true,
              },
            },
          },
        },
      },
    },
  },
});

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-5xl">
        <a
          href={`/organisationen/${id}/abrechnung`}
          className="text-blue-600 hover:underline"
        >
          ← Zurück zur Abrechnung
        </a>

        <h1 className="mt-6 text-3xl font-bold text-slate-900">
          Elektronische Abrechnung
        </h1>

        <p className="mt-3 text-slate-600">
          Hier bereiten wir die elektronische Abrechnung mit den
          Pflegekassen vor.
        </p>

        <div className="mt-8 rounded-xl bg-white p-6 shadow">
          <h2 className="text-xl font-semibold text-slate-900">
            Abrechnungen für die Übermittlung vorbereiten
          </h2>
          <p className="mt-3 font-semibold text-blue-700">
  Vorhandene Rechnungen: {rechnungen.length}
</p>

          <div className="mt-6 space-y-3">
  {rechnungen.map((rechnung) => {
  const leistungsartStimmt =
    rechnung.leistungsart !== null &&
    rechnung.abrechnungsbuchungen.length > 0 &&
    rechnung.abrechnungsbuchungen.every(
      (buchung) =>
        buchung.einsatz !== null &&
        buchung.einsatz.leistungsart === rechnung.leistungsart
    );

    const buchungssummeInCent = rechnung.abrechnungsbuchungen.reduce(
  (summe, buchung) =>
    summe + Math.round(Number(buchung.betrag) * 100),
  0
);

const rechnungsbetragInCent = Math.round(
  Number(rechnung.gesamtbetrag) * 100
);

const betragStimmt =
  buchungssummeInCent === rechnungsbetragInCent;

const leistungsmonatStimmt =
  rechnung.abrechnungsbuchungen.length > 0 &&
  rechnung.abrechnungsbuchungen.every((buchung) => {
    if (!buchung.einsatz) return false;

    const einsatzDatum = buchung.einsatz.datum;
    const rechnungsMonat = rechnung.leistungsmonat;

const monatInDeutschland = (datum: Date) =>
  new Intl.DateTimeFormat("de-DE", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
  }).format(datum);

return (
  monatInDeutschland(einsatzDatum) ===
  monatInDeutschland(rechnungsMonat)
);

  });

  const klientStimmt =
  rechnung.abrechnungsbuchungen.length > 0 &&
  rechnung.abrechnungsbuchungen.every(
    (buchung) =>
      buchung.einsatz !== null &&
      buchung.einsatz.klientId === rechnung.klientId
  );
const einsatzstatusStimmt =
  rechnung.abrechnungsbuchungen.length > 0 &&
  rechnung.abrechnungsbuchungen.every(
    (buchung) =>
      buchung.einsatz !== null &&
      buchung.einsatz.status === "GEPRUEFT"
  );

  const unterschriftenVorhanden =
  rechnung.abrechnungsbuchungen.length > 0 &&
  rechnung.abrechnungsbuchungen.every(
    (buchung) =>
      buchung.einsatz !== null &&
      buchung.einsatz.unterschriebenAm !== null
  );

const einsaetzeMitFehlendenAngaben =
  rechnung.abrechnungsbuchungen
    .filter((buchung) => buchung.einsatz !== null)
    .map((buchung) => {
      const einsatz = buchung.einsatz!;

      const unterschriftFehlt = einsatz.unterschriebenAm === null;
      const datumFehlt = einsatz.unterschriebenAm === null;

      return {
        id: einsatz.id,
        unterschriftFehlt,
        datumFehlt,
      };
    })
.filter(
  (einsatz) =>
    einsatz.unterschriftFehlt || einsatz.datumFehlt
)
.sort((a, b) => a.id - b.id);

  const einsaetzeOhneBeschaeftigtennummer = rechnung.abrechnungsbuchungen
    .filter((buchung) => buchung.einsatz !== null && !buchung.einsatz.benutzer.beschaeftigtennummer?.trim())
    .map((buchung) => buchung.einsatz!.id)
    .sort((a, b) => a - b);

  return (
    <div
      key={rechnung.id}
      className="rounded-lg border border-slate-200 p-4"
    >
<p className="font-semibold text-slate-900">
  Rechnungsnummer: {rechnung.rechnungsnummer} (ID: {rechnung.id})
</p>

<p className="mt-1 text-slate-600">
  Klient: {rechnung.klient.vorname}{" "}
  {rechnung.klient.nachname} (ID: {rechnung.klientId})
</p>

      {rechnung.klient.istTestklient && (
  <p className="mt-2 font-bold text-red-700">
    🧪 TESTRECHNUNG – Nicht elektronisch übermitteln
  </p>
)}

      <p className="text-slate-600">
        Rechnungsdatum:{" "}
     {new Intl.DateTimeFormat("de-DE", {
  timeZone: "Europe/Berlin",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
}).format(rechnung.rechnungsdatum)}
      </p>

<p className="text-slate-600">
  Leistungsmonat:{" "}
  {new Intl.DateTimeFormat("de-DE", {
    timeZone: "Europe/Berlin",
    month: "long",
    year: "numeric",
  }).format(rechnung.leistungsmonat)}
</p>

<p className="font-semibold text-slate-900">
  Betrag: {Number(rechnung.gesamtbetrag).toLocaleString("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} €
</p>

    <p className="mt-2 text-sm font-semibold">
  {betragStimmt ? (
    <span className="text-green-700">
      ✓ Rechnungsbetrag stimmt mit den Buchungen überein
    </span>
  ) : (
    <span className="text-red-700">
      ⚠ Rechnungsbetrag stimmt nicht mit den Buchungen überein
    </span>
  )}
</p>

      <p className="mt-1 text-sm text-slate-600">
  Leistungsart: {rechnung.leistungsart === "ENTLASTUNGSBETRAG_45B"
  ? "Entlastungsbetrag (§ 45b SGB XI)"
  : rechnung.leistungsart ?? "Nicht angegeben"}
</p>

<p className="mt-2 text-sm font-semibold">
  {leistungsmonatStimmt ? (
    <span className="text-green-700">
      ✓ Alle Einsätze gehören zum Leistungsmonat
    </span>
  ) : (
    <span className="text-red-700">
      ⚠ Mindestens ein Einsatz gehört nicht zum Leistungsmonat
    </span>
  )}
</p>

<p className="mt-2 text-sm font-semibold">
  {leistungsartStimmt ? (
    <span className="text-green-700">
      ✓ Leistungsart stimmt mit den Einsätzen überein
    </span>
  ) : (
    <span className="text-red-700">
      ⚠ Leistungsart stimmt nicht mit allen Einsätzen überein
    </span>
  )}
</p>

      <p className="mt-1 text-sm text-slate-600">
  Verknüpfte Abrechnungsbuchungen:{" "}
  {rechnung.abrechnungsbuchungen.length}
</p>

<p className="mt-1 text-sm text-slate-600">
  Zugeordnete Einsätze:{" "}
  {rechnung.abrechnungsbuchungen
    .map((buchung) => buchung.einsatz?.id)
    .filter((einsatzId) => einsatzId != null)
    .sort((a, b) => a - b)
    .join(", ") || "Keine Einsätze zugeordnet"}
</p>

<p className="mt-2 text-sm font-semibold">
  {klientStimmt ? (
    <span className="text-green-700">
      ✓ Alle Einsätze gehören zum richtigen Klienten
    </span>
  ) : (
    <span className="text-red-700">
      ⚠ Mindestens ein Einsatz gehört zu einem anderen Klienten
    </span>
  )}
</p>

<p className="mt-2 text-sm font-semibold">
  {einsatzstatusStimmt ? (
    <span className="text-green-700">
    ✓ Alle Einsätze wurden geprüft
    </span>
  ) : (
    <span className="text-amber-700">
      ⚠ Nicht alle Einsätze haben den Status GEPRUEFT
    </span>
  )}
</p>

<p className="mt-2 text-sm font-semibold">
  {unterschriftenVorhanden ? (
    <span className="text-green-700">
      ✓ Unterschriften und Unterschriftsdaten vorhanden
    </span>
  ) : (
    <span className="text-amber-700">
      ⚠ Unterschrift oder Unterschriftsdatum fehlt
    </span>
  )}
</p>

{einsaetzeMitFehlendenAngaben.length > 0 && (
  <p className="mt-1 text-sm font-semibold text-amber-700">
    Einsätze mit fehlender Unterschrift oder fehlendem Datum:{" "}
    {einsaetzeMitFehlendenAngaben
  .map((einsatz) => {
    const fehlendeAngaben =
      einsatz.unterschriftFehlt && einsatz.datumFehlt
        ? "Unterschrift und Datum fehlen"
        : einsatz.unterschriftFehlt
          ? "Unterschrift fehlt"
          : "Datum fehlt";

    return `${einsatz.id} (${fehlendeAngaben})`;
  })
  .join(", ")}
  </p>
)}

    <p className="mt-2 text-sm font-semibold">
  {rechnung.klient.istTestklient ? (
    <span className="text-red-700">
      Prüfstatus: TESTRECHNUNG – Übermittlung gesperrt
    </span>
) : !betragStimmt ||
    !leistungsmonatStimmt ||
    !leistungsartStimmt ||
    !klientStimmt ||
    !einsatzstatusStimmt ? (
  <span className="text-red-700">
    Prüfstatus: Rechnungsprüfung fehlgeschlagen
  </span>
  ) : !unterschriftenVorhanden ? (
  <span className="text-amber-700">
    Prüfstatus: Leistungsnachweise unvollständig – Unterschriften prüfen
  </span>
) : !rechnung.klient.versichertennummer ||
    !rechnung.klient.kassenIk ||
    !rechnung.klient.pflegekasse?.trim() ? (

    <span className="text-amber-700">
      Prüfstatus: Stammdaten unvollständig
    </span>
  ) : (
    <span className="text-blue-700">
      Prüfstatus: Stammdaten teilweise geprüft
    </span>
  )}
</p>
{einsaetzeOhneBeschaeftigtennummer.length > 0 && (
  <p className="mt-2 text-sm font-semibold text-amber-700">
    ⚠ Beschäftigtennummer fehlt bei Einsätzen:{" "}
    {einsaetzeOhneBeschaeftigtennummer.join(", ")}
  </p>
)}
      {!rechnung.klient.versichertennummer && (
  <p className="mt-2 font-semibold text-red-600">
    ⚠ Versichertennummer fehlt
  </p>
)}
{!rechnung.klient.kassenIk && (
  <p className="mt-2 font-semibold text-red-600">
    ⚠ Kassen-IK fehlt
  </p>
)}

{!rechnung.klient.pflegekasse?.trim() && (
  <p className="mt-2 font-semibold text-red-600">
    ⚠ Pflegekasse fehlt
  </p>
)}

    </div>
  );
})}
</div>
        </div>
      </div>
    </main>
  );
}
