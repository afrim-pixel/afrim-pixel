-- CreateTable
CREATE TABLE "EinsatzUnterschriftProtokoll" (
    "id" SERIAL NOT NULL,
    "einsatzId" INTEGER NOT NULL,
    "benutzerId" INTEGER NOT NULL,
    "unterschriebenAm" TIMESTAMP(3) NOT NULL,
    "protokolliertAm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bemerkung" TEXT,

    CONSTRAINT "EinsatzUnterschriftProtokoll_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "EinsatzUnterschriftProtokoll" ADD CONSTRAINT "EinsatzUnterschriftProtokoll_einsatzId_fkey" FOREIGN KEY ("einsatzId") REFERENCES "Einsatz"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
