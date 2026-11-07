import { prisma } from "../../../../lib/prisma";
import { notFound } from "next/navigation";
import { sessionErfordern } from "../../../../lib/auth";

export default async function DokumentationenPage({
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

  if (
  session.rolle !== "ADMIN_INHABER" &&
  session.rolle !== "MITARBEITER"
) {
  notFound();
}

const einsaetze = await prisma.einsatz.findMany({
      where: {
    ...(session.rolle === "MITARBEITER"
      ? { benutzerId: Number(session.benutzerId) }
      : {}),
    benutzer: {
      organisationId,
    },
    klient: {
      organisationId,
    },
  },
    include: {
      klient: true,
      benutzer: true,
      dokumentationen: true,
    },
    orderBy: [
      {
        datum: "desc",
      },
      {
        startzeit: "desc",
      },
    ],
  });

const offeneDokumentationen = einsaetze.filter(
  (einsatz) =>
    einsatz.endzeit <= new Date() &&
    einsatz.status === "BESTAETIGT" &&
    einsatz.dokumentationen.length === 0
);

const erledigteDokumentationen = einsaetze.filter(
  (einsatz) => einsatz.dokumentationen.length > 0
);

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold text-slate-900">
  {session.rolle === "MITARBEITER"
    ? "Meine Dokumentationen"
    : "Dokumentationen"}
</h1>

        <p className="mt-2 text-slate-600">
          Einsatz-Dokumentationen verwalten
        </p>

        <div className="mt-4">
  <a
    href={`/organisationen/${organisationId}`}
    className="inline-block rounded-lg bg-slate-700 px-4 py-2 font-semibold text-white hover:bg-slate-800"
  >
    ← Zurück zum Hauptmenü
  </a>
</div>

        <div className="mt-8">
          <h2 className="text-2xl font-bold text-slate-900">
            Offene Dokumentationen
          </h2>

          {offeneDokumentationen.length === 0 ? (
            <p className="mt-4 text-slate-500">
              Keine offenen Dokumentationen vorhanden.
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              {offeneDokumentationen.map((einsatz) => (
                <div
                  key={einsatz.id}
                  className="rounded-xl bg-white p-6 shadow"
                >
                  <p className="text-lg font-bold text-slate-900">
                    {einsatz.datum.toLocaleDateString("de-DE")}
                  </p>

                  <p className="mt-1 text-slate-700">
                    {einsatz.startzeit.toLocaleTimeString("de-DE", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {" – "}
                    {einsatz.endzeit.toLocaleTimeString("de-DE", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>

                  <p className="mt-3 text-sm text-slate-600">
                    Mitarbeiter: {einsatz.benutzer.vorname}{" "}
                    {einsatz.benutzer.nachname}
                  </p>

                  <p className="mt-1 text-sm text-slate-600">
                    Klient: {einsatz.klient.vorname}{" "}
                    {einsatz.klient.nachname}
                  </p>

                  <p className="mt-2 text-sm font-semibold text-slate-700">
                    Dokumentationen: {einsatz.dokumentationen.length}
                  </p>
                  {einsatz.dokumentationen.length > 0 && (
  <div className="mt-4 space-y-3">
    {einsatz.dokumentationen.map((dokumentation) => (
      <div
        key={dokumentation.id}
        className="rounded-lg bg-slate-50 p-4"
      >
        <p className="text-sm text-slate-700">
          {dokumentation.text}
        </p>

        <p className="mt-2 text-xs text-slate-500">
          Erstellt am{" "}
          {dokumentation.createdAt.toLocaleDateString("de-DE")} um{" "}
          {dokumentation.createdAt.toLocaleTimeString("de-DE", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>

        <a
  href={`/organisationen/${organisationId}/dokumentationen/${einsatz.id}/ansehen`}
  className="mt-3 inline-block rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
>
  Dokumentation ansehen
</a>

      </div>
    ))}
  </div>
)}
                  {einsatz.dokumentationen.length === 0 &&
  einsatz.endzeit <= new Date() &&
  einsatz.status === "BESTAETIGT" && (
  <a
    href={`/organisationen/${organisationId}/dokumentationen/${einsatz.id}`}
    className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
  >
    Dokumentation erstellen
  </a>
)}
                </div>
              ))}
            </div>
          )}
        </div>

<div className="mt-10">
          <h2 className="text-2xl font-bold text-slate-900">
            Erledigte Dokumentationen
          </h2>
          <div className="mt-4 space-y-4">
  {erledigteDokumentationen.map((einsatz) => (
    <div
      key={einsatz.id}
      className="rounded-xl bg-white p-6 shadow"
    >
      <p className="text-lg font-bold text-slate-900">
        {einsatz.datum.toLocaleDateString("de-DE")}
      </p>
      <p className="mt-1 text-slate-700">
  {einsatz.startzeit.toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  })}
  {" – "}
  {einsatz.endzeit.toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  })}
</p>
<p className="mt-3 text-sm text-slate-600">
  Mitarbeiter: {einsatz.benutzer.vorname}{" "}
  {einsatz.benutzer.nachname}
</p>

<p className="mt-1 text-sm text-slate-600">
  Klient: {einsatz.klient.vorname}{" "}
  {einsatz.klient.nachname}
</p>
{einsatz.dokumentationen.map((dokumentation) => (
  <div
    key={dokumentation.id}
    className="mt-4 rounded-lg bg-slate-50 p-4"
  >
    <p className="text-sm text-slate-700">
      {dokumentation.text}
    </p>
    <a
  href={`/organisationen/${organisationId}/dokumentationen/${einsatz.id}/ansehen`}
  className="mt-3 inline-block rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
>
  Dokumentation ansehen
</a>
  </div>
))}
    </div>
  ))}
</div>
        </div>

      </div>
    </main>
  );
}