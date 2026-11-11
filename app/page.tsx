import Link from "next/link";
import { sessionErfordern } from "../lib/auth";
import EdifactExportButton from "./EdifactExportButton";

export default async function Home() {
  const session = await sessionErfordern();
  const organisationId = Number(session.organisationId);
  const istAdmin = session.rolle === "ADMIN_INHABER";

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-3xl rounded-xl bg-white p-8 shadow">
        <h1 className="text-3xl font-bold text-slate-900">
          Betreuungssoftware
        </h1>
        <p className="mt-3 text-slate-600">
          Zentrale Einstiegsseite. Von hier aus gelangen Sie zur Organisation
          und können Abrechnungsdaten für dakota.le exportieren.
        </p>

        <Link
          href={`/organisationen/${organisationId}`}
          className="mt-6 inline-block rounded-lg bg-slate-800 px-5 py-3 font-semibold text-white hover:bg-slate-900"
        >
          Zur Organisation
        </Link>

        {istAdmin ? (
          <>
            <h2 className="mt-10 text-xl font-semibold text-slate-900">
              Elektronische Abrechnung
            </h2>
            <p className="mt-2 text-slate-600">
              Exportiert geprüfte, unterschriebene und noch nicht versendete
              Rechnungen als UN/EDIFACT-Nutzdatendatei (SLGA/SLLA) für
              dakota.le gemäß § 302 SGB V.
            </p>
            <EdifactExportButton />
          </>
        ) : (
          <p className="mt-8 text-sm text-slate-500">
            Der dakota.le-Export ist nur für Inhaber verfügbar.
          </p>
        )}
      </div>
    </main>
  );
}
