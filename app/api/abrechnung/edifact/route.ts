import { prisma } from "@/lib/prisma";
import { sessionLesen } from "@/lib/auth";
import {
  erzeugeDakotaNutzdatendatei,
  type EdifactRechnung,
} from "@/lib/edifact/dakota-nutzdaten";

export async function GET(request: Request) {
  const session = await sessionLesen();

  if (!session) {
    return Response.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  if (session.rolle !== "ADMIN_INHABER") {
    return Response.json(
      { error: "Nur der Inhaber darf die dakota.le-Nutzdatendatei exportieren." },
      { status: 403 }
    );
  }

  const organisationId = Number(session.organisationId);
  const { searchParams } = new URL(request.url);
  const nurNichtVersendet = searchParams.get("nurNichtVersendet") !== "0";

  const [organisation, rechnungen] = await Promise.all([
    prisma.organisation.findUnique({
      where: { id: organisationId },
      select: {
        name: true,
        ikNummer: true,
        steuernummer: true,
        ustIdNr: true,
      },
    }),
    prisma.rechnung.findMany({
      where: {
        klient: {
          organisationId,
          istTestklient: false,
        },
        leistungsart: { not: "SELBSTZAHLER" },
        ...(nurNichtVersendet ? { versendetAm: null } : {}),
      },
      orderBy: { rechnungsdatum: "asc" },
      select: {
        rechnungsnummer: true,
        rechnungsdatum: true,
        leistungsmonat: true,
        leistungsart: true,
        gesamtbetrag: true,
        klient: {
          select: {
            vorname: true,
            nachname: true,
            geburtsdatum: true,
            strasse: true,
            hausnummer: true,
            plz: true,
            ort: true,
            versichertennummer: true,
            kassenIk: true,
            pflegekasse: true,
          },
        },
        abrechnungsbuchungen: {
          select: {
            betrag: true,
            einsatz: {
              select: {
                id: true,
                datum: true,
                startzeit: true,
                endzeit: true,
                kilometer: true,
                anfahrtspauschale: true,
                status: true,
                unterschriebenAm: true,
                benutzer: {
                  select: {
                    beschaeftigtennummer: true,
                  },
                },
              },
            },
          },
        },
      },
    }),
  ]);

  if (!organisation) {
    return Response.json(
      { error: "Organisation nicht gefunden." },
      { status: 404 }
    );
  }

  if (!organisation.ikNummer?.trim()) {
    return Response.json(
      {
        error:
          "Institutionskennzeichen (IK) der Organisation fehlt. Bitte unter Unternehmensdaten hinterlegen.",
      },
      { status: 400 }
    );
  }

  const exportRechnungen: EdifactRechnung[] = [];

  for (const rechnung of rechnungen) {
    if (!rechnung.klient.kassenIk?.trim()) continue;

    const einsaetze = rechnung.abrechnungsbuchungen
      .filter(
        (buchung) =>
          buchung.einsatz !== null &&
          buchung.einsatz.status === "GEPRUEFT" &&
          buchung.einsatz.unterschriebenAm !== null
      )
      .map((buchung) => ({
        id: buchung.einsatz!.id,
        datum: buchung.einsatz!.datum,
        startzeit: buchung.einsatz!.startzeit,
        endzeit: buchung.einsatz!.endzeit,
        betrag: Number(buchung.betrag),
        kilometer:
          buchung.einsatz!.kilometer != null
            ? Number(buchung.einsatz!.kilometer)
            : null,
        anfahrtspauschale: buchung.einsatz!.anfahrtspauschale,
        beschaeftigtennummer: buchung.einsatz!.benutzer.beschaeftigtennummer,
      }));

    if (einsaetze.length === 0) continue;

    exportRechnungen.push({
      rechnungsnummer: rechnung.rechnungsnummer,
      rechnungsdatum: rechnung.rechnungsdatum,
      leistungsmonat: rechnung.leistungsmonat,
      leistungsart: rechnung.leistungsart,
      gesamtbetrag: Number(rechnung.gesamtbetrag),
      klient: {
        ...rechnung.klient,
        kassenIk: rechnung.klient.kassenIk!,
      },
      einsaetze,
    });
  }

  try {
    const datei = erzeugeDakotaNutzdatendatei(
      {
        name: organisation.name,
        ikNummer: organisation.ikNummer,
        steuernummer: organisation.steuernummer,
        ustIdNr: organisation.ustIdNr,
      },
      exportRechnungen
    );

    return new Response(datei.inhalt, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=ISO-8859-1",
        "Content-Disposition": `attachment; filename="${datei.dateiname}"`,
        "X-Edifact-Rechnungen": String(datei.rechnungsAnzahl),
        "X-Edifact-Warnungen": encodeURIComponent(datei.warnungen.join("|")),
      },
    });
  } catch (fehler) {
    const meldung =
      fehler instanceof Error
        ? fehler.message
        : "Export der Nutzdatendatei fehlgeschlagen.";
    return Response.json({ error: meldung }, { status: 400 });
  }
}
