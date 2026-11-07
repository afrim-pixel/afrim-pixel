-- CreateEnum
CREATE TYPE "EinsatzStatus" AS ENUM ('OFFEN', 'BESTAETIGT', 'AENDERUNG_GEMELDET');

-- CreateTable
CREATE TABLE "Einsatz" (
    "id" SERIAL NOT NULL,
    "datum" TIMESTAMP(3) NOT NULL,
    "startzeit" TIMESTAMP(3) NOT NULL,
    "endzeit" TIMESTAMP(3) NOT NULL,
    "status" "EinsatzStatus" NOT NULL DEFAULT 'OFFEN',
    "aenderungGemeldet" BOOLEAN NOT NULL DEFAULT false,
    "neuesDatum" TIMESTAMP(3),
    "neueStartzeit" TIMESTAMP(3),
    "neueEndzeit" TIMESTAMP(3),
    "aenderungsGrund" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "benutzerId" INTEGER NOT NULL,
    "klientId" INTEGER NOT NULL,

    CONSTRAINT "Einsatz_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Einsatz" ADD CONSTRAINT "Einsatz_benutzerId_fkey" FOREIGN KEY ("benutzerId") REFERENCES "Benutzer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Einsatz" ADD CONSTRAINT "Einsatz_klientId_fkey" FOREIGN KEY ("klientId") REFERENCES "Klient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
