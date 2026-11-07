import { prisma } from "../../../../../lib/prisma";
import { notFound, redirect } from "next/navigation";
import { sessionErfordern } from "../../../../../lib/auth";
import { hash } from "bcryptjs";

export default async function NeuerBenutzerPage({
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

  async function benutzerErstellen(formData: FormData) {
    "use server";

    const actionSession = await sessionErfordern();

    if (
      actionSession.organisationId !== organisationId ||
      actionSession.rolle !== "ADMIN_INHABER"
    ) {
      notFound();
    }

    const vorname = String(formData.get("vorname") ?? "").trim();
    const nachname = String(formData.get("nachname") ?? "").trim();
    const email = String(formData.get("email") ?? "")
      .trim()
      .toLowerCase();
    const passwort = String(formData.get("passwort") ?? "");

    if (!vorname || !nachname || !email || !passwort) {
      return;
    }

    const passwortHash = await hash(passwort, 12);

    await prisma.benutzer.create({
      data: {
        vorname,
        nachname,
        email,
        passwortHash,
        organisationId,
        rolle: "MITARBEITER",
      },
    });

    redirect(`/organisationen/${organisationId}/benutzer`);
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-xl">
        <h1 className="text-3xl font-bold text-slate-900">
          Mitarbeiter anlegen
        </h1>

        <p className="mt-2 text-slate-600">
          Neuen Mitarbeiter erstellen
        </p>

        <form
          action={benutzerErstellen}
          className="mt-8 rounded-xl bg-white p-6 shadow"
        >
          <div className="grid gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Vorname
              </label>
              <input
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
                name="nachname"
                required
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
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Passwort
              </label>
              <input
                type="password"
                name="passwort"
                required
                minLength={8}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>

            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
            >
              Mitarbeiter erstellen
            </button>

            <a
              href={`/organisationen/${organisationId}/benutzer`}
              className="text-center text-sm font-semibold text-slate-600 hover:underline"
            >
              Abbrechen
            </a>
          </div>
        </form>
      </div>
    </main>
  );
}