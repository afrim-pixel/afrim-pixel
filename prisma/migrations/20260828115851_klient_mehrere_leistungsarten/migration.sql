-- CreateTable
CREATE TABLE "KlientLeistungsart" (
    "id" SERIAL NOT NULL,
    "leistungsart" "Leistungsart" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "klientId" INTEGER NOT NULL,

    CONSTRAINT "KlientLeistungsart_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "KlientLeistungsart_klientId_leistungsart_key" ON "KlientLeistungsart"("klientId", "leistungsart");

-- AddForeignKey
ALTER TABLE "KlientLeistungsart" ADD CONSTRAINT "KlientLeistungsart_klientId_fkey" FOREIGN KEY ("klientId") REFERENCES "Klient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
