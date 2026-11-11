import { sessionLesen } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
    request: Request,
  { params }: { params: Promise<{ einsatzId: string }> }
) {
  const session = await sessionLesen();

if (!session) {
  return Response.json(
    { error: "Nicht angemeldet." },
    { status: 401 }
  );
}

if (session.rolle !== "ADMIN_INHABER") {
    return Response.json(
      { error: "Nur der Inhaber darf nachträgliche Unterschriften freigeben." },
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

  if (nummer !== 15) {
  return Response.json(
    {
      error: "Die nachträgliche Freigabe ist derzeit nur für Einsatz 15 vorgesehen.",
    },
    { status: 403 }
  );
}

  const einsatz = await prisma.einsatz.findFirst({
    where: {
      id: nummer,
      benutzer: {
        organisationId: Number(session.organisationId),
      },
      klient: {
        organisationId: Number(session.organisationId),
      },
    },
select: {
  id: true,
  klientId: true,
    status: true,
  unterschriebenAm: true,
  nachunterschriftFreigegebenAm: true,
  klient: {
  select: { istTestklient: true },
},
},
  });

  if (!einsatz) {
    return Response.json(
      { error: "Einsatz nicht gefunden oder keine Berechtigung." },
      { status: 404 }
    );
  }
  if (einsatz.klient.istTestklient) {
  return Response.json(
    { error: "Für Testklienten ist keine nachträgliche Freigabe erlaubt." },
    { status: 403 }
  );
}

    if (
    einsatz.status !== "GEPRUEFT" ||
    einsatz.unterschriebenAm !== null ||
    einsatz.nachunterschriftFreigegebenAm !== null
) {
  return Response.json(
    {
      error:
        "Eine nachträgliche Freigabe ist nur für geprüfte Einsätze ohne vorhandene Unterschrift möglich.",
    },
    { status: 409 }
  );
}

  const buchung = await prisma.abrechnungsbuchung.findUnique({
    where: {
      einsatzId: nummer,
    },
select: {
  rechnung: {
    select: {
      versendetAm: true,
      klientId: true,
      rechnungsnummer: true,
    },
  },
},
  });

  if (!buchung?.rechnung) {
    return Response.json(
      { error: "Keine zugehörige Rechnung gefunden. Freigabe gesperrt." },
      { status: 409 }
    );
  }

    if (
    nummer === 15 &&
    buchung.rechnung.rechnungsnummer !== "RE-2026-09-2"
  ) {
    return Response.json(
      {
        error:
          "Einsatz 15 gehört nicht zur erwarteten Rechnung RE-2026-09-2. Freigabe gesperrt.",
      },
      { status: 409 }
    );
  }

  if (buchung.rechnung.klientId !== einsatz.klientId) {
  return Response.json(
    {
      error:
        "Die Rechnung gehört nicht zum Klienten dieses Einsatzes. Freigabe gesperrt.",
    },
    { status: 409 }
  );
}

  if (buchung.rechnung.versendetAm !== null) {
    return Response.json(
      { error: "Die Rechnung wurde bereits versendet. Freigabe gesperrt." },
      { status: 409 }
    );
  }
  
    const body = await request.json().catch(() => null);

if (
  body?.freigabeBestaetigt !== true ||
  body?.einsatzId !== nummer ||
  body?.rechnungNichtVersendetBestaetigt !== true
) {

  return Response.json(
    {
      error:
        "Bitte bestätigen Sie ausdrücklich die nachträgliche Freigabe dieses Einsatzes.",
    },
    { status: 400 }
  );
}

  const grund =
    typeof body?.grund === "string" ? body.grund.trim() : "";

  if (grund.length < 10 || grund.length > 500) {
    return Response.json(
      {
        error:
          "Bitte geben Sie eine Begründung mit 10 bis 500 Zeichen ein.",
      },
      { status: 400 }
    );
  }

    const ergebnis = await prisma.einsatz.updateMany({
  where: {
    id: nummer,
    status: "GEPRUEFT",
    unterschrift: null,
    unterschriebenAm: null,
    nachunterschriftFreigegebenAm: null,

abrechnungsbuchungen: {
  some: {
    rechnung: {
      is: {
        rechnungsnummer: "RE-2026-09-2",
        versendetAm: null,
        klientId: einsatz.klientId,
      },
    },
  },
},

benutzer: {
      organisationId: Number(session.organisationId),
    },
    klient: {
  organisationId: Number(session.organisationId),
  istTestklient: false,
},
  },
  data: {
    nachunterschriftFreigegebenAm: new Date(),
    nachunterschriftFreigegebenVonId: Number(session.benutzerId),
    nachunterschriftFreigabeGrund: grund,
  },
});

if (ergebnis.count !== 1) {
  return Response.json(
    { error: "Der Einsatz konnte nicht freigegeben werden." },
    { status: 409 }
  );
}

return Response.json({
  erfolgreich: true,
  meldung: "Die nachträgliche Unterschrift wurde freigegeben.",
});
}