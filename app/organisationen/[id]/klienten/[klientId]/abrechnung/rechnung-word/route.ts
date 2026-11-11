import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
} from "docx";

import { prisma } from "@/lib/prisma";
import { sessionErfordern } from "@/lib/auth";
import { istSonntagOderFeiertag } from "@/lib/sonntagsFeiertagszuschlag";

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

  const url = new URL(request.url);
  const rechnungId = Number(url.searchParams.get("rechnungId"));

  if (!Number.isSafeInteger(rechnungId) || rechnungId <= 0) {
    return new Response("Rechnungs-ID fehlt", { status: 400 });
  }

    const rechnung = await prisma.rechnung.findFirst({
    where: {
      id: rechnungId,
      klient: {
        id: klientIdNummer,
        organisationId,
      },
    },
  });

  if (!rechnung) {
    return new Response("Rechnung nicht gefunden", { status: 404 });
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

  const istPflegekasse =
  rechnung.rechnungsempfaenger === "PFLEGEKASSE";

if (
  istPflegekasse &&
  (
    !klient.pflegekasse?.trim() ||
    !klient.pflegekassePlz?.trim() ||
    !klient.pflegekasseOrt?.trim() ||
    (Boolean(klient.pflegekasseStrasse?.trim()) !==
      Boolean(klient.pflegekasseHausnummer?.trim()))
  )
) {
  return new Response(
    "Bitte die Postanschrift der Pflegekasse prüfen: Name, PLZ und Ort sind erforderlich. Bei einer Straßenanschrift bitte Straße und Hausnummer vollständig angeben.",
    { status: 400 }
  );
}

const empfaengerName = istPflegekasse
  ? klient.pflegekasse?.trim() || "Pflegekasse nicht hinterlegt"
  : `${klient.vorname} ${klient.nachname}`;

const empfaengerStrasse = istPflegekasse
  ? `${klient.pflegekasseStrasse ?? ""} ${klient.pflegekasseHausnummer ?? ""}`.trim()
  : `${klient.strasse ?? ""} ${klient.hausnummer ?? ""}`.trim();

const empfaengerOrt = istPflegekasse
  ? `${klient.pflegekassePlz ?? ""} ${klient.pflegekasseOrt ?? ""}`.trim()
  : `${klient.plz ?? ""} ${klient.ort ?? ""}`.trim();

    const organisation = await prisma.organisation.findUnique({
    where: {
      id: organisationId,
    },
  });

  if (!organisation) {
    return new Response("Organisation nicht gefunden", { status: 404 });
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

  const einsatzIds = buchungen
    .map((buchung) => buchung.einsatzId)
    .filter((id): id is number => id !== null);

      const einsaetze = await prisma.einsatz.findMany({
    where: {
      id: {
        in: einsatzIds,
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

    const zahlungsziel = new Date(rechnung.rechnungsdatum);

    const anzahlSonntagsFeiertagszuschlaege = einsaetze.filter(
  (einsatz) =>
    einsatz.sonntagsFeiertagszuschlag &&
    istSonntagOderFeiertag(einsatz.datum)
).length;

const sonntagsFeiertagsGesamt =
  anzahlSonntagsFeiertagszuschlaege * 9.9;

  zahlungsziel.setDate(zahlungsziel.getDate() + 14);

    const leistungsartText =
    rechnung.leistungsart === "ENTLASTUNGSBETRAG_45B"
      ? "Entlastungsbetrag (§ 45b SGB XI)"
      : rechnung.leistungsart === "PFLEGESACHLEISTUNG_36"
      ? "Pflegesachleistung (§ 36 SGB XI)"
      : rechnung.leistungsart === "VERHINDERUNGSPFLEGE_39"
      ? "Verhinderungspflege (§ 39 SGB XI)"
      : rechnung.leistungsart === "UMWANDLUNGSANSPRUCH_45A"
      ? "Umwandlungsanspruch (§ 45a SGB XI)"
      : rechnung.leistungsart === "SELBSTZAHLER"
      ? "Selbstzahler"
      : "Nicht angegeben";

    const dokument = new Document({
        styles: {
            default: {
            document: {
            run: {
            font: "Arial",
            size: 20,
      },
    },
  },
},
    sections: [
      {
        children: [
new Paragraph({
  alignment: "center",
  spacing: {
    after: 300,
  },
  children: [
    new TextRun({
      text: "RECHNUNG",
      bold: true,
      size: 32,
    }),
  ],
}),

    new Paragraph({
  children: [
    new TextRun({
      text: "Alltagshelfer Bonn Rhein Sieg",
      bold: true,
    }),
  ],
}),

new Paragraph({
  children: [
    new TextRun({
      text: `${organisation.strasse ?? ""} ${organisation.hausnummer ?? ""}`.trim(),
    }),
  ],
}),

new Paragraph({
  children: [
    new TextRun({
      text: `${organisation.plz ?? ""} ${organisation.ort ?? ""}`.trim(),
    }),
  ],
}),

new Paragraph({
  children: [
    new TextRun({
      text: `Bank: ${organisation.bankname ?? ""}`,
    }),
  ],
}),

new Paragraph({
  children: [
    new TextRun({
      text: `IBAN: ${organisation.iban ?? ""}`,
    }),
  ],
}),

new Paragraph({
  children: [
    new TextRun({
      text: `BIC: ${organisation.bic ?? ""}`,
    }),
  ],
}),

new Paragraph({
  children: [
    new TextRun({
      text: `IK-Nummer: ${organisation.ikNummer ?? ""}`,
    }),
  ],
}),

new Paragraph({
  spacing: {
    before: 400,
    after: 100,
  },
  children: [
    new TextRun({
      text: `Alltagsunterstützung: ${klient.vorname} ${klient.nachname}`,
      bold: true,
    }),
  ],
}),

new Paragraph({
  children: [
    new TextRun({
      text: empfaengerName,
      bold: true,
    }),
  ],
}),


new Paragraph({
  children: [
    new TextRun({
      text: empfaengerStrasse,
    }),
  ],
}),

new Paragraph({
  children: [
    new TextRun({
      text: empfaengerOrt,
    }),
  ],
}),


new Paragraph({
  spacing: {
    before: 300,
  },
  children: [
    new TextRun({
      text: `Rechnungsnummer: ${rechnung.rechnungsnummer}`,
    }),
  ],
}),

new Paragraph({
  children: [
    new TextRun({
      text: `Rechnungsdatum: ${new Date(
        rechnung.rechnungsdatum
      ).toLocaleDateString("de-DE")}`,
    }),
  ],
}),

new Paragraph({
  children: [
    new TextRun({
      text: `Zahlungsziel: ${zahlungsziel.toLocaleDateString("de-DE")}`,
    }),
  ],
}),

new Paragraph({
  children: [
    new TextRun({
      text: `Leistungsmonat: ${rechnung.leistungsmonat.toLocaleDateString(
        "de-DE",
        {
          month: "long",
          year: "numeric",
        }
      )}`,
    }),
  ],
}),

new Paragraph({
  children: [
    new TextRun({
      text: `Leistungsart: ${leistungsartText}`,
    }),
  ],
}),

new Paragraph({
  spacing: {
    before: 300,
    after: 150,
  },
  children: [
    new TextRun({
      text: "Sehr geehrte Damen und Herren,",
    }),
  ],
}),

new Paragraph({
  spacing: {
    after: 250,
  },
  children: [
    new TextRun({
      text:
        rechnung.leistungsart === "ENTLASTUNGSBETRAG_45B"
          ? "für die erbrachten Leistungen übersende ich Ihnen die Vergütungsabrechnung nach § 45b SGB XI."
          : `Für die erbrachten Leistungen übersende ich Ihnen die Vergütungsabrechnung für ${leistungsartText}.`,
    }),
  ],
}),

new Paragraph({
  spacing: {
    before: 300,
    after: 150,
  },
  children: [
    new TextRun({
      text: "Leistungsabrechnung:",
      bold: true,
      size: 24,
    }),
  ],
}),

new Table({
  width: {
    size: 100,
    type: WidthType.PERCENTAGE,
  },
  rows: [
    new TableRow({
      children: [
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: "Leistung",
                  bold: true,
                }),
              ],
            }),
          ],
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: "Gesamtbetrag",
                  bold: true,
                }),
              ],
            }),
          ],
        }),
      ],
    }),


    new TableRow({
      children: [
        new TableCell({
          children: [
            new Paragraph(leistungsartText),
          ],
        }),
        new TableCell({
          children: [
            new Paragraph(
           (
  Number(rechnung.gesamtbetrag) - sonntagsFeiertagsGesamt
).toLocaleString("de-DE", {
  style: "currency",
  currency: "EUR",
})
            ),
          ],
        }),
      ],
    }),

    ...(anzahlSonntagsFeiertagszuschlaege > 0
      ? [
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph(
                    `Sonntags- und Feiertagszuschlag (${anzahlSonntagsFeiertagszuschlaege} × 9,90 €)`
                  ),
                ],
              }),
              new TableCell({
                children: [
                  new Paragraph(
                    sonntagsFeiertagsGesamt.toLocaleString("de-DE", {
                      style: "currency",
                      currency: "EUR",
                    })
                  ),
                ],
              }),
            ],
          }),
        ]
      : []),
  ],
}),

new Paragraph({
  spacing: {
    before: 150,
    after: 150,
  },
  children: [
    new TextRun({
      text: "Die o.g. Leistungen sind nach § 4 Nr. 16 g UStG von der Umsatzsteuer befreit.",
      size: 18,
    }),
  ],
}),

new Paragraph({
  spacing: {
    before: 300,
    after: 150,
  },
  children: [
    new TextRun({
    text: `Rechnungsdatum: ${rechnung.rechnungsdatum.toLocaleDateString("de-DE")}. Bitte überweisen Sie den Rechnungsbetrag innerhalb von 14 Tagen ab Rechnungsdatum, spätestens bis zum ${zahlungsziel.toLocaleDateString("de-DE")}, unter Angabe der Rechnungsnummer auf das oben angegebene Konto.`,    }),
  ],
}),

new Paragraph({
  spacing: {
    before: 200,
    after: 200,
  },
  children: [
    new TextRun({
      text: "Anlage: Einsatznachweis",
      italics: true,
    }),
  ],
}),

new Paragraph({
  spacing: {
    before: 400,
    after: 200,
  },
  children: [
    new TextRun({
      text: "Mit freundlichen Grüßen",
    }),
  ],
}),

new Paragraph({
  spacing: { before: 100 },
  children: [
    new TextRun({
      text: "Alltagshelfer Bonn Rhein Sieg",
    }),
  ],
}),

        ],
      },
    ],
  });

    const datei = await Packer.toBuffer(dokument);

  return new Response(new Uint8Array(datei), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": 'attachment; filename="rechnung.docx"',
    },
  });

}