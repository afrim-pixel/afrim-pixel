-- Performance: Foreign-Key- und Abfrage-Indizes
CREATE INDEX IF NOT EXISTS "Benutzer_organisationId_idx" ON "Benutzer"("organisationId");
CREATE INDEX IF NOT EXISTS "Klient_organisationId_idx" ON "Klient"("organisationId");
CREATE INDEX IF NOT EXISTS "Klient_kassenIk_idx" ON "Klient"("kassenIk");
CREATE INDEX IF NOT EXISTS "Einsatz_benutzerId_datum_idx" ON "Einsatz"("benutzerId", "datum");
CREATE INDEX IF NOT EXISTS "Einsatz_klientId_datum_idx" ON "Einsatz"("klientId", "datum");
CREATE INDEX IF NOT EXISTS "Einsatz_status_datum_idx" ON "Einsatz"("status", "datum");
CREATE INDEX IF NOT EXISTS "Abrechnungsbuchung_klientId_datum_idx" ON "Abrechnungsbuchung"("klientId", "datum");
CREATE INDEX IF NOT EXISTS "Abrechnungsbuchung_rechnungId_idx" ON "Abrechnungsbuchung"("rechnungId");
CREATE INDEX IF NOT EXISTS "Rechnung_klientId_leistungsmonat_idx" ON "Rechnung"("klientId", "leistungsmonat");
CREATE INDEX IF NOT EXISTS "Rechnung_versendetAm_idx" ON "Rechnung"("versendetAm");
