-- CreateTable
CREATE TABLE "Dokumentation" (
    "id" SERIAL NOT NULL,
    "datum" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "klientId" INTEGER NOT NULL,

    CONSTRAINT "Dokumentation_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Dokumentation" ADD CONSTRAINT "Dokumentation_klientId_fkey" FOREIGN KEY ("klientId") REFERENCES "Klient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
