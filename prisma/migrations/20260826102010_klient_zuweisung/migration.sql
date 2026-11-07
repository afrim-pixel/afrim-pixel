-- CreateTable
CREATE TABLE "KlientZuweisung" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "benutzerId" INTEGER NOT NULL,
    "klientId" INTEGER NOT NULL,

    CONSTRAINT "KlientZuweisung_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "KlientZuweisung_benutzerId_klientId_key" ON "KlientZuweisung"("benutzerId", "klientId");

-- AddForeignKey
ALTER TABLE "KlientZuweisung" ADD CONSTRAINT "KlientZuweisung_benutzerId_fkey" FOREIGN KEY ("benutzerId") REFERENCES "Benutzer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KlientZuweisung" ADD CONSTRAINT "KlientZuweisung_klientId_fkey" FOREIGN KEY ("klientId") REFERENCES "Klient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
