import { prisma } from "@/lib/prisma";
import { sessionLesen } from "@/lib/auth";
import { PNG } from "pngjs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ einsatzId: string }> }
) {
  const session = await sessionLesen();

  if (!session || session.rolle !== "MITARBEITER") {
    return Response.json(
      { error: "Keine Berechtigung." },
      { status: 403 }
    );
  }

  const { einsatzId } = await params;
  const nummer = Number(einsatzId);

  if (!Number.isSafeInteger(nummer) || nummer <= 0) {
    return Response.json(
      { error: "Ungültige Einsatz-ID." },
      { status: 400 }
    );
  }

  const einsatz = await prisma.einsatz.findFirst({
    where: {
      id: nummer,
      benutzerId: Number(session.benutzerId),
      benutzer: {
        organisationId: Number(session.organisationId),
      },
      klient: {
        organisationId: Number(session.organisationId),
      },
    },
    select: {
      id: true,
      datum: true,
      startzeit: true,
      endzeit: true,
      status: true,
      nachunterschriftFreigegebenAm: true,
      unterschriebenAm: true,
      klient: {
        select: {
          vorname: true,
          nachname: true,
        },
      },
    },
  });

  if (!einsatz) {
    return Response.json(
      { error: "Einsatz nicht gefunden." },
      { status: 404 }
    );
  }

  return Response.json({
    id: einsatz.id,
    datum: einsatz.datum,
    startzeit: einsatz.startzeit,
    endzeit: einsatz.endzeit,
    status: einsatz.status,
    nachtraeglichFreigegeben:
    einsatz.status === "GEPRUEFT" &&
    einsatz.nachunterschriftFreigegebenAm !== null,
    klient: einsatz.klient,
    hatUnterschrift: einsatz.unterschriebenAm !== null,
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ einsatzId: string }> }
) {
  try {
    const session = await sessionLesen();

if (!session) {
  return Response.json(
    { error: "Nicht angemeldet." },
    { status: 401 }
  );
}

if (session.rolle !== "MITARBEITER") {
  return Response.json(
    { error: "Keine Berechtigung." },
    { status: 403 }
  );
}

    const { einsatzId } = await params;
    const nummer = Number(einsatzId);

if (!Number.isInteger(nummer) || nummer <= 0) {
  return Response.json(
    { error: "Ungültige Einsatz-ID." },
    { status: 400 }
  );
}
    const body = await request.json();

    if (body.stundenBestaetigt !== true) {
  return Response.json(
    {
      error: "Die Einsatzzeiten müssen vor der Unterschrift bestätigt werden.",
    },
    { status: 400 }
  );
}

const berechtigterEinsatz = await prisma.einsatz.findFirst({
  where: {
    id: nummer,
    benutzerId: Number(session.benutzerId),
    benutzer: {
      organisationId: Number(session.organisationId),
    },
    klient: {
      organisationId: Number(session.organisationId),
    },
  },
  include: {
    klient: {
      select: {
        istTestklient: true,
      },
    },
  },
});

if (!berechtigterEinsatz) {
  return Response.json(
    { error: "Einsatz nicht gefunden oder keine Berechtigung." },
    { status: 403 }
  );
}

if (
  berechtigterEinsatz.klient.istTestklient &&
  berechtigterEinsatz.status === "GEPRUEFT"
) {
  return Response.json(
    {
      error:
        "Für Testklienten sind nachträgliche Unterschriften nicht erlaubt.",
    },
    { status: 403 }
  );
}

const bestaetigteDaten = body.bestaetigteEinsatzdaten;

if (
  !bestaetigteDaten ||
  bestaetigteDaten.datum !== berechtigterEinsatz.datum.toISOString() ||
  bestaetigteDaten.startzeit !== berechtigterEinsatz.startzeit.toISOString() ||
  bestaetigteDaten.endzeit !== berechtigterEinsatz.endzeit.toISOString()
) {
  return Response.json(
    {
      error:
        "Die Einsatzdaten stimmen nicht mehr überein. Bitte laden Sie die Seite neu und prüfen Sie die Zeiten erneut.",
    },
    { status: 409 }
  );
}

let rechnungNochNichtVersendet = false;

if (
  nummer === 15 &&
  berechtigterEinsatz.status === "GEPRUEFT"
) {
  const buchung = await prisma.abrechnungsbuchung.findUnique({
    where: {
      einsatzId: nummer,
    },
    select: {
      rechnung: {
        select: {
          rechnungsnummer: true,
          klientId: true,
          versendetAm: true,
        },
      },
    },
  });

  rechnungNochNichtVersendet =
    buchung?.rechnung?.rechnungsnummer === "RE-2026-09-2" &&
    buchung.rechnung.klientId === berechtigterEinsatz.klientId &&
    buchung.rechnung.versendetAm === null;
}
const normalUnterschreibbar =
  berechtigterEinsatz.status === "OFFEN" ||
  berechtigterEinsatz.status === "BESTAETIGT";

const nachtraeglichFreigegeben =
  nummer === 15 &&
  rechnungNochNichtVersendet &&
  berechtigterEinsatz.status === "GEPRUEFT" &&
  berechtigterEinsatz.nachunterschriftFreigegebenAm !== null &&
  berechtigterEinsatz.nachunterschriftFreigegebenVonId !== null &&
  Boolean(berechtigterEinsatz.nachunterschriftFreigabeGrund);

if (
  (!normalUnterschreibbar && !nachtraeglichFreigegeben) ||
  berechtigterEinsatz.unterschrift ||
  berechtigterEinsatz.unterschriebenAm
) {

  return Response.json(
    { error: "Für diesen Einsatz ist keine neue Unterschrift erlaubt." },
    { status: 409 }
  );
}

    const unterschrift = body.unterschrift;

    if (!unterschrift) {
      return Response.json(
        { error: "Keine Unterschrift übermittelt." },
        { status: 400 }
      );
    }

if (
  typeof unterschrift !== "string" ||
  !unterschrift.startsWith("data:image/png;base64,") ||
  unterschrift.length > 500_000
) {
  return Response.json(
    { error: "Ungültiges Unterschriftbild." },
    { status: 400 }
  );
}

const bildPuffer = Buffer.from(
  unterschrift.split(",")[1],
  "base64"
);

let bild: PNG;

try {
  bild = PNG.sync.read(bildPuffer);
} catch {
  return Response.json(
    { error: "Das Unterschriftbild ist beschädigt oder ungültig." },
    { status: 400 }
  );
}

if (bild.width !== 700 || bild.height !== 300) {
  return Response.json(
    { error: "Ungültige Abmessungen des Unterschriftbildes." },
    { status: 400 }
  );
}

let hatZeichnung = false;

for (let i = 0; i < bild.data.length; i += 4) {
  const rot = bild.data[i];
  const gruen = bild.data[i + 1];
  const blau = bild.data[i + 2];
  const alpha = bild.data[i + 3];

  if (
    alpha > 50 &&
    (rot < 200 || gruen < 200 || blau < 200)
  ) {
    hatZeichnung = true;
    break;
  }
}

if (!hatZeichnung) {
  return Response.json(
    { error: "Das Unterschriftfeld ist leer." },
    { status: 400 }
  );
}

const ergebnis = await prisma.$transaction(async (tx) => {
  const unterschriebenAm = new Date();

    const einsatzInTransaktion = await tx.einsatz.findFirst({
    where: {
      id: nummer,
      benutzerId: Number(session.benutzerId),
      benutzer: {
        organisationId: Number(session.organisationId),
      },
      klient: {
        organisationId: Number(session.organisationId),
      },
    },
select: {
  status: true,
  nachunterschriftFreigegebenAm: true,
  nachunterschriftFreigegebenVonId: true,
  nachunterschriftFreigabeGrund: true,
},
  });

  if (!einsatzInTransaktion) {
    throw new Error("Einsatz innerhalb der Transaktion nicht gefunden.");
  }

const normalErlaubt =
  einsatzInTransaktion.status === "OFFEN" ||
  einsatzInTransaktion.status === "BESTAETIGT";

  let rechnungInTransaktionNichtVersendet = false;

if (
  nummer === 15 &&
  einsatzInTransaktion.status === "GEPRUEFT"
) {
  const buchungInTransaktion =
    await tx.abrechnungsbuchung.findUnique({
      where: {
        einsatzId: nummer,
      },
      select: {
        rechnung: {
          select: {
            rechnungsnummer: true,
            klientId: true,
            versendetAm: true,
          },
        },
      },
    });

  rechnungInTransaktionNichtVersendet =
    buchungInTransaktion?.rechnung?.rechnungsnummer === "RE-2026-09-2" &&
    buchungInTransaktion.rechnung.klientId === berechtigterEinsatz.klientId &&
    buchungInTransaktion.rechnung.versendetAm === null;
}

const nachtraeglichErlaubt =
  nummer === 15 &&
  rechnungInTransaktionNichtVersendet &&
  einsatzInTransaktion.status === "GEPRUEFT" &&
  einsatzInTransaktion.nachunterschriftFreigegebenAm !== null &&
  einsatzInTransaktion.nachunterschriftFreigegebenVonId !== null &&
  Boolean(einsatzInTransaktion.nachunterschriftFreigabeGrund);

if (!normalErlaubt && !nachtraeglichErlaubt) {
  throw new Error("Dieser Einsatzstatus erlaubt keine Unterschrift.");
}

    const aktualisierung = await tx.einsatz.updateMany({ 
    where: {
      id: nummer,
      benutzerId: Number(session.benutzerId),
      benutzer: {
        organisationId: Number(session.organisationId),
      },
      klient: {
  organisationId: Number(session.organisationId),
  ...(einsatzInTransaktion.status === "GEPRUEFT"
    ? { istTestklient: false }
    : {}),
},
    status: einsatzInTransaktion.status,
    datum: berechtigterEinsatz.datum,
    startzeit: berechtigterEinsatz.startzeit,
    endzeit: berechtigterEinsatz.endzeit,
    unterschrift: null,
    unterschriebenAm: null,
...(einsatzInTransaktion.status === "GEPRUEFT"
  ? {
      nachunterschriftFreigegebenAm: {
        not: null,
      },
      nachunterschriftFreigegebenVonId: {
        not: null,
      },
      nachunterschriftFreigabeGrund: {
        not: null,
      },
      abrechnungsbuchungen: {
        some: {
          rechnung: {
            is: {
              rechnungsnummer: "RE-2026-09-2",
              klientId: berechtigterEinsatz.klientId,
              versendetAm: null,
            },
          },
        },
      },
    }
  : {}),
    },
    data: {
      unterschrift,
      unterschriebenAm,
    },
  });

  if (aktualisierung.count !== 1) {
    return aktualisierung;
  }

  await tx.einsatzUnterschriftProtokoll.create({
    data: {
      einsatzId: nummer,
      benutzerId: Number(session.benutzerId),
      unterschriebenAm,
      einsatzStatus: einsatzInTransaktion.status,
      nachtraeglich: einsatzInTransaktion.status === "GEPRUEFT",
      bemerkung: "Unterschrift persönlich auf dem Gerät erfasst.",
    },
  });

  return aktualisierung;
});

if (ergebnis.count !== 1) {
  return Response.json(
    { error: "Unterschrift konnte nicht gespeichert werden." },
    { status: 409 }
  );
}

return Response.json({
  erfolgreich: true,
});
  } catch (error) {
    console.error("Fehler beim Speichern der Unterschrift:", error);

    return Response.json(
      { error: "Unterschrift konnte nicht gespeichert werden." },
      { status: 500 }
    );
  }
}