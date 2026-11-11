/**
 * UN/EDIFACT-Nutzdatengenerator für dakota.le (§ 302 SGB V, TA Version 20).
 * Erzeugt SLGA (Gesamtaufstellung) + SLLA:C (Häusliche Krankenpflege).
 */

export type EdifactLeistungsart =
  | "ENTLASTUNGSBETRAG_45B"
  | "PFLEGESACHLEISTUNG_36"
  | "VERHINDERUNGSPFLEGE_39"
  | "SELBSTZAHLER"
  | "UMWANDLUNGSANSPRUCH_45A";

export type EdifactEinsatz = {
  id: number;
  datum: Date;
  startzeit: Date;
  endzeit: Date;
  betrag: number;
  kilometer: number | null;
  anfahrtspauschale: boolean;
  beschaeftigtennummer: string | null;
};

export type EdifactRechnung = {
  rechnungsnummer: string;
  rechnungsdatum: Date;
  leistungsmonat: Date;
  leistungsart: EdifactLeistungsart;
  gesamtbetrag: number;
  klient: {
    vorname: string;
    nachname: string;
    geburtsdatum: Date | null;
    strasse: string | null;
    hausnummer: string | null;
    plz: string | null;
    ort: string | null;
    versichertennummer: string | null;
    kassenIk: string;
    pflegekasse: string | null;
  };
  einsaetze: EdifactEinsatz[];
};

export type EdifactOrganisation = {
  name: string;
  ikNummer: string;
  steuernummer: string | null;
  ustIdNr: string | null;
};

export type EdifactExportErgebnis = {
  inhalt: string;
  dateiname: string;
  rechnungsAnzahl: number;
  warnungen: string[];
};

const SEGMENT_ENDE = "'";
const ELEMENT = "+";
const KOMPONENTE = ":";

/** Abrechnungscode + Tarifkennzeichen (Leistungserbringergruppe) je Leistungsart. */
function leistungserbringergruppe(art: EdifactLeistungsart): string {
  // Abrechnungscode 61 = Häusliche Krankenpflege; Tarifkennzeichen organisations-/vertragsabhängig.
  switch (art) {
    case "PFLEGESACHLEISTUNG_36":
      return `61${KOMPONENTE}00000`;
    case "VERHINDERUNGSPFLEGE_39":
      return `61${KOMPONENTE}00001`;
    case "UMWANDLUNGSANSPRUCH_45A":
      return `61${KOMPONENTE}00002`;
    case "ENTLASTUNGSBETRAG_45B":
      return `61${KOMPONENTE}00003`;
    default:
      return `61${KOMPONENTE}00099`;
  }
}

function positionsnummer(art: EdifactLeistungsart): string {
  switch (art) {
    case "PFLEGESACHLEISTUNG_36":
      return "71100";
    case "VERHINDERUNGSPFLEGE_39":
      return "71110";
    case "UMWANDLUNGSANSPRUCH_45A":
      return "71120";
    case "ENTLASTUNGSBETRAG_45B":
      return "71130";
    default:
      return "71199";
  }
}

function escapeEdifact(wert: string): string {
  return wert.replace(/([:?+'])/g, "?$1");
}

function nurZiffern(wert: string, laenge?: number): string {
  const ziffern = wert.replace(/\D/g, "");
  if (laenge === undefined) return ziffern;
  return ziffern.slice(0, laenge).padStart(laenge, "0");
}

function ikNormalisieren(ik: string): string {
  const z = nurZiffern(ik, 9);
  if (z.length !== 9) {
    throw new Error(`Ungültiges Institutionskennzeichen: ${ik}`);
  }
  return z;
}

function datumJjJjMmTt(datum: Date): string {
  const teile = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(datum);
  const y = teile.find((t) => t.type === "year")!.value;
  const m = teile.find((t) => t.type === "month")!.value;
  const d = teile.find((t) => t.type === "day")!.value;
  return `${y}${m}${d}`;
}

function uhrzeitHhMm(datum: Date): string {
  const teile = new Intl.DateTimeFormat("de-DE", {
    timeZone: "Europe/Berlin",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(datum);
  const h = teile.find((t) => t.type === "hour")!.value;
  const m = teile.find((t) => t.type === "minute")!.value;
  return `${h}${m}`;
}

function betragEdifact(wert: number): string {
  return wert.toFixed(2).replace(".", ",");
}

function rechnungsnummerSanitisieren(nummer: string): string {
  const bereinigt = nummer
    .replace(/[^A-Za-z0-9\-/]/g, "")
    .replace(/[-/]{2,}/g, "-")
    .replace(/^[-/]+|[-/]+$/g, "");
  return bereinigt.slice(0, 14) || "RE0001";
}

function beschaeftigtennummerOderErsatz(wert: string | null): string {
  if (!wert) return "999999999";
  const z = nurZiffern(wert, 9);
  return z.length === 9 ? z : "999999999";
}

function segment(...teile: string[]): string {
  return teile.join(ELEMENT) + SEGMENT_ENDE;
}

function nachricht(
  referenz: string,
  typ: "SLGA" | "SLLA",
  nutzsegmente: string[]
): string[] {
  const unh = segment(
    "UNH",
    referenz,
    `${typ}${KOMPONENTE}20${KOMPONENTE}0${KOMPONENTE}0`
  );
  const unt = segment(
    "UNT",
    String(nutzsegmente.length + 2),
    referenz
  );
  return [unh, ...nutzsegmente, unt];
}

function slgaSegmente(args: {
  leIk: string;
  kostenIk: string;
  kassenIk: string;
  absenderIk: string;
  rechnungsnummer: string;
  rechnungsdatum: Date;
  gesamtbetrag: number;
  organisationsname: string;
  steuernummer: string | null;
  ustIdNr: string | null;
}): string[] {
  const rn = rechnungsnummerSanitisieren(args.rechnungsnummer);
  const segmente = [
    segment(
      "FKT",
      "01",
      "",
      args.leIk,
      args.kostenIk,
      args.kassenIk,
      args.absenderIk
    ),
    segment(
      "REC",
      `${rn}${KOMPONENTE}0`,
      datumJjJjMmTt(args.rechnungsdatum),
      "1"
    ),
  ];

  const steuer = (args.ustIdNr || args.steuernummer || "").trim();
  if (steuer) {
    segmente.push(segment("UST", escapeEdifact(steuer.slice(0, 20)), "J"));
  }

  const betrag = betragEdifact(args.gesamtbetrag);
  // Summenstatus 00 = Gesamtsumme, 00-Zuzahlung hier 0
  segmente.push(segment("GES", "00", betrag, betrag, "0,00"));
  segmente.push(segment("GES", "11", betrag, betrag, "0,00"));
  segmente.push(
    segment("NAM", escapeEdifact(args.organisationsname.slice(0, 70)))
  );

  return segmente;
}

function sllaSegmente(args: {
  leIk: string;
  kostenIk: string;
  kassenIk: string;
  rechnungsnummer: string;
  rechnungsdatum: Date;
  rechnung: EdifactRechnung;
}): string[] {
  const rn = rechnungsnummerSanitisieren(args.rechnungsnummer);
  const k = args.rechnung.klient;
  const segmente: string[] = [
    segment("FKT", "01", "", args.leIk, args.kostenIk, args.kassenIk),
    segment(
      "REC",
      `${rn}${KOMPONENTE}0`,
      datumJjJjMmTt(args.rechnungsdatum),
      "1"
    ),
    segment(
      "INV",
      escapeEdifact((k.versichertennummer || "").slice(0, 12)),
      "",
      "",
      String(args.rechnung.rechnungsnummer.replace(/\W/g, "").slice(-10) || "1")
    ),
    segment(
      "NAD",
      escapeEdifact(k.nachname.slice(0, 47)),
      escapeEdifact(k.vorname.slice(0, 30)),
      k.geburtsdatum ? datumJjJjMmTt(k.geburtsdatum) : "00000000",
      escapeEdifact(
        [k.strasse, k.hausnummer].filter(Boolean).join(" ").slice(0, 30)
      ),
      escapeEdifact((k.plz || "").slice(0, 7)),
      escapeEdifact((k.ort || "").slice(0, 25))
    ),
  ];

  let fallSumme = 0;

  for (const einsatz of args.rechnung.einsaetze) {
    const dauerMin = Math.max(
      1,
      Math.round(
        (einsatz.endzeit.getTime() - einsatz.startzeit.getTime()) / 60_000
      )
    );
    fallSumme += einsatz.betrag;

    segmente.push(
      segment(
        "ESK",
        datumJjJjMmTt(einsatz.datum),
        uhrzeitHhMm(einsatz.startzeit),
        uhrzeitHhMm(einsatz.endzeit),
        String(dauerMin)
      )
    );

    segmente.push(
      segment(
        "EHK",
        leistungserbringergruppe(args.rechnung.leistungsart),
        positionsnummer(args.rechnung.leistungsart),
        "1,00",
        betragEdifact(einsatz.betrag),
        einsatz.kilometer != null
          ? String(Math.round(Number(einsatz.kilometer)))
          : "",
        beschaeftigtennummerOderErsatz(einsatz.beschaeftigtennummer)
      )
    );
  }

  segmente.push(
    segment(
      "ZHK",
      "999999999",
      "999999999",
      datumJjJjMmTt(args.rechnung.leistungsmonat),
      "00"
    )
  );
  segmente.push(
    segment(
      "SKZ",
      "1",
      datumJjJjMmTt(args.rechnung.leistungsmonat),
      "999999"
    )
  );
  segmente.push(segment("BES", betragEdifact(fallSumme)));

  return segmente;
}

/**
 * Erzeugt eine UN/EDIFACT-Nutzdatendatei (UNB…UNZ) für dakota.le.
 * Rechnungen werden je Kostenträger-IK (kassenIk) gruppiert.
 */
export function erzeugeDakotaNutzdatendatei(
  organisation: EdifactOrganisation,
  rechnungen: EdifactRechnung[]
): EdifactExportErgebnis {
  const warnungen: string[] = [];
  const leIk = ikNormalisieren(organisation.ikNummer);
  const jetzt = new Date();
  const datum = datumJjJjMmTt(jetzt).slice(2); // YYMMDD
  const uhr = uhrzeitHhMm(jetzt);
  const austauschRef = String(jetzt.getTime()).slice(-14);

  const nachKasse = new Map<string, EdifactRechnung[]>();
  for (const rechnung of rechnungen) {
    if (rechnung.leistungsart === "SELBSTZAHLER") {
      warnungen.push(
        `Rechnung ${rechnung.rechnungsnummer}: Selbstzahler übersprungen.`
      );
      continue;
    }
    if (!rechnung.klient.kassenIk?.trim()) {
      warnungen.push(
        `Rechnung ${rechnung.rechnungsnummer}: Kassen-IK fehlt – übersprungen.`
      );
      continue;
    }
    if (rechnung.einsaetze.length === 0) {
      warnungen.push(
        `Rechnung ${rechnung.rechnungsnummer}: Keine Einsätze – übersprungen.`
      );
      continue;
    }
    const ik = ikNormalisieren(rechnung.klient.kassenIk);
    const liste = nachKasse.get(ik) ?? [];
    liste.push(rechnung);
    nachKasse.set(ik, liste);
  }

  if (nachKasse.size === 0) {
    throw new Error(
      "Keine exportierbaren Rechnungen gefunden (Stammdaten oder Einsätze fehlen)."
    );
  }

  // Empfänger: erstes Kostenträger-IK (dakota.le ordnet Annahmestellen später zu)
  const erstesKostenIk = [...nachKasse.keys()][0];

  const zeilen: string[] = [`UNA:+.? '`];

  zeilen.push(
    segment(
      "UNB",
      `UNOC${KOMPONENTE}3`,
      leIk,
      erstesKostenIk,
      `${datum}${KOMPONENTE}${uhr}`,
      austauschRef,
      "",
      "SLGA",
      "",
      "1"
    )
  );

  let nachrichtenZaehler = 0;
  let exportierteRechnungen = 0;

  for (const [kostenIk, kassenRechnungen] of nachKasse) {
    for (const rechnung of kassenRechnungen) {
      const kassenIk = ikNormalisieren(rechnung.klient.kassenIk);
      nachrichtenZaehler += 1;
      const slgaRef = String(nachrichtenZaehler).padStart(5, "0");
      zeilen.push(
        ...nachricht(
          slgaRef,
          "SLGA",
          slgaSegmente({
            leIk,
            kostenIk,
            kassenIk,
            absenderIk: leIk,
            rechnungsnummer: rechnung.rechnungsnummer,
            rechnungsdatum: rechnung.rechnungsdatum,
            gesamtbetrag: rechnung.gesamtbetrag,
            organisationsname: organisation.name,
            steuernummer: organisation.steuernummer,
            ustIdNr: organisation.ustIdNr,
          })
        )
      );

      nachrichtenZaehler += 1;
      const sllaRef = String(nachrichtenZaehler).padStart(5, "0");
      zeilen.push(
        ...nachricht(
          sllaRef,
          "SLLA",
          sllaSegmente({
            leIk,
            kostenIk,
            kassenIk,
            rechnungsnummer: rechnung.rechnungsnummer,
            rechnungsdatum: rechnung.rechnungsdatum,
            rechnung,
          })
        )
      );

      exportierteRechnungen += 1;
    }
  }

  zeilen.push(
    segment("UNZ", String(nachrichtenZaehler), austauschRef)
  );

  const yyyymm = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
  })
    .format(jetzt)
    .replace("-", "");

  return {
    inhalt: zeilen.join("\r\n") + "\r\n",
    dateiname: `SLGA_${leIk}_${yyyymm}.txt`,
    rechnungsAnzahl: exportierteRechnungen,
    warnungen,
  };
}
