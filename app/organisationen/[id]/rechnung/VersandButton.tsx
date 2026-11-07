"use client";

export default function VersandButton() {
  return (
    <div className="flex flex-col gap-2">
      <select
        name="versandart"
        required
        defaultValue=""
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
      >
        <option value="" disabled>
          Versandart auswählen
        </option>
        <option value="POST">Post</option>
        <option value="EMAIL">E-Mail</option>
        <option value="DAKOTA">Dakota</option>
      </select>

      <button
        type="submit"
        className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white"
        onClick={(event) => {
          const bestaetigt = window.confirm(
            "Hast du diese Rechnung tatsächlich bereits versendet?\n\n" +
              "Nur mit OK wird der Versand gespeichert."
          );

          if (!bestaetigt) {
            event.preventDefault();
          }
        }}
      >
        Als versendet markieren
      </button>
    </div>
  );
}