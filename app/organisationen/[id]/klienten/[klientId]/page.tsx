import { prisma } from "../../../../../lib/prisma";
import { notFound } from "next/navigation";
import { sessionErfordern } from "../../../../../lib/auth";

export default async function KlientPage({
  params,
}: {
  params: Promise<{ id: string; klientId: string }>;
}) {
  const { id, klientId } = await params;

  const organisationId = Number(id);
  const klientIdNummer = Number(klientId);

  const session = await sessionErfordern();

  if (session.organisationId !== organisationId) {
  notFound();

  }
const klient = await prisma.klient.findFirst({
  where: {
    id: klientIdNummer,
    organisationId,

    ...(session.rolle === "MITARBEITER"
      ? {
          mitarbeiterZuweisungen: {
            some: {
              benutzerId: Number(session.benutzerId),
            },
          },
        }
      : {}),
  },
});

  if (!klient) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold text-slate-900">
          {klient.vorname} {klient.nachname}
        </h1>

        <p className="mt-2 text-slate-600">
          Klientenakte
        </p>
<div className="mt-6 flex gap-3">
  <a
    href="#stammdaten"
    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
  >
    Stammdaten
  </a>

  <a
    href={`/organisationen/${organisationId}/klienten/${klientIdNummer}/dokumentation`}
    className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow"
  >
    Dokumentation
  </a>
{session.rolle !== "MITARBEITER" && (
  <a
    href={`/organisationen/${organisationId}/klienten/${klientIdNummer}/abrechnung`}
    className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow"
  >
    Abrechnung
  </a>
  )}
</div>
        <div className="mt-8 rounded-xl bg-white p-6 shadow">
          <p className="text-sm text-slate-500">
            Geburtsdatum
          </p>

          <p className="mt-1 font-semibold text-slate-900">
            {klient.geburtsdatum
              ? klient.geburtsdatum.toLocaleDateString("de-DE")
              : "Nicht angegeben"}
          </p>
        </div>
        <div className="mt-4 rounded-xl bg-white p-6 shadow">
  <p className="text-sm text-slate-500">
    Adresse
  </p>

  <p className="mt-1 font-semibold text-slate-900">
    {klient.strasse || klient.hausnummer
      ? `${klient.strasse ?? ""} ${klient.hausnummer ?? ""}`.trim()
      : "Nicht angegeben"}
  </p>

  <p className="mt-1 text-slate-700">
    {klient.plz || klient.ort
      ? `${klient.plz ?? ""} ${klient.ort ?? ""}`.trim()
      : "Nicht angegeben"}
  </p>
</div>
<div className="mt-4 rounded-xl bg-white p-6 shadow">
  <p className="text-sm text-slate-500">
    Kontakt
  </p>

  <p className="mt-1 font-semibold text-slate-900">
    Telefon: {klient.telefon ?? "Nicht angegeben"}
  </p>

  <p className="mt-1 text-slate-700">
    E-Mail: {klient.email ?? "Nicht angegeben"}
  </p>
</div>
{session.rolle === "ADMIN_INHABER" && (
  <a
    href={`/organisationen/${organisationId}/klienten/${klientIdNummer}/bearbeiten`}
    className="mt-4 inline-block rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900"
  >
    Stammdaten bearbeiten
  </a>
)}
      </div>
    </main>
  );
}