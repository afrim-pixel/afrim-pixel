import { prisma } from "../../../../lib/prisma";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
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

  async function beschaeftigtennummerSpeichern(formData: FormData) {
    "use server";

    const actionSession = await sessionErfordern();

    if (
      actionSession.organisationId !== organisationId ||
      actionSession.rolle !== "ADMIN_INHABER"
    ) {
      notFound();
    }

    const benutzerId = Number(formData.get("benutzerId"));
    const beschaeftigtennummer = String(
      formData.get("beschaeftigtennummer") ?? ""
    ).trim();

    if (!Number.isSafeInteger(benutzerId) || benutzerId <= 0) {
      return;
    }

    await prisma.benutzer.updateMany({
      where: {
        id: benutzerId,
        organisationId,
      },
      data: {
        beschaeftigtennummer: beschaeftigtennummer || null,
      },
    });

    revalidatePath(`/organisationen/${organisationId}/benutzer`);
  }

  const benutzer = await prisma.benutzer.findMany({
    where: {
      organisationId,
    },
    select: {
      id: true,
      vorname: true,
      nachname: true,
      email: true,
      rolle: true,
      beschaeftigtennummer: true,
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
                Beschäftigtennummer: {eintrag.beschaeftigtennummer || "Nicht hinterlegt"}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Rolle: {eintrag.rolle}
              </p>

              <form action={beschaeftigtennummerSpeichern} className="mt-4 flex flex-wrap items-end gap-3">
                <input type="hidden" name="benutzerId" value={eintrag.id} />
                <div className="flex-1">
                  <label htmlFor={`beschaeftigtennummer-${eintrag.id}`} className="mb-1 block text-sm font-medium text-slate-700">
                    Beschäftigtennummer bearbeiten
                  </label>
                  <input
                    id={`beschaeftigtennummer-${eintrag.id}`}
                    name="beschaeftigtennummer"
                    defaultValue={eintrag.beschaeftigtennummer ?? ""}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>
                <button type="submit" className="rounded-lg bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700">
                  Speichern
                </button>
              </form>

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