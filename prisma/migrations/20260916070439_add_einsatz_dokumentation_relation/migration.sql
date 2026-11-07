-- AlterTable
ALTER TABLE "Abrechnungsbuchung" ADD COLUMN     "einsatzId" INTEGER;

-- AddForeignKey
ALTER TABLE "Abrechnungsbuchung" ADD CONSTRAINT "Abrechnungsbuchung_einsatzId_fkey" FOREIGN KEY ("einsatzId") REFERENCES "Einsatz"("id") ON DELETE SET NULL ON UPDATE CASCADE;
