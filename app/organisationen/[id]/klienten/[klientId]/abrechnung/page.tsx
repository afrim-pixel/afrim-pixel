import { prisma } from "../../../../../../lib/prisma";

import { istSonntagOderFeiertag } from "../../../../../../lib/sonntagsFeiertagszuschlag";

import { notFound } from "next/navigation";

import { sessionErfordern } from "../../../../../../lib/auth";

import { Leistungsart, Prisma } from "@/app/generated/prisma/client";

import Link from "next/link";

import { revalidatePath } from "next/cache";

export default async function AbrechnungPage({

  params,

  searchParams,

}: {

  params: Promise<{ id: string; klientId: string }>;

  searchParams: Promise<{ monat?: string; leistungsart?: string }>;

}) {

  const { id, klientId } = await params;

  const { monat, leistungsart } = await searchParams;

  if (
    leistungsart &&
    !Object.values(Leistungsart).some(
      (wert) => wert === leistungsart
    )
  ) {
    notFound();
  }

  const organisationId = Number(id);

  const klientIdNummer = Number(klientId);

  const session = await sessionErfordern();

if (

  session.rolle !== "ADMIN_INHABER" &&

  session.rolle !== "BUERO_ABRECHNUNG"

) {

notFound();

}

  if (session.organisationId !== organisationId) {

    notFound();

  }

const abrechnungsdatum = monat

  ? new Date(`${monat}-01T12:00:00`)

  : new Date();

const abrechnungsjahr = abrechnungsdatum.getFullYear();

const abrechnungsmonat = abrechnungsdatum.getMonth();

const vormonatDatum = new Date(abrechnungsjahr, abrechnungsmonat - 1, 1);

const vormonat = `${vormonatDatum.getFullYear()}-${String(

  vormonatDatum.getMonth() + 1

).padStart(2, "0")}`;

const naechsterMonatDatum = new Date(

  abrechnungsjahr,

  abrechnungsmonat + 1,

  1

);

const naechsterMonat = `${naechsterMonatDatum.getFullYear()}-${String(

  naechsterMonatDatum.getMonth() + 1

).padStart(2, "0")}`;

const aktuellerMonat = new Date();

const istAktuellerMonat =

  abrechnungsjahr === aktuellerMonat.getFullYear() &&

  abrechnungsmonat === aktuellerMonat.getMonth();

  const istZukuenftigerMonat =

  abrechnungsjahr > aktuellerMonat.getFullYear() ||

  (abrechnungsjahr === aktuellerMonat.getFullYear() &&

    abrechnungsmonat > aktuellerMonat.getMonth());

if (istZukuenftigerMonat) {

  notFound();

}

const klient = await prisma.klient.findFirst({

  where: {

    id: klientIdNummer,

    organisationId,

  },

include: {

  abrechnungsbuchungen: true,

  leistungsarten: true,

  einsaetze: {

    where: {

      status: "GEPRUEFT",

      ...(leistungsart ? { leistungsart: leistungsart as any } : {}),

    datum: {

  gte: new Date(abrechnungsjahr, abrechnungsmonat, 1),

  lt: new Date(abrechnungsjahr, abrechnungsmonat + 1, 1),

},

    },

    orderBy: {

      startzeit: "asc",

    },

  },

},

});

if (!klient) {

  notFound();

}

// Historische Buchungen unabhängig vom aktuellen Einsatzstatus anzeigen.
const monatsbuchungenAlle = klient.abrechnungsbuchungen.filter((buchung) =>
  buchung.datum >= new Date(abrechnungsjahr, abrechnungsmonat, 1) &&
  buchung.datum < new Date(abrechnungsjahr, abrechnungsmonat + 1, 1)
);
const gebuchteEinsaetze = await prisma.einsatz.findMany({
  where: { id: { in: monatsbuchungenAlle.map((buchung) => buchung.einsatzId).filter((id): id is number => id !== null) }, klientId: klientIdNummer },
});
const gebuchteEinsaetzeNachId = new Map(gebuchteEinsaetze.map((einsatz) => [einsatz.id, einsatz]));
const monatsbuchungen = monatsbuchungenAlle.filter((buchung) => {
  if (!leistungsart) return true;
  if (buchung.einsatzId === null) return false;
  return gebuchteEinsaetzeNachId.get(buchung.einsatzId)?.leistungsart === leistungsart;
});

const nochNichtAbgerechneteEinsaetze = klient.einsaetze.filter(

  (einsatz) =>

    (!leistungsart || einsatz.leistungsart === leistungsart) &&

    !klient.abrechnungsbuchungen.some(

      (buchung) => buchung.einsatzId === einsatz.id

    )

);

const abrechnungsmonatEnde = new Date(abrechnungsjahr, abrechnungsmonat + 1, 1);

const erstesHalbjahrEnde = new Date(abrechnungsjahr, 6, 1);

const bisherigeEinsaetze = await prisma.einsatz.findMany({

  where: {

    klientId: klientIdNummer,

    status: "GEPRUEFT",

    leistungsart: "ENTLASTUNGSBETRAG_45B",

    datum: {

gte: klient.leistungsbeginn

  ? new Date(

      Math.max(

        klient.leistungsbeginn.getTime(),

        new Date(abrechnungsjahr, 0, 1).getTime()

      )

    )

  : new Date(abrechnungsjahr, 0, 1),

        lt: abrechnungsmonatEnde,

},

  },

});

const einsaetzeErstesHalbjahr = await prisma.einsatz.findMany({

  where: {

    klientId: klientIdNummer,

    status: "GEPRUEFT",

    leistungsart: "ENTLASTUNGSBETRAG_45B",

   datum: {

  gte: klient.leistungsbeginn

    ? new Date(

        Math.max(

          klient.leistungsbeginn.getTime(),

          new Date(abrechnungsjahr, 0, 1).getTime()

        )

      )

    : new Date(abrechnungsjahr, 0, 1),

  lt:

    abrechnungsmonatEnde < erstesHalbjahrEnde

      ? abrechnungsmonatEnde

      : erstesHalbjahrEnde,

},

  },

});

const vorjahresEinsaetze = await prisma.einsatz.findMany({

  where: {

    klientId: klientIdNummer,

    status: "GEPRUEFT",

    leistungsart: "ENTLASTUNGSBETRAG_45B",

datum: {

  gte:

  klient.leistungsbeginn &&

  klient.leistungsbeginn.getFullYear() === abrechnungsjahr - 1

    ? klient.leistungsbeginn

    : new Date(abrechnungsjahr - 1, 0, 1),

  lt: new Date(abrechnungsjahr, 0, 1),

},

  },

});

const minutenErstesHalbjahr = einsaetzeErstesHalbjahr.reduce(

  (summe, einsatz) => {

    const dauer =

      (einsatz.endzeit.getTime() - einsatz.startzeit.getTime()) / 60000;

    return summe + dauer;

  },

  0

);

const arbeitskostenErstesHalbjahr =

  klient.stundensatz

    ? (minutenErstesHalbjahr / 60) * Number(klient.stundensatz)

    : 0;

const anfahrtspauschalenErstesHalbjahr = einsaetzeErstesHalbjahr.filter(

  (einsatz) => einsatz.anfahrtspauschale

).length;

const anfahrtskostenErstesHalbjahr = anfahrtspauschalenErstesHalbjahr * 5.5;

const sonntagsFeiertagskostenErstesHalbjahr =
  einsaetzeErstesHalbjahr.filter(
    (einsatz) =>
      einsatz.sonntagsFeiertagszuschlag &&
      istSonntagOderFeiertag(einsatz.datum)
  ).length * 9.9;

const gesamtbetragErstesHalbjahr =
  arbeitskostenErstesHalbjahr +
  anfahrtskostenErstesHalbjahr +
  sonntagsFeiertagskostenErstesHalbjahr;

const vorjahresMinuten = vorjahresEinsaetze.reduce((summe, einsatz) => {

  const dauer =

    (einsatz.endzeit.getTime() - einsatz.startzeit.getTime()) / 60000;

  return summe + dauer;

}, 0);

const vorjahresArbeitskosten =

  klient.stundensatz

    ? (vorjahresMinuten / 60) * Number(klient.stundensatz)

    : 0;

const vorjahresAnfahrtspauschalen = vorjahresEinsaetze.filter(

  (einsatz) => einsatz.anfahrtspauschale

).length;

const vorjahresAnfahrtskosten = vorjahresAnfahrtspauschalen * 5.5;

const vorjahresSonntagsFeiertagskosten =
  vorjahresEinsaetze.filter(
    (einsatz) =>
      einsatz.sonntagsFeiertagszuschlag &&
      istSonntagOderFeiertag(einsatz.datum)
  ).length * 9.9;

const vorjahresGesamtbetrag =
  vorjahresArbeitskosten +
  vorjahresAnfahrtskosten +
  vorjahresSonntagsFeiertagskosten;

const bisherigeMinuten = bisherigeEinsaetze.reduce((summe, einsatz) => {

  const dauer =

    (einsatz.endzeit.getTime() - einsatz.startzeit.getTime()) / 60000;

  return summe + dauer;

}, 0);

const bisherigeArbeitskosten =

  klient.stundensatz

    ? (bisherigeMinuten / 60) * Number(klient.stundensatz)

    : 0;

const bisherigeAnfahrtspauschalen = bisherigeEinsaetze.filter(

  (einsatz) => einsatz.anfahrtspauschale

).length;

const bisherigeAnfahrtskosten = bisherigeAnfahrtspauschalen * 5.5;

const bisherigeSonntagsFeiertagskosten =
  bisherigeEinsaetze.filter(
    (einsatz) =>
      einsatz.sonntagsFeiertagszuschlag &&
      istSonntagOderFeiertag(einsatz.datum)
  ).length * 9.9;

const bisherigerGesamtbetrag =
  bisherigeArbeitskosten +
  bisherigeAnfahrtskosten +
  bisherigeSonntagsFeiertagskosten;

const gesamtMinuten = nochNichtAbgerechneteEinsaetze.reduce((summe, einsatz) => {

  const dauer =

    (einsatz.endzeit.getTime() - einsatz.startzeit.getTime()) / 60000;

  return summe + dauer;

}, 0);

const arbeitskosten =

  klient.stundensatz

    ? (gesamtMinuten / 60) * Number(klient.stundensatz)

    : 0;

    const anfahrtspauschalen = nochNichtAbgerechneteEinsaetze.filter(

  (einsatz) => einsatz.anfahrtspauschale

).length;

const anfahrtskosten = anfahrtspauschalen * 5.5;

const anzahlSonntagsFeiertagszuschlaege =
  nochNichtAbgerechneteEinsaetze.filter(
    (einsatz) =>
      einsatz.sonntagsFeiertagszuschlag &&
      istSonntagOderFeiertag(einsatz.datum)
  ).length;

const sonntagsFeiertagskosten =
  anzahlSonntagsFeiertagszuschlaege * 9.9;

const gesamtbetrag =
  arbeitskosten + anfahrtskosten + sonntagsFeiertagskosten;

const abrechnungsmonatStart = new Date(abrechnungsjahr, abrechnungsmonat, 1);

const leistungsbeginnMonat = klient.leistungsbeginn

  ? new Date(

      klient.leistungsbeginn.getFullYear(),

      klient.leistungsbeginn.getMonth(),

      1

    )

  : null;

const leistungsbeginnJahr = leistungsbeginnMonat?.getFullYear() ?? null;

const istErstesLeistungsjahr = leistungsbeginnJahr === abrechnungsjahr;

const istErstesHalbjahr = abrechnungsmonat <= 5;

const vorjahresJahr = abrechnungsjahr - 1;

const anzahlVorjahresLeistungsmonate = leistungsbeginnMonat

  ? leistungsbeginnMonat.getFullYear() > vorjahresJahr

    ? 0

    : leistungsbeginnMonat.getFullYear() === vorjahresJahr

      ? 12 - leistungsbeginnMonat.getMonth()

      : 12

  : 0;

const vorjahresBudget45b = anzahlVorjahresLeistungsmonate * 131;

const vorjahresRest45b = Math.max(0, vorjahresBudget45b - vorjahresGesamtbetrag);

const nutzbarerVorjahresRest45b =

  !istErstesLeistungsjahr && istErstesHalbjahr ? vorjahresRest45b : 0;

  const verbrauchAktuellesJahrErstesHalbjahr = Math.max(

  0,

  gesamtbetragErstesHalbjahr - vorjahresRest45b

);

const verbrauchAbJuli = Math.max(

  0,

  bisherigerGesamtbetrag - gesamtbetragErstesHalbjahr

);

const startMonatAktuellesJahr = istErstesLeistungsjahr ? leistungsbeginnMonat?.getMonth() ?? 0 : 0;

const anzahlMonateAktuellesJahr =

  !leistungsbeginnMonat || abrechnungsmonatStart < leistungsbeginnMonat

    ? 0

    : abrechnungsmonat - startMonatAktuellesJahr + 1;

const bisherigesBudget45b =

  Math.max(0, anzahlMonateAktuellesJahr) * 131;

const verfuegbaresBudget45b = Math.max(

  0,

  istErstesHalbjahr

    ? bisherigesBudget45b +

        nutzbarerVorjahresRest45b -

        bisherigerGesamtbetrag

    : bisherigesBudget45b -

        verbrauchAktuellesJahrErstesHalbjahr -

        verbrauchAbJuli

);

const monatsbudget45b =

  leistungsbeginnMonat && abrechnungsmonatStart < leistungsbeginnMonat

    ? 0

    : 131;

const bestehendeRechnung = leistungsart ? await prisma.rechnung.findFirst({

  where: {

    klientId: klient.id,

    leistungsart: leistungsart as Leistungsart,

    leistungsmonat: abrechnungsmonatStart,

  },

}) : null;

async function rechnungsempfaengerSpeichern(formData: FormData) {
  "use server";

  const aktuelleSession = await sessionErfordern();

  if (
    aktuelleSession.rolle !== "ADMIN_INHABER" &&
    aktuelleSession.rolle !== "BUERO_ABRECHNUNG"
  ) {
    return;
  }

  if (aktuelleSession.organisationId !== organisationId) {
    return;
  }
const empfaenger = formData.get("rechnungsempfaenger");

if (empfaenger !== "KLIENT" && empfaenger !== "PFLEGEKASSE") {
  return;
}

const rechnungId = Number(formData.get("rechnungId"));

if (!Number.isSafeInteger(rechnungId) || rechnungId <= 0) {
  return;
}

const erlaubteRechnung = await prisma.rechnung.findFirst({
  where: {
    id: rechnungId,
    klientId: klientIdNummer,
    klient: {
      organisationId: aktuelleSession.organisationId,
    },
  },
});

if (!erlaubteRechnung) {
  return;
}

await prisma.rechnung.updateMany({
  where: {
    id: rechnungId,
    klientId: klientIdNummer,
    klient: {
      organisationId: aktuelleSession.organisationId,
    },
  },
  data: {
    rechnungsempfaenger: empfaenger,
  },
});

revalidatePath(
  `/organisationen/${organisationId}/klienten/${klientIdNummer}/abrechnung`
);
}

async function abrechnungErstellen(formData: FormData) {
  "use server";

  const empfaengerAuswahl = formData.get("rechnungsempfaenger");

const rechnungsempfaenger =
  empfaengerAuswahl === "PFLEGEKASSE"
    ? "PFLEGEKASSE"
    : "KLIENT";

  const aktuelleSession = await sessionErfordern();

  if (

    aktuelleSession.rolle !== "ADMIN_INHABER" &&

    aktuelleSession.rolle !== "BUERO_ABRECHNUNG"

  ) return;

  if (aktuelleSession.organisationId !== organisationId) return;

  if (!leistungsart) return;

  // Prisma-Objekte nicht aus der umgebenden Server Component übernehmen:

  // diese Action lädt die benötigten Daten bei Ausführung erneut.

  const abrechnungsKlient = await prisma.klient.findFirst({

    where: { id: klientIdNummer, organisationId },

    include: {

      abrechnungsbuchungen: true,

      einsaetze: {

        where: {

          status: "GEPRUEFT",

          leistungsart: leistungsart as Leistungsart,

          datum: {

            gte: new Date(abrechnungsjahr, abrechnungsmonat, 1),

            lt: new Date(abrechnungsjahr, abrechnungsmonat + 1, 1),

          },

        },

      },

    },

  });

  if (!abrechnungsKlient) return;

  const offeneEinsaetze = abrechnungsKlient.einsaetze.filter(

    (einsatz) => !abrechnungsKlient.abrechnungsbuchungen.some(

      (buchung) => buchung.einsatzId === einsatz.id

    )

  );

  if (offeneEinsaetze.length === 0) return;

  // Die bestehende Rechnungslogik bleibt erhalten; die Rechnung wird

  // nun ebenfalls innerhalb der Action frisch abgefragt.

  const vorhandeneRechnung = await prisma.rechnung.findFirst({

    where: {

      klientId: klientIdNummer,

      leistungsart: leistungsart as Leistungsart,

      leistungsmonat: new Date(abrechnungsjahr, abrechnungsmonat, 1),

    },

  });

  // Keine weiteren Buchungen an eine bereits vorhandene Monatsrechnung hängen.

  if (vorhandeneRechnung) return;

  const betraege = offeneEinsaetze.map((einsatz) => {

    const minuten =

      (einsatz.endzeit.getTime() - einsatz.startzeit.getTime()) / 60000;

const arbeitsbetrag =
  (minuten / 60) * Number(abrechnungsKlient.stundensatz ?? 0);

const anfahrt = einsatz.anfahrtspauschale ? 5.5 : 0;

const sonntagsFeiertagszuschlag =
  einsatz.sonntagsFeiertagszuschlag &&
  istSonntagOderFeiertag(einsatz.datum)
    ? 9.9
    : 0;

return {
  einsatz,
  betrag: arbeitsbetrag + anfahrt + sonntagsFeiertagszuschlag,
};

  });

  const rechnungsGesamtbetrag = betraege.reduce((summe, item) => summe + item.betrag, 0);

  const rechnungsnummer = `RE-${abrechnungsjahr}-${String(

    abrechnungsmonat + 1

  ).padStart(2, "0")}-${klientIdNummer}-${leistungsart}`;

  try {
await prisma.$transaction(async (tx) => {
  // 1. Rechnung zuerst erstellen
  const neueRechnung = await tx.rechnung.create({
    data: {
      rechnungsnummer,
      rechnungsdatum: new Date(),
      leistungsmonat: new Date(abrechnungsjahr, abrechnungsmonat, 1),
      leistungsart: leistungsart as Leistungsart,
      gesamtbetrag: rechnungsGesamtbetrag,
      klientId: klientIdNummer,
      rechnungsempfaenger,
    },
  });

  // 2. Abrechnungsbuchungen mit der Rechnung verknüpfen
  for (const { einsatz, betrag } of betraege) {
    await tx.abrechnungsbuchung.create({
      data: {
        datum: einsatz.datum,
        betrag,
        beschreibung: "Abrechnung geprüfter Einsatz",
        klientId: klientIdNummer,
        einsatzId: einsatz.id,
        rechnungId: neueRechnung.id,
      },
    });
  }
});

} catch (fehler) {
  if (
    fehler instanceof Prisma.PrismaClientKnownRequestError &&
    fehler.code === "P2002" &&
    Array.isArray(fehler.meta?.target) &&
    ["klientId", "leistungsmonat", "leistungsart"].every(
      (feld) => (fehler.meta?.target as string[]).includes(feld)
    )
  ) {
    return;
  }

  throw fehler;
}

  revalidatePath(

    `/organisationen/${organisationId}/klienten/${klientIdNummer}/abrechnung`

  );

}

return (

    <main className="min-h-screen bg-slate-100 p-8">

      <div className="mx-auto max-w-5xl">

        <h1 className="text-3xl font-bold text-slate-900">

          Abrechnung

        </h1>

        <p className="mt-2 text-slate-600">

  {klient.vorname} {klient.nachname}

</p>

<Link

  href={`/organisationen/${organisationId}`}

  className="mt-4 inline-block rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white"

>

  ← Zurück zum Hauptmenü

</Link>

<div className="mt-8 rounded-xl bg-white p-6 shadow">

  <h2 className="text-xl font-bold text-slate-900">

    Abrechnungsdaten

  </h2>

  <Link

href={`/organisationen/${organisationId}/klienten/${klientIdNummer}/abrechnung?monat=${vormonat}`}

  className="mt-2 inline-block text-sm font-medium text-blue-600"

>

  ← Vormonat

</Link>

{!istAktuellerMonat && (

  <Link

    href={`/organisationen/${organisationId}/klienten/${klientIdNummer}/abrechnung?monat=${naechsterMonat}`}

    className="ml-4 mt-2 inline-block text-sm font-medium text-blue-600"

  >

    Nächster Monat →

  </Link>

)}

<p className="mt-2 text-sm text-slate-700">

  Abrechnungsmonat:{" "}

  <strong>

    {abrechnungsdatum.toLocaleDateString("de-DE", {

      month: "long",

      year: "numeric",

    })}

  </strong>

</p>

  <p className="mt-2 text-sm text-slate-700">

  Leistungsart:{" "}

{leistungsart === "ENTLASTUNGSBETRAG_45B"

  ? "§ 45b SGB XI – Entlastungsbetrag"

  : leistungsart === "PFLEGESACHLEISTUNG_36"

  ? "§ 36 SGB XI – Pflegesachleistungen"

  : leistungsart === "VERHINDERUNGSPFLEGE_39"

  ? "§ 39 SGB XI – Verhinderungspflege"

  : leistungsart === "UMWANDLUNGSANSPRUCH_45A"

  ? "§ 45a SGB XI – Umwandlungsanspruch"

  : leistungsart === "SELBSTZAHLER"

  ? "Selbstzahler"

  : "Alle Leistungsarten"}

</p>

{leistungsart === "ENTLASTUNGSBETRAG_45B" &&

  klient.leistungsarten.some(

    (eintrag) => eintrag.leistungsart === "ENTLASTUNGSBETRAG_45B"

  ) && (

    <p className="mt-2 text-sm text-slate-700">

      Monatlicher Entlastungsbetrag:{" "}

      <strong>

        {monatsbudget45b.toFixed(2).replace(".", ",")} €

      </strong>

    </p>

  )}

{klient.leistungsbeginn && (

  <p className="mt-2 text-sm text-slate-700">

    Leistungsbeginn:{" "}

    <strong>

      {klient.leistungsbeginn.toLocaleDateString("de-DE")}

    </strong>

  </p>

)}

{klient.stundensatz && (

  <p className="mt-2 text-sm text-slate-700">

    Stundensatz:{" "}

    <strong>

      {Number(klient.stundensatz).toFixed(2).replace(".", ",")} €

    </strong>

  </p>

)}

<div className="mt-6">

  <h3 className="text-lg font-semibold text-slate-900">

    Geprüfte Einsätze

  </h3>

<div className="mt-6 rounded-lg bg-slate-50 p-4">

  <label

    htmlFor="leistungsart"

    className="block text-sm font-semibold text-slate-700"

  >

    Leistungsart für die Abrechnung auswählen

  </label>

  <form method="GET" className="mt-2 flex flex-wrap gap-3">

    <input

      type="hidden"

      name="monat"

      value={`${abrechnungsjahr}-${String(

        abrechnungsmonat + 1

      ).padStart(2, "0")}`}

    />

    <select

      id="leistungsart"

      name="leistungsart"

      defaultValue={leistungsart ?? ""}

      className="rounded-lg border border-slate-300 bg-white px-4 py-2"

    >

      <option value="">Alle Leistungsarten</option>

      <option value="ENTLASTUNGSBETRAG_45B">

        § 45b – Entlastungsbetrag

      </option>

      <option value="VERHINDERUNGSPFLEGE_39">

        § 39 – Verhinderungspflege

      </option>

      <option value="PFLEGESACHLEISTUNG_36">

        § 36 – Pflegesachleistungen

      </option>

      <option value="UMWANDLUNGSANSPRUCH_45A">

        § 45a – Umwandlungsanspruch

      </option>

      <option value="SELBSTZAHLER">

        Selbstzahler

      </option>

    </select>

    <button

      type="submit"

      className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white"

    >

      Anzeigen

    </button>

  </form>

</div>

  <p className="mt-2 text-sm text-slate-600">

    Gesamtzeit: {(gesamtMinuten / 60).toFixed(2).replace(".", ",")} Stunden

  </p>

<p className="mt-1 text-sm text-slate-600">

  Arbeitskosten: {arbeitskosten.toFixed(2).replace(".", ",")} €

</p>

<p className="mt-1 text-sm text-slate-600">
  Anfahrtskosten: {anfahrtskosten.toFixed(2).replace(".", ",")} €
</p>

<p className="mt-1 text-sm text-slate-600">
  Sonntags- und Feiertagszuschlag:{" "}
  {sonntagsFeiertagskosten.toFixed(2).replace(".", ",")} €
</p>

<p className="mt-2 text-sm font-semibold text-slate-900">

  Gesamtbetrag: {gesamtbetrag.toFixed(2).replace(".", ",")} €

</p>

{leistungsart === "ENTLASTUNGSBETRAG_45B" &&

  klient.leistungsarten.some(

    (eintrag) => eintrag.leistungsart === "ENTLASTUNGSBETRAG_45B"

  ) && (

  <p className="mt-1 text-sm text-slate-600">

    Verfügbares Guthaben §45b:{" "}

    {verfuegbaresBudget45b.toFixed(2).replace(".", ",")} €

  </p>

)}

<p className="mt-2 text-sm text-slate-600">

  Anzahl offener geprüfter Einsätze: {nochNichtAbgerechneteEinsaetze.length}

</p>

{!leistungsart && nochNichtAbgerechneteEinsaetze.length > 0 && (
  <p className="mt-3 text-sm text-slate-600">Zum Erstellen einer Rechnung bitte zuerst eine Leistungsart auswählen.</p>
)}
{leistungsart && nochNichtAbgerechneteEinsaetze.length > 0 && !bestehendeRechnung ? (

  <form action={abrechnungErstellen} className="mt-4">

  <label
  htmlFor="rechnungsempfaenger"
  className="mb-2 block text-sm font-semibold text-slate-700"
>
  Rechnungsempfänger auswählen
</label>

<select
  id="rechnungsempfaenger"
  name="rechnungsempfaenger"
  defaultValue="KLIENT"
  className="mb-4 block rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900"
>
  <option value="KLIENT">Klient</option>
  <option value="PFLEGEKASSE">Pflegekasse / Versicherung</option>
</select>

    <button

      type="submit"

      className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"

    >

      Rechnung erstellen

    </button>

  </form>

) : bestehendeRechnung ? (

<div className="mt-4 rounded-lg bg-green-50 p-4 text-sm text-green-700">

  <p className="font-semibold">

    ✓ Rechnung für diesen Monat wurde erstellt.

  </p>

  <p className="mt-2">
    Rechnungsnummer: <strong>{bestehendeRechnung.rechnungsnummer}</strong>
  </p>

<p className="mt-2">
  Rechnungsempfänger:{" "}
  <strong>
    {bestehendeRechnung.rechnungsempfaenger === "PFLEGEKASSE"
      ? "Pflegekasse / Versicherung"
      : "Klient"}
  </strong>
</p>
<form action={rechnungsempfaengerSpeichern} className="mt-4">

<label
  htmlFor="empfaenger-bestehende-rechnung"
  className="mt-4 block font-semibold"
>
  Rechnungsempfänger auswählen
</label>

<select
  id="empfaenger-bestehende-rechnung"
  name="rechnungsempfaenger"
  defaultValue={bestehendeRechnung.rechnungsempfaenger}
  className="mt-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900"
>
  <option value="KLIENT">Klient</option>
  <option value="PFLEGEKASSE">
    Pflegekasse / Versicherung
  </option>
</select>
<input
  type="hidden"
  name="rechnungId"
  value={bestehendeRechnung.id}
/>

<button
  type="submit"
  className="ml-3 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
>
  Rechnungsempfänger speichern
</button>
</form>

  <p>

    Gesamtbetrag:{" "}

    <strong>

      {Number(bestehendeRechnung.gesamtbetrag)

        .toFixed(2)

        .replace(".", ",")}{" "}

      €

    </strong>

  </p>

  <a

  href={`/organisationen/${organisationId}/klienten/${klient.id}/abrechnung/rechnung-pdf?rechnungId=${bestehendeRechnung.id}`}

  target="_blank"

  rel="noopener noreferrer"

  className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"

>

  Rechnung als PDF öffnen

</a>

</div>

) : null}

{nochNichtAbgerechneteEinsaetze.length === 0 ? (

  <p className="mt-4 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">

    Für diesen Monat sind keine offenen geprüften Einsätze vorhanden. Bereits gebuchte Einsätze stehen unten.

  </p>

) : (

  <div className="mt-6 overflow-hidden rounded-lg border border-slate-200">

    <table className="w-full text-left text-sm">

      <thead className="bg-slate-50 text-slate-700">

        <tr>

          <th className="px-4 py-3 font-semibold">Datum</th>

          <th className="px-4 py-3 font-semibold">Zeit</th>

          <th className="px-4 py-3 text-right font-semibold">Stunden</th>

          <th className="px-4 py-3 text-right font-semibold">Anfahrt</th>

          <th className="px-4 py-3 text-right font-semibold">Betrag</th>

        </tr>

      </thead>

      <tbody className="divide-y divide-slate-200">

        {nochNichtAbgerechneteEinsaetze.map((einsatz) => {

          const minuten =

            (einsatz.endzeit.getTime() - einsatz.startzeit.getTime()) /

            60000;

          const stunden = minuten / 60;

          const arbeitsbetrag = klient.stundensatz

            ? stunden * Number(klient.stundensatz)

            : 0;

          const anfahrt = einsatz.anfahrtspauschale ? 5.5 : 0;

          const sonntagsFeiertagszuschlag =
          einsatz.sonntagsFeiertagszuschlag &&
            istSonntagOderFeiertag(einsatz.datum)
              ? 9.9
              : 0;

          const einsatzbetrag =
          arbeitsbetrag + anfahrt + sonntagsFeiertagszuschlag;

          return (

            <tr key={einsatz.id} className="bg-white">

              <td className="px-4 py-3 text-slate-700">

                {einsatz.datum.toLocaleDateString("de-DE")}

              </td>

              <td className="px-4 py-3 text-slate-700">

                {einsatz.startzeit.toLocaleTimeString("de-DE", {

                  hour: "2-digit",

                  minute: "2-digit",

                })}

                {" – "}

                {einsatz.endzeit.toLocaleTimeString("de-DE", {

                  hour: "2-digit",

                  minute: "2-digit",

                })}

              </td>

              <td className="px-4 py-3 text-right text-slate-700">

                {stunden.toFixed(2).replace(".", ",")}

              </td>

              <td className="px-4 py-3 text-right text-slate-700">

                {anfahrt > 0

                  ? `${anfahrt.toFixed(2).replace(".", ",")} €`

                  : "–"}

              </td>

              <td className="px-4 py-3 text-right font-medium text-slate-900">

                {einsatzbetrag.toFixed(2).replace(".", ",")} €

              </td>

            </tr>

          );

        })}

      </tbody>

    </table>

  </div>

)}

</div>

<section className="mt-6">
  <h3 className="text-lg font-semibold text-slate-900">Bereits gebuchte Einsätze im ausgewählten Monat</h3>
  {monatsbuchungen.length === 0 ? (
    <p className="mt-2 text-sm text-slate-600">Keine Buchungen für diesen Monat und diese Leistungsart vorhanden.</p>
  ) : (
    <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50"><tr>
          <th className="px-3 py-2">Datum</th><th className="px-3 py-2">Einsatz-ID</th>
          <th className="px-3 py-2">Leistungsart</th><th className="px-3 py-2">Status</th>
          <th className="px-3 py-2 text-right">Gebucht</th>
        </tr></thead>
        <tbody>
          {monatsbuchungen.map((buchung) => {
            const einsatz = buchung.einsatzId === null ? undefined : gebuchteEinsaetzeNachId.get(buchung.einsatzId);
            return <tr key={buchung.id} className="border-t border-slate-200">
              <td className="px-3 py-2">{buchung.datum.toLocaleDateString("de-DE")}</td>
              <td className="px-3 py-2">{buchung.einsatzId}</td>
              <td className="px-3 py-2">{einsatz?.leistungsart ?? "Nicht zugeordnet"}</td>
              <td className="px-3 py-2">{einsatz?.status ?? "Einsatz nicht gefunden"}</td>
              <td className="px-3 py-2 text-right">{Number(buchung.betrag).toFixed(2).replace(".", ",")} €</td>
            </tr>;
          })}
        </tbody>
      </table>
    </div>
  )}
</section>


<div className="mt-6">

  <h3 className="text-lg font-semibold text-slate-900">



Bisherige Abrechnungsbuchungen (alle Monate)

  </h3>

{klient.abrechnungsbuchungen.length === 0 ? (

  <p className="mt-2 text-sm text-slate-600">

    Noch keine Abrechnungsbuchungen vorhanden.

  </p>

) : (

  <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">

    <table className="w-full text-left text-sm">

      <thead className="bg-slate-50 text-slate-700">

        <tr>

          <th className="px-4 py-3 font-semibold">Datum</th>

          <th className="px-4 py-3 font-semibold">Beschreibung</th>

          <th className="px-4 py-3 text-right font-semibold">Betrag</th>

        </tr>

      </thead>

      <tbody className="divide-y divide-slate-200">

        {klient.abrechnungsbuchungen.map((buchung) => (

          <tr key={buchung.id} className="bg-white">

            <td className="px-4 py-3 text-slate-700">

              {buchung.datum.toLocaleDateString("de-DE")}

            </td>

            <td className="px-4 py-3 text-slate-700">

              {buchung.beschreibung || "–"}

            </td>

            <td className="px-4 py-3 text-right font-medium text-slate-900">

              {Number(buchung.betrag).toFixed(2).replace(".", ",")} €

            </td>

          </tr>

        ))}

      </tbody>

    </table>

  </div>

)}

</div>

</div>

      </div>

    </main>

  );

}
