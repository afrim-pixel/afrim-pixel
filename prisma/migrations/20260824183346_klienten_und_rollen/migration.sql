/*
  Warnings:

  - The values [ADMIN,LEITUNG] on the enum `Rolle` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Rolle_new" AS ENUM ('ADMIN_INHABER', 'BUERO_ABRECHNUNG', 'EINSATZPLANUNG', 'MITARBEITER');
ALTER TABLE "public"."Benutzer" ALTER COLUMN "rolle" DROP DEFAULT;
ALTER TABLE "Benutzer" ALTER COLUMN "rolle" TYPE "Rolle_new" USING ("rolle"::text::"Rolle_new");
ALTER TYPE "Rolle" RENAME TO "Rolle_old";
ALTER TYPE "Rolle_new" RENAME TO "Rolle";
DROP TYPE "public"."Rolle_old";
ALTER TABLE "Benutzer" ALTER COLUMN "rolle" SET DEFAULT 'MITARBEITER';
COMMIT;

-- CreateTable
CREATE TABLE "Klient" (
    "id" SERIAL NOT NULL,
    "vorname" TEXT NOT NULL,
    "nachname" TEXT NOT NULL,
    "geburtsdatum" TIMESTAMP(3),
    "aktiv" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organisationId" INTEGER NOT NULL,

    CONSTRAINT "Klient_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Klient" ADD CONSTRAINT "Klient_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
