
import { prisma } from "../../../../../lib/prisma";
import { sessionErfordern } from "../../../../../lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import NachunterschriftFreigabe from "./NachunterschriftFreigabe";

export default async function EinsatzDetailPage({
  params,
}: {
  params: Promise<{ id: string; einsatzId: string }>;
}) {
  const { id, einsatzId } = await params;
  const organisationId = Number(id);
  const nummer = Number(einsatzId);

  const session = await sessionErfordern();

  if (
    session.organisationId !== organisationId ||
    session.rolle !== "ADMIN_INHABER" ||
    !Number.isInteger(nummer) ||
    nummer <= 0
  ) {
    notFound();
  }

  const einsatz = await prisma.einsatz.findFirst({
    where: {
      id: nummer,
      benutzer: { organisationId },
      klient: { organisationId },
    },
    include: {
      klient: true,
      benutzer: true,
    },
  });

  if (!einsatz) {
    notFound();
  }
  const darfNachtraeglichFreigeben =
    einsatz.status === "GEPRUEFT" &&
    !einsatz.klient.istTestklient &&
    einsatz.unterschrift === null &&
    einsatz.unterschriebenAm === null &&
    einsatz.nachunterschriftFreigegebenAm === null;

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-3xl rounded-xl bg-white p-6 shadow">
        <Link
          href={`/organisationen/${organisationId}/einsaetze`}
          className="text-blue-600 hover:underline"
        >
          ← Zurück zur Einsatzplanung
        </Link>

        <h1 className="mt-6 text-2xl font-bold text-slate-900">
          Einsatz-ID: {einsatz.id}
        </h1>

        <div className="mt-6 space-y-3 text-slate-700">
          <p>
            <strong>Klient:</strong> {einsatz.klient.vorname}{" "}
            {einsatz.klient.nachname}
          </p>
          <p>
            <strong>Mitarbeiter:</strong> {einsatz.benutzer.vorname}{" "}
            {einsatz.benutzer.nachname}
          </p>
          <p>
            <strong>Datum:</strong>{" "}
            {einsatz.datum.toLocaleDateString("de-DE")}
          </p>
          <p>
            <strong>Uhrzeit:</strong>{" "}
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
          <p>
            <strong>Status:</strong> {einsatz.status}
          </p>
          <p>
            <strong>Unterschrift:</strong>{" "}
            {einsatz.unterschrift?.trim()
              ? "Vorhanden"
              : "Fehlt"}
          </p>
          <p>
            <strong>Unterschriftsdatum:</strong>{" "}
            {einsatz.unterschriebenAm
              ? einsatz.unterschriebenAm.toLocaleString("de-DE")
              : "Fehlt"}
          </p>
                    <p>
            <strong>Nachträgliche Freigabe:</strong>{" "}
            {einsatz.nachunterschriftFreigegebenAm
              ? `Freigegeben am ${einsatz.nachunterschriftFreigegebenAm.toLocaleString("de-DE")}`
              : "Nicht freigegeben"}
          </p>
        </div>
                {darfNachtraeglichFreigeben && (
          <NachunterschriftFreigabe einsatzId={einsatz.id} />
        )}
      </div>
    </main>
  );
}
