"use client";

type AusfallMeldenButtonProps = {
  text?: string;
};

export default function AusfallMeldenButton({
  text = "Ausfall melden",
}: AusfallMeldenButtonProps) {
  return (
    <button
      type="submit"
      onClick={(event) => {
        const bestaetigt = window.confirm(
          "Soll dieser Einsatz wirklich als Ausfall gemeldet werden?"
        );

        if (!bestaetigt) {
          event.preventDefault();
        }
      }}
      className="mt-2 ml-2 inline-block rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
    >
      {text}
    </button>
  );
}