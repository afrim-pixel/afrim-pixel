-- AlterTable
ALTER TABLE "Rechnung" ADD COLUMN     "bezahlt" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "bezahltAm" TIMESTAMP(3);
