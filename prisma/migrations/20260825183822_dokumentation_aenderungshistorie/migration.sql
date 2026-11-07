-- CreateTable
CREATE TABLE "DokumentationAenderung" (
    "id" SERIAL NOT NULL,
    "alterText" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dokumentationId" INTEGER NOT NULL,
    "benutzerId" INTEGER NOT NULL,

    CONSTRAINT "DokumentationAenderung_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DokumentationAenderung" ADD CONSTRAINT "DokumentationAenderung_dokumentationId_fkey" FOREIGN KEY ("dokumentationId") REFERENCES "Dokumentation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DokumentationAenderung" ADD CONSTRAINT "DokumentationAenderung_benutzerId_fkey" FOREIGN KEY ("benutzerId") REFERENCES "Benutzer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
