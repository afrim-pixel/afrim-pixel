/*
  Warnings:

  - A unique constraint covering the columns `[klientId,leistungsmonat,leistungsart]` on the table `Rechnung` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Rechnung_klientId_leistungsmonat_leistungsart_key" ON "Rechnung"("klientId", "leistungsmonat", "leistungsart");
