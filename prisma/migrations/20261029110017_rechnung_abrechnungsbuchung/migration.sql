-- AlterTable
ALTER TABLE "Abrechnungsbuchung" ADD COLUMN     "rechnungId" INTEGER;

-- AddForeignKey
ALTER TABLE "Abrechnungsbuchung" ADD CONSTRAINT "Abrechnungsbuchung_rechnungId_fkey" FOREIGN KEY ("rechnungId") REFERENCES "Rechnung"("id") ON DELETE SET NULL ON UPDATE CASCADE;
