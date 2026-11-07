
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { sessionErfordern } from "../../../lib/auth";

export default async function OrganisationLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const organisationId = Number(id);
  const session = await sessionErfordern();

  if (Number(session.organisationId) !== organisationId) {
    notFound();
  }

  const istAdmin = session.rolle === "ADMIN_INHABER";

  const menue = [
    {
      name: "Hauptmenü",
      icon: "⌂",
      href: `/organisationen/${id}`,
    },
    {
      name: "Klienten",
      icon: "♙",
      href: `/organisationen/${id}/klienten`,
    },
    {
      name: "Meine Einsätze",
      icon: "▦",
      href: `/organisationen/${id}/einsaetze/meine`,
    },
    {
      name: "Dokumentationen",
      icon: "▤",
      href: `/organisationen/${id}/dokumentationen`,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-100 md:flex">
      <aside className="w-full bg-[#252B33] md:min-h-screen md:w-64 md:shrink-0">
        <div className="border-b border-slate-600 p-5">
          <Image
            src="/image.png"
            alt="Alltagshelfer Bonn Logo"
            width={75}
            height={56}
            className="h-auto w-auto"
          />

          <p className="mt-3 text-sm font-semibold text-orange-400">
            Alltagshelfer Bonn Rhein Sieg
          </p>
        </div>

        <nav className="space-y-1 p-3">
          {menue.map((eintrag) => (
            <Link
              key={eintrag.href}
              href={eintrag.href}
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm text-orange-400 hover:bg-slate-700"
            >
              <span className="w-6 text-xl">
                {eintrag.icon}
              </span>
              {eintrag.name}
            </Link>
          ))}

          {istAdmin && (
            <>
              <div className="my-3 border-t border-slate-600" />

              <Link
                href={`/organisationen/${id}/abrechnung`}
                className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm text-orange-400 hover:bg-slate-700"
              >
                <span className="w-6 text-xl">€</span>
                Abrechnung
              </Link>

              <Link
                href={`/organisationen/${id}/benutzer`}
                className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm text-orange-400 hover:bg-slate-700"
              >
                <span className="w-6 text-xl">⚙</span>
                Mitarbeiter
              </Link>
            </>
          )}
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        {children}
      </div>
    </div>
  );
}
