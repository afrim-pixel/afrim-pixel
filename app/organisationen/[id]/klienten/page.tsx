import { prisma } from "../../../../lib/prisma";
import { notFound } from "next/navigation";
import { sessionErfordern } from "../../../../lib/auth";

export default async function KlientenPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const organisationId = Number(id);
  const session = await sessionErfordern();

  if (session.organisationId !== organisationId) {
    notFound();
  }
  const organisation = await prisma.organisation.findUnique({
    where: {
      id: organisationId,
    },
  });

  if (!organisation) {
    notFound();
  }

  const klienten = await prisma.klient.findMany({
    where: {
      organisationId: organisationId,
    },
    orderBy: {
      id: "asc",
    },
  });

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold text-slate-900">
          Klienten
        </h1>

        <p className="mt-2 text-slate-600">
          {organisation.name}
        </p>

        <div className="mt-4">
  <a
    href={`/organisationen/${organisationId}`}
    className="inline-block rounded-lg bg-slate-700 px-4 py-2 font-semibold text-white hover:bg-slate-800"
  >
    ← Zurück zum Hauptmenü
  </a>
</div>

{session.rolle === "ADMIN_INHABER" && (
  <a
    href={`/organisationen/${organisationId}/klienten/neu`}
    className="mt-6 inline-block rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
  >
    Neuen Klienten anlegen
  </a>
)}
        <div className="mt-8 rounded-xl bg-white p-6 shadow">
          {klienten.length === 0 ? (
            <p className="text-slate-500">
              Noch keine Klienten vorhanden.
            </p>
          ) : (
            <div>
              {klienten.map((klient) => (
                <div
                  key={klient.id}
                  className="border-b border-slate-200 py-4 last:border-b-0"
                >
<a
  href={`/organisationen/${organisationId}/klienten/${klient.id}`}
  className="font-semibold text-blue-700 hover:underline"
>
  {klient.vorname} {klient.nachname}
</a>

<p className="mt-1 text-sm text-slate-500">
Geboren:{" "}
{klient.geburtsdatum
  ? klient.geburtsdatum.toLocaleDateString("de-DE")
  : "nicht angegeben"}
</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}