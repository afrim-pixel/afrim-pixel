-- AlterTable
ALTER TABLE "Dokumentation" ADD COLUMN     "einsatzId" INTEGER;

-- AddForeignKey
ALTER TABLE "Dokumentation" ADD CONSTRAINT "Dokumentation_einsatzId_fkey" FOREIGN KEY ("einsatzId") REFERENCES "Einsatz"("id") ON DELETE SET NULL ON UPDATE CASCADE;
