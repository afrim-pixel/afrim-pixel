import { prisma } from "../../../../lib/prisma";
import { notFound } from "next/navigation";
import { sessionErfordern } from "../../../../lib/auth";

export default async function BenutzerPage({
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

  if (session.rolle !== "ADMIN_INHABER") {
    notFound();
  }

  const benutzer = await prisma.benutzer.findMany({
    where: {
      organisationId,
    },
    orderBy: {
      nachname: "asc",
    },
  });

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold text-slate-900">
          Benutzer
        </h1>

        <p className="mt-2 text-slate-600">
          Mitarbeiter verwalten
        </p>

        <div className="mt-8 space-y-4">
          {benutzer.map((eintrag) => (
            <div
              key={eintrag.id}
              className="rounded-xl bg-white p-6 shadow"
            >
              <p className="font-semibold text-slate-900">
                {eintrag.vorname} {eintrag.nachname}
              </p>

              <p className="mt-1 text-sm text-slate-600">
                {eintrag.email}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Rolle: {eintrag.rolle}
              </p>

              <a
  href={`/organisationen/${organisationId}/benutzer/${eintrag.id}/klienten`}
  className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
>
  Klienten zuweisen
</a>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}