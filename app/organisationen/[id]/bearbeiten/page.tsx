import { prisma } from "../../../../lib/prisma";
import { notFound, redirect } from "next/navigation";
import { sessionErfordern } from "../../../../lib/auth";

export default async function OrganisationBearbeitenPage({
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
    notFound();
  }

  const organisation = await prisma.organisation.findUnique({
    where: {
      id: organisationId,
    },
  });

  if (!organisation) {
    notFound();
  }

  async function organisationsdatenSpeichern(formData: FormData) {
    "use server";

    const actionSession = await sessionErfordern();

    if (
      actionSession.organisationId !== organisationId ||
      actionSession.rolle !== "ADMIN_INHABER"
    ) {
      notFound();
    }

    const wertOderNull = (name: string) => {
      const wert = String(formData.get(name) ?? "").trim();
      return wert === "" ? null : wert;
    };

    const name = String(formData.get("name") ?? "").trim();

    if (!name) {
      return;
    }

    await prisma.organisation.update({
      where: {
        id: organisationId,
      },
      data: {
        name,
        strasse: wertOderNull("strasse"),
        hausnummer: wertOderNull("hausnummer"),
        plz: wertOderNull("plz"),
        ort: wertOderNull("ort"),
        telefon: wertOderNull("telefon"),
        email: wertOderNull("email"),
        ikNummer: wertOderNull("ikNummer"),
        steuernummer: wertOderNull("steuernummer"),
        ustIdNr: wertOderNull("ustIdNr"),
      },
    });

    redirect(`/organisationen/${organisationId}`);
  }

  const inputKlasse =
    "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900";

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold text-slate-900">
          Organisationsdaten bearbeiten
        </h1>

        <p className="mt-2 text-slate-600">
          Stammdaten des Leistungserbringers
        </p>

        <form
          action={organisationsdatenSpeichern}
          className="mt-8 space-y-5 rounded-xl bg-white p-6 shadow"
        >
          <div>
            <label className="text-sm font-medium">Name / Firmenname</label>
            <input
              name="name"
              required
              defaultValue={organisation.name}
              className={inputKlasse}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <label className="text-sm font-medium">Straße</label>
              <input
                name="strasse"
                defaultValue={organisation.strasse ?? ""}
                className={inputKlasse}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Hausnummer</label>
              <input
                name="hausnummer"
                defaultValue={organisation.hausnummer ?? ""}
                className={inputKlasse}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-medium">PLZ</label>
              <input
                name="plz"
                defaultValue={organisation.plz ?? ""}
                className={inputKlasse}
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium">Ort</label>
              <input
                name="ort"
                defaultValue={organisation.ort ?? ""}
                className={inputKlasse}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Telefon</label>
            <input
              name="telefon"
              type="tel"
              defaultValue={organisation.telefon ?? ""}
              className={inputKlasse}
            />
          </div>

          <div>
            <label className="text-sm font-medium">E-Mail</label>
            <input
              name="email"
              type="email"
              defaultValue={organisation.email ?? ""}
              className={inputKlasse}
            />
          </div>

          <div className="border-t border-slate-200 pt-5">
            <h2 className="text-lg font-bold text-slate-900">
              Abrechnungsdaten
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Angaben für spätere Rechnungen und Pflegekassenabrechnungen.
            </p>
          </div>

          <div>
            <label className="text-sm font-medium">
              IK-Nummer des Leistungserbringers
            </label>
            <input
              name="ikNummer"
              defaultValue={organisation.ikNummer ?? ""}
              className={inputKlasse}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Steuernummer</label>
            <input
              name="steuernummer"
              defaultValue={organisation.steuernummer ?? ""}
              className={inputKlasse}
            />
          </div>

          <div>
            <label className="text-sm font-medium">
              Umsatzsteuer-Identifikationsnummer
            </label>
            <input
              name="ustIdNr"
              defaultValue={organisation.ustIdNr ?? ""}
              className={inputKlasse}
            />
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white hover:bg-blue-700"
            >
              Organisationsdaten speichern
            </button>

            <a
              href={`/organisationen/${organisationId}`}
              className="rounded-lg bg-slate-200 px-5 py-2 font-semibold text-slate-800 hover:bg-slate-300"
            >
              Abbrechen
            </a>
          </div>
        </form>
      </div>
    </main>
  );
}