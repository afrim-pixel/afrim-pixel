-- CreateTable
CREATE TABLE "Rechnung" (
    "id" SERIAL NOT NULL,
    "rechnungsnummer" TEXT NOT NULL,
    "rechnungsdatum" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leistungsmonat" TIMESTAMP(3) NOT NULL,
    "gesamtbetrag" DECIMAL(65,30) NOT NULL,
    "erstelltAm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "klientId" INTEGER NOT NULL,

    CONSTRAINT "Rechnung_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Rechnung_rechnungsnummer_key" ON "Rechnung"("rechnungsnummer");

-- AddForeignKey
ALTER TABLE "Rechnung" ADD CONSTRAINT "Rechnung_klientId_fkey" FOREIGN KEY ("klientId") REFERENCES "Klient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
