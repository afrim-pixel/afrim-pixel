import { prisma } from "../../../../../../lib/prisma";
import { notFound, redirect } from "next/navigation";
import { sessionErfordern } from "../../../../../../lib/auth";

export default async function DokumentationPage({
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
const darfDokumentationErstellen =
  session.rolle === "ADMIN_INHABER" ||
  session.rolle === "MITARBEITER";

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
const dokumentationen = await prisma.dokumentation.findMany({
  where: {
    klientId: klientIdNummer,
    klient: {
      organisationId: organisationId,
    },
  },
include: {
  benutzer: true,
  aenderungen: {
    include: {
      benutzer: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  },
},
  orderBy: {
    datum: "desc",
  },
});
async function dokumentationSpeichern(formData: FormData) {
  "use server";

  const actionSession = await sessionErfordern();

  if (actionSession.organisationId !== organisationId) {
    notFound();
  }
const darfActionErstellen =
  actionSession.rolle === "ADMIN_INHABER" ||
  actionSession.rolle === "MITARBEITER";

if (!darfActionErstellen) {
  notFound();
}
const actionKlient = await prisma.klient.findFirst({
  where: {
    id: klientIdNummer,
    organisationId,

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
});

if (!actionKlient) {
  notFound();
}

const text = String(formData.get("text") ?? "").trim();

if (!text) {
  return;
}

await prisma.dokumentation.create({
  data: {
    text,
    klientId: klientIdNummer,
    benutzerId: Number(actionSession.benutzerId),
  },
});

  redirect(
    `/organisationen/${organisationId}/klienten/${klientIdNummer}/dokumentation`
  );
}
  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold text-slate-900">
          Dokumentation
        </h1>

        <p className="mt-2 text-slate-600">
          {klient.vorname} {klient.nachname}
        </p>
        <a
  href={`/organisationen/${organisationId}/klienten/${klientIdNummer}`}
  className="mt-4 inline-block rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900"
>
  Zurück zur Klientenakte
</a>
{darfDokumentationErstellen && (
  <form
    action={dokumentationSpeichern}
    className="mt-8 rounded-xl bg-white p-6 shadow"
  >
    <div className="grid gap-4">
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Neue Dokumentation
        </label>

        <textarea
          name="text"
          required
          rows={6}
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
          placeholder="Dokumentation eingeben..."
        />
      </div>

      <button
        type="submit"
        className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
      >
        Dokumentation speichern
      </button>
    </div>
  </form>
)}
<div className="mt-8 space-y-4">
  {dokumentationen.length === 0 ? (
    <p className="text-slate-500">
      Noch keine Dokumentation vorhanden.
    </p>
  ) : (
    dokumentationen.map((eintrag) => (
      <div
        key={eintrag.id}
        className="rounded-xl bg-white p-6 shadow"
      >
        <p className="text-sm text-slate-500">
          {eintrag.datum.toLocaleString("de-DE")}
        </p>
<p className="mt-1 text-sm text-slate-600">
  Mitarbeiter:{" "}
  {eintrag.benutzer
    ? `${eintrag.benutzer.vorname} ${eintrag.benutzer.nachname}`
    : "Nicht angegeben"}
</p>
<p className="mt-2 whitespace-pre-wrap text-slate-900">
  {eintrag.text}
</p>

{eintrag.updatedAt.getTime() > eintrag.createdAt.getTime() + 1000 && (
  <p className="mt-1 text-xs text-slate-500">
    Bearbeitet am: {eintrag.updatedAt.toLocaleString("de-DE")}
  </p>
)}
{eintrag.aenderungen.length > 0 && (
  <div className="mt-4 rounded-lg bg-slate-50 p-4">
    <p className="text-sm font-semibold text-slate-700">
      Änderungshistorie
    </p>

    <div className="mt-3 space-y-3">
      {eintrag.aenderungen.map((aenderung) => (
        <div
          key={aenderung.id}
          className="border-t border-slate-200 pt-3 first:border-t-0 first:pt-0"
        >
          <p className="text-xs text-slate-500">
            {aenderung.createdAt.toLocaleString("de-DE")}
          </p>

          <p className="mt-1 text-xs text-slate-600">
            Geändert von: {aenderung.benutzer.vorname}{" "}
            {aenderung.benutzer.nachname}
          </p>

          <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
            Vorheriger Text: {aenderung.alterText}
          </p>
        </div>
      ))}
    </div>
  </div>
)}
{(session.rolle === "ADMIN_INHABER" ||
  session.rolle === "MITARBEITER") && (
  <a
    href={`/organisationen/${organisationId}/klienten/${klientIdNummer}/dokumentation/${eintrag.id}/bearbeiten`}
    className="mt-4 inline-block rounded-lg bg-slate-200 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-300"
  >
    Bearbeiten
  </a>
)}
</div>
    ))
  )}
</div>
      </div>
    </main>
  );
}