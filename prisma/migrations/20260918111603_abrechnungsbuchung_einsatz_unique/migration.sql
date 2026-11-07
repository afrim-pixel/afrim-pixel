/*
  Warnings:

  - A unique constraint covering the columns `[einsatzId]` on the table `Abrechnungsbuchung` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Abrechnungsbuchung_einsatzId_key" ON "Abrechnungsbuchung"("einsatzId");
