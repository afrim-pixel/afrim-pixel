-- CreateTable
CREATE TABLE "EinsatzAenderung" (
    "id" SERIAL NOT NULL,
    "einsatzId" INTEGER NOT NULL,
    "neuesDatum" TIMESTAMP(3),
    "neueStartzeit" TIMESTAMP(3),
    "neueEndzeit" TIMESTAMP(3),
    "grund" TEXT,
    "erstelltAm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EinsatzAenderung_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "EinsatzAenderung" ADD CONSTRAINT "EinsatzAenderung_einsatzId_fkey" FOREIGN KEY ("einsatzId") REFERENCES "Einsatz"("id") ON DELETE CASCADE ON UPDATE CASCADE;
