import Holidays from "date-holidays";

const feiertageNRW = new Holidays("DE", "NW");

export function istSonntagOderFeiertag(datum: Date): boolean {
  const datumNRW = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(datum);

  const [jahr, monat, tag] = datumNRW.split("-").map(Number);

  const pruefdatum = new Date(jahr, monat - 1, tag, 12);

  const istSonntag = pruefdatum.getDay() === 0;

  const istGesetzlicherFeiertag = feiertageNRW
    .isHoliday(pruefdatum);

  return istSonntag || Boolean(
    istGesetzlicherFeiertag &&
    istGesetzlicherFeiertag.some(
      (feiertag) => feiertag.type === "public"
    )
  );
}