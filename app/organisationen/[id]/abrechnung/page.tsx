import { prisma } from "../../../../lib/prisma";
import { sessionErfordern } from "@/lib/auth";
import { notFound } from "next/navigation";
export default async function AbrechnungPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const organisationId = Number(id);
  const session = await sessionErfordern();
  if (Number(session.organisationId) !== organisationId || session.rolle !== "ADMIN_INHABER") {
    notFound();
  }

const klienten = await prisma.klient.findMany({
  where: {
    organisationId,
    aktiv: true,
  },
  select: {
    id: true,
    vorname: true,
    nachname: true,
  },
  orderBy: {
    nachname: "asc",
  },
});

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-5xl">
<h1 className="text-3xl font-bold text-slate-900">
  Abrechnung für Pflegekassen
</h1>
<a
  href={`/organisationen/${organisationId}/abrechnung/elektronisch`}
  className="mt-4 inline-block rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
>
  Elektronische Abrechnung vorbereiten
</a>

<p className="mt-2 text-slate-600">
  Klient auswählen und abrechenbare Leistungen prüfen.
</p>

        <p className="mt-2 text-slate-600">
          Abrechnungen für Pflegekassen erstellen
        </p>

        <div className="mt-6 rounded-xl bg-white p-6 shadow">
  <h2 className="text-xl font-bold text-slate-900">
    Klient auswählen
  </h2>
  <div className="mt-4 space-y-2">
  {klienten.map((klient) => (
<a
  key={klient.id}
  href={`/organisationen/${organisationId}/klienten/${klient.id}/abrechnung`}
  className="block rounded-lg border border-slate-200 p-3 font-semibold text-slate-900 hover:bg-slate-50"
>
  {klient.vorname} {klient.nachname}
</a>
  ))}
</div>
</div>

        <a
          href={`/organisationen/${id}`}
          className="mt-4 inline-block rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white"
        >
          ← Zurück zum Hauptmenü
        </a>
      </div>
    </main>
  );
}
