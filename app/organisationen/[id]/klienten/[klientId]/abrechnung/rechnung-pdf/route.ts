import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { prisma } from "@/lib/prisma";
import { sessionErfordern } from "@/lib/auth";
import { readFile } from "fs/promises";
import path from "path";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; klientId: string }> }
) {
  const { id, klientId } = await params;

  const organisationId = Number(id);
  const klientIdNummer = Number(klientId);
  const session = await sessionErfordern();

if (
  session.organisationId !== organisationId ||
  (session.rolle !== "ADMIN_INHABER" &&
    session.rolle !== "BUERO_ABRECHNUNG")
) {
  return new Response("Kein Zugriff", { status: 403 });
}
  const organisation = await prisma.organisation.findUnique({
  where: {
    id: organisationId,
  },
});

if (!organisation) {
  return new Response("Organisation nicht gefunden", { status: 404 });
}
 const klient = await prisma.klient.findFirst({
  where: {
    id: klientIdNummer,
    organisationId,
  },
});

if (!klient) {
  return new Response("Klient nicht gefunden", { status: 404 });
}
const url = new URL(request.url);
const rechnungId = Number(url.searchParams.get("rechnungId"));

if (!Number.isSafeInteger(rechnungId) || rechnungId <= 0) {
  return new Response("Rechnungs-ID fehlt", { status: 400 });
}

const rechnung = await prisma.rechnung.findFirst({
  where: {
    id: rechnungId,
    klientId: klient.id,
  },
});

if (!rechnung) {
  return new Response("Rechnung nicht gefunden", { status: 404 });
}

const buchungen = await prisma.abrechnungsbuchung.findMany({
  where: {
    rechnungId: rechnung.id,
    klientId: klient.id,
  },
  select: {
    einsatzId: true,
  },
});

const gebuchteEinsatzIds = buchungen
  .map((buchung) => buchung.einsatzId)
  .filter((id): id is number => id !== null);

const einsaetze = await prisma.einsatz.findMany({
  where: {
    id: {
      in: gebuchteEinsatzIds,
    },
    klientId: klient.id,
  },
  include: {
    benutzer: true,
  },
  orderBy: {
    startzeit: "asc",
  },
});
console.log("PDF-Prüfung:", {
  rechnungId: rechnung.id,
  buchungen: buchungen.length,
  einsatzIds: gebuchteEinsatzIds,
  einsaetze: einsaetze.length,
});
  const pdfDoc = await PDFDocument.create();

  const page = pdfDoc.addPage([595.28, 841.89]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
const logoPath = path.join(process.cwd(), "public", "image.png");
const logoBytes = await readFile(logoPath);
const logoImage = await pdfDoc.embedPng(logoBytes);

page.drawImage(logoImage, {
  x: 430,
  y: 735,
  width: 70,
  height: 70,
});
page.drawImage(logoImage, {
  x: 430,
  y: 735,
  width: 70,
  height: 70,
});

page.drawLine({
  start: { x: 365, y: 805 },
  end: { x: 365, y: 585 },
  thickness: 1,
  color: rgb(0, 0, 0),
});
const firmenInfoRechts = [
  organisation.name,
  organisation.strasse && organisation.hausnummer
    ? `${organisation.strasse} ${organisation.hausnummer}`
    : organisation.strasse,
  organisation.plz && organisation.ort
    ? `${organisation.plz} ${organisation.ort}`
    : organisation.ort,
  "",
  organisation.telefon ? `Telefon: ${organisation.telefon}` : null,
  organisation.email ? `E-Mail: ${organisation.email}` : null,
  "",
  organisation.ikNummer ? `IK-Nummer: ${organisation.ikNummer}` : null,
  organisation.bankname ? `Bank: ${organisation.bankname}` : null,
  organisation.iban ? `IBAN: ${organisation.iban}` : null,
  organisation.bic ? `BIC: ${organisation.bic}` : null,
].filter((zeile): zeile is string => zeile !== null && zeile !== undefined);
let firmenInfoY = 720;

for (const zeile of firmenInfoRechts) {
  page.drawText(zeile, {
    x: 385,
    y: firmenInfoY,
    size: 9,
    font,
    color: rgb(0, 0, 0),
  });

  firmenInfoY -= 12;
}


const absenderZeile = `${organisation.name} · ${organisation.strasse}${organisation.hausnummer ? ` ${organisation.hausnummer}` : ""} · ${organisation.plz ?? ""} ${organisation.ort ?? ""}`;

page.drawText(absenderZeile, {
  x: 50,
  y: 690,
  size: 7,
  font,
  color: rgb(0, 0, 0),
});

const kundenAdresse = [
  `${klient.vorname} ${klient.nachname}`,
  klient.strasse && klient.hausnummer
    ? `${klient.strasse} ${klient.hausnummer}`
    : klient.strasse,
  klient.plz && klient.ort
    ? `${klient.plz} ${klient.ort}`
    : klient.ort,
].filter((zeile): zeile is string => Boolean(zeile));

let kundenY = 670;

for (const zeile of kundenAdresse) {
  page.drawText(zeile, {
    x: 50,
    y: kundenY,
    size: 11,
    font,
    color: rgb(0, 0, 0),
  });

  kundenY -= 14;
}
page.drawText(
  `Bonn, ${rechnung.rechnungsdatum.toLocaleDateString("de-DE")}`,
  {
    x: 370,
    y: 585,
    size: 10,
    font: boldFont,
    color: rgb(0, 0, 0),
  }
);
page.drawText("Rechnungsnummer:", {
  x: 50,
  y: 555,
  size: 10,
  font,
  color: rgb(0, 0, 0),
});

page.drawText(rechnung.rechnungsnummer, {
  x: 250,
  y: 555,
  size: 10,
  font: boldFont,
  color: rgb(0, 0, 0),
});

const alltagsunterstuetzung = [
  `${klient.vorname} ${klient.nachname}`,
  klient.strasse && klient.hausnummer
    ? `${klient.strasse} ${klient.hausnummer}`
    : klient.strasse,
  klient.plz && klient.ort
    ? `${klient.plz} ${klient.ort}`
    : klient.ort,
  klient.pflegegrad ? `Pflegegrad ${klient.pflegegrad}` : null,
  klient.versichertennummer
    ? `Versichertennr. ${klient.versichertennummer}`
    : null,
]
  .filter((wert): wert is string => Boolean(wert))
  .join(", ");

page.drawText("Alltagsunterstützung:", {
  x: 50,
  y: 539,
  size: 9,
  font,
  color: rgb(0, 0, 0),
});

page.drawText(alltagsunterstuetzung, {
  x: 150,
  y: 539,
  size: 9,
  font,
  color: rgb(0, 0, 0),
});

page.drawText(
  `Abrechnungszeitraum: ${rechnung.leistungsmonat.toLocaleDateString("de-DE", {
    month: "long",
    year: "numeric",
  })}`,
  {
    x: 50,
    y: 523,
    size: 10,
    font,
    color: rgb(0, 0, 0),
  }
);

page.drawText("Sehr geehrte Damen und Herren,", {
  x: 50,
  y: 510,
  size: 10,
  font,
  color: rgb(0, 0, 0),
});

const leistungsartTexte: Record<string, string> = {
  ENTLASTUNGSBETRAG_45B: "§ 45b SGB XI",
  PFLEGESACHLEISTUNG_36: "§ 36 SGB XI",
  VERHINDERUNGSPFLEGE_39: "§ 39 SGB XI",
  UMWANDLUNGSANSPRUCH_45A: "§ 45a SGB XI",
  SELBSTZAHLER: "Selbstzahlerleistung",
};

const leistungsartText =
  leistungsartTexte[rechnung.leistungsart ?? "SELBSTZAHLER"];

page.drawText(
  `Für die erbrachten Leistungen übersenden wir Ihnen die Vergütungsabrechnung (${leistungsartText}).`,
  {
    x: 50,
    y: 490,
    size: 9,
    font,
    color: rgb(0, 0, 0),
  }
);
page.drawText("Leistungen:", {
  x: 50,
 y: 460,
  size: 12,
  font: boldFont,
  color: rgb(0, 0, 0),
});

// Abrechnungstabelle wie in der Rechnungsvorlage
const tableTop = 440;
const left = 50;
const right = 545;

const stundensatz = Number(klient.stundensatz ?? 0);

const gesamtMinuten = einsaetze.reduce((summe, einsatz) => {
  return (
    summe +
    (einsatz.endzeit.getTime() - einsatz.startzeit.getTime()) / 60000
  );
}, 0);

const gesamtStunden = gesamtMinuten / 60;

const betreuungsbetrag = gesamtStunden * stundensatz;

const anzahlAnfahrten = einsaetze.filter(
  (einsatz) => einsatz.anfahrtspauschale
).length;

const anfahrtSatz = 5.5;
const anfahrtGesamt = anzahlAnfahrten * anfahrtSatz;

const gesamtbetrag = Number(rechnung.gesamtbetrag);

// Hilfsfunktion für Tabellenlinien
function linie(y: number, dicke = 0.6) {
  page.drawLine({
    start: { x: left, y },
    end: { x: right, y },
    thickness: dicke,
    color: rgb(0.65, 0.65, 0.65),
  });
}

// 1. Leistungsbereich
page.drawText("1. Alltagsunterstützung und Begleitung", {
  x: left,
  y: tableTop,
  size: 10,
  font: boldFont,
});

linie(tableTop - 5);

let positionY = tableTop - 22;

// Betreuung
page.drawText(
  gesamtStunden.toFixed(2).replace(".", ","),
  {
    x: 55,
    y: positionY,
    size: 10,
    font,
  }
);

page.drawText("Betreuung", {
  x: 115,
  y: positionY,
  size: 10,
  font,
});

page.drawText("à", {
  x: 340,
  y: positionY,
  size: 10,
  font,
});

page.drawText(
  `${stundensatz.toFixed(2).replace(".", ",")} EUR`,
  {
    x: 380,
    y: positionY,
    size: 10,
    font,
  }
);

page.drawText(
  `${betreuungsbetrag.toFixed(2).replace(".", ",")} EUR`,
  {
    x: 475,
    y: positionY,
    size: 10,
    font,
  }
);

positionY -= 18;
linie(positionY + 7);

// 2. Besondere Aufwendungen
positionY -= 8;

page.drawText("2. Ersatz für besondere Aufwendungen", {
  x: left,
  y: positionY,
  size: 10,
  font: boldFont,
});

positionY -= 20;

page.drawText(String(anzahlAnfahrten), {
  x: 55,
  y: positionY,
  size: 10,
  font,
});

page.drawText("Fahrtkostenpauschale", {
  x: 115,
  y: positionY,
  size: 10,
  font,
});

page.drawText("à", {
  x: 340,
  y: positionY,
  size: 10,
  font,
});

page.drawText(
  `${anfahrtSatz.toFixed(2).replace(".", ",")} EUR`,
  {
    x: 380,
    y: positionY,
    size: 10,
    font,
  }
);

page.drawText(
  `${anfahrtGesamt.toFixed(2).replace(".", ",")} EUR`,
  {
    x: 475,
    y: positionY,
    size: 10,
    font,
  }
);

positionY -= 18;
linie(positionY + 7);

// 3. Ersatz sonstiger Aufwendungen
positionY -= 8;

page.drawText("3. Ersatz sonstiger Aufwendungen", {
  x: left,
  y: positionY,
  size: 10,
  font: boldFont,
});

positionY -= 20;

// Portokosten
page.drawText("0", {
  x: 55,
  y: positionY,
  size: 10,
  font,
});

page.drawText("Portokosten (Sammelpost)", {
  x: 115,
  y: positionY,
  size: 10,
  font,
});

page.drawText("à", {
  x: 340,
  y: positionY,
  size: 10,
  font,
});

page.drawText("1,00 EUR", {
  x: 380,
  y: positionY,
  size: 10,
  font,
});

page.drawText("0,00 EUR", {
  x: 475,
  y: positionY,
  size: 10,
  font,
});

positionY -= 18;

// Kilometerpauschale
page.drawText("0", {
  x: 55,
  y: positionY,
  size: 10,
  font,
});

page.drawText("Kilometerpauschale", {
  x: 115,
  y: positionY,
  size: 10,
  font,
});

page.drawText("à", {
  x: 340,
  y: positionY,
  size: 10,
  font,
});

page.drawText("0,40 EUR", {
  x: 380,
  y: positionY,
  size: 10,
  font,
});

page.drawText("0,00 EUR", {
  x: 475,
  y: positionY,
  size: 10,
  font,
});

positionY -= 18;
linie(positionY + 7);
// Endbetrag
positionY -= 15;

page.drawLine({
  start: { x: left, y: positionY + 12 },
  end: { x: right, y: positionY + 12 },
  thickness: 1.5,
  color: rgb(0, 0, 0),
});

page.drawText("Endbetrag", {
  x: left,
  y: positionY,
  size: 12,
  font: boldFont,
});

page.drawText(
  `${gesamtbetrag.toFixed(2).replace(".", ",")} EUR`,
  {
    x: 470,
    y: positionY,
    size: 12,
    font: boldFont,
  }
);

page.drawLine({
  start: { x: left, y: positionY - 5 },
  end: { x: right, y: positionY - 5 },
  thickness: 1.5,
  color: rgb(0, 0, 0),
});
page.drawText(
  "Die o.g. Leistungen sind nach § 4 Nr. 16 g UStG von der Umsatzsteuer befreit.",
  {
    x: left,
    y: positionY - 22,
    size: 8,
    font,
    color: rgb(0, 0, 0),
  }
);

page.drawText(
  "Die Dokumentation der Stundenabrechnungen sind dieser Rechnung beigefügt.",
  {
    x: left,
    y: positionY - 33,
    size: 8,
    font,
    color: rgb(0, 0, 0),
  }
);
const zahlungsziel = new Date(rechnung.rechnungsdatum);
zahlungsziel.setDate(zahlungsziel.getDate() + 14);

page.drawText(
  `Der o.g. Betrag ist bis zum ${zahlungsziel.toLocaleDateString("de-DE")} zu begleichen.`,
  {
    x: left,
    y: positionY - 50,
    size: 8,
    font,
    color: rgb(0, 0, 0),
  }
);
page.drawText("Mit freundlichen Grüßen", {
  x: left,
  y: positionY - 78,
  size: 10,
  font,
  color: rgb(0, 0, 0),
});

const unterschriftPath = path.join(
  process.cwd(),
  "public",
  "unterschrift.png"
);

const unterschriftBytes = await readFile(unterschriftPath);
const unterschriftImage = await pdfDoc.embedPng(unterschriftBytes);

page.drawImage(unterschriftImage, {
  x: left,
  y: positionY - 125,
  width: 100,
  height: 43,
});

page.drawText(organisation.inhaberName ?? "", {
  x: left,
  y: positionY - 140,
  size: 10,
  font: boldFont,
  color: rgb(0, 0, 0),
});
const bankdatenZeile = [
  organisation.bankname ? `Bank: ${organisation.bankname}` : null,
  organisation.iban ? `IBAN: ${organisation.iban}` : null,
  organisation.bic ? `BIC: ${organisation.bic}` : null,
  organisation.steuernummer ? `Steuernummer: ${organisation.steuernummer}` : null,
]
  .filter((wert): wert is string => wert !== null)
  .join("   |   ");

page.drawText(bankdatenZeile, {
  x: left,
  y: 55,
  size: 8,
  font,
  color: rgb(0, 0, 0),
});
let nachweisSeite = pdfDoc.addPage([595.28, 841.89]);

nachweisSeite.drawText("EINSATZNACHWEIS", {
  x: 50,
  y: 790,
  size: 20,
  font: boldFont,
  color: rgb(0, 0, 0),
});

nachweisSeite.drawText(
  `Klient: ${klient.vorname} ${klient.nachname}`,
  { x: 50, y: 750, size: 11, font }
);

nachweisSeite.drawText(
  `Pflegekasse: ${klient.pflegekasse ?? "-"}`,
  { x: 50, y: 730, size: 11, font }
);

nachweisSeite.drawText(
  `Versichertennummer: ${klient.versichertennummer ?? "-"}`,
  { x: 50, y: 710, size: 11, font }
);

nachweisSeite.drawText(
  `Pflegegrad: ${klient.pflegegrad ?? "-"}`,
  { x: 50, y: 690, size: 11, font }
);
let zeilenY = 625;
const tabellenSpalten = [
  { text: "Datum", x: 50 },
  { text: "Uhrzeit", x: 125 },
  { text: "Std.", x: 225 },
  { text: "Mitarbeiter", x: 275 },
  { text: "Unterschrift", x: 430 },
];

for (const spalte of tabellenSpalten) {
  nachweisSeite.drawText(spalte.text, {
    x: spalte.x,
    y: 660,
    size: 10,
    font: boldFont,
  });
}

for (const einsatz of einsaetze) {
  if (zeilenY < 80) {
    nachweisSeite = pdfDoc.addPage([595.28, 841.89]);
    zeilenY = 780;

    nachweisSeite.drawText("Einsatznachweis - Fortsetzung", {
      x: 50,
      y: 800,
      size: 16,
      font: boldFont,
    });
  }
  const datum = einsatz.datum.toLocaleDateString("de-DE");

  const start = einsatz.startzeit.toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const ende = einsatz.endzeit.toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const mitarbeiter =
    `${einsatz.benutzer.vorname} ${einsatz.benutzer.nachname}`;

const einsatzSpalten = [
  { text: datum, x: 50 },
  { text: `${start}–${ende}`, x: 125 },
  {
    text: (
      (einsatz.endzeit.getTime() - einsatz.startzeit.getTime()) /
      3600000
    ).toFixed(2).replace(".", ","),
    x: 225,
  },
  { text: mitarbeiter, x: 275 },
];

for (const spalte of einsatzSpalten) {
  nachweisSeite.drawText(spalte.text, {
    x: spalte.x,
    y: zeilenY,
    size: 9,
    font,
  });
}

if (einsatz.unterschrift?.startsWith("data:image/png;base64,")) {
  const bildDaten = einsatz.unterschrift.split(",")[1];
  const unterschriftBild = await pdfDoc.embedPng(
    Buffer.from(bildDaten, "base64")
  );

  nachweisSeite.drawImage(unterschriftBild, {
    x: 430,
    y: zeilenY - 18,
    width: 100,
    height: 35,
  });
}


nachweisSeite.drawLine({
  start: { x: 50, y: zeilenY - 28 },
  end: { x: 545, y: zeilenY - 28 },
  thickness: 0.5,
  color: rgb(0.8, 0.8, 0.8),
});

zeilenY -= 75;
}
const gesamtStundenNachweis = einsaetze.reduce(
  (summe, einsatz) =>
    summe +
    (einsatz.endzeit.getTime() - einsatz.startzeit.getTime()) / 3600000,
  0
);

nachweisSeite.drawText(
`Gesamtstunden: ${gesamtStundenNachweis.toFixed(2).replace(".", ",")} Std.`,
  {
    x: 50,
    y: zeilenY - 10,
    size: 11,
    font: boldFont,
  }
);
const pdfBytes = await pdfDoc.save();
  return new Response(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="rechnung.pdf"',
    },
  });
}