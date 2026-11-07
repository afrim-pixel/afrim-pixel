import { prisma } from "../../../../../lib/prisma";
import { notFound, redirect } from "next/navigation";
import { sessionErfordern } from "../../../../../lib/auth";
import EinsatzBestaetigenButton from "./EinsatzBestaetigenButton";
import AusfallMeldenButton from "./AusfallMeldenButton";

export default async function MeineEinsaetzePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ fehler?: string; ansicht?: string; monat?: string; woche?: string }>;
}) {
  const { id } = await params;
  const { fehler, ansicht, monat, woche } = await searchParams;
  const heute = new Date();
const fruehesterMonat = new Date(
  heute.getFullYear(),
  heute.getMonth() - 1,
  1
);

const gewuenschterMonat =
  monat && /^\d{4}-(0[1-9]|1[0-2])$/.test(monat)
    ? new Date(`${monat}-01T12:00:00`)
    : new Date(heute.getFullYear(), heute.getMonth(), 1);

const ausgewaehlterMonat =
  gewuenschterMonat < fruehesterMonat
    ? fruehesterMonat
    : gewuenschterMonat;

  const organisationId = Number(id);

  const monatsansicht = ansicht === "monat";

  const session = await sessionErfordern();

  if (session.organisationId !== organisationId) {
    notFound();
  }

  if (session.rolle !== "MITARBEITER") {
    notFound();
  }

  const benutzerId = Number(session.benutzerId);

    const einsaetze = await prisma.einsatz.findMany({  where: {
      benutzerId,
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
    orderBy: {
      startzeit: "asc",
    },
  });
const jetzt = heute;

const kalenderMonat = monatsansicht ? ausgewaehlterMonat : jetzt;

const fruehesterWochenTag = new Date(
  heute.getFullYear(),
  heute.getMonth() - 1,
  1
);

const gewuenschtesWochenDatum =
  woche && /^\d{4}-\d{2}-\d{2}$/.test(woche) &&
  !isNaN(new Date(`${woche}T12:00:00`).getTime())
    ? new Date(`${woche}T12:00:00`)
    : new Date(jetzt);

const wochenDatum =
  gewuenschtesWochenDatum < fruehesterWochenTag
    ? fruehesterWochenTag
    : gewuenschtesWochenDatum;


const kwDatum = new Date(
  Date.UTC(
    wochenDatum.getFullYear(),
    wochenDatum.getMonth(),
    wochenDatum.getDate()
  )
);

kwDatum.setUTCDate(
  kwDatum.getUTCDate() + 4 - (kwDatum.getUTCDay() || 7)
);

const kwJahr = kwDatum.getUTCFullYear();

const jahresAnfang = new Date(Date.UTC(kwJahr, 0, 1));

const kalenderWoche = Math.ceil(
  ((kwDatum.getTime() - jahresAnfang.getTime()) / 86400000 + 1) / 7
);

const beginnVormonat = new Date(
  jetzt.getFullYear(),
  jetzt.getMonth() - 1,
  1
);

const endeVormonat = new Date(
  jetzt.getFullYear(),
  jetzt.getMonth(),
  1
);

const vormonatEinsaetze = einsaetze.filter(
  (einsatz) =>
    einsatz.datum >= beginnVormonat &&
    einsatz.datum < endeVormonat
);

const vormonatHatOffeneEinsaetze = vormonatEinsaetze.some(
  (einsatz) =>
    einsatz.status === "OFFEN" ||
    einsatz.status === "AENDERUNG_GEMELDET"
);

const vormonatHatBestaetigteEinsaetze = vormonatEinsaetze.some(
  (einsatz) => einsatz.status === "BESTAETIGT"
);

  const kommendeEinsaetze = einsaetze.filter(
    (einsatz) => einsatz.endzeit >= jetzt
  );

const vergangeneEinsaetze = einsaetze.filter(
  (einsatz) =>
    einsatz.endzeit < jetzt &&
    einsatz.datum >= beginnVormonat
);

const einsaetzeOhneUnterschrift = einsaetze.filter(
  (einsatz) =>
    einsatz.endzeit < jetzt &&
    !einsatz.unterschrift &&
    !einsatz.unterschriebenAm &&
    !einsatz.ausfallGemeldet
);

async function einsatzBestaetigen(formData: FormData) {
  "use server";

  const actionSession = await sessionErfordern();

  if (
    actionSession.organisationId !== organisationId ||
    actionSession.rolle !== "MITARBEITER"
  ) {
    notFound();
  }

  const einsatzId = Number(formData.get("einsatzId"));

  const einsatz = await prisma.einsatz.findFirst({
    where: {
      id: einsatzId,
      benutzerId: Number(actionSession.benutzerId),
      benutzer: {
        organisationId,
      },
      klient: {
        organisationId,
      },
      status: "OFFEN",
      startzeit: {
  lte: new Date(),
},
    },
  });

  if (!einsatz) {
    redirect(`/organisationen/${organisationId}/einsaetze/meine`);
  }
if (!einsatz.unterschrift) {
  redirect(
    `/organisationen/${organisationId}/einsaetze/meine?fehler=unterschrift`
  );
}
  const actionJetzt = new Date();

const actionBeginnVormonat = new Date(
  actionJetzt.getFullYear(),
  actionJetzt.getMonth() - 1,
  1
);

if (einsatz.datum < actionBeginnVormonat) {
  redirect(`/organisationen/${organisationId}/einsaetze/meine`);
}

  await prisma.einsatz.update({
    where: {
      id: einsatz.id,
    },
    data: {
      status: "BESTAETIGT",
      bestaetigtAm: new Date(),
    },
  });

  redirect(`/organisationen/${organisationId}/einsaetze/meine`);
}

async function ausfallMelden(formData: FormData) {
  "use server";

  const actionSession = await sessionErfordern();

  if (
    actionSession.organisationId !== organisationId ||
    actionSession.rolle !== "MITARBEITER"
  ) {
    notFound();
  }

  const einsatzId = Number(formData.get("einsatzId"));

  const einsatz = await prisma.einsatz.findFirst({
    where: {
      id: einsatzId,
      benutzerId: Number(actionSession.benutzerId),
      benutzer: {
        organisationId,
      },
      klient: {
        organisationId,
      },
      status: {
        in: ["OFFEN", "BESTAETIGT"],
      },
    },
  });

  if (!einsatz) {
    redirect(`/organisationen/${organisationId}/einsaetze/meine`);
  }

  await prisma.einsatz.update({
    where: {
      id: einsatz.id,
    },
    data: {
      ausfallGemeldet: true,
      ausfallGemeldetAm: new Date(),
    },
  });

  redirect(`/organisationen/${organisationId}/einsaetze/meine`);
}
async function ausfallZurueckziehen(formData: FormData) {
  "use server";

  const actionSession = await sessionErfordern();

  if (
    actionSession.organisationId !== organisationId ||
    actionSession.rolle !== "MITARBEITER"
  ) {
    notFound();
  }

  const einsatzId = Number(formData.get("einsatzId"));

  const einsatz = await prisma.einsatz.findFirst({
    where: {
      id: einsatzId,
      benutzerId: Number(actionSession.benutzerId),
      benutzer: {
        organisationId,
      },
      klient: {
        organisationId,
      },
      ausfallGemeldet: true,
    },
  });

  if (!einsatz) {
    redirect(`/organisationen/${organisationId}/einsaetze/meine`);
  }

  await prisma.einsatz.update({
    where: {
      id: einsatz.id,
    },
    data: {
      ausfallGemeldet: false,
      ausfallZurueckgezogenAm: new Date(),
    },
  });

  redirect(`/organisationen/${organisationId}/einsaetze/meine`);
}
async function vormonatUebermitteln() {
  "use server";

  const actionSession = await sessionErfordern();

  if (
    actionSession.organisationId !== organisationId ||
    actionSession.rolle !== "MITARBEITER"
  ) {
    notFound();
  }

  const actionJetzt = new Date();

  const actionBeginnVormonat = new Date(
    actionJetzt.getFullYear(),
    actionJetzt.getMonth() - 1,
    1
  );

  const actionEndeVormonat = new Date(
    actionJetzt.getFullYear(),
    actionJetzt.getMonth(),
    1
  );

  const offeneEinsaetzeVormonat = await prisma.einsatz.count({
  where: {
    benutzerId: Number(actionSession.benutzerId),
    datum: {
      gte: actionBeginnVormonat,
      lt: actionEndeVormonat,
    },
    status: {
  in: ["OFFEN", "AENDERUNG_GEMELDET"],
},
    benutzer: {
      organisationId,
    },
    klient: {
      organisationId,
    },
  },
});

if (offeneEinsaetzeVormonat > 0) {
  redirect(`/organisationen/${organisationId}/einsaetze/meine`);
}

  await prisma.einsatz.updateMany({
    where: {
      benutzerId: Number(actionSession.benutzerId),
      datum: {
        gte: actionBeginnVormonat,
        lt: actionEndeVormonat,
      },
      status: "BESTAETIGT",
      benutzer: {
        organisationId,
      },
      klient: {
        organisationId,
      },
    },
    data: {
      status: "UEBERMITTELT",
    },
  });

  redirect(`/organisationen/${organisationId}/einsaetze/meine`);
}

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold text-slate-900">
          Meine Einsätze
        </h1>
        <p className="mt-2 text-slate-600">
          Meine geplanten Einsätze
        </p>

        <a
          href={`/organisationen/${organisationId}`}
          className="mt-4 inline-block rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900"
        >
          Zurück zum Hauptmenü
        </a>

{vormonatHatOffeneEinsaetze ? (
  <p className="mt-6 rounded-lg bg-amber-50 p-4 text-sm font-semibold text-amber-800">
    Der Vormonat kann noch nicht übermittelt werden. Bitte zuerst alle offenen
    Einsätze bestätigen und gemeldete Änderungen klären.
  </p>
) : vormonatHatBestaetigteEinsaetze ? (
  <form action={vormonatUebermitteln} className="mt-6">
    <button
      type="submit"
      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
    >
      Vormonat übermitteln
    </button>
  </form>
) : (
  <p className="mt-6 rounded-lg bg-green-50 p-4 text-sm font-semibold text-green-800">
    Der Vormonat wurde bereits vollständig übermittelt.
  </p>
)}


<section className="mt-8 rounded-xl bg-white p-6 shadow">
  <div className="mb-5 flex flex-wrap gap-3">
    <a
      href={`/organisationen/${organisationId}/einsaetze/meine?ansicht=woche`}
      className={`rounded-lg px-4 py-2 text-sm font-semibold ${
        !monatsansicht ? "bg-orange-500 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
      }`}
    >
      Wochenansicht
    </a>
    <a
      href={`/organisationen/${organisationId}/einsaetze/meine?ansicht=monat`}
      className={`rounded-lg px-4 py-2 text-sm font-semibold ${
        monatsansicht ? "bg-orange-500 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
      }`}
    >
      Monatsansicht
    </a>
  </div>

  <div className="mb-4 flex items-center justify-between">
  <h2 className="text-2xl font-bold text-slate-900">
    {monatsansicht ? "Mein Monatsplan" : "Mein Wochenplan"}
  </h2>

{!monatsansicht && (
  <div className="flex items-center gap-3">
        {new Date(
      wochenDatum.getFullYear(),
      wochenDatum.getMonth(),
      wochenDatum.getDate() - 7,
      12
    ) >= fruehesterWochenTag && (
      <a
        href={`?ansicht=woche&woche=${new Date(
          wochenDatum.getFullYear(),
          wochenDatum.getMonth(),
          wochenDatum.getDate() - 7,
          12
        ).toLocaleDateString("sv-SE")}`}
        className="rounded bg-slate-100 px-3 py-2"
      >
        ‹
      </a>
    )}

    <span>KW {kalenderWoche} · {kwJahr}</span>

    <a
      href={`?ansicht=woche&woche=${new Date(
        wochenDatum.getFullYear(),
        wochenDatum.getMonth(),
        wochenDatum.getDate() + 7,
        12
      ).toLocaleDateString("sv-SE")}`}
      className="rounded bg-slate-100 px-3 py-2"
    >
      ›
    </a>
  </div>
)}

  {monatsansicht && (
    <div className="flex items-center gap-3">
      {(kalenderMonat.getFullYear() * 12 + kalenderMonat.getMonth()) >
        (heute.getFullYear() * 12 + heute.getMonth() - 1) && (
        <a
          href={`?ansicht=monat&monat=${kalenderMonat.getMonth() === 0 ? kalenderMonat.getFullYear() - 1 : kalenderMonat.getFullYear()}-${String(kalenderMonat.getMonth() === 0 ? 12 : kalenderMonat.getMonth()).padStart(2, "0")}`}
          className="rounded bg-slate-100 px-3 py-2"
        >
          ‹
        </a>
      )}
      <span>
        {kalenderMonat.toLocaleDateString("de-DE", {
          month: "long",
          year: "numeric",
        })}
      </span>
      <a
        href={`?ansicht=monat&monat=${kalenderMonat.getMonth() === 11 ? kalenderMonat.getFullYear() + 1 : kalenderMonat.getFullYear()}-${String(kalenderMonat.getMonth() === 11 ? 1 : kalenderMonat.getMonth() + 2).padStart(2, "0")}`}
        className="rounded bg-slate-100 px-3 py-2"
      >
        ›
      </a>
    </div>
  )}
</div>

  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-7">
    {Array.from({ length: monatsansicht ? new Date(kalenderMonat.getFullYear(), kalenderMonat.getMonth() + 1, 0).getDate() : 7 }, (_, index) => {
      let tag: Date;
      if (monatsansicht) {
        tag = new Date(kalenderMonat.getFullYear(), kalenderMonat.getMonth(), index + 1);
      } else {
        const montag = new Date(wochenDatum);
        montag.setHours(0, 0, 0, 0);
        montag.setDate(montag.getDate() - ((montag.getDay() + 6) % 7));
        tag = new Date(montag);
        tag.setDate(montag.getDate() + index);
      }

      const tagesEinsaetze = einsaetze.filter(
        (einsatz) => einsatz.datum.toDateString() === tag.toDateString()
      );

      return (
        <div key={index} className="rounded-lg bg-slate-50 p-3">
          <p className="mb-3 font-bold text-slate-800">
            {tag.toLocaleDateString("de-DE", {
              weekday: "short",
              day: "2-digit",
              month: "2-digit",
            })}
          </p>

          {tagesEinsaetze.length === 0 ? (
            <p className="text-xs text-slate-400">Frei</p>
          ) : (
            tagesEinsaetze.map((einsatz) => (
              <div
                key={einsatz.id}
                className={`mb-2 rounded-lg p-2 text-xs ${
                  einsatz.status === "BESTAETIGT"
                    ? "bg-green-100 text-green-900"
                    : einsatz.status === "AENDERUNG_GEMELDET"
                      ? "bg-amber-100 text-amber-900"
                      : "bg-blue-100 text-blue-900"
                }`}
              >
                <p className="font-bold">
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
                  {einsatz.klient.vorname} {einsatz.klient.nachname}
                </p>
              </div>
            ))
          )}
        </div>
      );
    })}
  </div>
</section>
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-slate-900">
            Kommende Einsätze
          </h2>

          {kommendeEinsaetze.length === 0 ? (
            <div className="mt-4 rounded-xl bg-white p-6 shadow">
              <p className="text-slate-500">
                Keine kommenden Einsätze vorhanden.
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {kommendeEinsaetze.map((einsatz) => (
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
                    Klient: {einsatz.klient.vorname}{" "}
                    {einsatz.klient.nachname}
                  </p>

{einsatz.kilometer && (
  <p className="mt-1 text-sm text-slate-600">
    Kilometer: {einsatz.kilometer.toString().replace(".", ",")} km
  </p>
)}

{einsatz.anfahrtspauschale && (
  <p className="mt-1 text-sm text-slate-600">
    Anfahrtspauschale: 5,50 €
  </p>
)}
                  <p className="mt-2 text-sm font-semibold text-slate-700">
                    Status: {einsatz.status}
                  </p>

                 {einsatz.bestaetigtAm && (
  <p className="mt-1 text-xs text-slate-500">
    Bestätigt am{" "}
    {einsatz.bestaetigtAm.toLocaleDateString("de-DE")} um{" "}
    {einsatz.bestaetigtAm.toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
    })}
  </p>
)} 

{einsatz.status === "OFFEN" && einsatz.startzeit <= jetzt && (
  <form action={einsatzBestaetigen} className="mt-4">
    <input
      type="hidden"
      name="einsatzId"
      value={einsatz.id}
    />

<EinsatzBestaetigenButton
  hatUnterschrift={Boolean(einsatz.unterschrift)}
/>
  </form>
)}

{(einsatz.status === "OFFEN" || einsatz.status === "BESTAETIGT") && (
  <a
    href={`/organisationen/${organisationId}/einsaetze/meine/${einsatz.id}/aenderung`}
    className="mt-2 inline-block rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white"
  >
    Änderung melden
  </a>
)}
{(einsatz.status === "OFFEN" || einsatz.status === "BESTAETIGT") && (
  einsatz.unterschrift ? (
    <span className="mt-2 inline-block rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white">
      ✓ Unterschrift vorhanden
    </span>
  ) : (
    <a
      href={`/organisationen/${organisationId}/einsaetze/meine/${einsatz.id}/unterschrift`}
      className="mt-2 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
    >
      Unterschrift erfassen
    </a>
  )
)}
                </div>
              ))}
            </div>
          )}

<section className="mt-12 rounded-xl bg-white p-6 shadow">
  <h2 className="text-2xl font-bold text-slate-900">
    Fehlende Unterschriften
  </h2>

  <p className="mt-2 text-sm text-slate-600">
    Hier werden vergangene Einsätze angezeigt, für die noch
    eine Unterschrift der betreuten Person fehlt.
  </p>

  <p className="mt-4 text-sm font-semibold text-slate-700">
    Anzahl: {einsaetzeOhneUnterschrift.length}
  </p>

  <div className="mt-4 space-y-3">
  {einsaetzeOhneUnterschrift.map((einsatz) => (
    <div
      key={einsatz.id}
      className="rounded-lg border border-amber-200 bg-amber-50 p-4"
    >
      <p className="font-semibold text-slate-900">
        Einsatz-ID: {einsatz.id}
      </p>

      <p className="text-sm text-slate-700">
        {einsatz.datum.toLocaleDateString("de-DE")} ·{" "}
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

      <p className="text-sm text-slate-700">
        Klient: {einsatz.klient.vorname} {einsatz.klient.nachname}
      </p>

      <p className="text-sm text-slate-700">
        Status: {einsatz.status}
      </p>
      {einsatz.id === 15 &&
  einsatz.status === "GEPRUEFT" &&
  !einsatz.unterschrift &&
  !einsatz.unterschriebenAm &&
  einsatz.nachunterschriftFreigegebenAm !== null &&
  einsatz.nachunterschriftFreigegebenVonId !== null &&
  Boolean(einsatz.nachunterschriftFreigabeGrund) && (
    <a
      href={`/organisationen/${organisationId}/einsaetze/meine/${einsatz.id}/unterschrift`}
      className="mt-3 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
    >
      Nachträgliche Unterschrift erfassen
    </a>
  )}
    </div>
  ))}
</div>

</section>

<h2 className="mt-12 text-2xl font-bold text-slate-900">
  Vergangene Einsätze
</h2>

          {vergangeneEinsaetze.length === 0 ? (
            <div className="mt-4 rounded-xl bg-white p-6 shadow">
              <p className="text-slate-500">
                Keine vergangenen Einsätze vorhanden.
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {vergangeneEinsaetze.map((einsatz) => (
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
                    Klient: {einsatz.klient.vorname}{" "}
                    {einsatz.klient.nachname}
                  </p>

                  <p className="mt-2 text-sm font-semibold text-slate-700">
                    Status: {einsatz.status}
                  </p>

{einsatz.status === "OFFEN" && (
  <form action={einsatzBestaetigen} className="mt-4">
    <input
      type="hidden"
      name="einsatzId"
      value={einsatz.id}
    />

    <EinsatzBestaetigenButton
      hatUnterschrift={Boolean(einsatz.unterschrift)}
    />
  </form>
)}
{einsatz.ausfallGemeldet ? (
  <form action={ausfallZurueckziehen} className="mt-2">
    <input
      type="hidden"
      name="einsatzId"
      value={einsatz.id}
    />
    <button
      type="submit"
      className="inline-block rounded-lg bg-slate-600 px-4 py-2 text-sm font-semibold text-white"
    >
      Ausfall zurückziehen
    </button>
  </form>
) : (
  <>
{(einsatz.status === "OFFEN" ||
  einsatz.status === "BESTAETIGT" ||
  einsatz.status === "AENDERUNG_GEMELDET") && (
      <div>
        <a
          href={`/organisationen/${organisationId}/einsaetze/meine/${einsatz.id}/aenderung`}
          className="mt-2 inline-block rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white"
        >
          Änderung melden
        </a>

        <form action={ausfallMelden} className="inline">
          <input
            type="hidden"
            name="einsatzId"
            value={einsatz.id}
          />
          <AusfallMeldenButton />
        </form>

        {einsatz.unterschrift ? (
          <span className="mt-2 ml-2 inline-block rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white">
            ✓ Unterschrift vorhanden
          </span>
        ) : (
          <a
            href={`/organisationen/${organisationId}/einsaetze/meine/${einsatz.id}/unterschrift`}
            className="mt-2 ml-2 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Unterschrift erfassen
          </a>
        )}
      </div>
    )}
  </>
)}

{einsatz.id === 15 &&
  einsatz.status === "GEPRUEFT" &&
  !einsatz.unterschrift &&
  !einsatz.unterschriebenAm &&
  einsatz.nachunterschriftFreigegebenAm !== null &&
  einsatz.nachunterschriftFreigegebenVonId !== null &&
  Boolean(einsatz.nachunterschriftFreigabeGrund) && (
    <a
      href={`/organisationen/${organisationId}/einsaetze/meine/${einsatz.id}/unterschrift`}
      className="mt-2 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
    >
      Nachträgliche Unterschrift erfassen
    </a>
  )}

{einsatz.bestaetigtAm && (
  <p className="mt-1 text-xs text-slate-500">
    Bestätigt am{" "}
    {einsatz.bestaetigtAm.toLocaleDateString("de-DE")} um{" "}
    {einsatz.bestaetigtAm.toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
    })}
  </p>
)}

{einsatz.bestaetigtAm && (
  <p className="mt-1 text-xs text-slate-500">
    Bestätigt am{" "}
    {einsatz.bestaetigtAm.toLocaleDateString("de-DE")} um{" "}
    {einsatz.bestaetigtAm.toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
    })}
  </p>
)}
                </div>
         ))}
        </div>
        )}
      </div>
      </div>
    </main>
  );
}