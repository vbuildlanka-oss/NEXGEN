import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "events_page" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"intro_eyebrow" varchar DEFAULT 'Events',
  	"intro_heading" varchar DEFAULT 'Where to find us next',
  	"intro_standfirst" varchar DEFAULT 'Every NexGen night, in one place — the ones ahead and the ones worth remembering.',
  	"intro_image_id" integer,
  	"upcoming_heading" varchar DEFAULT 'Upcoming events',
  	"upcoming_count_label" varchar DEFAULT 'scheduled',
  	"upcoming_empty_heading" varchar DEFAULT 'Nothing announced just yet',
  	"upcoming_empty_body" varchar DEFAULT 'The next line-up is being locked in.',
  	"upcoming_empty_link_label" varchar DEFAULT 'Ask us what’s coming',
  	"upcoming_empty_link_url" varchar DEFAULT '/contact',
  	"past_eyebrow" varchar DEFAULT 'The archive',
  	"past_heading" varchar DEFAULT 'Past events',
  	"past_gallery_link_label" varchar DEFAULT 'Photos from the floor',
  	"seo_title" varchar DEFAULT 'Events',
  	"seo_description" varchar DEFAULT 'Upcoming NexGen events and the archive of everything that came before.',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "_events_page_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_intro_eyebrow" varchar DEFAULT 'Events',
  	"version_intro_heading" varchar DEFAULT 'Where to find us next',
  	"version_intro_standfirst" varchar DEFAULT 'Every NexGen night, in one place — the ones ahead and the ones worth remembering.',
  	"version_intro_image_id" integer,
  	"version_upcoming_heading" varchar DEFAULT 'Upcoming events',
  	"version_upcoming_count_label" varchar DEFAULT 'scheduled',
  	"version_upcoming_empty_heading" varchar DEFAULT 'Nothing announced just yet',
  	"version_upcoming_empty_body" varchar DEFAULT 'The next line-up is being locked in.',
  	"version_upcoming_empty_link_label" varchar DEFAULT 'Ask us what’s coming',
  	"version_upcoming_empty_link_url" varchar DEFAULT '/contact',
  	"version_past_eyebrow" varchar DEFAULT 'The archive',
  	"version_past_heading" varchar DEFAULT 'Past events',
  	"version_past_gallery_link_label" varchar DEFAULT 'Photos from the floor',
  	"version_seo_title" varchar DEFAULT 'Events',
  	"version_seo_description" varchar DEFAULT 'Upcoming NexGen events and the archive of everything that came before.',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "updates_page" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"intro_eyebrow" varchar DEFAULT 'Updates',
  	"intro_heading" varchar DEFAULT 'Everything new',
  	"intro_standfirst" varchar DEFAULT 'Announcements, collaborations, milestones and recordings — as they happen.',
  	"intro_image_id" integer,
  	"filters_all_label" varchar DEFAULT 'Everything',
  	"empty_heading" varchar DEFAULT 'Nothing here yet',
  	"empty_body" varchar DEFAULT 'The first announcements are on their way.',
  	"empty_link_label" varchar,
  	"empty_link_url" varchar,
  	"outro_heading" varchar DEFAULT 'Never miss an announcement',
  	"outro_body" varchar DEFAULT 'Follow NexGen on social, or get in touch to join the mailing list.',
  	"outro_link_label" varchar DEFAULT 'Drop us a message',
  	"outro_link_url" varchar DEFAULT '/contact',
  	"seo_title" varchar DEFAULT 'Updates',
  	"seo_description" varchar DEFAULT 'News, artist and event announcements, collaborations, milestones and live recordings from NexGen.',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "_updates_page_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_intro_eyebrow" varchar DEFAULT 'Updates',
  	"version_intro_heading" varchar DEFAULT 'Everything new',
  	"version_intro_standfirst" varchar DEFAULT 'Announcements, collaborations, milestones and recordings — as they happen.',
  	"version_intro_image_id" integer,
  	"version_filters_all_label" varchar DEFAULT 'Everything',
  	"version_empty_heading" varchar DEFAULT 'Nothing here yet',
  	"version_empty_body" varchar DEFAULT 'The first announcements are on their way.',
  	"version_empty_link_label" varchar,
  	"version_empty_link_url" varchar,
  	"version_outro_heading" varchar DEFAULT 'Never miss an announcement',
  	"version_outro_body" varchar DEFAULT 'Follow NexGen on social, or get in touch to join the mailing list.',
  	"version_outro_link_label" varchar DEFAULT 'Drop us a message',
  	"version_outro_link_url" varchar DEFAULT '/contact',
  	"version_seo_title" varchar DEFAULT 'Updates',
  	"version_seo_description" varchar DEFAULT 'News, artist and event announcements, collaborations, milestones and live recordings from NexGen.',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "gallery_page" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"intro_eyebrow" varchar DEFAULT 'Gallery',
  	"intro_heading" varchar DEFAULT 'Nights worth remembering',
  	"intro_standfirst" varchar,
  	"intro_image_id" integer,
  	"groups_untagged_heading" varchar DEFAULT 'More from the floor',
  	"groups_event_link_label" varchar DEFAULT 'Event',
  	"empty_heading" varchar DEFAULT 'The gallery is being put together',
  	"empty_body" varchar DEFAULT 'Photos from recent events are on their way.',
  	"empty_link_label" varchar DEFAULT 'See what’s coming up',
  	"empty_link_url" varchar DEFAULT '/events',
  	"seo_title" varchar DEFAULT 'Gallery',
  	"seo_description" varchar DEFAULT 'Photographs from NexGen events — the artists, the rooms and the crowds.',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "_gallery_page_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_intro_eyebrow" varchar DEFAULT 'Gallery',
  	"version_intro_heading" varchar DEFAULT 'Nights worth remembering',
  	"version_intro_standfirst" varchar,
  	"version_intro_image_id" integer,
  	"version_groups_untagged_heading" varchar DEFAULT 'More from the floor',
  	"version_groups_event_link_label" varchar DEFAULT 'Event',
  	"version_empty_heading" varchar DEFAULT 'The gallery is being put together',
  	"version_empty_body" varchar DEFAULT 'Photos from recent events are on their way.',
  	"version_empty_link_label" varchar DEFAULT 'See what’s coming up',
  	"version_empty_link_url" varchar DEFAULT '/events',
  	"version_seo_title" varchar DEFAULT 'Gallery',
  	"version_seo_description" varchar DEFAULT 'Photographs from NexGen events — the artists, the rooms and the crowds.',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "events_page" ADD CONSTRAINT "events_page_intro_image_id_media_id_fk" FOREIGN KEY ("intro_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_events_page_v" ADD CONSTRAINT "_events_page_v_version_intro_image_id_media_id_fk" FOREIGN KEY ("version_intro_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "updates_page" ADD CONSTRAINT "updates_page_intro_image_id_media_id_fk" FOREIGN KEY ("intro_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_updates_page_v" ADD CONSTRAINT "_updates_page_v_version_intro_image_id_media_id_fk" FOREIGN KEY ("version_intro_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "gallery_page" ADD CONSTRAINT "gallery_page_intro_image_id_media_id_fk" FOREIGN KEY ("intro_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_gallery_page_v" ADD CONSTRAINT "_gallery_page_v_version_intro_image_id_media_id_fk" FOREIGN KEY ("version_intro_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "events_page_intro_intro_image_idx" ON "events_page" USING btree ("intro_image_id");
  CREATE INDEX "_events_page_v_version_intro_version_intro_image_idx" ON "_events_page_v" USING btree ("version_intro_image_id");
  CREATE INDEX "_events_page_v_created_at_idx" ON "_events_page_v" USING btree ("created_at");
  CREATE INDEX "_events_page_v_updated_at_idx" ON "_events_page_v" USING btree ("updated_at");
  CREATE INDEX "updates_page_intro_intro_image_idx" ON "updates_page" USING btree ("intro_image_id");
  CREATE INDEX "_updates_page_v_version_intro_version_intro_image_idx" ON "_updates_page_v" USING btree ("version_intro_image_id");
  CREATE INDEX "_updates_page_v_created_at_idx" ON "_updates_page_v" USING btree ("created_at");
  CREATE INDEX "_updates_page_v_updated_at_idx" ON "_updates_page_v" USING btree ("updated_at");
  CREATE INDEX "gallery_page_intro_intro_image_idx" ON "gallery_page" USING btree ("intro_image_id");
  CREATE INDEX "_gallery_page_v_version_intro_version_intro_image_idx" ON "_gallery_page_v" USING btree ("version_intro_image_id");
  CREATE INDEX "_gallery_page_v_created_at_idx" ON "_gallery_page_v" USING btree ("created_at");
  CREATE INDEX "_gallery_page_v_updated_at_idx" ON "_gallery_page_v" USING btree ("updated_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "events_page" CASCADE;
  DROP TABLE "_events_page_v" CASCADE;
  DROP TABLE "updates_page" CASCADE;
  DROP TABLE "_updates_page_v" CASCADE;
  DROP TABLE "gallery_page" CASCADE;
  DROP TABLE "_gallery_page_v" CASCADE;`)
}
