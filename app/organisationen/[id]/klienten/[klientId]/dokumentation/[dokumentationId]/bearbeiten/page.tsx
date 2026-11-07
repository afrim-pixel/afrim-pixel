import { prisma } from "../../../../../../../../lib/prisma";
import { notFound, redirect } from "next/navigation";
import { sessionErfordern } from "../../../../../../../../lib/auth";

export default async function DokumentationBearbeitenPage({
  params,
}: {
  params: Promise<{
    id: string;
    klientId: string;
    dokumentationId: string;
  }>;
}) {
  const { id, klientId, dokumentationId } = await params;

  const organisationId = Number(id);
  const klientIdNummer = Number(klientId);
  const dokumentationIdNummer = Number(dokumentationId);

  const session = await sessionErfordern();

  if (session.organisationId !== organisationId) {
    notFound();
  }
const darfBearbeiten =
  session.rolle === "ADMIN_INHABER" ||
  session.rolle === "MITARBEITER";

if (!darfBearbeiten) {
  notFound();
}
const dokumentation = await prisma.dokumentation.findFirst({
  where: {
    id: dokumentationIdNummer,
    klientId: klientIdNummer,
    klient: {
      organisationId: organisationId,

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
  },
});

  if (!dokumentation) {
    notFound();
  }
async function dokumentationAktualisieren(formData: FormData) {
  "use server";

  const actionSession = await sessionErfordern();

  if (actionSession.organisationId !== organisationId) {
    notFound();
  }
const darfActionBearbeiten =
  actionSession.rolle === "ADMIN_INHABER" ||
  actionSession.rolle === "MITARBEITER";

if (!darfActionBearbeiten) {
  notFound();
}
  const text = String(formData.get("text") ?? "").trim();

  if (!text) {
    return;
  }

const actionDokumentation = await prisma.dokumentation.findFirst({
  where: {
    id: dokumentationIdNummer,
    klientId: klientIdNummer,
    klient: {
      organisationId: organisationId,

      ...(actionSession.rolle === "MITARBEITER"
        ? {
            mitarbeiterZuweisungen: {
              some: {
                benutzerId: Number(actionSession.benutzerId),
              },
            },
          }
        : {}),
    },
  },
});

if (!actionDokumentation) {
  notFound();
}

await prisma.$transaction([
  prisma.dokumentationAenderung.create({
    data: {
      alterText: actionDokumentation.text,
      dokumentationId: actionDokumentation.id,
      benutzerId: Number(actionSession.benutzerId),
    },
  }),

  prisma.dokumentation.update({
    where: {
      id: actionDokumentation.id,
    },
    data: {
      text,
    },
  }),
]);

  redirect(
    `/organisationen/${organisationId}/klienten/${klientIdNummer}/dokumentation`
  );
}
  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold text-slate-900">
          Dokumentation bearbeiten
        </h1>

    <form
  action={dokumentationAktualisieren}
  className="mt-8 rounded-xl bg-white p-6 shadow"
>
          <div className="grid gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Dokumentation
              </label>

              <textarea
                name="text"
                required
                rows={8}
                defaultValue={dokumentation.text}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>

            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
            >
              Änderungen speichern
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}