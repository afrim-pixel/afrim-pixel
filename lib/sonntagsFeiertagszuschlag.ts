/**
 * Berechnung von Sonntagen und gesetzlichen Feiertagen
 * in Nordrhein-Westfalen.
 *
 * Verwendet die Zeitzone Europe/Berlin.
 */

function ostersonntag(jahr: number): Date {
  const a = jahr % 19;
  const b = Math.floor(jahr / 100);
  const c = jahr % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);

  const monat = Math.floor((h + l - 7 * m + 114) / 31);
  const tag = ((h + l - 7 * m + 114) % 31) + 1;

  return new Date(Date.UTC(jahr, monat - 1, tag, 12));
}

function datumSchluessel(datum: Date): string {
  return datum.toISOString().slice(0, 10);
}

export function istSonntagOderFeiertag(datum: Date): boolean {
  if (Number.isNaN(datum.getTime())) return false;

  const teile = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(datum);

  const jahr = Number(teile.find((teil) => teil.type === "year")?.value);

  const monat = Number(teile.find((teil) => teil.type === "month")?.value);

  const tag = Number(teile.find((teil) => teil.type === "day")?.value);

  const datumNRW = [
    String(jahr).padStart(4, "0"),
    String(monat).padStart(2, "0"),
    String(tag).padStart(2, "0"),
  ].join("-");

  const pruefdatum = new Date(Date.UTC(jahr, monat - 1, tag, 12));

  if (pruefdatum.getUTCDay() === 0) return true;

  const ostern = ostersonntag(jahr);

  const feiertage = [
    new Date(Date.UTC(jahr, 0, 1, 12)),
    new Date(ostern.getTime() - 2 * 86400000),
    ostern,
    new Date(ostern.getTime() + 1 * 86400000),
    new Date(Date.UTC(jahr, 4, 1, 12)),
    new Date(ostern.getTime() + 39 * 86400000),
    new Date(ostern.getTime() + 50 * 86400000),
    new Date(ostern.getTime() + 60 * 86400000),
    new Date(Date.UTC(jahr, 9, 3, 12)),
    new Date(Date.UTC(jahr, 10, 1, 12)),
    new Date(Date.UTC(jahr, 11, 25, 12)),
    new Date(Date.UTC(jahr, 11, 26, 12)),
  ];

  return feiertage.some((feiertag) => datumSchluessel(feiertag) === datumNRW);
}
