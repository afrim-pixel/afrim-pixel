import { prisma } from "../../../../../../../lib/prisma";
import { notFound, redirect } from "next/navigation";
import { sessionErfordern } from "../../../../../../../lib/auth";

export default async function AenderungPage({
  params,
}: {
  params: Promise<{ id: string; einsatzId: string }>;
}) {
  const { id, einsatzId } = await params;

  const organisationId = Number(id);
  const einsatzIdNummer = Number(einsatzId);

  const session = await sessionErfordern();

  if (
    session.organisationId !== organisationId ||
    session.rolle !== "MITARBEITER"
  ) {
    notFound();
  }

  const einsatz = await prisma.einsatz.findFirst({
    where: {
      id: einsatzIdNummer,
      benutzerId: Number(session.benutzerId),
      status: {
in: ["OFFEN", "BESTAETIGT", "AENDERUNG_GEMELDET"],
},
      benutzer: {
        organisationId,
      },
      klient: {
        organisationId,
      },
    },
    include: {
      klient: true,
    },
  });

  if (!einsatz) {
    notFound();
  }

  const jetzt = new Date();

const beginnVormonat = new Date(
  jetzt.getFullYear(),
  jetzt.getMonth() - 1,
  1
);

if (einsatz.datum < beginnVormonat) {
  notFound();
}

  async function aenderungMelden(formData: FormData) {
  "use server";

  const actionSession = await sessionErfordern();

  if (
    actionSession.organisationId !== organisationId ||
    actionSession.rolle !== "MITARBEITER"
  ) {
    notFound();
  }

  const actionEinsatz = await prisma.einsatz.findFirst({
    where: {
      id: einsatzIdNummer,
      benutzerId: Number(actionSession.benutzerId),
      status: {
in: ["OFFEN", "BESTAETIGT", "AENDERUNG_GEMELDET"],
},
      benutzer: {
        organisationId,
      },
      klient: {
        organisationId,
      },
    },
  });

  if (!actionEinsatz) {
    notFound();
  }

  const actionJetzt = new Date();

const actionBeginnVormonat = new Date(
  actionJetzt.getFullYear(),
  actionJetzt.getMonth() - 1,
  1
);

if (actionEinsatz.datum < actionBeginnVormonat) {
  notFound();
}

  const neuesDatum = String(formData.get("neuesDatum") ?? "");
  const neueStartzeit = String(formData.get("neueStartzeit") ?? "");
  const neueEndzeit = String(formData.get("neueEndzeit") ?? "");
  const aenderungsGrund = String(
    formData.get("aenderungsGrund") ?? ""
  ).trim();

  if (
    !neuesDatum ||
    !neueStartzeit ||
    !neueEndzeit ||
    !aenderungsGrund
  ) {
    return;
  }

  const neuesDatumWert = new Date(
    `${neuesDatum}T00:00:00`
  );

  const neueStartzeitWert = new Date(
    `${neuesDatum}T${neueStartzeit}:00`
  );

  const neueEndzeitWert = new Date(
    `${neuesDatum}T${neueEndzeit}:00`
  );

  if (
    Number.isNaN(neuesDatumWert.getTime()) ||
    Number.isNaN(neueStartzeitWert.getTime()) ||
    Number.isNaN(neueEndzeitWert.getTime()) ||
    neueEndzeitWert <= neueStartzeitWert
  ) {
    return;
  }


const ergebnis = await prisma.einsatz.updateMany({
  where: {
    id: actionEinsatz.id,
    benutzerId: Number(actionSession.benutzerId),
    status: {
      in: ["OFFEN", "BESTAETIGT", "AENDERUNG_GEMELDET"],
    },
  },
  data: {
    datum: neuesDatumWert,
    startzeit: neueStartzeitWert,
    endzeit: neueEndzeitWert,
    status: actionEinsatz.status === "AENDERUNG_GEMELDET"
      ? "OFFEN"
      : actionEinsatz.status,
    aenderungGemeldet: true,
    ausfallGemeldet: false,
    neuesDatum: null,
    neueStartzeit: null,
    neueEndzeit: null,
    aenderungsGrund: null,
  },
});

if (ergebnis.count === 0) {
  notFound();
}
  await prisma.einsatzAenderung.create({
    data: {
      einsatzId: actionEinsatz.id,
      neuesDatum: neuesDatumWert,
      neueStartzeit: neueStartzeitWert,
      neueEndzeit: neueEndzeitWert,
      grund: aenderungsGrund,
    },
  });

  redirect(
    `/organisationen/${organisationId}/einsaetze/meine`
  );
}

    return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold text-slate-900">
          Änderung melden
        </h1>

        <p className="mt-2 text-slate-600">
          Änderung für diesen Einsatz melden
        </p>

        <div className="mt-8 rounded-xl bg-white p-6 shadow">
          <p className="font-bold text-slate-900">
            {einsatz.datum.toLocaleDateString("de-DE")}
          </p>

          <p className="mt-2 text-slate-700">
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

          <p className="mt-2 text-slate-600">
            Klient: {einsatz.klient.vorname}{" "}
            {einsatz.klient.nachname}
          </p>

          <p className="mt-2 font-semibold text-slate-700">
            Status: {einsatz.status}
          </p>

                </div>

        <form
          action={aenderungMelden}
          className="mt-6 rounded-xl bg-white p-6 shadow"
        >
          <div>
            <label className="block text-sm font-semibold text-slate-700">
              Neues Datum
            </label>
            <input
              type="date"
              name="neuesDatum"
              required
              className="mt-2 w-full rounded-lg border border-slate-300 p-3"
            />
          </div>

          <div className="mt-4">
            <label className="block text-sm font-semibold text-slate-700">
              Neue Startzeit
            </label>
            <input
              type="time"
              name="neueStartzeit"
              required
              className="mt-2 w-full rounded-lg border border-slate-300 p-3"
            />
          </div>

          <div className="mt-4">
            <label className="block text-sm font-semibold text-slate-700">
              Neue Endzeit
            </label>
            <input
              type="time"
              name="neueEndzeit"
              required
              className="mt-2 w-full rounded-lg border border-slate-300 p-3"
            />
          </div>

          <div className="mt-4">
            <label className="block text-sm font-semibold text-slate-700">
              Grund der Änderung
            </label>
            <textarea
              name="aenderungsGrund"
              required
              rows={4}
              className="mt-2 w-full rounded-lg border border-slate-300 p-3"
              placeholder="Bitte Grund der Änderung eingeben"
            />
          </div>

          <button
            type="submit"
            className="mt-6 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600"
          >
            Änderung melden
          </button>
        </form>

        <a
          href={`/organisationen/${organisationId}/einsaetze/meine`}
          className="mt-6 inline-block rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900"
        >
          Zurück zu meinen Einsätzen
        </a>
      </div>
    </main>
  );
}