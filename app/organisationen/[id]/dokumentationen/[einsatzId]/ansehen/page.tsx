import { prisma } from "../../../../../../lib/prisma";
import { notFound } from "next/navigation";
import { sessionErfordern } from "../../../../../../lib/auth";

export default async function DokumentationAnsehenPage({
  params,
}: {
  params: Promise<{ id: string; einsatzId: string }>;
}) {
  const { id, einsatzId } = await params;

  const organisationId = Number(id);
  const einsatzIdNummer = Number(einsatzId);

  const session = await sessionErfordern();

  if (session.organisationId !== organisationId) {
    notFound();
  }

  const einsatz = await prisma.einsatz.findFirst({
    where: {
      id: einsatzIdNummer,
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
  dokumentationen: {
    include: {
      aenderungen: {
        include: {
          benutzer: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  },
},
  });

  if (!einsatz) {
    notFound();
  }

  if (
    session.rolle === "MITARBEITER" &&
    einsatz.benutzerId !== Number(session.benutzerId)
  ) {
    notFound();
  }

  if (
    session.rolle !== "ADMIN_INHABER" &&
    session.rolle !== "MITARBEITER"
  ) {
    notFound();
  }

  const dokumentation = einsatz.dokumentationen[0];

  if (!dokumentation) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold text-slate-900">
          Dokumentation ansehen
        </h1>

        <div className="mt-6 rounded-xl bg-white p-6 shadow">
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
        </div>

        <div className="mt-6 rounded-xl bg-white p-6 shadow">
          <h2 className="text-xl font-bold text-slate-900">
            Dokumentation
          </h2>

          <p className="mt-4 whitespace-pre-wrap text-slate-700">
            {dokumentation.text}
          </p>

          <p className="mt-4 text-sm text-slate-500">
            Erstellt am{" "}
            {dokumentation.createdAt.toLocaleDateString("de-DE")} um{" "}
            {dokumentation.createdAt.toLocaleTimeString("de-DE", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>

<a
  href={`/organisationen/${organisationId}/dokumentationen/${einsatz.id}/bearbeiten`}
  className="mt-4 inline-block rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600"
>
  Dokumentation bearbeiten
  {dokumentation.aenderungen.length > 0 && (
  <div className="mt-8 border-t border-slate-200 pt-6">
    <h2 className="text-xl font-bold text-slate-900">
      Änderungshistorie
    </h2>

    <div className="mt-4 space-y-4">
      {dokumentation.aenderungen.map((aenderung) => (
        <div
          key={aenderung.id}
          className="rounded-lg bg-slate-50 p-4"
        >
          <p className="text-sm font-semibold text-slate-700">
            Vorheriger Text
          </p>

          <p className="mt-2 whitespace-pre-wrap text-slate-700">
            {aenderung.alterText}
          </p>

          <p className="mt-3 text-xs text-slate-500">
            Geändert von {aenderung.benutzer.vorname}{" "}
            {aenderung.benutzer.nachname} am{" "}
            {aenderung.createdAt.toLocaleDateString("de-DE")} um{" "}
            {aenderung.createdAt.toLocaleTimeString("de-DE", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      ))}
    </div>
  </div>
)}
</a>

        </div>
      </div>
    </main>
  );
}