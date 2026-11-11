import { prisma } from "../../../lib/prisma";
import { notFound, redirect } from "next/navigation";
import { sessionErfordern, sessionLoeschen } from "../../../lib/auth";

export default async function OrganisationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const organisationId = Number(id);

  const session = await sessionErfordern();

  if (session.organisationId !== organisationId) {
    notFound();
  }

  async function abmelden() {
  "use server";

  await sessionLoeschen();
  redirect("/login");
}

  const [angemeldeterBenutzer, organisation, benutzer, klienten] =
    await Promise.all([
      prisma.benutzer.findFirst({
        where: {
          id: Number(session.benutzerId),
          organisationId,
        },
        select: {
          vorname: true,
          nachname: true,
        },
      }),
      prisma.organisation.findUnique({
        where: {
          id: organisationId,
        },
      }),
      prisma.benutzer.count({
        where: {
          organisationId: organisationId,
        },
      }),
      prisma.klient.count({
        where: {
          organisationId,
          ...(session.rolle === "MITARBEITER"
            ? {
                mitarbeiterZuweisungen: {
                  some: {
                    benutzerId: Number(session.benutzerId),
                  },
                },
              }
            : {}),
        },
      }),
    ]);

  if (!organisation) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold text-slate-900">
          {organisation.name}
        </h1>

        <p className="mt-2 text-slate-600">
          {session.rolle === "MITARBEITER" && angemeldeterBenutzer
  ? `${angemeldeterBenutzer.vorname} ${angemeldeterBenutzer.nachname}`
  : "Organisationsdetails"}

        </p>
        <form action={abmelden} className="mt-4">
          <button
            type="submit"
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900"
          >
            Abmelden
          </button>
        </form>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <a
  href={`/organisationen/${organisationId}/klienten`}
  className="rounded-xl bg-white p-6 shadow hover:bg-slate-50"
>
  <p className="text-sm text-slate-500">
    {session.rolle === "MITARBEITER" ? "Meine Klienten" : "Klienten"}
  </p>

  <p className="mt-2 text-3xl font-bold">
    {klienten}
  </p>
</a>

          <a
  href={
  session.rolle === "MITARBEITER"
    ? `/organisationen/${organisationId}/einsaetze/meine`
    : `/organisationen/${organisationId}/einsaetze`
}
  className="rounded-xl bg-white p-6 shadow hover:bg-slate-50"
>
  <p className="text-sm text-slate-500">
    {session.rolle === "MITARBEITER"
  ? "Meine Einsätze"
  : "Einsatzplanung"}
  </p>

  <p className="mt-2 text-lg font-bold text-slate-900">
    {session.rolle === "MITARBEITER"
  ? "Meine Einsätze öffnen"
  : "Einsätze öffnen"}
  </p>
</a>
<a
  href={`/organisationen/${organisationId}/dokumentationen`}
  className="rounded-xl bg-white p-6 shadow hover:bg-slate-50"
>
  <p className="text-sm text-slate-500">
    {session.rolle === "MITARBEITER"
  ? "Meine Dokumentationen"
  : "Dokumentationen"}
  </p>

  <p className="mt-2 text-lg font-bold text-slate-900">
    Dokumentationen öffnen
  </p>
</a>

{session.rolle === "ADMIN_INHABER" && (
  <a
    href={`/organisationen/${organisationId}/abrechnung`}
    className="rounded-xl bg-white p-6 shadow hover:bg-slate-50"
  >
    <p className="text-sm text-slate-500">
      Abrechnung
    </p>

    <p className="mt-2 text-lg font-bold text-slate-900">
      Abrechnung erstellen
    </p>
  </a>
)}

{session.rolle === "ADMIN_INHABER" && (
  <a
    href={`/organisationen/${organisationId}/rechnung`}
    className="rounded-xl bg-white p-6 shadow hover:bg-slate-50"
  >
    <p className="text-sm text-slate-500">
      Rechnungen
    </p>

    <p className="mt-2 text-lg font-bold text-slate-900">
      Erstellte Rechnungen
    </p>
  </a>
)}

{session.rolle === "ADMIN_INHABER" && (
  <a
    href={`/organisationen/${organisationId}/bearbeiten`}
    className="rounded-xl bg-white p-6 shadow hover:bg-slate-50"
  >
    <p className="text-sm text-slate-500">
      Unternehmensdaten
    </p>

    <p className="mt-2 text-lg font-bold text-slate-900">
      Unternehmensdaten bearbeiten
    </p>
  </a>
)}

          {session.rolle === "ADMIN_INHABER" && (
  <div className="rounded-xl bg-white p-6 shadow">
    <p className="text-sm text-slate-500">Benutzer</p>
    <p className="mt-2 text-3xl font-bold">{benutzer}</p>
  </div>
)}
        </div>
      </div>
    </main>
  );
}