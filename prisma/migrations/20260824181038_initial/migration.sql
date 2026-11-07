-- CreateEnum
CREATE TYPE "Rolle" AS ENUM ('ADMIN', 'LEITUNG', 'MITARBEITER');

-- CreateTable
CREATE TABLE "Organisation" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organisation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Benutzer" (
    "id" SERIAL NOT NULL,
    "vorname" TEXT NOT NULL,
    "nachname" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwortHash" TEXT NOT NULL,
    "aktiv" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organisationId" INTEGER NOT NULL,
    "rolle" "Rolle" NOT NULL DEFAULT 'MITARBEITER',

    CONSTRAINT "Benutzer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Benutzer_email_key" ON "Benutzer"("email");

-- AddForeignKey
ALTER TABLE "Benutzer" ADD CONSTRAINT "Benutzer_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
