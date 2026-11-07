import { prisma } from "../../../../../lib/prisma";
import { redirect } from "next/navigation";
import { sessionErfordern } from "../../../../../lib/auth";

export default async function NeuerKlientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const organisationId = Number(id);

  const session = await sessionErfordern();

if (
  session.organisationId !== organisationId ||
  session.rolle !== "ADMIN_INHABER"
) {
  redirect(`/organisationen/${organisationId}/klienten`);
}

  async function klientAnlegen(formData: FormData) {
    "use server";

    const aktuelleSession = await sessionErfordern();

if (
  aktuelleSession.organisationId !== organisationId ||
  aktuelleSession.rolle !== "ADMIN_INHABER"
) {
  throw new Error("Keine Berechtigung zum Anlegen von Klienten.");
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
    await prisma.klient.create({
      data: {
        vorname,
        nachname,
        geburtsdatum: new Date(geburtsdatum),
        strasse,
        hausnummer,
        plz,
        ort,
        telefon,
        email,
        organisationId,
      },
    });

    redirect(`/organisationen/${organisationId}/klienten`);
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold text-slate-900">
          Neuen Klienten anlegen
        </h1>

        <p className="mt-2 text-slate-600">
          Klientendaten erfassen
        </p>

        <form
          action={klientAnlegen}
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
                required
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
                required
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
                required
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
    className="w-full rounded-lg border border-slate-300 px-3 py-2"
  />
</div>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
            >
              Klienten speichern
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}