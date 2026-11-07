-- AlterTable
ALTER TABLE "Dokumentation" ADD COLUMN     "benutzerId" INTEGER;

-- AddForeignKey
ALTER TABLE "Dokumentation" ADD CONSTRAINT "Dokumentation_benutzerId_fkey" FOREIGN KEY ("benutzerId") REFERENCES "Benutzer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
