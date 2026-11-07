/*
  Warnings:

  - Added the required column `einsatzStatus` to the `EinsatzUnterschriftProtokoll` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "EinsatzUnterschriftProtokoll" ADD COLUMN     "einsatzStatus" "EinsatzStatus" NOT NULL;
