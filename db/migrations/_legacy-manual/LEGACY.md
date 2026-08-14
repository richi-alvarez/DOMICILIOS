# Migraciones aplicadas fuera del journal de drizzle (histórico)

Estos 4 archivos (`0004_phase14_analytics.sql`, `0005_phase15_archive_share.sql`,
`0006_phase15_schedules.sql`, `0007_whatsapp.sql`) se aplicaron **a mano por psql en su momento**,
sin pasar por `drizzle-kit migrate` — por eso nunca quedaron registrados en
`../meta/_journal.json` (que solo llegaba hasta `0003_calm_rattler`) ni tienen snapshot en
`../meta/`.

## Por qué están aquí y no en `db/migrations/`

El 2026-08-14 se generó `../0004_small_nightcrawler.sql` con `drizzle-kit generate` (diff real
contra `db/schema.ts`). Como el journal no sabía de estos 4 archivos, el diff generado **recreó
completo** todo lo que ya hacían — mismas tablas, mismas columnas (`custom_reports`,
`report_exports`, `report_schedules`, `whatsapp_conversations`, `whatsapp_messages`, con
`archived_at`/`share_token`/`share_token_expires_at` incluidos) — más lo que faltaba
(`appointments`, `monitoring_alerts`, `monitoring_metrics`, `ai_prompt_guides`, `catalogs.type`).

Se movieron aquí para que `db/migrations/` quede coherente con `_journal.json` (todo archivo en la
raíz corresponde a una entrada del journal, nada más). **No re-ejecutar estos 4 archivos** — en un
entorno donde ya corrió `0004_small_nightcrawler.sql`, `0004_phase14_analytics.sql` y
`0006_phase15_schedules.sql` fallarían con "already exists" (no tienen guardas `IF NOT EXISTS`).
Se conservan solo como registro histórico de qué se aplicó y cuándo (ver mensajes de commit
originales).

## Estado de la reconciliación

Con este movimiento, `db/migrations/` (raíz) contiene exactamente `0000`-`0004`, todos
registrados en `_journal.json` con su snapshot en `../meta/`. Un `drizzle-kit migrate` desde cero
en un entorno nuevo aplica esos 5 archivos y llega al mismo estado de schema que produce este
historial manual + `0004_small_nightcrawler.sql` combinados.
