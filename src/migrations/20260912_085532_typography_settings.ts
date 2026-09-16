import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_site_settings_typography_text_size" AS ENUM('0.85', '0.9', '0.95', '1', '1.05', '1.1', '1.2');
  CREATE TYPE "public"."enum_site_settings_typography_heading_weight" AS ENUM('600', '700', '800');
  CREATE TYPE "public"."enum__site_settings_v_version_typography_text_size" AS ENUM('0.85', '0.9', '0.95', '1', '1.05', '1.1', '1.2');
  CREATE TYPE "public"."enum__site_settings_v_version_typography_heading_weight" AS ENUM('600', '700', '800');
  ALTER TABLE "site_settings" ADD COLUMN "typography_text_size" "enum_site_settings_typography_text_size" DEFAULT '1';
  ALTER TABLE "site_settings" ADD COLUMN "typography_heading_weight" "enum_site_settings_typography_heading_weight" DEFAULT '800';
  ALTER TABLE "_site_settings_v" ADD COLUMN "version_typography_text_size" "enum__site_settings_v_version_typography_text_size" DEFAULT '1';
  ALTER TABLE "_site_settings_v" ADD COLUMN "version_typography_heading_weight" "enum__site_settings_v_version_typography_heading_weight" DEFAULT '800';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" DROP COLUMN "typography_text_size";
  ALTER TABLE "site_settings" DROP COLUMN "typography_heading_weight";
  ALTER TABLE "_site_settings_v" DROP COLUMN "version_typography_text_size";
  ALTER TABLE "_site_settings_v" DROP COLUMN "version_typography_heading_weight";
  DROP TYPE "public"."enum_site_settings_typography_text_size";
  DROP TYPE "public"."enum_site_settings_typography_heading_weight";
  DROP TYPE "public"."enum__site_settings_v_version_typography_text_size";
  DROP TYPE "public"."enum__site_settings_v_version_typography_heading_weight";`)
}
