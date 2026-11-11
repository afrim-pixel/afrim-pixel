import { prisma } from "../../../../../../lib/prisma";
import { notFound, redirect } from "next/navigation";
import { sessionErfordern } from "../../../../../../lib/auth";
import { ok } from "assert";

export default async function KlientBearbeitenPage({
  params,
}: {
  params: Promise<{ id: string; klientId: string }>;
}) {
  const { id, klientId } = await params;

  const organisationId = Number(id);
  const klientIdNummer = Number(klientId);

  const session = await sessionErfordern();

  if (session.organisationId !== organisationId) {
    notFound();
  }
if (session.rolle !== "ADMIN_INHABER") {
  notFound();
}
  const klient = await prisma.klient.findFirst({
    where: {
      id: klientIdNummer,
      organisationId,
    },
    include: {
  leistungsarten: true,
    },
  });

  if (!klient) {
    notFound();
  }
async function klientAktualisieren(formData: FormData) {
  "use server";
const actionSession = await sessionErfordern();

if (
  actionSession.organisationId !== organisationId ||
  actionSession.rolle !== "ADMIN_INHABER"
) {
  notFound();
}
const actionKlient = await prisma.klient.findFirst({
  where: {
    id: klientIdNummer,
    organisationId,
  },
});

if (!actionKlient) {
  notFound();
}
  const vorname = formData.get("vorname") as string;
  const nachname = formData.get("nachname") as string;
  const geburtsdatum = formData.get("geburtsdatum") as string;
  const strasse = (formData.get("strasse") as string) || null;
  const hausnummer = (formData.get("hausnummer") as string) || null;
  const plz = (formData.get("plz") as string) || null;
  const ort = (formData.get("ort") as string) || null;
  const telefon = (formData.get("telefon") as string) || null;
  const email = (formData.get("email") as string) || null;
  const pflegekasse = (formData.get("pflegekasse") as string) || null;
  const pflegekasseStrasse =
  (formData.get("pflegekasseStrasse") as string)?.trim() || null;
const versichertennummer =
  (formData.get("versichertennummer") as string) || null;
  const pflegekasseHausnummer =
  (formData.get("pflegekasseHausnummer") as string)?.trim() || null;
  const pflegekassePlz =
  (formData.get("pflegekassePlz") as string)?.trim() || null;
  const pflegekasseOrt =
  (formData.get("pflegekasseOrt") as string)?.trim() || null;
const kassenIk = (formData.get("kassenIk") as string) || null;
const leistungsarten = formData.getAll("leistungsarten") as (
  | "ENTLASTUNGSBETRAG_45B"
  | "UMWANDLUNGSANSPRUCH_45A"
  | "PFLEGESACHLEISTUNG_36"
  | "VERHINDERUNGSPFLEGE_39"
  | "SELBSTZAHLER"
)[];
const leistungsbeginn =
  (formData.get("leistungsbeginn") as string) || null;

  const pflegegrad =
  (formData.get("pflegegrad") as string) || null;


const stundensatz =
  (formData.get("stundensatz") as string) || null;

  await prisma.klient.update({
    where: {
      id: klientIdNummer,
    },
    data: {
      vorname,
      nachname,
      geburtsdatum: geburtsdatum ? new Date(geburtsdatum) : null,
      strasse,
      hausnummer,
      plz,
      ort,
      telefon,
      email,
      pflegekasse,
      pflegekasseStrasse,
      pflegekasseHausnummer,
      pflegekassePlz,
      pflegekasseOrt,
      versichertennummer,
      kassenIk,
      leistungsbeginn: leistungsbeginn
  ? new Date(leistungsbeginn)
  : null,
  pflegegrad: pflegegrad ? Number(pflegegrad) : null,

  stundensatz: stundensatz
  ? Number(stundensatz.replace(",", "."))
  : null,

    },
  });

  await prisma.klientLeistungsart.deleteMany({
  where: {
    klientId: klientIdNummer,
  },
});

if (leistungsarten.length > 0) {
  await prisma.klientLeistungsart.createMany({
    data: leistungsarten.map((leistungsart) => ({
      klientId: klientIdNummer,
      leistungsart,
    })),
  });
}
  redirect(`/organisationen/${organisationId}/klienten/${klientIdNummer}`);
}
  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold text-slate-900">
          Stammdaten bearbeiten
        </h1>

        <p className="mt-2 text-slate-600">
          {klient.vorname} {klient.nachname}
        </p>
<form
  action={klientAktualisieren}
  className="mt-8 rounded-xl bg-white p-6 shadow"
>
  <div className="grid gap-6">
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        Vorname
      </label>
      <input
        type="text"
        name="vorname"
        defaultValue={klient.vorname}
        className="w-full rounded-lg border border-slate-300 px-3 py-2"
      />
    </div>

    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        Nachname
      </label>
      <input
        type="text"
        name="nachname"
        defaultValue={klient.nachname}
        className="w-full rounded-lg border border-slate-300 px-3 py-2"
      />
    </div>

    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        Geburtsdatum
      </label>
      <input
        type="date"
        name="geburtsdatum"
        defaultValue={
          klient.geburtsdatum
            ? klient.geburtsdatum.toISOString().split("T")[0]
            : ""
        }
        className="w-full rounded-lg border border-slate-300 px-3 py-2"
      />
    </div>
    <div>
  <label className="mb-2 block text-sm font-medium text-slate-700">
    Straße
  </label>
  <input
    type="text"
    name="strasse"
    defaultValue={klient.strasse ?? ""}
    className="w-full rounded-lg border border-slate-300 px-3 py-2"
  />
</div>

<div>
  <label className="mb-2 block text-sm font-medium text-slate-700">
    Hausnummer
  </label>
  <input
    type="text"
    name="hausnummer"
    defaultValue={klient.hausnummer ?? ""}
    className="w-full rounded-lg border border-slate-300 px-3 py-2"
  />
</div>
<div>
  <label className="mb-2 block text-sm font-medium text-slate-700">
    PLZ
  </label>
  <input
    type="text"
    name="plz"
    defaultValue={klient.plz ?? ""}
    className="w-full rounded-lg border border-slate-300 px-3 py-2"
  />
</div>

<div>
  <label className="mb-2 block text-sm font-medium text-slate-700">
    Ort
  </label>
  <input
    type="text"
    name="ort"
    defaultValue={klient.ort ?? ""}
    className="w-full rounded-lg border border-slate-300 px-3 py-2"
  />
</div>
<div>
  <label className="mb-2 block text-sm font-medium text-slate-700">
    Telefon
  </label>
  <input
    type="tel"
    name="telefon"
    defaultValue={klient.telefon ?? ""}
    className="w-full rounded-lg border border-slate-300 px-3 py-2"
  />
</div>

<div>
  <label className="mb-2 block text-sm font-medium text-slate-700">
    E-Mail
  </label>
  <input
    type="email"
    name="email"
    defaultValue={klient.email ?? ""}
    className="w-full rounded-lg border border-slate-300 px-3 py-2"
  />
</div>
<div className="mt-6 border-t border-slate-200 pt-6">
  <h2 className="text-lg font-bold text-slate-900">
    Kranken- und Pflegeversicherung
  </h2>
  <p className="mt-1 text-sm text-slate-500">
    Angaben für die spätere Abrechnung mit der Pflegekasse.
  </p>
</div>

<div>
  <label className="mb-2 block text-sm font-medium text-slate-700">
    Pflegekasse / Krankenkasse
  </label>
  <input
    type="text"
    name="pflegekasse"
    defaultValue={klient.pflegekasse ?? ""}
    placeholder="z. B. AOK Rheinland/Hamburg"
    className="w-full rounded-lg border border-slate-300 px-3 py-2"
  />
</div>

<div>
  <label className="mb-2 block text-sm font-medium text-slate-700">
    Straße der Pflegekasse
  </label>
  <input
    type="text"
    name="pflegekasseStrasse"
    defaultValue={klient.pflegekasseStrasse ?? ""}
    className="w-full rounded-lg border border-slate-300 px-3 py-2"
  />
</div>

<div>
  <label className="mb-2 block text-sm font-medium text-slate-700">
    Hausnummer der Pflegekasse
  </label>
  <input
    type="text"
    name="pflegekasseHausnummer"
    defaultValue={klient.pflegekasseHausnummer ?? ""}
    className="w-full rounded-lg border border-slate-300 px-3 py-2"
  />
</div>

<div>
  <label className="mb-2 block text-sm font-medium text-slate-700">
    Postleitzahl der Pflegekasse
  </label>
  <input
    type="text"
    name="pflegekassePlz"
    defaultValue={klient.pflegekassePlz ?? ""}
    className="w-full rounded-lg border border-slate-300 px-3 py-2"
  />
</div>

<div>
  <label className="mb-2 block text-sm font-medium text-slate-700">
    Ort der Pflegekasse
  </label>
  <input
    type="text"
    name="pflegekasseOrt"
    defaultValue={klient.pflegekasseOrt ?? ""}
    className="w-full rounded-lg border border-slate-300 px-3 py-2"
  />
</div>

<div>
  <label className="mb-2 block text-sm font-medium text-slate-700">
    Versichertennummer
  </label>
  <input
    type="text"
    name="versichertennummer"
    defaultValue={klient.versichertennummer ?? ""}
    className="w-full rounded-lg border border-slate-300 px-3 py-2"
  />
</div>

<div>
  <label className="mb-2 block text-sm font-medium text-slate-700">
    IK der Pflegekasse
  </label>
  <input
    type="text"
    name="kassenIk"
    defaultValue={klient.kassenIk ?? ""}
    placeholder="Institutionskennzeichen der Pflegekasse"
    className="w-full rounded-lg border border-slate-300 px-3 py-2"
  />
</div>
<div>
  <label className="mb-2 block text-sm font-medium text-slate-700">
    Leistungsarten
  </label>
  <label className="flex items-center gap-2">
  <input
    type="checkbox"
    name="leistungsarten"
    value="ENTLASTUNGSBETRAG_45B"
    defaultChecked={klient.leistungsarten.some(
      (eintrag) => eintrag.leistungsart === "ENTLASTUNGSBETRAG_45B"
    )}
  />
  <span>§ 45b SGB XI – Entlastungsbetrag</span>
</label>

<label className="flex items-center gap-2">
  <input
    type="checkbox"
    name="leistungsarten"
    value="UMWANDLUNGSANSPRUCH_45A"
    defaultChecked={klient.leistungsarten.some(
      (eintrag) => eintrag.leistungsart === "UMWANDLUNGSANSPRUCH_45A"
    )}
  />
  <span>§ 45a SGB XI – Umwandlungsanspruch</span>
</label>

<label className="flex items-center gap-2">
  <input
    type="checkbox"
    name="leistungsarten"
    value="PFLEGESACHLEISTUNG_36"
    defaultChecked={klient.leistungsarten.some(
      (eintrag) => eintrag.leistungsart === "PFLEGESACHLEISTUNG_36"
    )}
  />
  <span>§ 36 SGB XI – Pflegesachleistungen</span>
</label>

<label className="flex items-center gap-2">
  <input
    type="checkbox"
    name="leistungsarten"
    value="VERHINDERUNGSPFLEGE_39"
    defaultChecked={klient.leistungsarten.some(
      (eintrag) => eintrag.leistungsart === "VERHINDERUNGSPFLEGE_39"
    )}
  />
  <span>§ 39 SGB XI – Verhinderungspflege</span>
</label>

<label className="flex items-center gap-2">
  <input
    type="checkbox"
    name="leistungsarten"
    value="SELBSTZAHLER"
    defaultChecked={klient.leistungsarten.some(
      (eintrag) => eintrag.leistungsart === "SELBSTZAHLER"
    )}
  />
  <span>Selbstzahler</span>
</label>

</div>
<div>
  <label className="mb-2 block text-sm font-medium text-slate-700">
    Pflegegrad
  </label>

  <select
    name="pflegegrad"
    defaultValue={klient.pflegegrad?.toString() ?? ""}
    className="w-full rounded-lg border border-slate-300 px-3 py-2"
  >
    <option value="">Bitte auswählen</option>
    <option value="1">Pflegegrad 1</option>
    <option value="2">Pflegegrad 2</option>
    <option value="3">Pflegegrad 3</option>
    <option value="4">Pflegegrad 4</option>
    <option value="5">Pflegegrad 5</option>
  </select>
</div>
<div>
  <label className="mb-2 block text-sm font-medium text-slate-700">
    Stundensatz (€)
  </label>

  <input
    type="text"
    name="stundensatz"
    defaultValue={
      klient.stundensatz
        ? klient.stundensatz.toString().replace(".", ",")
        : ""
    }
    placeholder="z. B. 39,50"
    className="w-full rounded-lg border border-slate-300 px-3 py-2"
  />
</div>

<div>
  <label className="mb-2 block text-sm font-medium text-slate-700">
    Leistungsbeginn
  </label>

  <input
    type="date"
    name="leistungsbeginn"
    defaultValue={
      klient.leistungsbeginn
        ? klient.leistungsbeginn.toISOString().split("T")[0]
        : ""
    }
    className="w-full rounded-lg border border-slate-300 px-3 py-2"
  />
</div>
<button
  type="submit"
  className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
>
  Änderungen speichern
</button>
  </div>
</form>
      </div>
    </main>
  );
}