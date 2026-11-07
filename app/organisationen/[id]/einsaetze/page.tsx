import { prisma } from "../../../../lib/prisma";
import { notFound, redirect } from "next/navigation";
import { sessionErfordern } from "../../../../lib/auth";
import EinsatzForm from "./EinsatzForm";
import Link from "next/link";

export default async function EinsaetzePage({
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

  const mitarbeiter = await prisma.benutzer.findMany({
    where: {
      organisationId,
      aktiv: true,
      rolle: "MITARBEITER",
    },
    include: {
      klientZuweisungen: true,
    },
    orderBy: {
      nachname: "asc",
    },
  });

  const klienten = await prisma.klient.findMany({
    where: {
      organisationId,
      aktiv: true,
    },
    orderBy: {
      nachname: "asc",
    },
  });

  const einsaetze = await prisma.einsatz.findMany({
  where: {
    benutzer: {
      organisationId,
    },
    klient: {
      organisationId,
    },
  },
include: {
  benutzer: true,
  klient: true,
  aenderungen: {
    orderBy: {
      erstelltAm: "desc",
    },
  },
},
orderBy: [
  {
    datum: "asc",
  },
  {
    startzeit: "asc",
  },
],
});

const jetzt = new Date();

const kommendeEinsaetze = einsaetze.filter(
  (einsatz) => einsatz.endzeit >= jetzt
);

const vergangeneEinsaetze = einsaetze.filter(
  (einsatz) => einsatz.endzeit < jetzt
);

  async function einsatzErstellen(formData: FormData) {
    "use server";

    const actionSession = await sessionErfordern();

    if (
      actionSession.organisationId !== organisationId ||
      actionSession.rolle !== "ADMIN_INHABER"
    ) {
      notFound();
    }

    const benutzerId = Number(formData.get("benutzerId"));
    const klientId = Number(formData.get("klientId"));

    const datum = String(formData.get("datum") ?? "");
    const startzeit = String(formData.get("startzeit") ?? "");
    const endzeit = String(formData.get("endzeit") ?? "");
    const kilometer = String(formData.get("kilometer") ?? "");
    const anfahrtspauschale = formData.get("anfahrtspauschale") === "on";
const leistungsart = String(formData.get("leistungsart") ?? "") as
  | "ENTLASTUNGSBETRAG_45B"
  | "UMWANDLUNGSANSPRUCH_45A"
  | "PFLEGESACHLEISTUNG_36"
  | "VERHINDERUNGSPFLEGE_39"
  | "SELBSTZAHLER";
    if (
      !benutzerId ||
      !klientId ||
      !datum ||
      !startzeit ||
      !endzeit
    ) {
      return;
    }

    const actionMitarbeiter = await prisma.benutzer.findFirst({
      where: {
        id: benutzerId,
        organisationId,
        aktiv: true,
        rolle: "MITARBEITER",
      },
    });

    if (!actionMitarbeiter) {
      notFound();
    }

    const actionKlient = await prisma.klient.findFirst({
      where: {
        id: klientId,
        organisationId,
        aktiv: true,
      },
    });

    if (!actionKlient) {
      notFound();
    }

    const zuweisung = await prisma.klientZuweisung.findFirst({
      where: {
        benutzerId,
        klientId,
      },
    });

    if (!zuweisung) {
      return;
    }

    const startDatum = new Date(`${datum}T${startzeit}:00`);
    const endDatum = new Date(`${datum}T${endzeit}:00`);
    const datumWert = new Date(`${datum}T00:00:00`);

    if (
      Number.isNaN(startDatum.getTime()) ||
      Number.isNaN(endDatum.getTime()) ||
      Number.isNaN(datumWert.getTime()) ||
      endDatum <= startDatum
    ) {
      return;
    }

    await prisma.einsatz.create({
      data: {
        datum: datumWert,
        startzeit: startDatum,
        endzeit: endDatum,
        kilometer: kilometer
          ? Number(kilometer.replace(",", "."))
          : null,
        anfahrtspauschale,
        leistungsart,
        benutzerId,
        klientId,
      },
    });

    redirect(`/organisationen/${organisationId}/einsaetze`);
  }

  async function einsatzBestaetigen(formData: FormData) {
  "use server";

  const actionSession = await sessionErfordern();

  if (
    actionSession.organisationId !== organisationId ||
    actionSession.rolle !== "ADMIN_INHABER"
  ) {
    notFound();
  }

  const einsatzId = Number(formData.get("einsatzId"));
  const leistungsart = String(formData.get("leistungsart") ?? "");

  const einsatz = await prisma.einsatz.findFirst({
    where: {
      id: einsatzId,
      benutzer: {
        organisationId,
      },
      klient: {
        organisationId,
      },
      status: "OFFEN",
    },
  });

  if (!einsatz) {
    notFound();
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

  redirect(`/organisationen/${organisationId}/einsaetze`);
}
  
async function einsatzLoeschen(formData: FormData) {
  "use server";

  const actionSession = await sessionErfordern();

  if (
    actionSession.organisationId !== organisationId ||
    actionSession.rolle !== "ADMIN_INHABER"
  ) {
    notFound();
  }

  const einsatzId = Number(formData.get("einsatzId"));

  const einsatz = await prisma.einsatz.findFirst({
    where: {
      id: einsatzId,
      status: "OFFEN",
      benutzer: {
        organisationId,
      },
      klient: {
        organisationId,
      },
    },
  });

  if (!einsatz) {
    notFound();
  }

  await prisma.einsatz.delete({
    where: {
      id: einsatz.id,
    },
  });

  redirect(`/organisationen/${organisationId}/einsaetze`);
}

async function aenderungAlsGesehenMarkieren(formData: FormData) {
  "use server";

  const actionSession = await sessionErfordern();

  if (
    actionSession.organisationId !== organisationId ||
    actionSession.rolle !== "ADMIN_INHABER"
  ) {
    notFound();
  }

  const aenderungId = Number(formData.get("aenderungId"));

  if (!Number.isInteger(aenderungId) || aenderungId <= 0) {
    return;
  }

  await prisma.einsatzAenderung.updateMany({
    where: {
      id: aenderungId,
      gesehenAm: null,
      einsatz: {
        benutzer: { organisationId },
        klient: { organisationId },
      },
    },
    data: {
      gesehenAm: new Date(),
    },
  });

  redirect(`/organisationen/${organisationId}/einsaetze`);
}
async function aenderungAblehnen(formData: FormData) {
  "use server";

  const actionSession = await sessionErfordern();

  if (
    actionSession.organisationId !== organisationId ||
    actionSession.rolle !== "ADMIN_INHABER"
  ) {
    notFound();
  }

  const einsatzId = Number(formData.get("einsatzId"));

  const einsatz = await prisma.einsatz.findFirst({
    where: {
      id: einsatzId,
      benutzer: {
        organisationId,
      },
      klient: {
        organisationId,
      },
      status: "AENDERUNG_GEMELDET",
    },
  });

  if (!einsatz) {
    notFound();
  }

  await prisma.einsatz.update({
    where: {
      id: einsatz.id,
    },
    data: {
      status: "BESTAETIGT",
      neuesDatum: null,
      neueStartzeit: null,
      neueEndzeit: null,
      aenderungsGrund: null,
    },
  });

  redirect(`/organisationen/${organisationId}/einsaetze`);
}

async function einsatzPruefen(formData: FormData) {
  "use server";

  const actionSession = await sessionErfordern();

  if (
    actionSession.organisationId !== organisationId ||
    actionSession.rolle !== "ADMIN_INHABER"
  ) {
    notFound();
  }

  const einsatzId = Number(formData.get("einsatzId"));
  const leistungsart = String(formData.get("leistungsart") ?? "");
  const erlaubteLeistungsarten = [
  "ENTLASTUNGSBETRAG_45B",
  "VERHINDERUNGSPFLEGE_39",
  "PFLEGESACHLEISTUNG_36",
  "UMWANDLUNGSANSPRUCH_45A",
  "SELBSTZAHLER",
];

if (!erlaubteLeistungsarten.includes(leistungsart)) {
  return;
}


  const einsatz = await prisma.einsatz.findFirst({
    where: {
      id: einsatzId,
      status: "UEBERMITTELT",
      benutzer: {
        organisationId,
      },
      klient: {
        organisationId,
      },
    },
  });

  if (!einsatz) {
    notFound();
  }

  await prisma.einsatz.update({
    where: {
      id: einsatz.id,
    },
data: {
  status: "GEPRUEFT",
  leistungsart: leistungsart as
    | "ENTLASTUNGSBETRAG_45B"
    | "VERHINDERUNGSPFLEGE_39"
    | "PFLEGESACHLEISTUNG_36"
    | "UMWANDLUNGSANSPRUCH_45A"
    | "SELBSTZAHLER",
},
  });

  redirect(`/organisationen/${organisationId}/einsaetze`);
}

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold text-slate-900">
          Einsatzplanung
        </h1>

        <p className="mt-2 text-slate-600">
          Einsätze verwalten
        </p>
        <Link
  href={`/organisationen/${organisationId}`}
  className="mt-4 inline-block rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white"
>
  ← Zurück zum Hauptmenü
</Link>
<a
  href={`/organisationen/${organisationId}/einsaetze/drucken`}
  target="_blank"
  rel="noopener noreferrer"
  className="ml-3 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
>
  🖨️ Dienstplan drucken
</a>
        <EinsatzForm
          mitarbeiter={mitarbeiter.map((eintrag) => ({
            id: eintrag.id,
            vorname: eintrag.vorname,
            nachname: eintrag.nachname,
          }))}
          klienten={klienten.map((klient) => ({
            id: klient.id,
            vorname: klient.vorname,
            nachname: klient.nachname,
          }))}
          zuweisungen={mitarbeiter.flatMap((eintrag) =>
            eintrag.klientZuweisungen.map((zuweisung) => ({
              benutzerId: zuweisung.benutzerId,
              klientId: zuweisung.klientId,
            }))
          )}
          action={einsatzErstellen}
        />
        <div className="mt-10">
  <h2 className="text-2xl font-bold text-slate-900">
Noch nicht angesehene Änderungen 
 </h2>
<p className="mt-2 text-sm text-slate-600">
  Ungesehene Änderungen: {
    einsaetze.flatMap((einsatz) => einsatz.aenderungen)
      .filter((aenderung) => aenderung.gesehenAm === null).length
  }
</p>
{einsaetze.flatMap((einsatz) =>
  einsatz.aenderungen
    .filter((aenderung) => aenderung.gesehenAm === null)
    .map((aenderung) => (
      <div
        key={aenderung.id}
        className="mt-4 rounded-xl border border-amber-200 bg-white p-5 shadow"
      >
        <p className="font-semibold text-slate-900">
          {einsatz.klient.vorname} {einsatz.klient.nachname}
        </p>

        <p className="mt-1 text-sm text-slate-600">
          Mitarbeiter: {einsatz.benutzer.vorname}{" "}
          {einsatz.benutzer.nachname}
        </p>

        <p className="mt-2 text-sm text-slate-700">
          Änderung vom:{" "}
          {aenderung.erstelltAm.toLocaleDateString("de-DE")}
        </p>

        <p className="mt-1 text-sm text-slate-700">
          Datum: {aenderung.neuesDatum?.toLocaleDateString("de-DE")}
        </p>

        <p className="mt-1 text-sm text-slate-700">
          Zeit:{" "}
          {aenderung.neueStartzeit?.toLocaleTimeString("de-DE", {
            hour: "2-digit",
            minute: "2-digit",
          })}
          {" – "}
          {aenderung.neueEndzeit?.toLocaleTimeString("de-DE", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>

        <p className="mt-1 text-sm text-slate-700">
          Grund: {aenderung.grund}
        </p>

        <form action={aenderungAlsGesehenMarkieren} className="mt-4">
          <input
            type="hidden"
            name="aenderungId"
            value={aenderung.id}
          />
          <button
            type="submit"
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Als gesehen markieren
          </button>
        </form>
      </div>
    ))
)}
</div>
        <div className="mt-10">
  <h2 className="text-2xl font-bold text-slate-900">
    Kommende Einsätze
  </h2>

  {einsaetze.filter(
    (einsatz) => einsatz.endzeit >= new Date()
  ).length === 0 ? (
    <p className="mt-4 text-slate-500">
      Keine kommenden Einsätze vorhanden.
    </p>
  ) : (
    <div className="mt-6 space-y-4">
      {einsaetze
        .filter((einsatz) => einsatz.endzeit >= new Date())
        .map((einsatz) => (
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

{einsatz.status === "OFFEN" && (
  <form action={einsatzBestaetigen} className="mt-3">
    <input
      type="hidden"
      name="einsatzId"
      value={einsatz.id}
    />

    <button
      type="submit"
      className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
    >
      Einsatz bestätigen
    </button>
  </form>
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
            {einsatz.status === "AENDERUNG_GEMELDET" && (
              <div className="mt-4 rounded-lg bg-amber-50 p-4">
                <p className="font-semibold text-amber-800">
                  Gemeldete Änderung
                </p>

                <p className="mt-2 text-sm text-slate-700">
                  Neues Datum:{" "}
                  {einsatz.neuesDatum?.toLocaleDateString("de-DE")}
                </p>

                <p className="mt-1 text-sm text-slate-700">
                  Neue Zeit:{" "}
                  {einsatz.neueStartzeit?.toLocaleTimeString("de-DE", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {" – "}
                  {einsatz.neueEndzeit?.toLocaleTimeString("de-DE", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>

                <p className="mt-1 text-sm text-slate-700">
                  Grund: {einsatz.aenderungsGrund}
                </p>

              </div>
            )}
                        {einsatz.aenderungen.length > 0 && (
  <div className="mt-4 border-t border-amber-200 pt-3">
    <p className="font-semibold text-slate-800">
      Änderungshistorie ({einsatz.aenderungen.length})
    </p>

    {einsatz.aenderungen.map((aenderung, index) => (
      <div key={aenderung.id} className="mt-2 text-sm text-slate-700">
        <p className="font-semibold">
          Änderung {einsatz.aenderungen.length - index}
        </p>
        <p>
          {aenderung.neuesDatum?.toLocaleDateString("de-DE")}{" "}
          {aenderung.neueStartzeit?.toLocaleTimeString("de-DE", {
            hour: "2-digit",
            minute: "2-digit",
          })}{" "}
          –{" "}
          {aenderung.neueEndzeit?.toLocaleTimeString("de-DE", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
        <p>Grund: {aenderung.grund}</p>
      </div>
    ))}
  </div>
)}

          </div>
        ))}
    </div>
  )}

  <h2 className="mt-12 text-2xl font-bold text-slate-900">
    Vergangene Einsätze
  </h2>

  {einsaetze.filter(
    (einsatz) => einsatz.endzeit < new Date()
  ).length === 0 ? (
    <p className="mt-4 text-slate-500">
      Keine vergangenen Einsätze vorhanden.
    </p>
  ) : (
    <div className="mt-6 space-y-4">
      {einsaetze
        .filter((einsatz) => einsatz.endzeit < new Date())
        .map((einsatz) => (
          <div
            key={einsatz.id}
            className="rounded-xl bg-white p-6 shadow"
          >
            <p className="text-lg font-bold text-slate-900">
              {einsatz.datum.toLocaleDateString("de-DE")}
            </p>

            <p className="mt-1 text-xs text-slate-500">
  Einsatz-ID: {einsatz.id}
</p>

<a
  href={`/organisationen/${id}/einsaetze/${einsatz.id}`}
  className="mt-1 inline-block text-sm text-blue-600 hover:underline"
>
  Details öffnen
</a>

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
  <p className="mt-1 text-sm text-slate-600">
  Leistungsart: {
    einsatz.leistungsart === "ENTLASTUNGSBETRAG_45B" ? "§ 45b – Entlastungsbetrag" :
    einsatz.leistungsart === "VERHINDERUNGSPFLEGE_39" ? "§ 39 – Verhinderungspflege" :
    einsatz.leistungsart === "PFLEGESACHLEISTUNG_36" ? "§ 36 – Pflegesachleistungen" :
    einsatz.leistungsart === "UMWANDLUNGSANSPRUCH_45A" ? "§ 45a – Umwandlungsanspruch" :
    einsatz.leistungsart === "SELBSTZAHLER" ? "Selbstzahler" :
    "Noch nicht zugeordnet"
  }
</p>
  {einsatz.status === "AENDERUNG_GEMELDET" && (
  <div className="mt-4 rounded-lg bg-amber-50 p-4">
    <p className="font-semibold text-amber-800">
      Gemeldete Änderung
    </p>

    <p className="mt-2 text-sm text-slate-700">
      Neues Datum:{" "}
      {einsatz.neuesDatum?.toLocaleDateString("de-DE")}
    </p>

    <p className="mt-1 text-sm text-slate-700">
      Neue Zeit:{" "}
      {einsatz.neueStartzeit?.toLocaleTimeString("de-DE", {
        hour: "2-digit",
        minute: "2-digit",
      })}
      {" – "}
      {einsatz.neueEndzeit?.toLocaleTimeString("de-DE", {
        hour: "2-digit",
        minute: "2-digit",
      })}
    </p>

    <p className="mt-1 text-sm text-slate-700">
      Grund: {einsatz.aenderungsGrund}
    </p>
  </div>
)}
{einsatz.aenderungen.length > 0 && (
  <div className="mt-4 border-t border-amber-200 pt-3">
    <p className="font-semibold text-slate-800">
      Änderungshistorie ({einsatz.aenderungen.length})
    </p>

    {einsatz.aenderungen.map((aenderung, index) => (
      <div key={aenderung.id} className="mt-2 text-sm text-slate-700">
        <p className="font-semibold">
          Änderung {einsatz.aenderungen.length - index}
        </p>

        <p>
          {aenderung.neuesDatum?.toLocaleDateString("de-DE")}{" "}
          {aenderung.neueStartzeit?.toLocaleTimeString("de-DE", {
            hour: "2-digit",
            minute: "2-digit",
          })}{" "}
          –{" "}
          {aenderung.neueEndzeit?.toLocaleTimeString("de-DE", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>

        <p>Grund: {aenderung.grund}</p>
      </div>
    ))}
  </div>
)}
  {einsatz.status === "UEBERMITTELT" && (
  <form action={einsatzPruefen} className="mt-3">
    <input
      type="hidden"
      name="einsatzId"
      value={einsatz.id}
    />
    <label className="mt-3 block text-sm font-semibold text-slate-700">
  Leistungsart für diesen Einsatz
</label>

<select
  name="leistungsart"
  defaultValue={einsatz.leistungsart ?? ""}
  required
  className="mt-2 w-full rounded-lg border border-slate-300 bg-white p-3 text-sm"
>
  <option value="">Bitte Leistungsart auswählen</option>
  <option value="ENTLASTUNGSBETRAG_45B">§ 45b – Entlastungsbetrag</option>
  <option value="VERHINDERUNGSPFLEGE_39">§ 39 – Verhinderungspflege</option>
  <option value="PFLEGESACHLEISTUNG_36">§ 36 – Pflegesachleistungen</option>
  <option value="UMWANDLUNGSANSPRUCH_45A">§ 45a – Umwandlungsanspruch</option>
  <option value="SELBSTZAHLER">Selbstzahler</option>
</select>

    <button
      type="submit"
      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
    >
      Einsatz prüfen
    </button>
  </form>
)}

  {einsatz.status === "OFFEN" && (
  <form action={einsatzBestaetigen} className="mt-3">
    <input
      type="hidden"
      name="einsatzId"
      value={einsatz.id}
    />

    <button
      type="submit"
      className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
    >
      Einsatz bestätigen
    </button>
  </form>
)}

{einsatz.status === "OFFEN" && (
  <form action={einsatzLoeschen} className="mt-2">
    <input
      type="hidden"
      name="einsatzId"
      value={einsatz.id}
    />

    <button
      type="submit"
      className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
    >
      Einsatz löschen
    </button>
  </form>
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