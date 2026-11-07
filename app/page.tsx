import { prisma } from "../lib/prisma";
import { redirect } from "next/navigation";
import { sessionLoeschen } from "../lib/auth";

export default async function Home() {
async function abmelden() {
  "use server";

  await sessionLoeschen();
  redirect("/login");
}
  const organisationen = await prisma.organisation.count();
  const benutzer = await prisma.benutzer.count();
  const klienten = await prisma.klient.count();

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold text-slate-900">
          Betreuungssoftware
        </h1>

        <p className="mt-2 text-slate-600">
          Verwaltungs- und Abrechnungssoftware
        </p>

        <form action={abmelden} className="mt-4">
  <button
    type="submit"
    className="rounded-lg bg-slate-900 px-4 py-2 text-white"
  >
    Abmelden
  </button>
</form>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl bg-white p-6 shadow">
            <p className="text-sm text-slate-500">Organisationen</p>
            <p className="mt-2 text-3xl font-bold">{organisationen}</p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow">
            <p className="text-sm text-slate-500">Benutzer</p>
            <p className="mt-2 text-3xl font-bold">{benutzer}</p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow">
            <p className="text-sm text-slate-500">Klienten</p>
            <p className="mt-2 text-3xl font-bold">{klienten}</p>
          </div>
        </div>
      </div>
    </main>
  );
}