"use client";

type EinsatzBestaetigenButtonProps = {
  hatUnterschrift: boolean;
};

export default function EinsatzBestaetigenButton({
  hatUnterschrift,
}: EinsatzBestaetigenButtonProps) {
  return (
    <button
      type="submit"
      onClick={(event) => {
        if (!hatUnterschrift) {
          event.preventDefault();
          alert(
            "Kundenunterschrift fehlt. Bitte zuerst die Unterschrift erfassen."
          );
        }
      }}
      className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
    >
      Einsatz bestätigen
    </button>
  );
}