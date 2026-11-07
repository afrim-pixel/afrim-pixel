import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { sessionErfordern } from "@/lib/auth";

export default async function DienstplanDrucken({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ monat?: string }>;
}) {
const { id } = await params;
const { monat } = await searchParams;

const heute = new Date();
const ausgewaehlterMonat =
  monat && /^\d{4}-\d{2}$/.test(monat)
    ? monat
    : `${heute.getFullYear()}-${String(heute.getMonth() + 1).padStart(2, "0")}`;

const [jahr, monatsNummer] = ausgewaehlterMonat.split("-").map(Number);

const monatsBeginn = new Date(jahr, monatsNummer - 1, 1);
const monatsEnde = new Date(jahr, monatsNummer, 1);
  const organisationId = Number(id);
  const session = await sessionErfordern();

  if (
    session.organisationId !== organisationId ||
    session.rolle !== "ADMIN_INHABER"
  ) {
    notFound();
  }

  const einsaetze = await prisma.einsatz.findMany({
where: {
  benutzer: { organisationId },
  klient: { organisationId },
  datum: {
    gte: monatsBeginn,
    lt: monatsEnde,
  },
},
    include: {
      benutzer: true,
      klient: true,
    },
    orderBy: [
      { datum: "asc" },
      { startzeit: "asc" },
    ],
  });

  const datumFormatieren = (datum: Date) =>
    datum.toLocaleDateString("de-DE");

  const zeitFormatieren = (datum: Date) =>
    datum.toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
   <main className="mx-auto w-full max-w-none bg-white p-8 text-black print:p-2">
      <div className="mb-6 print:hidden">
        <Link
          href={`/organisationen/${organisationId}/einsaetze`}
          className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white"
        >
          ← Zurück zur Einsatzplanung
        </Link>
      </div>

      <h1 className="mb-2 text-3xl font-bold">
        Dienstplan
      </h1>
<form method="GET" className="mb-6 print:hidden">
  <label htmlFor="monat" className="mr-3 font-semibold">
    Monat auswählen:
  </label>
  <input
    id="monat"
    name="monat"
    type="month"
    defaultValue={ausgewaehlterMonat}
    className="rounded border p-2"
  />
  <button
    type="submit"
    className="ml-3 rounded bg-blue-600 px-4 py-2 text-white"
  >
    Anzeigen
  </button>
</form>
      <p className="mb-6 text-sm text-slate-600">
        Erstellt am {datumFormatieren(new Date())}
      </p>
<div className="grid grid-cols-7 border-l border-t border-slate-300 text-sm">
{["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((tag) => (
    <div
      key={tag}
      className="border-b border-r border-slate-300 bg-slate-100 p-2 text-center font-bold"
    >
      {tag}
    </div>
  ))}

  {Array.from(
    {
      length:
        Math.ceil(
          (
            (monatsBeginn.getDay() + 6) % 7 +
            new Date(jahr, monatsNummer, 0).getDate()
          ) / 7
        ) * 7,
    },
    (_, index) => {
      const ersterWochentag = (monatsBeginn.getDay() + 6) % 7;
      const tagNummer = index - ersterWochentag + 1;
      const tageImMonat = new Date(jahr, monatsNummer, 0).getDate();
      const istImMonat = tagNummer >= 1 && tagNummer <= tageImMonat;

      const tagesEinsaetze = istImMonat
        ? einsaetze.filter((einsatz) => {
            const datum = new Date(einsatz.datum);
            return (
              datum.getFullYear() === jahr &&
              datum.getMonth() === monatsNummer - 1 &&
              datum.getDate() === tagNummer
            );
          })
        : [];

      return (
        <div
          key={index}
          className={`min-h-28 border-b border-r border-slate-300 p-1 ${
            istImMonat ? "bg-white" : "bg-slate-100"
          }`}
        >
          {istImMonat && (
            <>
              <div className="mb-1 font-bold">{tagNummer}</div>

              {tagesEinsaetze.map((einsatz) => (
                <div
                  key={einsatz.id}
                  className="mb-1 rounded bg-blue-50 p-1 text-[10px] leading-tight"
                >
                  <div className="font-semibold">
                    {zeitFormatieren(einsatz.startzeit)}–
                    {zeitFormatieren(einsatz.endzeit)}
                  </div>
                  <div>
                    {einsatz.benutzer.vorname} {einsatz.benutzer.nachname}
                  </div>
                  <div>
                    {einsatz.klient.vorname} {einsatz.klient.nachname}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      );
    }
  )}
</div>

      {einsaetze.length === 0 && (
        <p className="mt-4">Keine Einsätze vorhanden.</p>
      )}

      <p className="mt-6 text-sm text-slate-500 print:hidden">
        Zum Drucken Strg + P drücken.
      </p>
    </main>
  );
}