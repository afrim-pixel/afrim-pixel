import { prisma } from "../../../../../../lib/prisma";
import { notFound } from "next/navigation";
import { sessionErfordern } from "../../../../../../lib/auth";

export default async function KlientenZuweisenPage({
  params,
}: {
  params: Promise<{
    id: string;
    benutzerId: string;
  }>;
}) {
  const { id, benutzerId } = await params;

  const organisationId = Number(id);
  const benutzerIdNummer = Number(benutzerId);

  const session = await sessionErfordern();

  if (session.organisationId !== organisationId) {
    notFound();
  }

  if (session.rolle !== "ADMIN_INHABER") {
    notFound();
  }

  const benutzer = await prisma.benutzer.findFirst({
    where: {
      id: benutzerIdNummer,
      organisationId,
    },
  });

  if (!benutzer) {
    notFound();
  }

  const klienten = await prisma.klient.findMany({
    where: {
      organisationId,
      aktiv: true,
    },
    include: {
      mitarbeiterZuweisungen: {
        where: {
          benutzerId: benutzerIdNummer,
        },
      },
    },
    orderBy: {
      nachname: "asc",
    },
  });
async function klientZuweisen(formData: FormData) {
  "use server";

  const actionSession = await sessionErfordern();

  if (
    actionSession.organisationId !== organisationId ||
    actionSession.rolle !== "ADMIN_INHABER"
  ) {
    notFound();
  }

  const klientId = Number(formData.get("klientId"));

  const actionBenutzer = await prisma.benutzer.findFirst({
  where: {
    id: benutzerIdNummer,
    organisationId,
  },
});

if (!actionBenutzer) {
  notFound();
}

  const klient = await prisma.klient.findFirst({
    where: {
      id: klientId,
      organisationId,
    },
  });

  if (!klient) {
    notFound();
  }

  await prisma.klientZuweisung.upsert({
    where: {
      benutzerId_klientId: {
        benutzerId: benutzerIdNummer,
        klientId,
      },
    },
    update: {},
    create: {
      benutzerId: benutzerIdNummer,
      klientId,
    },
  });
}

async function klientZuweisungEntfernen(formData: FormData) {
  "use server";

  const actionSession = await sessionErfordern();

  if (
    actionSession.organisationId !== organisationId ||
    actionSession.rolle !== "ADMIN_INHABER"
  ) {
    notFound();
  }
const actionBenutzer = await prisma.benutzer.findFirst({
  where: {
    id: benutzerIdNummer,
    organisationId,
  },
});

if (!actionBenutzer) {
  notFound();
}
  const klientId = Number(formData.get("klientId"));

  await prisma.klientZuweisung.deleteMany({
    where: {
      benutzerId: benutzerIdNummer,
      klientId,
    },
  });
}
  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold text-slate-900">
          Klienten zuweisen
        </h1>

        <p className="mt-2 text-slate-600">
          Mitarbeiter: {benutzer.vorname} {benutzer.nachname}
        </p>

        <a
          href={`/organisationen/${organisationId}/benutzer`}
          className="mt-4 inline-block rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900"
        >
          Zurück zu Benutzer
        </a>

        <div className="mt-8 space-y-4">
          {klienten.map((klient) => {
            const istZugewiesen =
              klient.mitarbeiterZuweisungen.length > 0;

            return (
              <div
                key={klient.id}
                className="rounded-xl bg-white p-6 shadow"
              >
                <p className="font-semibold text-slate-900">
                  {klient.vorname} {klient.nachname}
                </p>

                <p className="mt-2 text-sm text-slate-600">
                  Status:{" "}
                  {istZugewiesen
                    ? "Zugewiesen"
                    : "Nicht zugewiesen"}
                </p>
                {istZugewiesen ? (
  <form action={klientZuweisungEntfernen} className="mt-4">
    <input type="hidden" name="klientId" value={klient.id} />
    <button
      type="submit"
      className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
    >
      Zuweisung entfernen
    </button>
  </form>
) : (
  <form action={klientZuweisen} className="mt-4">
    <input type="hidden" name="klientId" value={klient.id} />
    <button
      type="submit"
      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
    >
      Zuweisen
    </button>
  </form>
)}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}