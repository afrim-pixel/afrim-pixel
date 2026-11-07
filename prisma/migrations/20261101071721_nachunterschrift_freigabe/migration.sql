-- AlterTable
ALTER TABLE "Einsatz" ADD COLUMN     "nachunterschriftFreigabeGrund" TEXT,
ADD COLUMN     "nachunterschriftFreigegebenAm" TIMESTAMP(3),
ADD COLUMN     "nachunterschriftFreigegebenVonId" INTEGER;
