import { prisma } from "../../lib/prisma";

export default async function OrganisationenPage() {
  const organisationen = await prisma.organisation.findMany({
    orderBy: {
      name: "asc",
    },
  });

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold text-slate-900">
          Organisationen
        </h1>

        <p className="mt-2 text-slate-600">
          Übersicht aller Organisationen
        </p>

        <div className="mt-8 rounded-xl bg-white p-6 shadow">
          {organisationen.map((organisation) => (
            <div
              key={organisation.id}
              className="border-b border-slate-200 py-4 last:border-b-0"
            >
<a
  href={`/organisationen/${organisation.id}`}
  className="font-semibold text-blue-700 hover:underline"
>
  {organisation.name}
</a>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}