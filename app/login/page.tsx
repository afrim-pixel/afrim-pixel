import { prisma } from "../../lib/prisma";
import { compare } from "bcryptjs";
import { redirect } from "next/navigation";
import { sessionErstellen } from "../../lib/auth";

export default function LoginPage() {
  async function anmelden(formData: FormData) {
    "use server";

    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const passwort = String(formData.get("passwort") ?? "");

    const benutzer = await prisma.benutzer.findUnique({
      where: {
        email,
      },
    });

    if (!benutzer || !benutzer.aktiv) {
      redirect("/login?fehler=1");
    }

    const passwortKorrekt = await compare(
      passwort,
      benutzer.passwortHash
    );

    if (!passwortKorrekt) {
      redirect("/login?fehler=1");
    }

await sessionErstellen(
  benutzer.id,
  benutzer.organisationId,
  benutzer.rolle
);

    redirect(`/organisationen/${benutzer.organisationId}`);
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-md">
        <h1 className="text-3xl font-bold text-slate-900">
          Anmeldung
        </h1>

        <p className="mt-2 text-slate-600">
          Betreuungssoftware
        </p>

        <form
          action={anmelden}
          className="mt-8 rounded-xl bg-white p-6 shadow"
        >
          <div className="grid gap-6">
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
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>

            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
            >
              Anmelden
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
 