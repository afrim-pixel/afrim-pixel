import { prisma } from "../../../../../lib/prisma";
import { notFound, redirect } from "next/navigation";
import { sessionErfordern } from "../../../../../lib/auth";

export default async function DokumentationErstellenPage({
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
      dokumentationen: true,
    },
  });

  if (!einsatz) {
    notFound();
  }

if (
  einsatz.endzeit > new Date() ||
  einsatz.status !== "BESTAETIGT"
) {
  notFound();
}

  if (einsatz.dokumentationen.length > 0) {
    redirect(`/organisationen/${organisationId}/dokumentationen`);
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

async function dokumentationSpeichern(formData: FormData) {
    "use server";

    const actionSession = await sessionErfordern();

    if (actionSession.organisationId !== organisationId) {
      notFound();
    }

    const text = String(formData.get("text") ?? "").trim();

    if (!text) {
      return;
    }

    const actionEinsatz = await prisma.einsatz.findFirst({
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
        dokumentationen: true,
      },
    });

    if (!actionEinsatz) {
      notFound();
    }

if (
  actionEinsatz.endzeit > new Date() ||
  actionEinsatz.status !== "BESTAETIGT"
) {
  notFound();
}

    if (actionEinsatz.dokumentationen.length > 0) {
      redirect(`/organisationen/${organisationId}/dokumentationen`);
    }

if (
      actionSession.rolle === "MITARBEITER" &&
      actionEinsatz.benutzerId !== Number(actionSession.benutzerId)
    ) {
      notFound();
    }

    if (
      actionSession.rolle !== "ADMIN_INHABER" &&
      actionSession.rolle !== "MITARBEITER"
    ) {
      notFound();
    }

    await prisma.dokumentation.create({
      data: {
        text,
        klientId: actionEinsatz.klientId,
        benutzerId: actionEinsatz.benutzerId,
        einsatzId: actionEinsatz.id,
      },
    });

    redirect(`/organisationen/${organisationId}/dokumentationen`);
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold text-slate-900">
          Dokumentation erstellen
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
        <form
  action={dokumentationSpeichern}
  className="mt-6 rounded-xl bg-white p-6 shadow"
>
  <label
    htmlFor="text"
    className="block text-sm font-semibold text-slate-700"
  >
    Dokumentation
  </label>

  <textarea
    id="text"
    name="text"
    rows={8}
    placeholder="Dokumentation zum Einsatz eingeben..."
    className="mt-2 w-full rounded-lg border border-slate-300 p-3 text-slate-900"
  />

  <button
    type="submit"
    className="mt-4 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
  >
    Dokumentation speichern
  </button>
</form>
      </div>
    </main>
  );
}