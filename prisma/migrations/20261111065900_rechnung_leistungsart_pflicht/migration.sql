/*
  Warnings:

  - Made the column `leistungsart` on table `Rechnung` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Rechnung" ALTER COLUMN "leistungsart" SET NOT NULL;
