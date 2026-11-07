-- CreateTable
CREATE TABLE "Abrechnungsbuchung" (
    "id" SERIAL NOT NULL,
    "datum" TIMESTAMP(3) NOT NULL,
    "betrag" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "klientId" INTEGER NOT NULL,

    CONSTRAINT "Abrechnungsbuchung_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Abrechnungsbuchung" ADD CONSTRAINT "Abrechnungsbuchung_klientId_fkey" FOREIGN KEY ("klientId") REFERENCES "Klient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
