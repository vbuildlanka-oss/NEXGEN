import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_events_currency" AS ENUM('LKR', 'USD', 'GBP', 'EUR');
  CREATE TYPE "public"."enum_events_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__events_v_version_currency" AS ENUM('LKR', 'USD', 'GBP', 'EUR');
  CREATE TYPE "public"."enum__events_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_posts_category" AS ENUM('news', 'artist-announcement', 'event-announcement', 'collaboration', 'milestone', 'live-recording');
  CREATE TYPE "public"."enum_posts_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__posts_v_version_category" AS ENUM('news', 'artist-announcement', 'event-announcement', 'collaboration', 'milestone', 'live-recording');
  CREATE TYPE "public"."enum__posts_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_home_panels_accent" AS ENUM('nexgen-red', 'ember-red', 'chrome-grey');
  CREATE TYPE "public"."enum_orders_status" AS ENUM('pending', 'paid', 'refunded', 'cancelled');
  CREATE TYPE "public"."enum_tickets_status" AS ENUM('valid', 'checked-in', 'void');
  CREATE TYPE "public"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'schedulePublish');
  CREATE TYPE "public"."enum_payload_jobs_log_state" AS ENUM('failed', 'succeeded');
  CREATE TYPE "public"."enum_payload_jobs_task_slug" AS ENUM('inline', 'schedulePublish');
  CREATE TYPE "public"."enum_home_page_hero_buttons_style" AS ENUM('primary', 'secondary');
  CREATE TYPE "public"."enum__home_page_v_version_hero_buttons_style" AS ENUM('primary', 'secondary');
  CREATE TYPE "public"."enum_contact_info_socials_platform" AS ENUM('instagram', 'tiktok', 'facebook', 'youtube', 'x', 'spotify', 'soundcloud', 'whatsapp', 'other');
  CREATE TYPE "public"."enum__contact_info_v_version_socials_platform" AS ENUM('instagram', 'tiktok', 'facebook', 'youtube', 'x', 'spotify', 'soundcloud', 'whatsapp', 'other');
  CREATE TABLE "events_artists" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"role" varchar
  );
  
  CREATE TABLE "events" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"tagline" varchar,
  	"starts_at" timestamp(3) with time zone,
  	"ends_at" timestamp(3) with time zone,
  	"venue" varchar,
  	"city" varchar,
  	"description" jsonb,
  	"ticket_price" numeric,
  	"currency" "enum_events_currency" DEFAULT 'LKR',
  	"ticket_note" varchar,
  	"external_ticket_url" varchar,
  	"sold_out" boolean DEFAULT false,
  	"cover_image_id" integer,
  	"background_image_id" integer,
  	"slug" varchar,
  	"featured" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_events_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_events_v_version_artists" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"role" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_events_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_tagline" varchar,
  	"version_starts_at" timestamp(3) with time zone,
  	"version_ends_at" timestamp(3) with time zone,
  	"version_venue" varchar,
  	"version_city" varchar,
  	"version_description" jsonb,
  	"version_ticket_price" numeric,
  	"version_currency" "enum__events_v_version_currency" DEFAULT 'LKR',
  	"version_ticket_note" varchar,
  	"version_external_ticket_url" varchar,
  	"version_sold_out" boolean DEFAULT false,
  	"version_cover_image_id" integer,
  	"version_background_image_id" integer,
  	"version_slug" varchar,
  	"version_featured" boolean DEFAULT false,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__events_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "posts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"excerpt" varchar,
  	"body" jsonb,
  	"cover_image_id" integer,
  	"related_event_id" integer,
  	"external_url" varchar,
  	"slug" varchar,
  	"category" "enum_posts_category" DEFAULT 'news',
  	"published_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_posts_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_posts_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_excerpt" varchar,
  	"version_body" jsonb,
  	"version_cover_image_id" integer,
  	"version_related_event_id" integer,
  	"version_external_url" varchar,
  	"version_slug" varchar,
  	"version_category" "enum__posts_v_version_category" DEFAULT 'news',
  	"version_published_at" timestamp(3) with time zone,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__posts_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar,
  	"caption" varchar,
  	"credit" varchar,
  	"event_id" integer,
  	"show_in_gallery" boolean DEFAULT false,
  	"gallery_order" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumbnail_url" varchar,
  	"sizes_thumbnail_width" numeric,
  	"sizes_thumbnail_height" numeric,
  	"sizes_thumbnail_mime_type" varchar,
  	"sizes_thumbnail_filesize" numeric,
  	"sizes_thumbnail_filename" varchar,
  	"sizes_card_url" varchar,
  	"sizes_card_width" numeric,
  	"sizes_card_height" numeric,
  	"sizes_card_mime_type" varchar,
  	"sizes_card_filesize" numeric,
  	"sizes_card_filename" varchar,
  	"sizes_wide_url" varchar,
  	"sizes_wide_width" numeric,
  	"sizes_wide_height" numeric,
  	"sizes_wide_mime_type" varchar,
  	"sizes_wide_filesize" numeric,
  	"sizes_wide_filename" varchar,
  	"sizes_hero_url" varchar,
  	"sizes_hero_width" numeric,
  	"sizes_hero_height" numeric,
  	"sizes_hero_mime_type" varchar,
  	"sizes_hero_filesize" numeric,
  	"sizes_hero_filename" varchar
  );
  
  CREATE TABLE "home_panels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" numeric DEFAULT 1 NOT NULL,
  	"heading" varchar NOT NULL,
  	"subheading" varchar,
  	"artist_image_id" integer NOT NULL,
  	"background_image_id" integer NOT NULL,
  	"accent" "enum_home_panels_accent" DEFAULT 'nexgen-red',
  	"link_label" varchar,
  	"link_url" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "contact_messages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"subject" varchar,
  	"message" varchar NOT NULL,
  	"handled" boolean DEFAULT false,
  	"email_delivered" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "orders" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"event_id" integer NOT NULL,
  	"email" varchar NOT NULL,
  	"buyer_name" varchar,
  	"quantity" numeric DEFAULT 1 NOT NULL,
  	"amount_total" numeric,
  	"currency" varchar DEFAULT 'LKR',
  	"status" "enum_orders_status" DEFAULT 'pending',
  	"payment_provider" varchar,
  	"payment_reference" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "tickets" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"code" varchar NOT NULL,
  	"order_id" integer,
  	"event_id" integer NOT NULL,
  	"holder_name" varchar,
  	"status" "enum_tickets_status" DEFAULT 'valid',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_jobs_log" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"executed_at" timestamp(3) with time zone NOT NULL,
  	"completed_at" timestamp(3) with time zone NOT NULL,
  	"task_slug" "enum_payload_jobs_log_task_slug" NOT NULL,
  	"task_i_d" varchar NOT NULL,
  	"input" jsonb,
  	"output" jsonb,
  	"state" "enum_payload_jobs_log_state" NOT NULL,
  	"error" jsonb
  );
  
  CREATE TABLE "payload_jobs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"input" jsonb,
  	"completed_at" timestamp(3) with time zone,
  	"total_tried" numeric DEFAULT 0,
  	"has_error" boolean DEFAULT false,
  	"error" jsonb,
  	"task_slug" "enum_payload_jobs_task_slug",
  	"queue" varchar DEFAULT 'default',
  	"wait_until" timestamp(3) with time zone,
  	"processing" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"events_id" integer,
  	"posts_id" integer,
  	"media_id" integer,
  	"home_panels_id" integer,
  	"contact_messages_id" integer,
  	"orders_id" integer,
  	"tickets_id" integer,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "home_page_hero_buttons" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"url" varchar NOT NULL,
  	"style" "enum_home_page_hero_buttons_style" DEFAULT 'primary'
  );
  
  CREATE TABLE "home_page_teasers" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar NOT NULL,
  	"body" varchar,
  	"link_label" varchar NOT NULL,
  	"link_url" varchar NOT NULL,
  	"image_id" integer
  );
  
  CREATE TABLE "home_page" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"hero_video_id" integer,
  	"hero_poster_id" integer,
  	"hero_headline" varchar DEFAULT 'A new generation of entertainment' NOT NULL,
  	"hero_subheadline" varchar,
  	"hero_scroll_hint" varchar DEFAULT 'Scroll',
  	"panels_eyebrow" varchar DEFAULT 'What is NexGen?',
  	"panels_intro" varchar DEFAULT 'A home for the artists shaping what comes next — and the crowds who find them first.' NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "_home_page_v_version_hero_buttons" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"url" varchar NOT NULL,
  	"style" "enum__home_page_v_version_hero_buttons_style" DEFAULT 'primary',
  	"_uuid" varchar
  );
  
  CREATE TABLE "_home_page_v_version_teasers" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar NOT NULL,
  	"body" varchar,
  	"link_label" varchar NOT NULL,
  	"link_url" varchar NOT NULL,
  	"image_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_home_page_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_hero_video_id" integer,
  	"version_hero_poster_id" integer,
  	"version_hero_headline" varchar DEFAULT 'A new generation of entertainment' NOT NULL,
  	"version_hero_subheadline" varchar,
  	"version_hero_scroll_hint" varchar DEFAULT 'Scroll',
  	"version_panels_eyebrow" varchar DEFAULT 'What is NexGen?',
  	"version_panels_intro" varchar DEFAULT 'A home for the artists shaping what comes next — and the crowds who find them first.' NOT NULL,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "our_story" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"intro_eyebrow" varchar DEFAULT 'Our Story',
  	"intro_heading" varchar DEFAULT 'Built for what comes next' NOT NULL,
  	"intro_standfirst" varchar,
  	"intro_image_id" integer,
  	"what_is_nex_gen_heading" varchar DEFAULT 'What is NexGen?' NOT NULL,
  	"what_is_nex_gen_body" jsonb,
  	"what_is_nex_gen_image_id" integer,
  	"what_is_nex_gen_pull_quote" varchar,
  	"why_we_started_heading" varchar DEFAULT 'Why We Started' NOT NULL,
  	"why_we_started_body" jsonb,
  	"why_we_started_image_id" integer,
  	"why_we_started_pull_quote" varchar,
  	"what_we_stand_for_heading" varchar DEFAULT 'What We Stand For' NOT NULL,
  	"what_we_stand_for_body" jsonb,
  	"what_we_stand_for_image_id" integer,
  	"what_we_stand_for_pull_quote" varchar,
  	"community_heading" varchar DEFAULT 'The NexGen Community' NOT NULL,
  	"community_body" jsonb,
  	"community_image_id" integer,
  	"community_pull_quote" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "_our_story_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_intro_eyebrow" varchar DEFAULT 'Our Story',
  	"version_intro_heading" varchar DEFAULT 'Built for what comes next' NOT NULL,
  	"version_intro_standfirst" varchar,
  	"version_intro_image_id" integer,
  	"version_what_is_nex_gen_heading" varchar DEFAULT 'What is NexGen?' NOT NULL,
  	"version_what_is_nex_gen_body" jsonb,
  	"version_what_is_nex_gen_image_id" integer,
  	"version_what_is_nex_gen_pull_quote" varchar,
  	"version_why_we_started_heading" varchar DEFAULT 'Why We Started' NOT NULL,
  	"version_why_we_started_body" jsonb,
  	"version_why_we_started_image_id" integer,
  	"version_why_we_started_pull_quote" varchar,
  	"version_what_we_stand_for_heading" varchar DEFAULT 'What We Stand For' NOT NULL,
  	"version_what_we_stand_for_body" jsonb,
  	"version_what_we_stand_for_image_id" integer,
  	"version_what_we_stand_for_pull_quote" varchar,
  	"version_community_heading" varchar DEFAULT 'The NexGen Community' NOT NULL,
  	"version_community_body" jsonb,
  	"version_community_image_id" integer,
  	"version_community_pull_quote" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "contact_info_socials" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"platform" "enum_contact_info_socials_platform" NOT NULL,
  	"label" varchar,
  	"url" varchar NOT NULL
  );
  
  CREATE TABLE "contact_info" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar DEFAULT 'Contact Us',
  	"heading" varchar DEFAULT 'Get in touch' NOT NULL,
  	"standfirst" varchar,
  	"form_success_message" varchar DEFAULT 'Thanks — your message is on its way. We’ll come back to you shortly.',
  	"image_id" integer,
  	"email" varchar,
  	"booking_email" varchar,
  	"phone" varchar,
  	"address" varchar,
  	"opening_hours" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "_contact_info_v_version_socials" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"platform" "enum__contact_info_v_version_socials_platform" NOT NULL,
  	"label" varchar,
  	"url" varchar NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_contact_info_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_eyebrow" varchar DEFAULT 'Contact Us',
  	"version_heading" varchar DEFAULT 'Get in touch' NOT NULL,
  	"version_standfirst" varchar,
  	"version_form_success_message" varchar DEFAULT 'Thanks — your message is on its way. We’ll come back to you shortly.',
  	"version_image_id" integer,
  	"version_email" varchar,
  	"version_booking_email" varchar,
  	"version_phone" varchar,
  	"version_address" varchar,
  	"version_opening_hours" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "site_settings_nav_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"url" varchar NOT NULL
  );
  
  CREATE TABLE "site_settings_footer_columns_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"url" varchar NOT NULL
  );
  
  CREATE TABLE "site_settings_footer_columns" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar NOT NULL
  );
  
  CREATE TABLE "site_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"announcement_enabled" boolean DEFAULT false,
  	"announcement_text" varchar,
  	"announcement_link_label" varchar,
  	"announcement_link_url" varchar,
  	"header_cta_label" varchar DEFAULT 'Events',
  	"header_cta_url" varchar DEFAULT '/events',
  	"header_tagline" varchar,
  	"footer_blurb" varchar,
  	"copyright_name" varchar DEFAULT 'NexGen Entertainment',
  	"seo_default_title" varchar DEFAULT 'NexGen Entertainment',
  	"seo_default_description" varchar,
  	"seo_share_image_id" integer,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "_site_settings_v_version_nav_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"url" varchar NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_site_settings_v_version_footer_columns_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"url" varchar NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_site_settings_v_version_footer_columns" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_site_settings_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_announcement_enabled" boolean DEFAULT false,
  	"version_announcement_text" varchar,
  	"version_announcement_link_label" varchar,
  	"version_announcement_link_url" varchar,
  	"version_header_cta_label" varchar DEFAULT 'Events',
  	"version_header_cta_url" varchar DEFAULT '/events',
  	"version_header_tagline" varchar,
  	"version_footer_blurb" varchar,
  	"version_copyright_name" varchar DEFAULT 'NexGen Entertainment',
  	"version_seo_default_title" varchar DEFAULT 'NexGen Entertainment',
  	"version_seo_default_description" varchar,
  	"version_seo_share_image_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "events_artists" ADD CONSTRAINT "events_artists_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events" ADD CONSTRAINT "events_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "events" ADD CONSTRAINT "events_background_image_id_media_id_fk" FOREIGN KEY ("background_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_events_v_version_artists" ADD CONSTRAINT "_events_v_version_artists_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_events_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_events_v" ADD CONSTRAINT "_events_v_parent_id_events_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_events_v" ADD CONSTRAINT "_events_v_version_cover_image_id_media_id_fk" FOREIGN KEY ("version_cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_events_v" ADD CONSTRAINT "_events_v_version_background_image_id_media_id_fk" FOREIGN KEY ("version_background_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "posts" ADD CONSTRAINT "posts_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "posts" ADD CONSTRAINT "posts_related_event_id_events_id_fk" FOREIGN KEY ("related_event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_posts_v" ADD CONSTRAINT "_posts_v_parent_id_posts_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."posts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_posts_v" ADD CONSTRAINT "_posts_v_version_cover_image_id_media_id_fk" FOREIGN KEY ("version_cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_posts_v" ADD CONSTRAINT "_posts_v_version_related_event_id_events_id_fk" FOREIGN KEY ("version_related_event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "media" ADD CONSTRAINT "media_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home_panels" ADD CONSTRAINT "home_panels_artist_image_id_media_id_fk" FOREIGN KEY ("artist_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home_panels" ADD CONSTRAINT "home_panels_background_image_id_media_id_fk" FOREIGN KEY ("background_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "orders" ADD CONSTRAINT "orders_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "tickets" ADD CONSTRAINT "tickets_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "tickets" ADD CONSTRAINT "tickets_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_jobs_log" ADD CONSTRAINT "payload_jobs_log_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."payload_jobs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_events_fk" FOREIGN KEY ("events_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_home_panels_fk" FOREIGN KEY ("home_panels_id") REFERENCES "public"."home_panels"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_contact_messages_fk" FOREIGN KEY ("contact_messages_id") REFERENCES "public"."contact_messages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_orders_fk" FOREIGN KEY ("orders_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tickets_fk" FOREIGN KEY ("tickets_id") REFERENCES "public"."tickets"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_page_hero_buttons" ADD CONSTRAINT "home_page_hero_buttons_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_page_teasers" ADD CONSTRAINT "home_page_teasers_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home_page_teasers" ADD CONSTRAINT "home_page_teasers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_page" ADD CONSTRAINT "home_page_hero_video_id_media_id_fk" FOREIGN KEY ("hero_video_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home_page" ADD CONSTRAINT "home_page_hero_poster_id_media_id_fk" FOREIGN KEY ("hero_poster_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_home_page_v_version_hero_buttons" ADD CONSTRAINT "_home_page_v_version_hero_buttons_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_page_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_page_v_version_teasers" ADD CONSTRAINT "_home_page_v_version_teasers_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_home_page_v_version_teasers" ADD CONSTRAINT "_home_page_v_version_teasers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_page_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_page_v" ADD CONSTRAINT "_home_page_v_version_hero_video_id_media_id_fk" FOREIGN KEY ("version_hero_video_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_home_page_v" ADD CONSTRAINT "_home_page_v_version_hero_poster_id_media_id_fk" FOREIGN KEY ("version_hero_poster_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "our_story" ADD CONSTRAINT "our_story_intro_image_id_media_id_fk" FOREIGN KEY ("intro_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "our_story" ADD CONSTRAINT "our_story_what_is_nex_gen_image_id_media_id_fk" FOREIGN KEY ("what_is_nex_gen_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "our_story" ADD CONSTRAINT "our_story_why_we_started_image_id_media_id_fk" FOREIGN KEY ("why_we_started_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "our_story" ADD CONSTRAINT "our_story_what_we_stand_for_image_id_media_id_fk" FOREIGN KEY ("what_we_stand_for_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "our_story" ADD CONSTRAINT "our_story_community_image_id_media_id_fk" FOREIGN KEY ("community_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_our_story_v" ADD CONSTRAINT "_our_story_v_version_intro_image_id_media_id_fk" FOREIGN KEY ("version_intro_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_our_story_v" ADD CONSTRAINT "_our_story_v_version_what_is_nex_gen_image_id_media_id_fk" FOREIGN KEY ("version_what_is_nex_gen_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_our_story_v" ADD CONSTRAINT "_our_story_v_version_why_we_started_image_id_media_id_fk" FOREIGN KEY ("version_why_we_started_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_our_story_v" ADD CONSTRAINT "_our_story_v_version_what_we_stand_for_image_id_media_id_fk" FOREIGN KEY ("version_what_we_stand_for_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_our_story_v" ADD CONSTRAINT "_our_story_v_version_community_image_id_media_id_fk" FOREIGN KEY ("version_community_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "contact_info_socials" ADD CONSTRAINT "contact_info_socials_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."contact_info"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "contact_info" ADD CONSTRAINT "contact_info_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_contact_info_v_version_socials" ADD CONSTRAINT "_contact_info_v_version_socials_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_contact_info_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_contact_info_v" ADD CONSTRAINT "_contact_info_v_version_image_id_media_id_fk" FOREIGN KEY ("version_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings_nav_items" ADD CONSTRAINT "site_settings_nav_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_footer_columns_links" ADD CONSTRAINT "site_settings_footer_columns_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings_footer_columns"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_footer_columns" ADD CONSTRAINT "site_settings_footer_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_seo_share_image_id_media_id_fk" FOREIGN KEY ("seo_share_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_site_settings_v_version_nav_items" ADD CONSTRAINT "_site_settings_v_version_nav_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_settings_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_site_settings_v_version_footer_columns_links" ADD CONSTRAINT "_site_settings_v_version_footer_columns_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_settings_v_version_footer_columns"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_site_settings_v_version_footer_columns" ADD CONSTRAINT "_site_settings_v_version_footer_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_settings_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_site_settings_v" ADD CONSTRAINT "_site_settings_v_version_seo_share_image_id_media_id_fk" FOREIGN KEY ("version_seo_share_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "events_artists_order_idx" ON "events_artists" USING btree ("_order");
  CREATE INDEX "events_artists_parent_id_idx" ON "events_artists" USING btree ("_parent_id");
  CREATE INDEX "events_cover_image_idx" ON "events" USING btree ("cover_image_id");
  CREATE INDEX "events_background_image_idx" ON "events" USING btree ("background_image_id");
  CREATE UNIQUE INDEX "events_slug_idx" ON "events" USING btree ("slug");
  CREATE INDEX "events_updated_at_idx" ON "events" USING btree ("updated_at");
  CREATE INDEX "events_created_at_idx" ON "events" USING btree ("created_at");
  CREATE INDEX "events__status_idx" ON "events" USING btree ("_status");
  CREATE INDEX "_events_v_version_artists_order_idx" ON "_events_v_version_artists" USING btree ("_order");
  CREATE INDEX "_events_v_version_artists_parent_id_idx" ON "_events_v_version_artists" USING btree ("_parent_id");
  CREATE INDEX "_events_v_parent_idx" ON "_events_v" USING btree ("parent_id");
  CREATE INDEX "_events_v_version_version_cover_image_idx" ON "_events_v" USING btree ("version_cover_image_id");
  CREATE INDEX "_events_v_version_version_background_image_idx" ON "_events_v" USING btree ("version_background_image_id");
  CREATE INDEX "_events_v_version_version_slug_idx" ON "_events_v" USING btree ("version_slug");
  CREATE INDEX "_events_v_version_version_updated_at_idx" ON "_events_v" USING btree ("version_updated_at");
  CREATE INDEX "_events_v_version_version_created_at_idx" ON "_events_v" USING btree ("version_created_at");
  CREATE INDEX "_events_v_version_version__status_idx" ON "_events_v" USING btree ("version__status");
  CREATE INDEX "_events_v_created_at_idx" ON "_events_v" USING btree ("created_at");
  CREATE INDEX "_events_v_updated_at_idx" ON "_events_v" USING btree ("updated_at");
  CREATE INDEX "_events_v_latest_idx" ON "_events_v" USING btree ("latest");
  CREATE INDEX "_events_v_autosave_idx" ON "_events_v" USING btree ("autosave");
  CREATE INDEX "posts_cover_image_idx" ON "posts" USING btree ("cover_image_id");
  CREATE INDEX "posts_related_event_idx" ON "posts" USING btree ("related_event_id");
  CREATE UNIQUE INDEX "posts_slug_idx" ON "posts" USING btree ("slug");
  CREATE INDEX "posts_updated_at_idx" ON "posts" USING btree ("updated_at");
  CREATE INDEX "posts_created_at_idx" ON "posts" USING btree ("created_at");
  CREATE INDEX "posts__status_idx" ON "posts" USING btree ("_status");
  CREATE INDEX "_posts_v_parent_idx" ON "_posts_v" USING btree ("parent_id");
  CREATE INDEX "_posts_v_version_version_cover_image_idx" ON "_posts_v" USING btree ("version_cover_image_id");
  CREATE INDEX "_posts_v_version_version_related_event_idx" ON "_posts_v" USING btree ("version_related_event_id");
  CREATE INDEX "_posts_v_version_version_slug_idx" ON "_posts_v" USING btree ("version_slug");
  CREATE INDEX "_posts_v_version_version_updated_at_idx" ON "_posts_v" USING btree ("version_updated_at");
  CREATE INDEX "_posts_v_version_version_created_at_idx" ON "_posts_v" USING btree ("version_created_at");
  CREATE INDEX "_posts_v_version_version__status_idx" ON "_posts_v" USING btree ("version__status");
  CREATE INDEX "_posts_v_created_at_idx" ON "_posts_v" USING btree ("created_at");
  CREATE INDEX "_posts_v_updated_at_idx" ON "_posts_v" USING btree ("updated_at");
  CREATE INDEX "_posts_v_latest_idx" ON "_posts_v" USING btree ("latest");
  CREATE INDEX "_posts_v_autosave_idx" ON "_posts_v" USING btree ("autosave");
  CREATE INDEX "media_event_idx" ON "media" USING btree ("event_id");
  CREATE INDEX "media_show_in_gallery_idx" ON "media" USING btree ("show_in_gallery");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "media_sizes_thumbnail_sizes_thumbnail_filename_idx" ON "media" USING btree ("sizes_thumbnail_filename");
  CREATE INDEX "media_sizes_card_sizes_card_filename_idx" ON "media" USING btree ("sizes_card_filename");
  CREATE INDEX "media_sizes_wide_sizes_wide_filename_idx" ON "media" USING btree ("sizes_wide_filename");
  CREATE INDEX "media_sizes_hero_sizes_hero_filename_idx" ON "media" USING btree ("sizes_hero_filename");
  CREATE INDEX "home_panels_artist_image_idx" ON "home_panels" USING btree ("artist_image_id");
  CREATE INDEX "home_panels_background_image_idx" ON "home_panels" USING btree ("background_image_id");
  CREATE INDEX "home_panels_updated_at_idx" ON "home_panels" USING btree ("updated_at");
  CREATE INDEX "home_panels_created_at_idx" ON "home_panels" USING btree ("created_at");
  CREATE INDEX "contact_messages_updated_at_idx" ON "contact_messages" USING btree ("updated_at");
  CREATE INDEX "contact_messages_created_at_idx" ON "contact_messages" USING btree ("created_at");
  CREATE INDEX "orders_event_idx" ON "orders" USING btree ("event_id");
  CREATE INDEX "orders_payment_reference_idx" ON "orders" USING btree ("payment_reference");
  CREATE INDEX "orders_updated_at_idx" ON "orders" USING btree ("updated_at");
  CREATE INDEX "orders_created_at_idx" ON "orders" USING btree ("created_at");
  CREATE UNIQUE INDEX "tickets_code_idx" ON "tickets" USING btree ("code");
  CREATE INDEX "tickets_order_idx" ON "tickets" USING btree ("order_id");
  CREATE INDEX "tickets_event_idx" ON "tickets" USING btree ("event_id");
  CREATE INDEX "tickets_updated_at_idx" ON "tickets" USING btree ("updated_at");
  CREATE INDEX "tickets_created_at_idx" ON "tickets" USING btree ("created_at");
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_jobs_log_order_idx" ON "payload_jobs_log" USING btree ("_order");
  CREATE INDEX "payload_jobs_log_parent_id_idx" ON "payload_jobs_log" USING btree ("_parent_id");
  CREATE INDEX "payload_jobs_completed_at_idx" ON "payload_jobs" USING btree ("completed_at");
  CREATE INDEX "payload_jobs_total_tried_idx" ON "payload_jobs" USING btree ("total_tried");
  CREATE INDEX "payload_jobs_has_error_idx" ON "payload_jobs" USING btree ("has_error");
  CREATE INDEX "payload_jobs_task_slug_idx" ON "payload_jobs" USING btree ("task_slug");
  CREATE INDEX "payload_jobs_queue_idx" ON "payload_jobs" USING btree ("queue");
  CREATE INDEX "payload_jobs_wait_until_idx" ON "payload_jobs" USING btree ("wait_until");
  CREATE INDEX "payload_jobs_processing_idx" ON "payload_jobs" USING btree ("processing");
  CREATE INDEX "payload_jobs_updated_at_idx" ON "payload_jobs" USING btree ("updated_at");
  CREATE INDEX "payload_jobs_created_at_idx" ON "payload_jobs" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_events_id_idx" ON "payload_locked_documents_rels" USING btree ("events_id");
  CREATE INDEX "payload_locked_documents_rels_posts_id_idx" ON "payload_locked_documents_rels" USING btree ("posts_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_home_panels_id_idx" ON "payload_locked_documents_rels" USING btree ("home_panels_id");
  CREATE INDEX "payload_locked_documents_rels_contact_messages_id_idx" ON "payload_locked_documents_rels" USING btree ("contact_messages_id");
  CREATE INDEX "payload_locked_documents_rels_orders_id_idx" ON "payload_locked_documents_rels" USING btree ("orders_id");
  CREATE INDEX "payload_locked_documents_rels_tickets_id_idx" ON "payload_locked_documents_rels" USING btree ("tickets_id");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");
  CREATE INDEX "home_page_hero_buttons_order_idx" ON "home_page_hero_buttons" USING btree ("_order");
  CREATE INDEX "home_page_hero_buttons_parent_id_idx" ON "home_page_hero_buttons" USING btree ("_parent_id");
  CREATE INDEX "home_page_teasers_order_idx" ON "home_page_teasers" USING btree ("_order");
  CREATE INDEX "home_page_teasers_parent_id_idx" ON "home_page_teasers" USING btree ("_parent_id");
  CREATE INDEX "home_page_teasers_image_idx" ON "home_page_teasers" USING btree ("image_id");
  CREATE INDEX "home_page_hero_video_idx" ON "home_page" USING btree ("hero_video_id");
  CREATE INDEX "home_page_hero_poster_idx" ON "home_page" USING btree ("hero_poster_id");
  CREATE INDEX "_home_page_v_version_hero_buttons_order_idx" ON "_home_page_v_version_hero_buttons" USING btree ("_order");
  CREATE INDEX "_home_page_v_version_hero_buttons_parent_id_idx" ON "_home_page_v_version_hero_buttons" USING btree ("_parent_id");
  CREATE INDEX "_home_page_v_version_teasers_order_idx" ON "_home_page_v_version_teasers" USING btree ("_order");
  CREATE INDEX "_home_page_v_version_teasers_parent_id_idx" ON "_home_page_v_version_teasers" USING btree ("_parent_id");
  CREATE INDEX "_home_page_v_version_teasers_image_idx" ON "_home_page_v_version_teasers" USING btree ("image_id");
  CREATE INDEX "_home_page_v_version_version_hero_video_idx" ON "_home_page_v" USING btree ("version_hero_video_id");
  CREATE INDEX "_home_page_v_version_version_hero_poster_idx" ON "_home_page_v" USING btree ("version_hero_poster_id");
  CREATE INDEX "_home_page_v_created_at_idx" ON "_home_page_v" USING btree ("created_at");
  CREATE INDEX "_home_page_v_updated_at_idx" ON "_home_page_v" USING btree ("updated_at");
  CREATE INDEX "our_story_intro_intro_image_idx" ON "our_story" USING btree ("intro_image_id");
  CREATE INDEX "our_story_what_is_nex_gen_what_is_nex_gen_image_idx" ON "our_story" USING btree ("what_is_nex_gen_image_id");
  CREATE INDEX "our_story_why_we_started_why_we_started_image_idx" ON "our_story" USING btree ("why_we_started_image_id");
  CREATE INDEX "our_story_what_we_stand_for_what_we_stand_for_image_idx" ON "our_story" USING btree ("what_we_stand_for_image_id");
  CREATE INDEX "our_story_community_community_image_idx" ON "our_story" USING btree ("community_image_id");
  CREATE INDEX "_our_story_v_version_intro_version_intro_image_idx" ON "_our_story_v" USING btree ("version_intro_image_id");
  CREATE INDEX "_our_story_v_version_what_is_nex_gen_version_what_is_nex_idx" ON "_our_story_v" USING btree ("version_what_is_nex_gen_image_id");
  CREATE INDEX "_our_story_v_version_why_we_started_version_why_we_start_idx" ON "_our_story_v" USING btree ("version_why_we_started_image_id");
  CREATE INDEX "_our_story_v_version_what_we_stand_for_version_what_we_s_idx" ON "_our_story_v" USING btree ("version_what_we_stand_for_image_id");
  CREATE INDEX "_our_story_v_version_community_version_community_image_idx" ON "_our_story_v" USING btree ("version_community_image_id");
  CREATE INDEX "_our_story_v_created_at_idx" ON "_our_story_v" USING btree ("created_at");
  CREATE INDEX "_our_story_v_updated_at_idx" ON "_our_story_v" USING btree ("updated_at");
  CREATE INDEX "contact_info_socials_order_idx" ON "contact_info_socials" USING btree ("_order");
  CREATE INDEX "contact_info_socials_parent_id_idx" ON "contact_info_socials" USING btree ("_parent_id");
  CREATE INDEX "contact_info_image_idx" ON "contact_info" USING btree ("image_id");
  CREATE INDEX "_contact_info_v_version_socials_order_idx" ON "_contact_info_v_version_socials" USING btree ("_order");
  CREATE INDEX "_contact_info_v_version_socials_parent_id_idx" ON "_contact_info_v_version_socials" USING btree ("_parent_id");
  CREATE INDEX "_contact_info_v_version_version_image_idx" ON "_contact_info_v" USING btree ("version_image_id");
  CREATE INDEX "_contact_info_v_created_at_idx" ON "_contact_info_v" USING btree ("created_at");
  CREATE INDEX "_contact_info_v_updated_at_idx" ON "_contact_info_v" USING btree ("updated_at");
  CREATE INDEX "site_settings_nav_items_order_idx" ON "site_settings_nav_items" USING btree ("_order");
  CREATE INDEX "site_settings_nav_items_parent_id_idx" ON "site_settings_nav_items" USING btree ("_parent_id");
  CREATE INDEX "site_settings_footer_columns_links_order_idx" ON "site_settings_footer_columns_links" USING btree ("_order");
  CREATE INDEX "site_settings_footer_columns_links_parent_id_idx" ON "site_settings_footer_columns_links" USING btree ("_parent_id");
  CREATE INDEX "site_settings_footer_columns_order_idx" ON "site_settings_footer_columns" USING btree ("_order");
  CREATE INDEX "site_settings_footer_columns_parent_id_idx" ON "site_settings_footer_columns" USING btree ("_parent_id");
  CREATE INDEX "site_settings_seo_seo_share_image_idx" ON "site_settings" USING btree ("seo_share_image_id");
  CREATE INDEX "_site_settings_v_version_nav_items_order_idx" ON "_site_settings_v_version_nav_items" USING btree ("_order");
  CREATE INDEX "_site_settings_v_version_nav_items_parent_id_idx" ON "_site_settings_v_version_nav_items" USING btree ("_parent_id");
  CREATE INDEX "_site_settings_v_version_footer_columns_links_order_idx" ON "_site_settings_v_version_footer_columns_links" USING btree ("_order");
  CREATE INDEX "_site_settings_v_version_footer_columns_links_parent_id_idx" ON "_site_settings_v_version_footer_columns_links" USING btree ("_parent_id");
  CREATE INDEX "_site_settings_v_version_footer_columns_order_idx" ON "_site_settings_v_version_footer_columns" USING btree ("_order");
  CREATE INDEX "_site_settings_v_version_footer_columns_parent_id_idx" ON "_site_settings_v_version_footer_columns" USING btree ("_parent_id");
  CREATE INDEX "_site_settings_v_version_seo_version_seo_share_image_idx" ON "_site_settings_v" USING btree ("version_seo_share_image_id");
  CREATE INDEX "_site_settings_v_created_at_idx" ON "_site_settings_v" USING btree ("created_at");
  CREATE INDEX "_site_settings_v_updated_at_idx" ON "_site_settings_v" USING btree ("updated_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "events_artists" CASCADE;
  DROP TABLE "events" CASCADE;
  DROP TABLE "_events_v_version_artists" CASCADE;
  DROP TABLE "_events_v" CASCADE;
  DROP TABLE "posts" CASCADE;
  DROP TABLE "_posts_v" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "home_panels" CASCADE;
  DROP TABLE "contact_messages" CASCADE;
  DROP TABLE "orders" CASCADE;
  DROP TABLE "tickets" CASCADE;
  DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_jobs_log" CASCADE;
  DROP TABLE "payload_jobs" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "home_page_hero_buttons" CASCADE;
  DROP TABLE "home_page_teasers" CASCADE;
  DROP TABLE "home_page" CASCADE;
  DROP TABLE "_home_page_v_version_hero_buttons" CASCADE;
  DROP TABLE "_home_page_v_version_teasers" CASCADE;
  DROP TABLE "_home_page_v" CASCADE;
  DROP TABLE "our_story" CASCADE;
  DROP TABLE "_our_story_v" CASCADE;
  DROP TABLE "contact_info_socials" CASCADE;
  DROP TABLE "contact_info" CASCADE;
  DROP TABLE "_contact_info_v_version_socials" CASCADE;
  DROP TABLE "_contact_info_v" CASCADE;
  DROP TABLE "site_settings_nav_items" CASCADE;
  DROP TABLE "site_settings_footer_columns_links" CASCADE;
  DROP TABLE "site_settings_footer_columns" CASCADE;
  DROP TABLE "site_settings" CASCADE;
  DROP TABLE "_site_settings_v_version_nav_items" CASCADE;
  DROP TABLE "_site_settings_v_version_footer_columns_links" CASCADE;
  DROP TABLE "_site_settings_v_version_footer_columns" CASCADE;
  DROP TABLE "_site_settings_v" CASCADE;
  DROP TYPE "public"."enum_events_currency";
  DROP TYPE "public"."enum_events_status";
  DROP TYPE "public"."enum__events_v_version_currency";
  DROP TYPE "public"."enum__events_v_version_status";
  DROP TYPE "public"."enum_posts_category";
  DROP TYPE "public"."enum_posts_status";
  DROP TYPE "public"."enum__posts_v_version_category";
  DROP TYPE "public"."enum__posts_v_version_status";
  DROP TYPE "public"."enum_home_panels_accent";
  DROP TYPE "public"."enum_orders_status";
  DROP TYPE "public"."enum_tickets_status";
  DROP TYPE "public"."enum_payload_jobs_log_task_slug";
  DROP TYPE "public"."enum_payload_jobs_log_state";
  DROP TYPE "public"."enum_payload_jobs_task_slug";
  DROP TYPE "public"."enum_home_page_hero_buttons_style";
  DROP TYPE "public"."enum__home_page_v_version_hero_buttons_style";
  DROP TYPE "public"."enum_contact_info_socials_platform";
  DROP TYPE "public"."enum__contact_info_v_version_socials_platform";`)
}
