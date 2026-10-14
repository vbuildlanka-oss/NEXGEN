import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_events_event_status" AS ENUM('upcoming', 'past');
  CREATE TYPE "public"."enum__events_v_version_event_status" AS ENUM('upcoming', 'past');
  ALTER TABLE "events" ADD COLUMN "event_status" "enum_events_event_status" DEFAULT 'upcoming';
  ALTER TABLE "_events_v" ADD COLUMN "version_event_status" "enum__events_v_version_event_status" DEFAULT 'upcoming';
  CREATE INDEX "events_event_status_idx" ON "events" USING btree ("event_status");
  CREATE INDEX "_events_v_version_version_event_status_idx" ON "_events_v" USING btree ("version_event_status");`)

  /*
   * Label the events that already exist, so nothing moves list on deploy.
   *
   * By start date only. The end date is deliberately ignored: it is what went
   * wrong before (an end typed months before the start filed an upcoming show
   * as past). Past starts become "past", everything else stays "upcoming". From
   * here on the editor sets the label by hand.
   */
  await db.execute(sql`
   UPDATE "events" SET "event_status" = 'past' WHERE "starts_at" < now();
  UPDATE "_events_v" SET "version_event_status" = 'past' WHERE "version_starts_at" < now();`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "events_event_status_idx";
  DROP INDEX "_events_v_version_version_event_status_idx";
  ALTER TABLE "events" DROP COLUMN "event_status";
  ALTER TABLE "_events_v" DROP COLUMN "version_event_status";
  DROP TYPE "public"."enum_events_event_status";
  DROP TYPE "public"."enum__events_v_version_event_status";`)
}
