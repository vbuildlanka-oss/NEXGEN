import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Clears the stored header tagline.
 *
 * The field is kept — it is useful, and the client asked for it to stay available
 * in Site settings — but its seeded value ("Colombo, Sri Lanka / Next: see events")
 * is no longer wanted in the header, which should show only the wordmark.
 *
 * A migration rather than a change to the seed script, because seeding deliberately
 * never overwrites a global that already has content: the client's own edits must
 * survive a deployment. That protection also means the seed cannot clear this, so
 * the one-off correction belongs here.
 *
 * The header renders the tagline only when it is set, so an empty value shows the
 * wordmark alone. Typing something into the field brings it back.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    UPDATE "site_settings" SET "header_tagline" = NULL;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Restores the value this migration cleared, so the change is reversible.
  await db.execute(sql`
    UPDATE "site_settings"
    SET "header_tagline" = 'Colombo, Sri Lanka / Next: see events'
    WHERE "header_tagline" IS NULL;
  `)
}
